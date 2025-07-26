'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { detectAdBlocker, shouldShowAds } from '../../lib/adsense';

interface AdBlockerDetectorProps {
  onDetected?: (isBlocked: boolean) => void;
  showMessage?: boolean;
  className?: string;
}

export function AdBlockerDetector({ 
  onDetected, 
  showMessage = true,
  className = '' 
}: AdBlockerDetectorProps) {
  const { data: session, status } = useSession();
  const [isAdBlocked, setIsAdBlocked] = useState<boolean | null>(null);
  const [showNotice, setShowNotice] = useState(false);

  // Check if ads should be shown
  const showAds = shouldShowAds(session?.user);

  useEffect(() => {
    if (!showAds) {
      return;
    }

    let isMounted = true;

    const checkAdBlocker = async () => {
      try {
        const isBlocked = await detectAdBlocker();
        
        if (isMounted) {
          setIsAdBlocked(isBlocked);
          setShowNotice(isBlocked && showMessage);
          onDetected?.(isBlocked);
        }
      } catch (error) {
        console.error('Error detecting ad blocker:', error);
      }
    };

    // Delay the check to avoid false positives
    const timer = setTimeout(checkAdBlocker, 1000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [showAds, showMessage, onDetected]);

  // Don't show anything if ads shouldn't be displayed or no ad blocker detected
  if (!showAds || !showNotice) {
    return null;
  }

  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            広告ブロッカーが検出されました
          </h3>
          
          <div className="mt-2 text-sm text-yellow-700">
            <p className="mb-2">
              このサイトは広告収入によって運営されています。広告ブロッカーを無効にしていただくか、プレミアムプランにアップグレードして広告なしでご利用ください。
            </p>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowNotice(false)}
                className="text-yellow-800 hover:text-yellow-900 font-medium"
              >
                理解しました
              </button>
              
              <Link
                href="/pricing"
                className="inline-flex items-center px-3 py-1 border border-yellow-300 rounded-md text-yellow-800 hover:bg-yellow-100 transition-colors"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                プレミアムプラン
              </Link>
            </div>
          </div>
        </div>
        
        <div className="ml-auto pl-3">
          <button
            onClick={() => setShowNotice(false)}
            className="inline-flex text-yellow-400 hover:text-yellow-600"
          >
            <span className="sr-only">閉じる</span>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdBlockerDetector;