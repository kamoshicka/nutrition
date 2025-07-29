#!/usr/bin/env node

/**
 * Environment Setup CLI Tool
 * 
 * This script helps developers set up their environment configuration
 * for the Healthcare Food App with proper Rakuten API integration.
 */

const fs = require('fs');
const path = require('path');

// Import the environment setup utilities
// Note: In a real scenario, we'd need to compile TypeScript first
// For now, we'll create a simplified version

function detectEnvironment() {
  const nodeEnv = process.env.NODE_ENV;
  const vercelEnv = process.env.VERCEL_ENV;
  
  if (vercelEnv === 'production' || nodeEnv === 'production') {
    return 'production';
  } else if (vercelEnv === 'preview') {
    return 'staging';
  } else {
    return 'development';
  }
}

function generateExampleConfig(environment = 'development') {
  const configs = {
    development: `# Environment Configuration for DEVELOPMENT
# Generated on ${new Date().toISOString()}
#
# This file contains environment variables needed for the Healthcare Food App
# Copy this file to .env.local and update the values as needed
#
# For Rakuten API setup instructions, see:
# https://webservice.rakuten.co.jp/

# ===== REQUIRED VARIABLES =====
# NextAuth.js secret for JWT signing (minimum 32 characters)
NEXTAUTH_SECRET=your-super-secret-key-here-minimum-32-characters-long

# SQLite database file path
DATABASE_URL=./data/app.db

# ===== OPTIONAL VARIABLES =====
# These variables have default values but can be customized

# Rakuten Recipe API Application ID (20 characters)
RAKUTEN_APPLICATION_ID=your_20_character_api_key_here

# API request timeout in milliseconds
RAKUTEN_API_TIMEOUT=10000

# Maximum requests per second to Rakuten API
RAKUTEN_RATE_LIMIT_RPS=5

# Enable periodic API health checks (true/false)
RAKUTEN_ENABLE_HEALTH_CHECKS=false

# Use mock recipe data instead of Rakuten API (true/false)
USE_MOCK_RECIPES=true

# Public API base URL
NEXT_PUBLIC_API_URL=http://localhost:3000

# Number of bcrypt hashing rounds
BCRYPT_ROUNDS=12

# Enable analytics tracking (true/false)
ENABLE_ANALYTICS=false

# Enable error reporting (true/false)
ENABLE_ERROR_REPORTING=false

# ===== ENVIRONMENT-SPECIFIC NOTES =====
# - Set USE_MOCK_RECIPES=true to save API quota during development
# - RAKUTEN_APPLICATION_ID is optional in development
# - Health checks are disabled by default in development
`,
    staging: `# Environment Configuration for STAGING
# Generated on ${new Date().toISOString()}
#
# This file contains environment variables needed for the Healthcare Food App
# Copy this file to .env.local and update the values as needed
#
# For Rakuten API setup instructions, see:
# https://webservice.rakuten.co.jp/

# ===== REQUIRED VARIABLES =====
# NextAuth.js secret for JWT signing (minimum 32 characters)
NEXTAUTH_SECRET=your-super-secret-key-here-minimum-32-characters-long

# SQLite database file path
DATABASE_URL=./data/app.db

# ===== OPTIONAL VARIABLES =====
# These variables have default values but can be customized

# Rakuten Recipe API Application ID (20 characters)
RAKUTEN_APPLICATION_ID=your_20_character_api_key_here

# API request timeout in milliseconds
RAKUTEN_API_TIMEOUT=10000

# Maximum requests per second to Rakuten API
RAKUTEN_RATE_LIMIT_RPS=5

# Enable periodic API health checks (true/false)
RAKUTEN_ENABLE_HEALTH_CHECKS=true

# Use mock recipe data instead of Rakuten API (true/false)
USE_MOCK_RECIPES=false

# Public API base URL
NEXT_PUBLIC_API_URL=http://localhost:3000

# Number of bcrypt hashing rounds
BCRYPT_ROUNDS=12

# Enable analytics tracking (true/false)
ENABLE_ANALYTICS=false

# Enable error reporting (true/false)
ENABLE_ERROR_REPORTING=false

# ===== ENVIRONMENT-SPECIFIC NOTES =====
# - RAKUTEN_APPLICATION_ID is recommended for realistic testing
# - Health checks are enabled by default in staging
# - Use test Stripe keys for payment testing
`,
    production: `# Environment Configuration for PRODUCTION
# Generated on ${new Date().toISOString()}
#
# This file contains environment variables needed for the Healthcare Food App
# Copy this file to .env.local and update the values as needed
#
# For Rakuten API setup instructions, see:
# https://webservice.rakuten.co.jp/

# ===== REQUIRED VARIABLES =====
# Rakuten Recipe API Application ID (20 characters)
RAKUTEN_APPLICATION_ID=your_20_character_api_key_here

# NextAuth.js secret for JWT signing (minimum 32 characters)
NEXTAUTH_SECRET=your-super-secret-key-here-minimum-32-characters-long

# SQLite database file path
DATABASE_URL=./data/app.db

# Stripe secret key for payment processing
STRIPE_SECRET_KEY=sk_live_your_live_key_here

# Stripe publishable key (client-side)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key_here

# Stripe webhook endpoint secret
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Stripe price ID for premium subscriptions
STRIPE_PRICE_ID=price_your_price_id_here

# ===== OPTIONAL VARIABLES =====
# These variables have default values but can be customized

# API request timeout in milliseconds
RAKUTEN_API_TIMEOUT=10000

# Maximum requests per second to Rakuten API
RAKUTEN_RATE_LIMIT_RPS=5

# Enable periodic API health checks (true/false)
RAKUTEN_ENABLE_HEALTH_CHECKS=true

# Use mock recipe data instead of Rakuten API (true/false)
USE_MOCK_RECIPES=false

# Public API base URL
NEXT_PUBLIC_API_URL=https://yourdomain.com

# Number of bcrypt hashing rounds
BCRYPT_ROUNDS=12

# Enable analytics tracking (true/false)
ENABLE_ANALYTICS=true

# Enable error reporting (true/false)
ENABLE_ERROR_REPORTING=true

# ===== ENVIRONMENT-SPECIFIC NOTES =====
# - RAKUTEN_APPLICATION_ID is required for real recipe data
# - All Stripe keys must be production keys
# - Health checks are enabled by default
# - Ensure all secrets are properly secured
`
  };

  return configs[environment] || configs.development;
}

function checkRequiredVariables() {
  const environment = detectEnvironment();
  const requiredVars = {
    production: [
      'RAKUTEN_APPLICATION_ID',
      'NEXTAUTH_SECRET',
      'DATABASE_URL',
      'STRIPE_SECRET_KEY',
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'STRIPE_PRICE_ID'
    ],
    staging: [
      'NEXTAUTH_SECRET',
      'DATABASE_URL'
    ],
    development: [
      'NEXTAUTH_SECRET',
      'DATABASE_URL'
    ]
  };

  const required = requiredVars[environment] || [];
  const missing = [];
  const warnings = [];

  for (const varName of required) {
    if (!process.env[varName] || process.env[varName].trim() === '') {
      missing.push(varName);
    }
  }

  // Environment-specific warnings
  if (environment === 'production') {
    if (!process.env.RAKUTEN_APPLICATION_ID) {
      warnings.push('Production environment should have RAKUTEN_APPLICATION_ID configured for real recipe data');
    }
    if (process.env.USE_MOCK_RECIPES === 'true') {
      warnings.push('Production environment is configured to use mock recipes');
    }
  }

  return {
    environment,
    missing,
    warnings,
    isReady: missing.length === 0
  };
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log('🔧 Healthcare Food App - Environment Setup Tool\n');

  switch (command) {
    case 'check':
      console.log('📋 Checking environment configuration...\n');
      const check = checkRequiredVariables();
      
      console.log(`Environment: ${check.environment.toUpperCase()}`);
      console.log(`Status: ${check.isReady ? '✅ Ready' : '❌ Needs Configuration'}\n`);
      
      if (check.missing.length > 0) {
        console.log('❌ Missing required variables:');
        check.missing.forEach(var_ => console.log(`   - ${var_}`));
        console.log();
      }
      
      if (check.warnings.length > 0) {
        console.log('⚠️  Warnings:');
        check.warnings.forEach(warning => console.log(`   - ${warning}`));
        console.log();
      }
      
      if (!check.isReady) {
        console.log('💡 Run "node scripts/env-setup.js generate" to create example configuration files.');
      }
      break;

    case 'generate':
      const targetEnv = args[1] || detectEnvironment();
      console.log(`📝 Generating example configuration for ${targetEnv.toUpperCase()} environment...\n`);
      
      const config = generateExampleConfig(targetEnv);
      const filename = `.env.${targetEnv}.example`;
      
      fs.writeFileSync(filename, config);
      console.log(`✅ Created ${filename}`);
      console.log(`\n💡 Copy this file to .env.local and update the values as needed.`);
      console.log(`\n📖 For Rakuten API setup instructions, visit:`);
      console.log(`   https://webservice.rakuten.co.jp/`);
      break;

    case 'generate-all':
      console.log('📝 Generating example configurations for all environments...\n');
      
      ['development', 'staging', 'production'].forEach(env => {
        const config = generateExampleConfig(env);
        const filename = `.env.${env}.example`;
        fs.writeFileSync(filename, config);
        console.log(`✅ Created ${filename}`);
      });
      
      console.log(`\n💡 Copy the appropriate file to .env.local and update the values as needed.`);
      break;

    case 'validate':
      console.log('🔍 Validating current environment configuration...\n');
      const validation = checkRequiredVariables();
      
      console.log(`Environment: ${validation.environment.toUpperCase()}`);
      
      if (validation.isReady) {
        console.log('✅ Configuration is valid!');
      } else {
        console.log('❌ Configuration has issues:');
        validation.missing.forEach(var_ => {
          console.log(`   - Missing: ${var_}`);
        });
      }
      
      if (validation.warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        validation.warnings.forEach(warning => {
          console.log(`   - ${warning}`);
        });
      }
      break;

    default:
      console.log('Usage: node scripts/env-setup.js <command>');
      console.log('');
      console.log('Commands:');
      console.log('  check           Check current environment configuration');
      console.log('  generate [env]  Generate example config for environment (development|staging|production)');
      console.log('  generate-all    Generate example configs for all environments');
      console.log('  validate        Validate current configuration');
      console.log('');
      console.log('Examples:');
      console.log('  node scripts/env-setup.js check');
      console.log('  node scripts/env-setup.js generate development');
      console.log('  node scripts/env-setup.js generate-all');
      console.log('  node scripts/env-setup.js validate');
      break;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  detectEnvironment,
  generateExampleConfig,
  checkRequiredVariables
};