const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

export async function textToSpeech(
  text: string,
  language: 'en' | 'ar'
): Promise<ArrayBuffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = language === 'ar'
    ? (process.env.ELEVENLABS_VOICE_ID_AR || process.env.ELEVENLABS_VOICE_ID)
    : process.env.ELEVENLABS_VOICE_ID;

  if (!apiKey || !voiceId) {
    throw new Error('ElevenLabs API key or voice ID not configured');
  }

  const response = await fetch(
    `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs TTS error: ${error}`);
  }

  return response.arrayBuffer();
}

export async function speechToText(
  audioBuffer: ArrayBuffer,
  filename: string = 'audio.webm'
): Promise<{ text: string; language?: string }> {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    throw new Error('ElevenLabs API key not configured');
  }

  // Create a proper File object from the ArrayBuffer
  const blob = new Blob([audioBuffer], { type: 'audio/webm' });

  const formData = new FormData();
  formData.append('file', blob, filename);
  formData.append('model_id', 'scribe_v1');

  console.log('Sending to ElevenLabs STT - Size:', audioBuffer.byteLength, 'Filename:', filename);

  const response = await fetch(
    `${ELEVENLABS_API_URL}/speech-to-text`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('ElevenLabs STT response:', error);
    throw new Error(`ElevenLabs STT error: ${error}`);
  }

  const result = await response.json();
  console.log('ElevenLabs STT result:', result);

  return {
    text: result.text || '',
    language: result.language_code,
  };
}
