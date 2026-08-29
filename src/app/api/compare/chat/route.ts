import { NextResponse } from 'next/server';
import { askComparisonAssistant } from '@/lib/comparison-assistant';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const RATE_LIMIT_MAX_REQUESTS = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_PROMPT_LENGTH = 2000;
const MAX_DEVICE_IDS = 6;

export async function POST(request: Request) {
  const clientIp = getClientIp(request);
  const rateLimit = checkRateLimit(`compare-chat:${clientIp}`, RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MS);

  if (!rateLimit.allowed) {
    console.warn(`[rate-limit] blocked ip=${clientIp} route=/api/compare/chat`);
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment before trying again.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.max(1, Math.ceil((rateLimit.resetAt - Date.now()) / 1000))),
        },
      }
    );
  }

  try {
    const body = (await request.json()) as {
      deviceIds?: string[];
      prompt?: string;
    };

    const deviceIds = Array.isArray(body.deviceIds) ? body.deviceIds.filter(Boolean) : [];
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';

    if (deviceIds.length < 1) {
      return NextResponse.json(
        {
          error: 'Select at least one phone before asking a question.',
        },
        { status: 400 }
      );
    }

    if (deviceIds.length > MAX_DEVICE_IDS) {
      return NextResponse.json(
        {
          error: `You can compare up to ${MAX_DEVICE_IDS} phones at a time.`,
        },
        { status: 400 }
      );
    }

    if (!prompt) {
      return NextResponse.json(
        {
          error: 'Enter a question for the comparison assistant.',
        },
        { status: 400 }
      );
    }

    if (prompt.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json(
        {
          error: `Your question is too long (max ${MAX_PROMPT_LENGTH} characters).`,
        },
        { status: 400 }
      );
    }

    const result = await askComparisonAssistant(prompt, deviceIds);

    return NextResponse.json({
      answer: result.answer,
      source: result.source,
      model: result.model,
      comparedPhones: result.phones.map((phone) => phone.name),
    });
  } catch (error) {
    console.error('[compare/chat] request failed:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      {
        error: 'Failed to answer the comparison question.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
