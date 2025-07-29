/**
 * Demo script to showcase the Rakuten API Key Validation Service
 * 
 * This script demonstrates the key features of the API validation service:
 * - Format validation
 * - Connection testing
 * - Setup instruction generation
 * 
 * Run with: node src/lib/__tests__/rakuten-api-validator-demo.js
 */

const { 
  apiKeyValidator,
  validateRakutenApiKeyFormat,
  getRakutenSetupInstructions 
} = require('../rakuten-api-validator');

async function demonstrateApiKeyValidation() {
  console.log('🔍 Rakuten API Key Validation Service Demo\n');
  
  // 1. Format Validation Examples
  console.log('1. API Key Format Validation:');
  console.log('─'.repeat(40));
  
  const testKeys = [
    'abcdefghij1234567890', // Valid 20-char key
    'invalid-key',          // Invalid format
    'abcdefghij123456789',  // Too short (19 chars)
    'abcdefghij12345678901', // Too long (21 chars)
    'abcdefghij123456789!', // Contains special char
    '',                     // Empty string
    null                    // Null value
  ];
  
  testKeys.forEach(key => {
    const isValid = validateRakutenApiKeyFormat(key);
    const keyDisplay = key === null ? 'null' : key === '' ? '(empty)' : key;
    console.log(`  ${isValid ? '✅' : '❌'} "${keyDisplay}" - ${isValid ? 'Valid' : 'Invalid'}`);
  });
  
  console.log('\n');
  
  // 2. Setup Instructions for Different Environments
  console.log('2. Setup Instructions:');
  console.log('─'.repeat(40));
  
  const environments = ['development', 'staging', 'production'];
  
  environments.forEach(env => {
    console.log(`\n📋 ${env.toUpperCase()} Environment Setup:`);
    const instructions = getRakutenSetupInstructions(env);
    
    console.log(`   Environment Variables:`);
    Object.entries(instructions.environmentVariables).forEach(([key, value]) => {
      console.log(`     ${key}=${value}`);
    });
    
    console.log(`   Key Steps:`);
    instructions.steps.slice(0, 3).forEach((step, index) => {
      console.log(`     ${index + 1}. ${step.replace(/^\d+\.\s*/, '')}`);
    });
    
    console.log(`   Troubleshooting Tips: ${instructions.troubleshooting.length} available`);
    console.log(`   Documentation Links: ${instructions.links.length} available`);
  });
  
  console.log('\n');
  
  // 3. Connection Testing (Mock Example)
  console.log('3. Connection Testing:');
  console.log('─'.repeat(40));
  
  const validKey = 'abcdefghij1234567890';
  const invalidKey = 'invalid-key';
  
  console.log(`\n🔗 Testing connection with valid format key: "${validKey}"`);
  try {
    // Note: This will fail in demo because we don't have a real API key
    // but it demonstrates the validation flow
    const result = await apiKeyValidator.testConnection(validKey);
    if (result.success) {
      console.log(`   ✅ Connection successful (${result.responseTime}ms)`);
    } else {
      console.log(`   ❌ Connection failed: ${result.error}`);
    }
  } catch (error) {
    console.log(`   ❌ Connection test error: ${error.message}`);
  }
  
  console.log(`\n🔗 Testing connection with invalid format key: "${invalidKey}"`);
  try {
    const result = await apiKeyValidator.testConnection(invalidKey);
    console.log(`   ❌ ${result.error}`);
  } catch (error) {
    console.log(`   ❌ Connection test error: ${error.message}`);
  }
  
  console.log('\n');
  
  // 4. Comprehensive Validation
  console.log('4. Comprehensive Validation:');
  console.log('─'.repeat(40));
  
  console.log(`\n🔍 Full validation of "${validKey}":`);
  try {
    const validation = await apiKeyValidator.validateConnection(validKey);
    if (validation.isValid) {
      console.log(`   ✅ API key is valid`);
      if (validation.details) {
        console.log(`   📊 Response time: ${validation.details.responseTime}ms`);
        if (validation.details.rateLimitRemaining) {
          console.log(`   📈 Rate limit remaining: ${validation.details.rateLimitRemaining}`);
        }
      }
    } else {
      console.log(`   ❌ API key validation failed: ${validation.error}`);
    }
  } catch (error) {
    console.log(`   ❌ Validation error: ${error.message}`);
  }
  
  console.log('\n');
  
  // 5. Service Features Summary
  console.log('5. Service Features Summary:');
  console.log('─'.repeat(40));
  console.log('✅ Format validation (20-character alphanumeric)');
  console.log('✅ Real API connection testing');
  console.log('✅ Environment-specific setup instructions');
  console.log('✅ Comprehensive error handling');
  console.log('✅ Rate limit information extraction');
  console.log('✅ Timeout and network error handling');
  console.log('✅ Development, staging, and production support');
  console.log('✅ Detailed troubleshooting guidance');
  
  console.log('\n🎉 Demo completed! The API Key Validation Service is ready for use.\n');
}

// Run the demo
if (require.main === module) {
  demonstrateApiKeyValidation().catch(console.error);
}

module.exports = { demonstrateApiKeyValidation };