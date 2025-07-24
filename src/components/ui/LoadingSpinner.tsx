'use client';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  className?: string;
}

/**
 * LoadingSpinner component for displaying loading states
 * 
 * This component shows a spinner animation with an optional message
 * to indicate that content is being loaded.
 */
export default function LoadingSpinner({
  size = 'medium',
  message = 'データを読み込み中...',
  className = '',
}: LoadingSpinnerProps) {
  // Determine spinner size
  const spinnerSizeClasses = {
    small: 'w-4 h-4 border-2',
    medium: 'w-8 h-8 border-3',
    large: 'w-12 h-12 border-4',
  };

  const sizeClass = spinnerSizeClasses[size];

  return (
    <div className={`flex flex-col items-center justify-center p-4 ${className}`}>
      <div
        className={`${sizeClass} border-t-blue-500 border-r-blue-500 border-b-blue-200 border-l-blue-200 rounded-full animate-spin`}
        role="status"
        aria-label="読み込み中"
      ></div>
      {message && (
        <p className="mt-3 text-sm text-gray-600">{message}</p>
      )}
    </div>
  );
}