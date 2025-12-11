'use client';

export function LoadingDots() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
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
      </div>
      <div className="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-3">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-gray-400 rounded-full loading-dot" />
          <span className="w-2 h-2 bg-gray-400 rounded-full loading-dot" />
          <span className="w-2 h-2 bg-gray-400 rounded-full loading-dot" />
        </div>
      </div>
    </div>
  );
}
