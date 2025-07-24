'use client';

interface ErrorMessageProps {
  message?: string;
  details?: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * ErrorMessage component for displaying error states
 * 
 * This component shows an error message with optional details
 * and a retry button if a retry function is provided.
 */
export default function ErrorMessage({
  message = 'エラーが発生しました',
  details,
  onRetry,
  className = '',
}: ErrorMessageProps) {
  return (
    <div className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`} role="alert">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">{message}</h3>
          {details && (
            <div className="mt-2 text-sm text-red-700">
              <p>{details}</p>
            </div>
          )}
          {onRetry && (
            <div className="mt-4">
              <button
                type="button"
                onClick={onRetry}
                className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                再試行
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}