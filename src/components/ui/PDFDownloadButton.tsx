'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import LoadingSpinner from './LoadingSpinner';

interface PDFDownloadButtonProps {
  onDownload: () => Promise<void>;
  filename?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  children?: React.ReactNode;
}

export function PDFDownloadButton({
  onDownload,
  filename = 'document',
  className = '',
  size = 'md',
  variant = 'primary',
  disabled = false,
  children
}: PDFDownloadButtonProps) {
  const { data: session, status } = useSession();
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Size configurations
  const sizeConfig = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  // Variant configurations
  const variantConfig = {
    primary: 'bg-red-600 text-white hover:bg-red-700 border-red-600',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 border-gray-600',
    outline: 'bg-white text-red-600 hover:bg-red-50 border-red-600 border'
  };

  const baseClasses = `
    inline-flex items-center justify-center rounded-md font-medium transition-colors
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500
    disabled:opacity-50 disabled:cursor-not-allowed
    ${sizeConfig[size]}
    ${variantConfig[variant]}
    ${className}
  `;

  // Check if user has premium access
  const hasPremiumAccess = status === 'authenticated' && session?.user?.subscription?.status === 'premium';

  if (status !== 'authenticated') {
    return (
      <Link
        href="/auth/signin"
        className={baseClasses}
        title="ログインしてPDFをダウンロード"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        {children || 'PDFダウンロード'}
      </Link>
    );
  }

  if (!hasPremiumAccess) {
    return (
      <Link
        href="/pricing"
        className={baseClasses}
        title="プレミアムプランでPDFダウンロード"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        {children || 'プレミアム限定'}
      </Link>
    );
  }

  const handleDownload = async () => {
    if (disabled || isDownloading) return;

    setIsDownloading(true);
    setError(null);

    try {
      await onDownload();
    } catch (error) {
      console.error('PDF download error:', error);
      setError(error instanceof Error ? error.message : 'PDFダウンロードに失敗しました');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleDownload}
        disabled={disabled || isDownloading}
        className={baseClasses}
        title={`${filename}.pdfをダウンロード`}
      >
        {isDownloading ? (
          <>
            <LoadingSpinner size="sm" className="mr-2" />
            生成中...
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {children || 'PDFダウンロード'}
          </>
        )}
      </button>

      {error && (
        <div className="absolute top-full left-0 mt-1 px-3 py-2 bg-red-100 border border-red-300 rounded text-sm text-red-700 whitespace-nowrap z-10 shadow-lg">
          {error}
          {error.includes('プレミアム') && (
            <Link href="/pricing" className="ml-2 underline hover:no-underline">
              アップグレード
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export default PDFDownloadButton;