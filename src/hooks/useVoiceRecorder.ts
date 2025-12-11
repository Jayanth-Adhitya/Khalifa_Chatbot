'use client';

import { useState, useRef, useCallback } from 'react';
import { AudioRecorder, transcribeAudio } from '@/lib/elevenlabs-client';

interface UseVoiceRecorderReturn {
  isRecording: boolean;
  isTranscribing: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  error: string | null;
  recordingDuration: number;
}

export function useVoiceRecorder(): UseVoiceRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const recorderRef = useRef<AudioRecorder | null>(null);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = useCallback(async () => {
    setError(null);
    setRecordingDuration(0);

    try {
      const recorder = new AudioRecorder();
      recorderRef.current = recorder;

      await recorder.start();
      setIsRecording(true);
      startTimeRef.current = Date.now();

      // Update duration every 100ms
      timerRef.current = setInterval(() => {
        setRecordingDuration(Date.now() - startTimeRef.current);
      }, 100);

    } catch (err) {
      console.error('Failed to start recording:', err);
      if ((err as Error).name === 'NotAllowedError') {
        setError('Microphone access denied. Please allow microphone access.');
      } else {
        setError('Failed to access microphone.');
      }
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const duration = Date.now() - startTimeRef.current;
    setRecordingDuration(0);
    setIsRecording(false);

    if (!recorderRef.current || !recorderRef.current.isRecording()) {
      return null;
    }

    // Check minimum duration
    if (duration < 500) {
      recorderRef.current.cleanup();
      setError('Recording too short. Hold for at least 1 second.');
      return null;
    }

    try {
      const audioBlob = await recorderRef.current.stop();

      if (!audioBlob || audioBlob.size < 1000) {
        console.log('Recording too short or empty');
        setError('Recording was too short. Please try again.');
        return null;
      }

      // Transcribe the audio using ElevenLabs
      setIsTranscribing(true);
      console.log('📤 Sending audio for transcription...');

      const transcript = await transcribeAudio(audioBlob);

      setIsTranscribing(false);

      if (transcript && transcript.trim()) {
        console.log('✅ Got transcript:', transcript);
        setError(null);
        return transcript.trim();
      } else {
        console.log('No speech detected');
        setError('No speech detected. Please try again.');
        return null;
      }
    } catch (err) {
      setIsTranscribing(false);
      console.error('Transcription error:', err);
      setError('Failed to transcribe: ' + (err as Error).message);
      return null;
    }
  }, []);

  return {
    isRecording,
    isTranscribing,
    startRecording,
    stopRecording,
    error,
    recordingDuration,
  };
}
