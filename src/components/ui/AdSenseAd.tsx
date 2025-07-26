'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { 
  shouldShowAds, 
  loadAdSenseScript, 
  initializeAd, 
  getAdUnitAttributes,
  trackAdPerformance,
  AD_UNITS,
  ADSENSE_CONFIG
} from '../../lib/adsense';

interface AdSenseAdProps {
  placement: string;
  className?: string;
  style?: React.CSSProperties;
  fallback?: React.ReactNode;
}

export function AdSenseAd({ 
  placement, 
  className = '', 
  style = {},
  fallback 
}: AdSenseAdProps) {
  const { data: session, status } = useSession();
  const adRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Check if ads should be shown
  const showAds = shouldShowAds(session?.user);

  // Get ad unit configuration
  const adUnit = AD_UNITS[placement];

  useEffect(() => {
    if (!showAds || !adUnit || hasError) {
      return;
    }

    let isMounted = true;

    const initializeAdSense = async () => {
      try {
        // Load AdSense script
        await loadAdSenseScript();
        
        if (!isMounted) return;

        // Initialize the ad
        if (adRef.current) {
          initializeAd(adRef.current);
          setIsLoaded(true);
          
          // Track impression
          trackAdPerformance(placement, 'impression');
        }
      } catch (error) {
        console.error('Error loading AdSense:', error);
        if (isMounted) {
          setHasError(true);
        }
      }
    };

    initializeAdSense();

    return () => {
      isMounted = false;
    };
  }, [showAds, adUnit, placement, hasError]);

  // Intersection Observer for viewability tracking
  useEffect(() => {
    if (!adRef.current || !isLoaded) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true);
            // Track when ad becomes visible
            trackAdPerformance(placement, 'impression');
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(adRef.current);

    return () => {
      observer.disconnect();
    };
  }, [isLoaded, isVisible, placement]);

  // Don't render if ads shouldn't be shown
  if (!showAds) {
    return fallback ? <>{fallback}</> : null;
  }

  // Don't render if no ad unit configuration
  if (!adUnit) {
    console.warn(`No ad unit configuration found for placement: ${placement}`);
    return fallback ? <>{fallback}</> : null;
  }

  // Show error fallback
  if (hasError) {
    return fallback ? <>{fallback}</> : (
      <div className={`bg-gray-100 border border-gray-200 rounded-lg p-4 text-center ${className}`}>
        <p className="text-sm text-gray-500">広告を読み込めませんでした</p>
      </div>
    );
  }

  // Get ad attributes
  const adAttributes = getAdUnitAttributes(placement);

  // Combine styles
  const combinedStyle = {
    ...adUnit.style,
    ...style
  };

  return (
    <div className={`ad-container ${className}`} style={combinedStyle}>
      {/* Ad label for transparency */}
      <div className="text-xs text-gray-400 mb-1 text-center">
        スポンサー
      </div>
      
      {/* AdSense ad unit */}
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={combinedStyle}
        {...adAttributes}
      />
      
      {/* Loading state */}
      {!isLoaded && (
        <div className="flex items-center justify-center bg-gray-100 border border-gray-200 rounded-lg" style={combinedStyle}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400 mx-auto mb-2"></div>
            <p className="text-xs text-gray-500">広告を読み込み中...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdSenseAd;