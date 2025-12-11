import { NextRequest, NextResponse } from 'next/server';
import { textToSpeech } from '@/lib/elevenlabs';
import { detectLanguage } from '@/lib/gemini';

interface TTSRequest {
  text: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: TTSRequest = await request.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // Auto-detect language from the text
    const language = detectLanguage(text);

    const audioBuffer = await textToSpeech(text, language);

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('TTS API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate speech' },
      { status: 500 }
    );
  }
}
