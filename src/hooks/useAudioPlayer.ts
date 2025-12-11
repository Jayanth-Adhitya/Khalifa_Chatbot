'use client';

import { useState, useRef, useCallback } from 'react';

interface UseAudioPlayerReturn {
  isPlaying: boolean;
  play: (audioUrl: string) => void;
  stop: () => void;
  playFromBlob: (blob: Blob) => void;
}

export function useAudioPlayer(): UseAudioPlayerReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const play = useCallback((audioUrl: string) => {
    cleanup();

    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.onended = () => {
      setIsPlaying(false);
    };

    audio.onerror = () => {
      console.error('Audio playback error');
      setIsPlaying(false);
    };

    audio.play();
    setIsPlaying(true);
  }, [cleanup]);

  const playFromBlob = useCallback((blob: Blob) => {
    cleanup();

    const url = URL.createObjectURL(blob);
    urlRef.current = url;

    const audio = new Audio(url);
    audioRef.current = audio;

    audio.onended = () => {
      setIsPlaying(false);
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
    };

    audio.onerror = () => {
      console.error('Audio playback error');
      setIsPlaying(false);
    };

    audio.play();
    setIsPlaying(true);
  }, [cleanup]);

  const stop = useCallback(() => {
    cleanup();
  }, [cleanup]);

  return {
    isPlaying,
    play,
    stop,
    playFromBlob,
  };
}
