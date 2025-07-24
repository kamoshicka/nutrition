'use client';

import { useEffect, useState } from 'react';
import ErrorMessage from './ErrorMessage';

interface ApiErrorFallbackProps {
  error: Error | null;
  resetError?: () => void;
  retryAction?: () => void;
}

/**
 * ApiErrorFallback component for displaying API-specific errors
 * 
 * This component provides a user-friendly display for API errors with
 * appropriate retry functionality.
 */
export default function ApiErrorFallback({
  error,
  resetError,
  retryAction,
}: ApiErrorFallbackProps) {
  const [errorDetails, setErrorDetails] = useState<{
    title: string;
    message: string;
    isNotFound?: boolean;
  }>({
    title: 'エラーが発生しました',
    message: 'データの読み込み中に問題が発生しました。',
  });

  useEffect(() => {
    if (!error) return;

    try {
      // Try to parse the error message as JSON (for API errors)
      const errorData = JSON.parse(error.message);
      
      if (errorData?.error) {
        const isNotFound = errorData.error.code === 'not_found' || 
                          errorData.error.code === 'FOOD_NOT_FOUND' ||
                          errorData.error.code === 'CATEGORY_NOT_FOUND';
        
        setErrorDetails({
          title: isNotFound ? '見つかりませんでした' : 'エラーが発生しました',
          message: errorData.error.message || 'データの読み込み中に問題が発生しました。',
          isNotFound,
        });
      }
    } catch (e) {
      // If not JSON, use the error message directly
      setErrorDetails({
        title: 'エラーが発生しました',
        message: error.message || 'データの読み込み中に問題が発生しました。',
      });
    }
  }, [error]);

  const handleRetry = () => {
    if (resetError) resetError();
    if (retryAction) retryAction();
  };

  return (
    <div className="my-8">
      <ErrorMessage
        message={errorDetails.title}
        details={errorDetails.message}
        onRetry={retryAction || resetError ? handleRetry : undefined}
      />
    </div>
  );
}