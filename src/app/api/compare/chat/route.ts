import { NextResponse } from 'next/server';
import { askComparisonAssistant } from '@/lib/comparison-assistant';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      deviceIds?: string[];
      prompt?: string;
    };

    const deviceIds = Array.isArray(body.deviceIds) ? body.deviceIds.filter(Boolean) : [];
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';

    if (deviceIds.length < 2) {
      return NextResponse.json(
        {
          error: 'Select at least two phones before asking for a comparison.',
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

    const result = await askComparisonAssistant(prompt, deviceIds);

    return NextResponse.json({
      answer: result.answer,
      source: result.source,
      model: result.model,
      comparedPhones: result.phones.map((phone) => phone.name),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to answer the comparison question.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
