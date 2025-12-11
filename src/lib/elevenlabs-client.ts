/**
 * ElevenLabs Client-Side Service
 * Handles TTS and STT directly from browser (no server-side issues)
 */

// Voice settings for natural conversation
const VOICE_SETTINGS = {
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0.5,
  use_speaker_boost: true
};

/**
 * Get the ElevenLabs API key from environment
 */
function getApiKey(): string {
  // Try Next.js public env var first, then regular env var
  const key = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
  if (!key) {
    throw new Error('ElevenLabs API key not configured. Set NEXT_PUBLIC_ELEVENLABS_API_KEY in your .env file');
  }
  return key;
}

/**
 * Get the voice ID from environment
 */
function getVoiceId(): string {
  return process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
}

/**
 * Convert text to speech using ElevenLabs API
 */
export async function textToSpeech(text: string): Promise<Blob> {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    throw new Error('TTS Error: No text provided');
  }

  const apiKey = getApiKey();
  const voiceId = getVoiceId();

  console.log('📝 TTS Input text length:', text.length, 'characters');

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: VOICE_SETTINGS
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ TTS Error response:', errorText);
    throw new Error(`TTS Error: ${response.status} - ${errorText}`);
  }

  const blob = await response.blob();
  console.log('✅ TTS Blob received, size:', blob.size);
  return blob;
}

/**
 * Transcribe audio using ElevenLabs Scribe API
 */
export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const apiKey = getApiKey();

  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.webm');
  formData.append('model_id', 'scribe_v1');

  console.log('📤 Sending audio for transcription, size:', audioBlob.size);

  const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error('❌ STT Error:', error);
    throw new Error(error.detail?.message || `STT Error: ${response.status}`);
  }

  const data = await response.json();
  console.log('✅ Transcript:', data.text);
  return data.text || '';
}

/**
 * Audio Recorder class using MediaRecorder API
 */
export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;

  async start(): Promise<boolean> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(100); // Collect data every 100ms
      console.log('🎙️ Recording started');
      return true;
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }

  stop(): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.cleanup();
        console.log('⏹️ Recording stopped, blob size:', audioBlob.size);
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }
}

/**
 * Play audio blob
 */
export function playAudioBlob(blob: Blob): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const audioUrl = URL.createObjectURL(blob);
    audio.src = audioUrl;

    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      resolve();
    };

    audio.onerror = (error) => {
      URL.revokeObjectURL(audioUrl);
      reject(error);
    };

    audio.play().catch(reject);
  });
}
