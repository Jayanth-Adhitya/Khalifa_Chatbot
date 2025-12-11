'use client';

import { Language } from '@/types';

interface LanguageToggleProps {
  language: Language;
  onLanguageChange: (language: Language) => void;
}

export function LanguageToggle({ language, onLanguageChange }: LanguageToggleProps) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-gray-100 p-1">
      <button
        onClick={() => onLanguageChange('en')}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
          language === 'en'
            ? 'bg-[#ffc107] text-white shadow-sm'
            : 'text-gray-600 hover:text-gray-800'
        }`}
      >
        English
      </button>
      <button
        onClick={() => onLanguageChange('ar')}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
          language === 'ar'
            ? 'bg-[#ffc107] text-white shadow-sm'
            : 'text-gray-600 hover:text-gray-800'
        }`}
      >
        العربية
      </button>
    </div>
  );
}
