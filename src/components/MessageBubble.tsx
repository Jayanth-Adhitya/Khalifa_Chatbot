'use client';

import { Message, Language } from '@/types';

interface MessageBubbleProps {
  message: Message;
  language: Language;
  onPlayAudio?: () => void;
  isPlayingAudio?: boolean;
}

export function MessageBubble({
  message,
  language,
  onPlayAudio,
  isPlayingAudio,
}: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isRTL = language === 'ar';

  return (
    <div
      className={`chat-message flex gap-3 message-animate ${
        isUser ? 'flex-row-reverse' : ''
      }`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
          isUser ? 'bg-[#ffc107]' : 'bg-gray-200'
        }`}
      >
        {isUser ? (
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        ) : (
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        )}
      </div>

      {/* Message content */}
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-[#ffc107] text-white rounded-tr-none'
            : 'bg-gray-100 text-gray-800 rounded-tl-none'
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </p>

        {/* Audio button for assistant messages */}
        {!isUser && onPlayAudio && (
          <button
            onClick={onPlayAudio}
            disabled={isPlayingAudio}
            className={`mt-2 flex items-center gap-1 text-xs ${
              isPlayingAudio ? 'text-gray-400' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {isPlayingAudio ? (
              <>
                <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </svg>
                {isRTL ? 'جاري التشغيل...' : 'Playing...'}
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                </svg>
                {isRTL ? 'استمع' : 'Listen'}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
