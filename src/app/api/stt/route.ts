import { NextRequest, NextResponse } from 'next/server';
import { speechToText } from '@/lib/elevenlabs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'Audio file is required' },
        { status: 400 }
      );
    }

    // Get the actual bytes from the file
    const arrayBuffer = await audioFile.arrayBuffer();

    // Determine file extension from mime type
    let filename = 'audio.webm';
    if (audioFile.type.includes('mp4')) {
      filename = 'audio.mp4';
    } else if (audioFile.type.includes('ogg')) {
      filename = 'audio.ogg';
    } else if (audioFile.type.includes('wav')) {
      filename = 'audio.wav';
    }

    console.log('STT Request - File type:', audioFile.type, 'Size:', arrayBuffer.byteLength, 'bytes');

    const result = await speechToText(arrayBuffer, filename);

    return NextResponse.json({
      text: result.text,
      language: result.language,
    });
  } catch (error) {
    console.error('STT API error:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}
