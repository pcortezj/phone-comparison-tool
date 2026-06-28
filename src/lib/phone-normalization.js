const SECTION_ALIASES = {
  battery: 'battery',
  body: 'design',
  build: 'design',
  camera: 'camera',
  comms: 'connectivity',
  connectivity: 'connectivity',
  display: 'display',
  features: 'software',
  launch: 'software',
  main_camera: 'camera',
  memory: 'performance',
  network: 'connectivity',
  performance: 'performance',
  platform: 'performance',
  selfie_camera: 'camera',
  software: 'software',
};

const DEFAULT_IMAGE = 'https://via.placeholder.com/300x400?text=Phone+Image';
const NULL_LIKE_PATTERN = /^(?:n\/a|na|not applicable|null|none|unknown|-|—)$/i;

const normalizeWhitespace = (value) => String(value || '').replace(/\s+/g, ' ').trim();

const slugify = (value) =>
  normalizeWhitespace(value)
    .replace(/\+/g, ' plus ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const normalizeKey = (value) =>
  slugify(value)
    .replace(/-/g, '_')
    .replace(/^_+|_+$/g, '');

const normalizeSection = (value) => SECTION_ALIASES[normalizeKey(value)] || normalizeKey(value);

const stringifyValue = (value) => {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry)).join(', ');
  }

  if (value === null || value === undefined) {
    return '';
  }

  return normalizeWhitespace(String(value));
};

const normalizeNullishString = (value) => {
  const normalized = normalizeWhitespace(value);
  if (!normalized || NULL_LIKE_PATTERN.test(normalized)) {
    return null;
  }

  return normalized;
};

const getString = (...values) => {
  for (const value of values) {
    if (typeof value === 'string') {
      const normalized = normalizeWhitespace(value);
      if (normalized) {
        return normalized;
      }
    }
  }

  return '';
};

const buildName = (brand, model, fallback) => {
  const candidate = normalizeWhitespace(fallback || '');
  if (!candidate) {
    return `${brand} ${model}`.trim();
  }

  if (candidate.toLowerCase().includes(brand.toLowerCase())) {
    return candidate;
  }

  return `${brand} ${candidate}`.trim();
};

const addSectionValue = (sections, sectionName, key, value) => {
  const normalizedSection = normalizeSection(sectionName || '');
  const normalizedKey = normalizeKey(key || '');
  const normalizedValue = normalizeNullishString(stringifyValue(value));

  if (!normalizedSection || !normalizedKey || !normalizedValue) {
    return;
  }

  sections[normalizedSection] = sections[normalizedSection] || {};
  sections[normalizedSection][normalizedKey] = normalizedValue;
};

const readObjectSections = (raw, sections) => {
  const objectSections = raw.specs;
  if (!objectSections || typeof objectSections !== 'object' || Array.isArray(objectSections)) {
    return;
  }

  Object.entries(objectSections).forEach(([sectionName, sectionValue]) => {
    if (!sectionValue || typeof sectionValue !== 'object' || Array.isArray(sectionValue)) {
      return;
    }

    Object.entries(sectionValue).forEach(([key, value]) => {
      addSectionValue(sections, sectionName, key, value);
    });
  });
};

const readArraySections = (raw, sections) => {
  const rawSections = raw.specifications;
  if (!Array.isArray(rawSections)) {
    return;
  }

  rawSections.forEach((sectionEntry) => {
    if (!sectionEntry || typeof sectionEntry !== 'object') {
      return;
    }

    const section = sectionEntry;
    const title = stringifyValue(section.title || section.name);
    const rows = Array.isArray(section.specs)
      ? section.specs
      : Array.isArray(section.data)
        ? section.data
        : [];

    rows.forEach((rowEntry) => {
      if (!rowEntry || typeof rowEntry !== 'object') {
        return;
      }

      const row = rowEntry;
      addSectionValue(
        sections,
        title,
        stringifyValue(row.key || row.name || row.label),
        row.value ?? row.spec ?? row.content
      );
    });
  });
};

const normalizeSections = (raw) => {
  const sections = {};
  readObjectSections(raw, sections);
  readArraySections(raw, sections);
  return sections;
};

const readSectionValue = (sections, ...candidates) => {
  for (const [sectionName, keyName] of candidates) {
    const value = sections?.[sectionName]?.[keyName];
    if (typeof value === 'string' && value) {
      return value;
    }
  }

  return null;
};

const parseNumber = (value, pattern) => {
  if (!value) {
    return null;
  }

  const match = value.match(pattern);
  return match ? Number.parseFloat(match[1]) : null;
};

const parseDateValue = (value) => {
  if (!value) {
    return null;
  }

  const cleaned = value
    .replace(/available\.?\s*released\s*/i, '')
    .replace(/released\s*/i, '')
    .replace(/status\s*:/i, '')
    .replace(/(?:exp\.?\s*)?release\s*/i, '')
    .trim();

  const fullDateMatch = cleaned.match(/\b(\d{4}),?\s+([A-Za-z]+)\s+(\d{1,2})\b/);
  if (fullDateMatch) {
    const fullDate = new Date(`${fullDateMatch[2]} ${fullDateMatch[3]}, ${fullDateMatch[1]}`);
    if (!Number.isNaN(fullDate.getTime())) {
      return fullDate;
    }
  }

  const directDate = new Date(cleaned);
  if (!Number.isNaN(directDate.getTime())) {
    return directDate;
  }

  const yearMonthMatch = cleaned.match(/\b(\d{4}),?\s+([A-Za-z]+)\b/);
  if (yearMonthMatch) {
    const monthDate = new Date(`${yearMonthMatch[2]} 1, ${yearMonthMatch[1]}`);
    if (!Number.isNaN(monthDate.getTime())) {
      return monthDate;
    }
  }

  const yearMatch = cleaned.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    const yearDate = new Date(`${yearMatch[0]}-01-01T00:00:00Z`);
    if (!Number.isNaN(yearDate.getTime())) {
      return yearDate;
    }
  }

  return null;
};

const sortNumericOptions = (values) => [...new Set(values)].sort((left, right) => left - right);

const parseRamOptions = (sections) => {
  const dedicatedRam = readSectionValue(sections, ['performance', 'ram']);
  const combinedMemoryValues = [
    readSectionValue(sections, ['performance', 'internal']),
    readSectionValue(sections, ['performance', 'memory']),
  ].filter(Boolean);

  const values = [
    ...(dedicatedRam
      ? [...dedicatedRam.matchAll(/(\d+(?:\.\d+)?)\s*GB\b/gi)].map((match) => Number.parseFloat(match[1]))
      : []),
    ...combinedMemoryValues.flatMap((value) =>
      [...value.matchAll(/(\d+(?:\.\d+)?)\s*GB\s*RAM\b/gi)].map((match) => Number.parseFloat(match[1]))
    ),
  ];

  return sortNumericOptions(values);
};

const parseStorageOptions = (sections) => {
  const values = [
    readSectionValue(sections, ['performance', 'storage']),
    readSectionValue(sections, ['performance', 'internal']),
    readSectionValue(sections, ['performance', 'memory']),
  ]
    .filter(Boolean)
    .flatMap((value) =>
      [...value.matchAll(/(\d+(?:\.\d+)?)\s*(TB|GB)\b(?!\s*RAM)/gi)]
        .map((match) => {
          const amount = Number.parseFloat(match[1]);
          const unit = match[2].toUpperCase();
          return unit === 'TB' ? amount * 1024 : amount;
        })
        .filter((amount) => amount >= 32)
    );

  return sortNumericOptions(values);
};

const parseBatteryCapacityMah = (sections) =>
  parseNumber(readSectionValue(sections, ['battery', 'capacity'], ['battery', 'type']), /(\d{3,5})\s*mAh/i);

const parseRefreshRate = (sections) => {
  const displayValue = readSectionValue(sections, ['display', 'refresh_rate'], ['display', 'type']);
  if (!displayValue) {
    return 60;
  }

  const matches = [...displayValue.matchAll(/(\d{2,4})\s*Hz/gi)].map((match) => Number.parseInt(match[1], 10));
  const plausibleRefreshRates = matches.filter((value) => value >= 50 && value <= 240);
  if (plausibleRefreshRates.length > 0) {
    return Math.max(...plausibleRefreshRates);
  }

  return matches.length > 0 ? matches[0] : 60;
};

const parseChipsetValue = (sections) =>
  readSectionValue(sections, ['performance', 'chipset'], ['performance', 'processor'], ['performance', 'cpu']);

const parseChipset = (sections) => {
  const chipsetValue = parseChipsetValue(sections);
  if (!chipsetValue) {
    return null;
  }

  return normalizeWhitespace(chipsetValue.replace(/\s*\([^)]*nm[^)]*\)\s*/i, ' ').replace(/\s{2,}/g, ' '));
};

const parseChipsetNodeNm = (sections) =>
  parseNumber(parseChipsetValue(sections), /(\d+(?:\.\d+)?)\s*nm/i);

const parseDisplaySizeInches = (sections) =>
  parseNumber(readSectionValue(sections, ['display', 'size']), /(\d+(?:\.\d+)?)\s*inch/i);

const parseCameraMp = (value) => parseNumber(value, /(\d+(?:\.\d+)?)\s*MP\b/i);

const parseWiredChargingWatts = (sections) =>
  parseNumber(readSectionValue(sections, ['battery', 'charging']), /(\d+(?:\.\d+)?)\s*W\b/i);

const parseWeightG = (sections) =>
  parseNumber(readSectionValue(sections, ['design', 'weight']), /(\d+(?:\.\d+)?)\s*g\b/i);

const parseReleaseDate = (sections) => {
  const announced = readSectionValue(sections, ['software', 'announced']);
  const status = readSectionValue(sections, ['software', 'status']);
  return parseDateValue(status) || parseDateValue(announced);
};

const parseIsDiscontinued = (sections, rawPhone) => {
  const status = readSectionValue(sections, ['software', 'status']);
  const summary = getString(rawPhone.summary);
  return /discontinued/i.test(status || '') || /discontinued/i.test(summary);
};

const normalizePhoneRecord = (rawPhone) => {
  if (!rawPhone || typeof rawPhone !== 'object' || Array.isArray(rawPhone)) {
    return null;
  }

  const brandName = getString(rawPhone.brand, rawPhone.Brand, rawPhone.manufacturer, rawPhone.oem_name);
  const modelName = getString(rawPhone.model, rawPhone.Model, rawPhone.device, rawPhone.phone_name, rawPhone.name);

  if (!brandName || !modelName) {
    return null;
  }

  const sections = normalizeSections(rawPhone);
  const releaseDate = parseReleaseDate(sections);

  return {
    brandName,
    brandSlug: slugify(brandName),
    modelName,
    deviceSlug: slugify(modelName),
    name: buildName(brandName, modelName, getString(rawPhone.name, rawPhone.device, rawPhone.phone_name)),
    imageUrl: getString(rawPhone.image, rawPhone.img, rawPhone.photo, rawPhone.thumbnail) || DEFAULT_IMAGE,
    specBlob: JSON.stringify(sections),
    rawPayload: JSON.stringify(rawPhone),
    releaseDate: releaseDate ? releaseDate.toISOString() : null,
    displaySizeInches: parseDisplaySizeInches(sections),
    displayResolution: readSectionValue(sections, ['display', 'resolution']),
    displayRefreshRate: parseRefreshRate(sections),
    displayType: readSectionValue(sections, ['display', 'type']),
    performanceChipset: parseChipset(sections),
    performanceChipsetNodeNm: parseChipsetNodeNm(sections),
    performanceRamOptions: JSON.stringify(parseRamOptions(sections)),
    storageOptions: JSON.stringify(parseStorageOptions(sections)),
    cameraMainMp: parseCameraMp(
      readSectionValue(
        sections,
        ['camera', 'main'],
        ['camera', 'triple'],
        ['camera', 'dual'],
        ['camera', 'quad'],
        ['camera', 'single']
      )
    ),
    cameraFrontMp: parseCameraMp(
      readSectionValue(sections, ['camera', 'front'], ['camera', 'selfie'], ['camera', 'single'])
    ),
    batteryCapacityMah: parseBatteryCapacityMah(sections),
    batteryWiredChargingW: parseWiredChargingWatts(sections),
    weightG: parseWeightG(sections),
    lastScrapedAt: new Date().toISOString(),
    isDiscontinued: parseIsDiscontinued(sections, rawPhone),
  };
};

const parseSpecBlob = (specBlob) => {
  if (!specBlob) {
    return {};
  }

  try {
    return JSON.parse(specBlob);
  } catch {
    return {};
  }
};

const parseNumericArrayBlob = (value) => {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((entry) => typeof entry === 'number' && Number.isFinite(entry));
  } catch {
    return [];
  }
};

module.exports = {
  DEFAULT_IMAGE,
  addSectionValue,
  buildName,
  getString,
  normalizeKey,
  normalizePhoneRecord,
  normalizeSection,
  normalizeSections,
  normalizeWhitespace,
  parseNumericArrayBlob,
  parseSpecBlob,
  slugify,
  stringifyValue,
};
