'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Message } from '@/types';
import { MessageBubble } from './MessageBubble';
import { VoiceButton } from './VoiceButton';
import { LoadingDots } from './LoadingDots';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { textToSpeech, playAudioBlob } from '@/lib/elevenlabs-client';

interface ChatResponse {
  response: string;
  sources: string[];
  language: 'ar' | 'en';
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [lastLanguage, setLastLanguage] = useState<'ar' | 'en'>('en');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    isRecording,
    isTranscribing,
    startRecording,
    stopRecording,
    error: recordingError,
    recordingDuration
  } = useVoiceRecorder();
  const { isPlaying, stop: stopAudio } = useAudioPlayer();

  // Initialize knowledge base on mount
  useEffect(() => {
    fetch('/api/init')
      .then(res => res.json())
      .then(data => {
        console.log('Knowledge base status:', data);
        setIsInitialized(true);
      })
      .catch(err => {
        console.error('Failed to initialize:', err);
        setIsInitialized(true); // Continue anyway
      });
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          history,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data: ChatResponse = await response.json();

      // Update last detected language
      if (data.language) {
        setLastLanguage(data.language);
      }

      const responseText = data.response || 'Sorry, I could not generate a response.';

      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Auto-play TTS for the response
      try {
        const audioBlob = await textToSpeech(responseText);
        setPlayingMessageId(assistantMessage.id);
        await playAudioBlob(audioBlob);
        setPlayingMessageId(null);
      } catch (ttsError) {
        console.error('Auto TTS error:', ttsError);
        setPlayingMessageId(null);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: 'Sorry, an error occurred. Please try again. / عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputText);
  };

  const handleVoiceToggle = async () => {
    if (isRecording) {
      // Stop recording and transcribe
      const transcript = await stopRecording();
      if (transcript) {
        sendMessage(transcript);
      }
    } else {
      // Start recording
      await startRecording();
    }
  };

  const playMessageAudio = async (message: Message) => {
    if (playingMessageId === message.id) {
      stopAudio();
      setPlayingMessageId(null);
      return;
    }

    setPlayingMessageId(message.id);

    try {
      // Use client-side ElevenLabs TTS
      const audioBlob = await textToSpeech(message.content);
      await playAudioBlob(audioBlob);
    } catch (error) {
      console.error('TTS error:', error);
    } finally {
      setPlayingMessageId(null);
    }
  };

  // Reset playing state when audio stops
  useEffect(() => {
    if (!isPlaying) {
      setPlayingMessageId(null);
    }
  }, [isPlaying]);

  const isProcessing = isTranscribing;

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="flex-shrink-0 bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#ffc107] flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            <div>
              <h1 className="font-semibold text-gray-800">
                Khalifa Assistant | مساعد خليفة
              </h1>
              <p className="text-xs text-gray-500">
                {isInitialized ? 'Ready to help | جاهز للمساعدة' : 'Loading... | جاري التحميل...'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="px-2 py-1 rounded-full bg-gray-100">EN</span>
            <span className="px-2 py-1 rounded-full bg-gray-100">عربي</span>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Welcome message */}
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-[#fff3cd] mx-auto mb-4 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-[#ffc107]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Welcome! | مرحباً بك!
              </h2>
              <p className="text-gray-600 max-w-md mx-auto mb-2">
                I am your intelligent assistant for UAE Ministry of Economy and Tourism services.
              </p>
              <p className="text-gray-600 max-w-md mx-auto" dir="rtl">
                أنا مساعدك الذكي للاستفسارات حول خدمات وزارة الاقتصاد والسياحة.
              </p>
              <p className="text-sm text-gray-400 mt-4">
                Just type or speak in any language - I'll respond in the same language!
              </p>
            </div>
          )}

          {/* Message list */}
          {messages.map(message => (
            <MessageBubble
              key={message.id}
              message={message}
              language={lastLanguage}
              onPlayAudio={
                message.role === 'assistant'
                  ? () => playMessageAudio(message)
                  : undefined
              }
              isPlayingAudio={playingMessageId === message.id}
            />
          ))}

          {/* Loading indicator */}
          {isLoading && <LoadingDots />}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input area */}
      <footer className="flex-shrink-0 bg-white border-t border-gray-100 px-4 py-4">
        <div className="max-w-3xl mx-auto">
          {/* Recording error */}
          {recordingError && (
            <p className="text-red-500 text-sm mb-2 text-center">{recordingError}</p>
          )}

          {/* Recording/Transcribing indicator */}
          {isRecording && (
            <p className="text-red-500 text-sm mb-2 text-center animate-pulse">
              🎙️ Recording... Release when done | جاري التسجيل... اترك عند الانتهاء
            </p>
          )}
          {isTranscribing && (
            <p className="text-yellow-600 text-sm mb-2 text-center animate-pulse">
              ⏳ Transcribing... | جاري التحويل...
            </p>
          )}

          <form onSubmit={handleSubmit} className="flex items-center gap-3">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Type in English or Arabic... | اكتب بالإنجليزية أو العربية..."
              disabled={isLoading || isRecording || isTranscribing}
              className="flex-1 px-4 py-3 rounded-full border border-gray-200 focus:outline-none focus:border-[#ffc107] focus:ring-2 focus:ring-[#ffc107]/20 disabled:bg-gray-50 disabled:cursor-not-allowed"
            />

            {/* Voice button */}
            <VoiceButton
              isRecording={isRecording}
              isProcessing={isProcessing}
              onClick={handleVoiceToggle}
              disabled={isLoading}
              recordingDuration={recordingDuration}
            />

            {/* Send button */}
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading || isRecording || isTranscribing}
              className="w-12 h-12 rounded-full bg-[#ffc107] hover:bg-[#e0a800] disabled:bg-gray-200 disabled:cursor-not-allowed flex items-center justify-center transition-all active:scale-95 shadow-md"
            >
              <svg
                className={`w-5 h-5 ${inputText.trim() && !isLoading ? 'text-white' : 'text-gray-400'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-3">
            Click mic to start/stop recording | اضغط على الميكروفون للتسجيل
          </p>
        </div>
      </footer>
    </div>
  );
}
