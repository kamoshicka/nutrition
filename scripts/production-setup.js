/**
 * Production environment setup script
 * Handles initial production deployment setup and configuration
 */

const fs = require('fs').promises;
const path = require('path');
const { DatabaseMigrator } = require('./migrate-db');

class ProductionSetup {
  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.requiredEnvVars = [
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL',
      'DATABASE_URL',
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET'
    ];
  }

  async validateEnvironment() {
    console.log('🔍 Validating production environment...');
    
    const missing = [];
    const warnings = [];
    
    // Check required environment variables
    for (const envVar of this.requiredEnvVars) {
      if (!process.env[envVar]) {
        missing.push(envVar);
      }
    }
    
    // Check optional but recommended variables
    const recommended = [
      'SENTRY_DSN',
      'NEXT_PUBLIC_GA_MEASUREMENT_ID',
      'RAKUTEN_APPLICATION_ID'
    ];
    
    for (const envVar of recommended) {
      if (!process.env[envVar]) {
        warnings.push(envVar);
      }
    }
    
    if (missing.length > 0) {
      console.error('❌ Missing required environment variables:');
      missing.forEach(var_ => console.error(`   - ${var_}`));
      throw new Error('Missing required environment variables');
    }
    
    if (warnings.length > 0) {
      console.warn('⚠️  Missing recommended environment variables:');
      warnings.forEach(var_ => console.warn(`   - ${var_}`));
    }
    
    // Validate NEXTAUTH_SECRET length
    if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length < 32) {
      throw new Error('NEXTAUTH_SECRET must be at least 32 characters long');
    }
    
    // Validate URLs
    if (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.startsWith('https://')) {
      console.warn('⚠️  NEXTAUTH_URL should use HTTPS in production');
    }
    
    console.log('✅ Environment validation completed');
  }

  async setupDirectories() {
    console.log('📁 Setting up directories...');
    
    const directories = [
      'data',
      'logs',
      'backups',
      'migrations'
    ];
    
    for (const dir of directories) {
      const dirPath = path.join(process.cwd(), dir);
      try {
        await fs.access(dirPath);
        console.log(`   ✅ Directory exists: ${dir}`);
      } catch (error) {
        await fs.mkdir(dirPath, { recursive: true });
        console.log(`   📁 Created directory: ${dir}`);
      }
    }
  }

  async setupDatabase() {
    console.log('🗄️  Setting up database...');
    
    const dbPath = process.env.DATABASE_URL || path.join(process.cwd(), 'data', 'app.db');
    
    // Check if database exists
    try {
      await fs.access(dbPath);
      console.log('   ✅ Database file exists');
    } catch (error) {
      console.log('   📄 Database file does not exist, will be created during migration');
    }
    
    // Run migrations
    const migrator = new DatabaseMigrator(dbPath);
    try {
      await migrator.migrate();
      console.log('   ✅ Database migrations completed');
    } catch (error) {
      console.error('   ❌ Database migration failed:', error.message);
      throw error;
    } finally {
      await migrator.disconnect();
    }
  }

  async setupLogging() {
    console.log('📝 Setting up logging...');
    
    const logsDir = path.join(process.cwd(), 'logs');
    
    // Create log files
    const logFiles = [
      'app.log',
      'error.log',
      'access.log'
    ];
    
    for (const logFile of logFiles) {
      const logPath = path.join(logsDir, logFile);
      try {
        await fs.access(logPath);
        console.log(`   ✅ Log file exists: ${logFile}`);
      } catch (error) {
        await fs.writeFile(logPath, '');
        console.log(`   📝 Created log file: ${logFile}`);
      }
    }
    
    // Set up log rotation configuration
    const logRotateConfig = {
      files: logFiles.map(file => path.join(logsDir, file)),
      maxSize: '10M',
      maxFiles: 5,
      compress: true
    };
    
    await fs.writeFile(
      path.join(logsDir, 'logrotate.conf'),
      JSON.stringify(logRotateConfig, null, 2)
    );
    
    console.log('   ✅ Log rotation configuration created');
  }

  async setupSecurityHeaders() {
    console.log('🔒 Validating security configuration...');
    
    // Check if security headers are configured in next.config.js
    const nextConfigPath = path.join(process.cwd(), 'next.config.js');
    
    try {
      const nextConfig = await fs.readFile(nextConfigPath, 'utf8');
      
      const securityHeaders = [
        'X-Content-Type-Options',
        'X-Frame-Options',
        'X-XSS-Protection'
      ];
      
      const missingHeaders = securityHeaders.filter(header => 
        !nextConfig.includes(header)
      );
      
      if (missingHeaders.length > 0) {
        console.warn('⚠️  Missing security headers in next.config.js:');
        missingHeaders.forEach(header => console.warn(`   - ${header}`));
      } else {
        console.log('   ✅ Security headers configured');
      }
      
    } catch (error) {
      console.warn('⚠️  Could not validate next.config.js security headers');
    }
  }

  async createHealthCheckScript() {
    console.log('🏥 Creating health check script...');
    
    const healthCheckScript = `#!/bin/bash
# Health check script for production monitoring
# Usage: ./health-check.sh [endpoint]

ENDPOINT=\${1:-"http://localhost:3000/api/health"}
TIMEOUT=\${2:-10}

echo "Checking health endpoint: \$ENDPOINT"

response=\$(curl -s -w "%{http_code}" -m \$TIMEOUT "\$ENDPOINT")
http_code=\$(echo "\$response" | tail -n1)
body=\$(echo "\$response" | head -n -1)

if [ "\$http_code" -eq 200 ]; then
    echo "✅ Health check passed (HTTP \$http_code)"
    echo "\$body" | jq '.' 2>/dev/null || echo "\$body"
    exit 0
elif [ "\$http_code" -eq 503 ]; then
    echo "❌ Service unhealthy (HTTP \$http_code)"
    echo "\$body" | jq '.' 2>/dev/null || echo "\$body"
    exit 1
else
    echo "⚠️  Unexpected response (HTTP \$http_code)"
    echo "\$body" | jq '.' 2>/dev/null || echo "\$body"
    exit 2
fi
`;
    
    const scriptPath = path.join(process.cwd(), 'health-check.sh');
    await fs.writeFile(scriptPath, healthCheckScript);
    
    // Make script executable (Unix systems)
    try {
      await fs.chmod(scriptPath, 0o755);
      console.log('   ✅ Health check script created and made executable');
    } catch (error) {
      console.log('   ✅ Health check script created (chmod not available on this system)');
    }
  }

  async generateDeploymentChecklist() {
    console.log('📋 Generating deployment checklist...');
    
    const checklist = `# Production Deployment Checklist

## Pre-deployment
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] SSL certificate configured
- [ ] Domain DNS configured
- [ ] Stripe webhooks configured
- [ ] Error monitoring (Sentry) configured
- [ ] Analytics (Google Analytics) configured

## Deployment
- [ ] Build completed successfully
- [ ] Database migrations applied
- [ ] Health check endpoint responding
- [ ] All critical user flows tested
- [ ] Performance monitoring active

## Post-deployment
- [ ] Monitor error rates
- [ ] Check subscription webhooks
- [ ] Verify payment processing
- [ ] Test premium features
- [ ] Monitor system resources

## Rollback Plan
- [ ] Previous version tagged
- [ ] Database backup created
- [ ] Rollback procedure documented
- [ ] Monitoring alerts configured

## Environment Variables Checklist
${this.requiredEnvVars.map(var_ => `- [ ] ${var_}`).join('\n')}

## Optional Configuration
- [ ] SENTRY_DSN (Error monitoring)
- [ ] NEXT_PUBLIC_GA_MEASUREMENT_ID (Analytics)
- [ ] RAKUTEN_APPLICATION_ID (Recipe API)
- [ ] REDIS_URL (Caching)
- [ ] SMTP_* (Email notifications)

Generated on: ${new Date().toISOString()}
`;
    
    await fs.writeFile(
      path.join(process.cwd(), 'DEPLOYMENT_CHECKLIST.md'),
      checklist
    );
    
    console.log('   ✅ Deployment checklist created');
  }

  async run() {
    console.log('🚀 Starting production environment setup...\n');
    
    try {
      await this.validateEnvironment();
      await this.setupDirectories();
      await this.setupDatabase();
      await this.setupLogging();
      await this.setupSecurityHeaders();
      await this.createHealthCheckScript();
      await this.generateDeploymentChecklist();
      
      console.log('\n✅ Production setup completed successfully!');
      console.log('\nNext steps:');
      console.log('1. Review DEPLOYMENT_CHECKLIST.md');
      console.log('2. Test the health check: ./health-check.sh');
      console.log('3. Configure monitoring and alerts');
      console.log('4. Set up automated backups');
      
    } catch (error) {
      console.error('\n❌ Production setup failed:', error.message);
      process.exit(1);
    }
  }
}

// Run setup if called directly
if (require.main === module) {
  const setup = new ProductionSetup();
  setup.run();
}

module.exports = { ProductionSetup };