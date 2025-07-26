/**
 * Google AdSense integration utilities
 */

export interface AdSenseConfig {
  publisherId: string;
  enabled: boolean;
  testMode: boolean;
}

export interface AdUnit {
  slot: string;
  format: 'auto' | 'rectangle' | 'vertical' | 'horizontal';
  responsive: boolean;
  style?: {
    display?: string;
    width?: string;
    height?: string;
  };
}

// AdSense configuration
export const ADSENSE_CONFIG: AdSenseConfig = {
  publisherId: process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || 'ca-pub-test',
  enabled: process.env.NEXT_PUBLIC_ADSENSE_ENABLED === 'true',
  testMode: process.env.NODE_ENV !== 'production'
};

// Predefined ad units for different placements
export const AD_UNITS: Record<string, AdUnit> = {
  header: {
    slot: '1234567890',
    format: 'horizontal',
    responsive: true,
    style: {
      display: 'block',
      width: '100%',
      height: '90px'
    }
  },
  sidebar: {
    slot: '2345678901',
    format: 'vertical',
    responsive: true,
    style: {
      display: 'block',
      width: '300px',
      height: '600px'
    }
  },
  content: {
    slot: '3456789012',
    format: 'rectangle',
    responsive: true,
    style: {
      display: 'block',
      width: '336px',
      height: '280px'
    }
  },
  footer: {
    slot: '4567890123',
    format: 'horizontal',
    responsive: true,
    style: {
      display: 'block',
      width: '100%',
      height: '90px'
    }
  },
  mobile_banner: {
    slot: '5678901234',
    format: 'horizontal',
    responsive: true,
    style: {
      display: 'block',
      width: '320px',
      height: '50px'
    }
  },
  in_article: {
    slot: '6789012345',
    format: 'auto',
    responsive: true,
    style: {
      display: 'block'
    }
  }
};

/**
 * Check if AdSense should be displayed for the current user
 */
export function shouldShowAds(user: any): boolean {
  // Don't show ads if AdSense is disabled
  if (!ADSENSE_CONFIG.enabled) {
    return false;
  }

  // Don't show ads to premium users
  if (user?.subscription?.status === 'premium') {
    return false;
  }

  // Show ads to free users and unauthenticated users
  return true;
}

/**
 * Load AdSense script
 */
export function loadAdSenseScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if script is already loaded
    if (document.querySelector('script[src*="adsbygoogle.js"]')) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CONFIG.publisherId}`;
    
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load AdSense script'));
    
    document.head.appendChild(script);
  });
}

/**
 * Initialize AdSense ad
 */
export function initializeAd(element: HTMLElement): void {
  try {
    // Check if adsbygoogle is available
    if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    }
  } catch (error) {
    console.error('Error initializing AdSense ad:', error);
  }
}

/**
 * Get responsive ad sizes based on screen width
 */
export function getResponsiveAdSizes(placement: string): string {
  const sizes: Record<string, string> = {
    header: '(max-width: 768px) 320px, (max-width: 1024px) 728px, 970px',
    sidebar: '(max-width: 768px) 300px, 336px',
    content: '(max-width: 768px) 300px, 336px',
    footer: '(max-width: 768px) 320px, (max-width: 1024px) 728px, 970px',
    mobile_banner: '320px',
    in_article: '(max-width: 768px) 300px, (max-width: 1024px) 728px, 970px'
  };

  return sizes[placement] || '300px';
}

/**
 * Generate ad unit HTML attributes
 */
export function getAdUnitAttributes(placement: string): Record<string, string> {
  const adUnit = AD_UNITS[placement];
  
  if (!adUnit) {
    console.warn(`Unknown ad placement: ${placement}`);
    return {};
  }

  const attributes: Record<string, string> = {
    'data-ad-client': ADSENSE_CONFIG.publisherId,
    'data-ad-slot': adUnit.slot,
    'data-ad-format': adUnit.format,
    'data-full-width-responsive': adUnit.responsive.toString()
  };

  // Add responsive sizes for auto format
  if (adUnit.format === 'auto' && adUnit.responsive) {
    attributes['data-ad-format'] = 'auto';
    attributes['data-full-width-responsive'] = 'true';
  }

  // Add test mode attributes
  if (ADSENSE_CONFIG.testMode) {
    attributes['data-adtest'] = 'on';
  }

  return attributes;
}

/**
 * Track ad performance (placeholder for analytics)
 */
export function trackAdPerformance(placement: string, event: 'impression' | 'click'): void {
  try {
    // In a real implementation, you would send this data to your analytics service
    console.log(`Ad ${event} tracked for placement: ${placement}`);
    
    // Example: Send to Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', `ad_${event}`, {
        event_category: 'advertising',
        event_label: placement,
        value: event === 'click' ? 1 : 0
      });
    }
  } catch (error) {
    console.error('Error tracking ad performance:', error);
  }
}

/**
 * Handle ad blocking detection
 */
export function detectAdBlocker(): Promise<boolean> {
  return new Promise((resolve) => {
    // Create a test element that ad blockers typically block
    const testAd = document.createElement('div');
    testAd.innerHTML = '&nbsp;';
    testAd.className = 'adsbox';
    testAd.style.position = 'absolute';
    testAd.style.left = '-10000px';
    testAd.style.width = '1px';
    testAd.style.height = '1px';
    
    document.body.appendChild(testAd);
    
    // Check if the element was blocked
    setTimeout(() => {
      const isBlocked = testAd.offsetHeight === 0;
      document.body.removeChild(testAd);
      resolve(isBlocked);
    }, 100);
  });
}

/**
 * Get ad placement recommendations based on page type
 */
export function getRecommendedPlacements(pageType: string): string[] {
  const recommendations: Record<string, string[]> = {
    home: ['header', 'sidebar', 'content'],
    search: ['header', 'sidebar', 'in_article'],
    food_detail: ['header', 'sidebar', 'content', 'footer'],
    recipe_detail: ['header', 'sidebar', 'in_article', 'footer'],
    favorites: ['header', 'content'],
    nutrition: ['header', 'sidebar', 'content'],
    shopping_list: ['header', 'content'],
    mobile: ['mobile_banner', 'in_article']
  };

  return recommendations[pageType] || ['header', 'content'];
}

/**
 * Calculate ad revenue estimation (placeholder)
 */
export function estimateAdRevenue(impressions: number, ctr: number = 0.02, cpc: number = 0.5): number {
  return impressions * ctr * cpc;
}