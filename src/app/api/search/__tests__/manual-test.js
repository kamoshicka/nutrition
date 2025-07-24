/**
 * Manual test script for search API endpoints
 * 
 * This script can be run in the browser console when visiting the application
 * to test the search API endpoints.
 */

// Test categories search API
async function testCategoriesSearch(query, options = {}) {
  const { limit, caseSensitive, exactMatch } = options;
  
  let url = `/api/search/categories?q=${encodeURIComponent(query)}`;
  
  if (limit !== undefined) {
    url += `&limit=${limit}`;
  }
  
  if (caseSensitive) {
    url += '&caseSensitive=true';
  }
  
  if (exactMatch) {
    url += '&exactMatch=true';
  }
  
  console.log(`Testing categories search API: ${url}`);
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', data);
    
    return data;
  } catch (error) {
    console.error('Error testing categories search API:', error);
  }
}

// Test foods search API
async function testFoodsSearch(query, options = {}) {
  const { limit, caseSensitive, exactMatch } = options;
  
  let url = `/api/search/foods?q=${encodeURIComponent(query)}`;
  
  if (limit !== undefined) {
    url += `&limit=${limit}`;
  }
  
  if (caseSensitive) {
    url += '&caseSensitive=true';
  }
  
  if (exactMatch) {
    url += '&exactMatch=true';
  }
  
  console.log(`Testing foods search API: ${url}`);
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', data);
    
    return data;
  } catch (error) {
    console.error('Error testing foods search API:', error);
  }
}

// Test error cases
async function testErrorCases() {
  console.log('Testing error cases:');
  
  // Empty query
  console.log('\nTesting empty query:');
  await testCategoriesSearch('');
  
  // Invalid limit
  console.log('\nTesting invalid limit:');
  await testCategoriesSearch('test', { limit: 'invalid' });
  
  // Negative limit
  console.log('\nTesting negative limit:');
  await testCategoriesSearch('test', { limit: -1 });
}

// Run all tests
async function runAllTests() {
  console.log('=== SEARCH API MANUAL TESTS ===');
  
  // Test categories search
  console.log('\n=== Categories Search Tests ===');
  await testCategoriesSearch('糖尿病');
  await testCategoriesSearch('高血圧', { limit: 3 });
  await testCategoriesSearch('がん', { caseSensitive: true });
  await testCategoriesSearch('心臓病', { exactMatch: true });
  
  // Test foods search
  console.log('\n=== Foods Search Tests ===');
  await testFoodsSearch('りんご');
  await testFoodsSearch('魚', { limit: 3 });
  await testFoodsSearch('野菜', { caseSensitive: true });
  await testFoodsSearch('豆腐', { exactMatch: true });
  
  // Test error cases
  console.log('\n=== Error Cases ===');
  await testErrorCases();
  
  console.log('\n=== Tests Complete ===');
}

// Export test functions
window.testSearchAPI = {
  testCategoriesSearch,
  testFoodsSearch,
  testErrorCases,
  runAllTests
};

console.log('Search API test functions loaded. Run window.testSearchAPI.runAllTests() to test all endpoints.');