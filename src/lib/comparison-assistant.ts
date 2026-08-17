import { getDeviceByEncodedId, getSpecsForDevice } from '@/lib/phone-catalog';
import phoneNormalization from '@/lib/phone-normalization.js';

const { parseNumericArrayBlob } = phoneNormalization as {
  parseNumericArrayBlob: (value: string | null) => number[];
};

type DeviceRecord = Awaited<ReturnType<typeof getDeviceByEncodedId>>;
type PresentDeviceRecord = NonNullable<DeviceRecord>;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-5-mini';
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN;
const HUGGINGFACE_BASE_URL = process.env.HUGGINGFACE_BASE_URL || 'https://router.huggingface.co/v1';
const HUGGINGFACE_MODEL = process.env.HUGGINGFACE_MODEL || 'Qwen/Qwen2.5-72B-Instruct:fastest';
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:7b';
const ASSISTANT_PROVIDER =
  process.env.COMPARE_ASSISTANT_PROVIDER ||
  (OPENAI_API_KEY ? 'openai' : HUGGINGFACE_API_KEY ? 'huggingface' : 'ollama');

type AssistantSource = 'openai' | 'huggingface' | 'ollama' | 'fallback';

const formatNumber = (value: number | null | undefined, suffix?: string) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  return `${value}${suffix || ''}`;
};

const formatDate = (value: Date | null | undefined) => {
  if (!value) {
    return null;
  }

  return value.toISOString().slice(0, 10);
};

const formatStorageCapacity = (value: number) => (value >= 1024 && value % 1024 === 0 ? `${value / 1024}TB` : `${value}GB`);

const formatArray = (values: number[], formatter: (value: number) => string) =>
  values.length > 0 ? values.map(formatter).join(', ') : null;

const getSpec = (specs: Record<string, Record<string, string>>, path: string[]) => {
  let current: unknown = specs;
  for (const part of path) {
    if (!current || typeof current !== 'object') {
      return null;
    }

    current = (current as Record<string, unknown>)[part];
  }

  return typeof current === 'string' && current ? current : null;
};

const getFirstSpec = (specs: Record<string, Record<string, string>>, paths: string[][]) => {
  for (const path of paths) {
    const value = getSpec(specs, path);
    if (value) {
      return value;
    }
  }

  return null;
};

const buildPhoneSummary = (phone: PresentDeviceRecord) => {
  const specs = getSpecsForDevice(phone.specBlob);
  const ramOptions = parseNumericArrayBlob(phone.performanceRamOptions);
  const storageOptions = parseNumericArrayBlob(phone.storageOptions);

  return {
    id: `${phone.brand.slug}::${phone.slug}`,
    name: phone.name,
    brand: phone.brand.name,
    releaseDate: formatDate(phone.releaseDate),
    discontinued: phone.isDiscontinued,
    display: {
      sizeInches: phone.displaySizeInches,
      sizeLabel: formatNumber(phone.displaySizeInches, ' in') || getSpec(specs, ['display', 'size']),
      type: phone.displayType || getSpec(specs, ['display', 'type']),
      resolution: phone.displayResolution || getSpec(specs, ['display', 'resolution']),
      refreshRate: phone.displayRefreshRate,
      refreshRateLabel: formatNumber(phone.displayRefreshRate, 'Hz'),
    },
    performance: {
      chipset: phone.performanceChipset || getFirstSpec(specs, [['performance', 'processor'], ['performance', 'chipset']]),
      chipsetNodeNm: phone.performanceChipsetNodeNm,
      ramOptions,
      ramLabel:
        formatArray(ramOptions, (value) => `${value}GB RAM`) ||
        getFirstSpec(specs, [['performance', 'ram'], ['performance', 'internal']]),
      storageOptions,
      storageLabel:
        formatArray(storageOptions, formatStorageCapacity) ||
        getFirstSpec(specs, [['performance', 'storage'], ['performance', 'internal']]),
    },
    camera: {
      mainMp: phone.cameraMainMp,
      frontMp: phone.cameraFrontMp,
      mainLabel: formatNumber(phone.cameraMainMp, ' MP') || getFirstSpec(specs, [['camera', 'main'], ['camera', 'triple'], ['camera', 'dual']]),
      frontLabel: formatNumber(phone.cameraFrontMp, ' MP') || getFirstSpec(specs, [['camera', 'front'], ['camera', 'selfie']]),
      video: getSpec(specs, ['camera', 'video']),
    },
    battery: {
      capacityMah: phone.batteryCapacityMah,
      capacityLabel: formatNumber(phone.batteryCapacityMah, ' mAh') || getFirstSpec(specs, [['battery', 'capacity'], ['battery', 'type']]),
      wiredChargingW: phone.batteryWiredChargingW,
      wiredChargingLabel:
        formatNumber(phone.batteryWiredChargingW, 'W') || getSpec(specs, ['battery', 'charging']),
    },
    build: {
      weightG: phone.weightG,
      weightLabel: formatNumber(phone.weightG, ' g') || getSpec(specs, ['design', 'weight']),
      dimensions: getSpec(specs, ['design', 'dimensions']),
      materials: getFirstSpec(specs, [['design', 'materials'], ['design', 'build']]),
      network: getFirstSpec(specs, [['connectivity', 'network'], ['connectivity', 'technology']]),
      wifi: getFirstSpec(specs, [['connectivity', 'wifi'], ['connectivity', 'wlan']]),
      bluetooth: getSpec(specs, ['connectivity', 'bluetooth']),
      gps: getFirstSpec(specs, [['connectivity', 'gps'], ['connectivity', 'positioning']]),
      os: getFirstSpec(specs, [['software', 'os'], ['performance', 'os']]),
    },
  };
};

const buildComparisonPrompt = (question: string, phones: ReturnType<typeof buildPhoneSummary>[]) => {
  const context = JSON.stringify({ phones }, null, 2);

  return [
    'You are a phone comparison assistant.',
    'Answer only using the structured comparison data provided.',
    'Do not invent prices, benchmark scores, availability, or features that are not in the data.',
    'If the data is missing, say so clearly.',
    'When comparing a specific attribute across phones, first line up each phone\'s exact value for that attribute, then check which value actually wins (e.g. the higher number, or whether values are tied) before writing your conclusion.',
    'Focus on helping a consumer decide between the phones in the comparison.',
    'Keep the answer concise, practical, and easy to scan.',
    '',
    'Comparison data:',
    context,
    '',
    `User question: ${question}`,
  ].join('\n');
};

const buildFallbackAnswer = (
  question: string,
  phones: ReturnType<typeof buildPhoneSummary>[],
  failureReason?: string
) => {
  const bullets = phones.map((phone) => {
    const parts = [
      phone.display.sizeLabel && `display ${phone.display.sizeLabel}`,
      phone.display.refreshRateLabel && phone.display.refreshRateLabel,
      phone.performance.chipset && phone.performance.chipset,
      phone.performance.ramLabel && `RAM ${phone.performance.ramLabel}`,
      phone.performance.storageLabel && `storage ${phone.performance.storageLabel}`,
      phone.battery.capacityLabel && `battery ${phone.battery.capacityLabel}`,
      phone.build.weightLabel && `weight ${phone.build.weightLabel}`,
      phone.camera.mainLabel && `main camera ${phone.camera.mainLabel}`,
    ].filter(Boolean);

    return `- ${phone.name}: ${parts.join(', ')}`;
  });

  return [
    `I couldn't reach a live AI provider, so here's a grounded summary for: "${question}"`,
    '',
    ...bullets,
    '',
    failureReason ? `Provider note: ${failureReason}` : null,
    'Add `HF_TOKEN` for a hosted open model, add `OPENAI_API_KEY`, or start Ollama locally and try again for a natural-language recommendation.',
  ].join('\n');
};

const getTextFromOpenAIResponse = (payload: unknown) => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const directOutput = (payload as { output_text?: unknown }).output_text;
  if (typeof directOutput === 'string' && directOutput.trim()) {
    return directOutput.trim();
  }

  const output = (payload as { output?: unknown }).output;
  if (!Array.isArray(output)) {
    return null;
  }

  const chunks: string[] = [];

  for (const item of output) {
    if (!item || typeof item !== 'object') {
      continue;
    }

    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) {
      continue;
    }

    for (const part of content) {
      if (!part || typeof part !== 'object') {
        continue;
      }

      const text = (part as { text?: unknown }).text;
      if (typeof text === 'string' && text.trim()) {
        chunks.push(text.trim());
      }
    }
  }

  return chunks.length > 0 ? chunks.join('\n\n') : null;
};

const getTextFromChatCompletionResponse = (payload: unknown) => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const choices = (payload as { choices?: unknown }).choices;
  if (!Array.isArray(choices)) {
    return null;
  }

  const chunks: string[] = [];

  for (const choice of choices) {
    if (!choice || typeof choice !== 'object') {
      continue;
    }

    const message = (choice as { message?: unknown }).message;
    if (!message || typeof message !== 'object') {
      continue;
    }

    const content = (message as { content?: unknown }).content;
    if (typeof content === 'string' && content.trim()) {
      chunks.push(content.trim());
      continue;
    }

    if (Array.isArray(content)) {
      for (const part of content) {
        if (!part || typeof part !== 'object') {
          continue;
        }

        const text = (part as { text?: unknown }).text;
        if (typeof text === 'string' && text.trim()) {
          chunks.push(text.trim());
        }
      }
    }
  }

  return chunks.length > 0 ? chunks.join('\n\n') : null;
};

const askOpenAI = async (prompt: string) => {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set');
  }

  const response = await fetch(`${OPENAI_BASE_URL}/responses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: prompt,
      max_output_tokens: 1200,
      text: {
        format: {
          type: 'text',
        },
      },
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`OpenAI request failed with status ${response.status}: ${details}`);
  }

  const payload = (await response.json()) as unknown;
  const answer = getTextFromOpenAIResponse(payload);

  if (!answer) {
    throw new Error('OpenAI returned an empty response');
  }

  return {
    answer,
    source: 'openai' as const,
    model: OPENAI_MODEL,
  };
};

const askHuggingFace = async (prompt: string) => {
  if (!HUGGINGFACE_API_KEY) {
    throw new Error('HF_TOKEN or HUGGINGFACE_API_KEY is not set');
  }

  const response = await fetch(`${HUGGINGFACE_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
    },
    body: JSON.stringify({
      model: HUGGINGFACE_MODEL,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 1000,
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Hugging Face request failed with status ${response.status}: ${details}`);
  }

  const payload = (await response.json()) as unknown;
  const answer = getTextFromChatCompletionResponse(payload);

  if (!answer) {
    throw new Error('Hugging Face returned an empty response');
  }

  return {
    answer,
    source: 'huggingface' as const,
    model: HUGGINGFACE_MODEL,
  };
};

const askOllama = async (prompt: string) => {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      stream: false,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      options: {
        num_predict: 1000,
        temperature: 0.2,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as {
    message?: { content?: string };
  };

  const answer = payload.message?.content?.trim();
  if (!answer) {
    throw new Error('Ollama returned an empty response');
  }

  return {
    answer,
    source: 'ollama' as const,
    model: OLLAMA_MODEL,
  };
};

const getProviderOrder = (): AssistantSource[] => {
  if (ASSISTANT_PROVIDER === 'openai') {
    return ['openai', 'huggingface', 'ollama', 'fallback'];
  }

  if (ASSISTANT_PROVIDER === 'huggingface') {
    return ['huggingface', 'ollama', 'openai', 'fallback'];
  }

  if (ASSISTANT_PROVIDER === 'ollama') {
    return ['ollama', 'huggingface', 'openai', 'fallback'];
  }

  return ['openai', 'huggingface', 'ollama', 'fallback'];
};

export const buildComparisonAssistantContext = async (deviceIds: string[]) => {
  const devices = await Promise.all(deviceIds.map((deviceId) => getDeviceByEncodedId(deviceId)));
  const phones = devices
    .filter((device): device is PresentDeviceRecord => device !== null)
    .map((device) => buildPhoneSummary(device));

  return phones;
};

export const askComparisonAssistant = async (question: string, deviceIds: string[]) => {
  const phones = await buildComparisonAssistantContext(deviceIds);

  if (phones.length < 2) {
    throw new Error('Select at least two phones before asking for a comparison.');
  }

  const prompt = buildComparisonPrompt(question, phones);
  const providerErrors: string[] = [];

  for (const provider of getProviderOrder()) {
    if (provider === 'fallback') {
      break;
    }

    try {
      const result =
        provider === 'openai'
          ? await askOpenAI(prompt)
          : provider === 'huggingface'
            ? await askHuggingFace(prompt)
            : await askOllama(prompt);

      return {
        answer: result.answer,
        source: result.source,
        model: result.model,
        phones,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : `Unknown ${provider} error`;
      providerErrors.push(`${provider}: ${message}`);
    }
  }

  return {
    answer: buildFallbackAnswer(question, phones, providerErrors.join(' | ')),
    source: 'fallback' as const,
    model: providerErrors.length > 0 ? providerErrors.join(' | ') : ASSISTANT_PROVIDER,
    phones,
  };
};
