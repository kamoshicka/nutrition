// Simple test to verify data access functionality
const { loadCategories, loadFoods, loadCookingMethods, getCategoryById, getFoodById } = require('../data-loader');
const { searchCategories, searchFoods, filterFoodsByCategory } = require('../search');

async function testDataAccess() {
  console.log('Testing data access layer...');
  
  try {
    // Test loading data
    const categories = await loadCategories();
    console.log(`✓ Loaded ${categories.length} categories`);
    
    const foods = await loadFoods();
    console.log(`✓ Loaded ${foods.length} foods`);
    
    const cookingMethods = await loadCookingMethods();
    console.log(`✓ Loaded ${cookingMethods.length} cooking methods`);
    
    // Test getting by ID
    const category = await getCategoryById('diabetes');
    console.log(`✓ Found category: ${category ? category.name : 'Not found'}`);
    
    const food = await getFoodById('garlic');
    console.log(`✓ Found food: ${food ? food.name : 'Not found'}`);
    
    // Test search functionality
    const searchResult = await searchCategories('糖尿病');
    console.log(`✓ Search found ${searchResult.items.length} categories for '糖尿病'`);
    
    const foodSearchResult = await searchFoods('にんにく');
    console.log(`✓ Search found ${foodSearchResult.items.length} foods for 'にんにく'`);
    
    // Test filtering
    const diabetesFoods = await filterFoodsByCategory('diabetes');
    console.log(`✓ Found ${diabetesFoods.length} foods for diabetes category`);
    
    console.log('All tests passed! ✓');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testDataAccess();
}

module.exports = { testDataAccess };