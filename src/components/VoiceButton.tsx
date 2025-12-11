'use client';

interface VoiceButtonProps {
  isRecording: boolean;
  isProcessing: boolean;
  onClick: () => void;
  disabled?: boolean;
  recordingDuration?: number;
}

export function VoiceButton({
  isRecording,
  isProcessing,
  onClick,
  disabled,
  recordingDuration = 0,
}: VoiceButtonProps) {
  const seconds = Math.floor(recordingDuration / 1000);
  const showTimer = isRecording && recordingDuration > 0;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isProcessing) {
      onClick();
    }
  };

  return (
    <div className="relative">
      {/* Pulse animation when recording */}
      {isRecording && (
        <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75" />
      )}

      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isProcessing}
        className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md ${
          isRecording
            ? 'bg-red-500 scale-110 shadow-red-300'
            : isProcessing
            ? 'bg-gray-300 cursor-wait'
            : 'bg-white border-2 border-[#ffc107] hover:bg-[#fff8e1] active:scale-95'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isProcessing ? (
          <svg
            className="w-5 h-5 text-gray-500 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : showTimer ? (
          <span className="text-white font-bold text-sm">{seconds}s</span>
        ) : (
          <svg
            className={`w-5 h-5 ${isRecording ? 'text-white' : 'text-[#ffc107]'}`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          </svg>
        )}
      </button>
    </div>
  );
}
