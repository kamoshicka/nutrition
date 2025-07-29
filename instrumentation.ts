/**
 * Next.js Instrumentation File
 * 
 * This file is used to initialize server-side services when the application starts.
 * It runs once when the server starts up.
 */

export async function register() {
  // Only run on server side
  if (typeof window === 'undefined') {
    try {
      // Initialize health monitoring system
      const { initializeHealthMonitoring } = await import('./src/lib/rakuten-health-monitor');
      initializeHealthMonitoring();
      
      console.info('✓ Health monitoring system initialized');
    } catch (error) {
      console.error('Failed to initialize health monitoring:', error);
    }
  }
}