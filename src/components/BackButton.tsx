'use client';

import { useRouter } from 'next/navigation';

interface BackButtonProps {
  className?: string;
  variant?: 'default' | 'minimal' | 'floating';
  onBack?: () => void;
}

export default function BackButton({ 
  className = '', 
  variant = 'default',
  onBack 
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  if (variant === 'floating') {
    return (
      <button
        onClick={handleBack}
        className={`fixed top-4 left-4 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors ${className}`}
        aria-label="返回"
      >
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
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>
    );
  }

  if (variant === 'minimal') {
    return (
      <button
        onClick={handleBack}
        className={`flex items-center text-gray-600 hover:text-gray-900 transition-colors ${className}`}
      >
        <svg
          className="w-5 h-5 mr-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        <span className="text-sm">返回</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleBack}
      className={`flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors ${className}`}
    >
      <svg
        className="w-4 h-4 mr-2"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 19l-7-7 7-7"
        />
      </svg>
      返回
    </button>
  );
}
