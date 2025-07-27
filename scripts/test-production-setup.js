/**
 * Production setup verification script
 * Tests all production components to ensure they're working correctly
 */

const fs = require('fs').promises;
const path = require('path');
const { DatabaseMigrator } = require('./migrate-db');
const { DatabaseBackup } = require('./backup-db');

class ProductionSetupTester {
  constructor() {
    this.testResults = [];
    this.errors = [];
  }

  async runAllTests() {
    console.log('🧪 Running production setup verification tests...\n');

    const tests = [
      { name: 'Environment Configuration', test: () => this.testEnvironmentConfig() },
      { name: 'Directory Structure', test: () => this.testDirectoryStructure() },
      { name: 'Database Migration System', test: () => this.testMigrationSystem() },
      { name: 'Backup System', test: () => this.testBackupSystem() },
      { name: 'Logging Configuration', test: () => this.testLoggingConfig() },
      { name: 'Health Check System', test: () => this.testHealthCheckSystem() },
      { name: 'Monitoring System', test: () => this.testMonitoringSystem() },
      { name: 'Error Monitoring', test: () => this.testErrorMonitoring() },
      { name: 'Security Configuration', test: () => this.testSecurityConfig() },
      { name: 'Performance Optimization', test: () => this.testPerformanceOptimization() }
    ];

    for (const { name, test } of tests) {
      try {
        console.log(`Testing ${name}...`);
        const result = await test();
        this.testResults.push({ name, status: 'PASS', details: result });
        console.log(`✅ ${name}: PASSED`);
      } catch (error) {
        this.testResults.push({ name, status: 'FAIL', error: error.message });
        this.errors.push({ test: name, error: error.message });
        console.log(`❌ ${name}: FAILED - ${error.message}`);
      }
      console.log('');
    }

    this.printSummary();
    return this.errors.length === 0;
  }

  async testEnvironmentConfig() {
    // Test environment configuration files
    const envFiles = ['.env.example', '.env.production.example'];
    
    for (const file of envFiles) {
      await fs.access(path.join(process.cwd(), file));
    }

    // Test config module
    try {
      const configPath = path.join(process.cwd(), 'lib', 'config.ts');
      await fs.access(configPath);
      
      const configContent = await fs.readFile(configPath, 'utf8');
      if (!configContent.includes('envSchema')) {
        throw new Error('Environment validation schema not found');
      }
    } catch (error) {
      throw new Error(`Config module test failed: ${error.message}`);
    }

    return 'Environment configuration files and validation present';
  }

  async testDirectoryStructure() {
    const requiredDirs = ['data', 'logs', 'backups', 'migrations'];
    const missingDirs = [];

    for (const dir of requiredDirs) {
      try {
        await fs.access(path.join(process.cwd(), dir));
      } catch (error) {
        missingDirs.push(dir);
      }
    }

    if (missingDirs.length > 0) {
      throw new Error(`Missing directories: ${missingDirs.join(', ')}`);
    }

    return 'All required directories present';
  }

  async testMigrationSystem() {
    // Test migration script exists
    const migrationScript = path.join(process.cwd(), 'scripts', 'migrate-db.js');
    await fs.access(migrationScript);

    // Test migration directory and files
    const migrationsDir = path.join(process.cwd(), 'migrations');
    await fs.access(migrationsDir);

    const migrationFiles = await fs.readdir(migrationsDir);
    const sqlFiles = migrationFiles.filter(f => f.endsWith('.sql'));
    
    if (sqlFiles.length === 0) {
      throw new Error('No migration files found');
    }

    // Test DatabaseMigrator class
    const dbPath = path.join(process.cwd(), 'data', 'test_migration.db');
    const migrator = new DatabaseMigrator(dbPath);
    
    try {
      await migrator.connect();
      await migrator.createMigrationsTable();
      await migrator.disconnect();
      
      // Clean up test database
      try {
        await fs.unlink(dbPath);
      } catch (error) {
        // Ignore cleanup errors
      }
    } catch (error) {
      throw new Error(`Migration system test failed: ${error.message}`);
    }

    return `Migration system working, ${sqlFiles.length} migration files found`;
  }

  async testBackupSystem() {
    // Test backup script exists
    const backupScript = path.join(process.cwd(), 'scripts', 'backup-db.js');
    await fs.access(backupScript);

    // Test DatabaseBackup class
    const backup = new DatabaseBackup();
    
    // Test backup directory creation
    await backup.ensureBackupDirectory();
    
    // Test backup listing (should not throw)
    const backups = await backup.listBackups();
    
    return `Backup system working, ${backups.length} existing backups found`;
  }

  async testLoggingConfig() {
    // Test logger module
    const loggerPath = path.join(process.cwd(), 'lib', 'logger.ts');
    await fs.access(loggerPath);

    const loggerContent = await fs.readFile(loggerPath, 'utf8');
    if (!loggerContent.includes('class Logger')) {
      throw new Error('Logger class not found');
    }

    // Test log directory
    const logsDir = path.join(process.cwd(), 'logs');
    await fs.access(logsDir);

    return 'Logging system configured';
  }

  async testHealthCheckSystem() {
    // Test health check API route
    const healthRoute = path.join(process.cwd(), 'src', 'app', 'api', 'health', 'route.ts');
    await fs.access(healthRoute);

    // Test monitoring module
    const monitoringPath = path.join(process.cwd(), 'lib', 'monitoring.ts');
    await fs.access(monitoringPath);

    const monitoringContent = await fs.readFile(monitoringPath, 'utf8');
    if (!monitoringContent.includes('class MonitoringService')) {
      throw new Error('MonitoringService class not found');
    }

    // Test health check script
    const healthScript = path.join(process.cwd(), 'health-check.sh');
    await fs.access(healthScript);

    return 'Health check system configured';
  }

  async testMonitoringSystem() {
    // Test monitoring module components
    const monitoringPath = path.join(process.cwd(), 'lib', 'monitoring.ts');
    const monitoringContent = await fs.readFile(monitoringPath, 'utf8');

    const requiredComponents = [
      'HealthCheckResult',
      'MetricData',
      'MonitoringService',
      'runHealthChecks',
      'recordMetric'
    ];

    for (const component of requiredComponents) {
      if (!monitoringContent.includes(component)) {
        throw new Error(`Missing monitoring component: ${component}`);
      }
    }

    return 'Monitoring system components present';
  }

  async testErrorMonitoring() {
    // Test error monitoring module
    const errorMonitoringPath = path.join(process.cwd(), 'lib', 'error-monitoring.ts');
    await fs.access(errorMonitoringPath);

    const errorContent = await fs.readFile(errorMonitoringPath, 'utf8');
    if (!errorContent.includes('class ErrorMonitoringService')) {
      throw new Error('ErrorMonitoringService class not found');
    }

    const requiredComponents = [
      'ErrorReport',
      'AlertRule',
      'reportError',
      'checkAlertRules'
    ];

    for (const component of requiredComponents) {
      if (!errorContent.includes(component)) {
        throw new Error(`Missing error monitoring component: ${component}`);
      }
    }

    return 'Error monitoring system configured';
  }

  async testSecurityConfig() {
    // Test Next.js security configuration
    const nextConfigPath = path.join(process.cwd(), 'next.config.js');
    const nextConfig = await fs.readFile(nextConfigPath, 'utf8');

    const securityHeaders = [
      'X-Content-Type-Options',
      'X-Frame-Options',
      'X-XSS-Protection',
      'Content-Security-Policy'
    ];

    for (const header of securityHeaders) {
      if (!nextConfig.includes(header)) {
        throw new Error(`Missing security header: ${header}`);
      }
    }

    return 'Security headers configured in Next.js';
  }

  async testPerformanceOptimization() {
    // Test database optimizer
    const optimizerPath = path.join(process.cwd(), 'lib', 'database-optimizer.ts');
    await fs.access(optimizerPath);

    const optimizerContent = await fs.readFile(optimizerPath, 'utf8');
    if (!optimizerContent.includes('class DatabaseOptimizer')) {
      throw new Error('DatabaseOptimizer class not found');
    }

    // Test analytics module
    const analyticsPath = path.join(process.cwd(), 'lib', 'analytics.ts');
    await fs.access(analyticsPath);

    const analyticsContent = await fs.readFile(analyticsPath, 'utf8');
    if (!analyticsContent.includes('class AnalyticsService')) {
      throw new Error('AnalyticsService class not found');
    }

    // Test admin API endpoints
    const kpisRoute = path.join(process.cwd(), 'src', 'app', 'api', 'admin', 'kpis', 'route.ts');
    const performanceRoute = path.join(process.cwd(), 'src', 'app', 'api', 'admin', 'performance', 'route.ts');
    
    await fs.access(kpisRoute);
    await fs.access(performanceRoute);

    return 'Performance optimization components configured';
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('PRODUCTION SETUP TEST SUMMARY');
    console.log('='.repeat(60));

    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const total = this.testResults.length;

    console.log(`\nTotal Tests: ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Success Rate: ${Math.round((passed / total) * 100)}%`);

    if (failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.errors.forEach(({ test, error }) => {
        console.log(`   - ${test}: ${error}`);
      });
    }

    if (passed === total) {
      console.log('\n🎉 All production setup tests passed!');
      console.log('\nNext steps:');
      console.log('1. Configure environment variables for production');
      console.log('2. Set up external services (Stripe, Sentry, etc.)');
      console.log('3. Configure monitoring and alerting');
      console.log('4. Run end-to-end tests');
      console.log('5. Deploy to production environment');
    } else {
      console.log('\n⚠️  Some tests failed. Please fix the issues before deploying to production.');
    }

    console.log('\n' + '='.repeat(60));
  }

  async generateTestReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.testResults.length,
        passed: this.testResults.filter(r => r.status === 'PASS').length,
        failed: this.testResults.filter(r => r.status === 'FAIL').length,
        successRate: Math.round((this.testResults.filter(r => r.status === 'PASS').length / this.testResults.length) * 100)
      },
      results: this.testResults,
      errors: this.errors
    };

    const reportPath = path.join(process.cwd(), 'production-setup-test-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📄 Test report saved to: ${reportPath}`);
    return reportPath;
  }
}

async function main() {
  const tester = new ProductionSetupTester();
  
  try {
    const success = await tester.runAllTests();
    await tester.generateTestReport();
    
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('Test runner failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { ProductionSetupTester };