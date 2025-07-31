/**
 * Next.js Instrumentation File
 * 
 * This file is used to initialize server-side services when the application starts.
 * It runs once when the server starts up and performs startup validation.
 * 
 * This implements the startup validation requirements:
 * - 1.1: Read RAKUTEN_APPLICATION_ID from environment variables on startup
 * - 1.3: Fall back to mock data when API key is missing
 * - 1.5: Log warnings and use mock data for invalid API keys
 * - 2.3: Provide helpful error messages with setup instructions
 * - 2.4: Clearly indicate data source in development mode
 */

export async function register() {
  // Only run on server side
  if (typeof window === 'undefined') {
    const startTime = Date.now();
    
    console.info('🚀 Starting application initialization...');
    
    try {
      // Perform comprehensive startup configuration validation
      const { validateApplicationStartup } = await import('./src/lib/startup-validation');
      
      const validationResult = await validateApplicationStartup({
        exitOnError: process.env.NODE_ENV === 'production',
        logLevel: process.env.NODE_ENV === 'production' ? 'minimal' : 'detailed',
        skipNonCritical: false,
        validateConnections: true
      });

      // Log startup validation summary
      const duration = Date.now() - startTime;
      
      if (validationResult.canStart) {
        console.info(`✅ Application startup validation completed successfully (${duration}ms)`);
        
        // Log configuration status for transparency
        const { rakutenApi, database, authentication, payments } = validationResult.configurationStatus;
        console.info('📊 Configuration Status:');
        console.info(`  • Rakuten API: ${rakutenApi.configured ? '✓' : '✗'} configured, ${rakutenApi.valid ? '✓' : '✗'} valid, using ${rakutenApi.usingMockData ? 'mock' : 'real'} data`);
        console.info(`  • Database: ${database.configured ? '✓' : '✗'} configured, ${database.accessible ? '✓' : '✗'} accessible`);
        console.info(`  • Authentication: ${authentication.configured ? '✓' : '✗'} configured, ${authentication.valid ? '✓' : '✗'} valid`);
        console.info(`  • Payments: ${payments.configured ? '✓' : '✗'} configured, ${payments.valid ? '✓' : '✗'} valid`);
        
        // Show warnings if any
        if (validationResult.warnings.length > 0) {
          console.warn('⚠️ Configuration warnings:');
          validationResult.warnings.forEach(warning => console.warn(`  • ${warning}`));
        }
        
        // Show recommendations in development
        if (process.env.NODE_ENV === 'development' && validationResult.recommendations.length > 0) {
          console.info('💡 Configuration recommendations:');
          validationResult.recommendations.forEach(rec => console.info(`  • ${rec}`));
        }
        
      } else {
        console.error(`❌ Application startup validation failed (${duration}ms)`);
        console.error('Configuration errors:');
        validationResult.errors.forEach(error => console.error(`  • ${error}`));
        
        if (validationResult.recommendations.length > 0) {
          console.error('Recommendations:');
          validationResult.recommendations.forEach(rec => console.error(`  • ${rec}`));
        }
        
        // In production, exit immediately
        if (process.env.NODE_ENV === 'production') {
          console.error('🛑 Cannot start application in production with configuration errors');
          process.exit(1);
        } else {
          console.warn('⚠️ Starting application with configuration issues (development mode)');
        }
      }
      
      // Initialize health monitoring system if validation passed
      if (validationResult.canStart) {
        try {
          const { initializeHealthMonitoring } = await import('./src/lib/rakuten-health-monitor');
          initializeHealthMonitoring();
          console.info('🔍 Health monitoring system initialized');
        } catch (healthError) {
          console.warn('⚠️ Failed to initialize health monitoring:', healthError);
        }
      }
      
      const totalDuration = Date.now() - startTime;
      console.info(`🎉 Application initialization completed in ${totalDuration}ms`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`💥 Critical failure during application initialization (${duration}ms):`, error);
      
      // In production, this is a critical failure
      if (process.env.NODE_ENV === 'production') {
        console.error('🛑 Critical startup failure in production environment');
        console.error('Please check your configuration and try again.');
        process.exit(1);
      } else {
        console.warn('⚠️ Continuing with limited functionality due to startup issues');
        console.warn('Some features may not work correctly. Please check your configuration.');
      }
    }
  }
}