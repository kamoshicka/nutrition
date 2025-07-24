// This is a simple script to manually test the API endpoint
// You can run it with: node manual-test.js

const { getFoodById, getCookingMethodsByFood } = require('../../../../lib/data-loader');

async function testFoodApi() {
  try {
    console.log('Testing food API...');
    
    // Test with a valid food ID
    const foodId = 'garlic';
    console.log(`Getting food with ID: ${foodId}`);
    
    const food = await getFoodById(foodId);
    if (!food) {
      console.error(`Food not found: ${foodId}`);
      return;
    }
    
    console.log('Food details:');
    console.log(JSON.stringify(food, null, 2));
    
    // Get cooking methods
    console.log(`Getting cooking methods for food: ${foodId}`);
    const cookingMethods = await getCookingMethodsByFood(foodId);
    
    console.log('Cooking methods:');
    console.log(JSON.stringify(cookingMethods, null, 2));
    
    // Sort cooking methods by nutrition retention
    const sortedMethods = [...cookingMethods].sort(
      (a, b) => b.nutritionRetention - a.nutritionRetention
    );
    
    console.log('Sorted cooking methods (by nutrition retention):');
    console.log(sortedMethods.map(m => `${m.name} (${m.nutritionRetention}%)`).join(', '));
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Error testing food API:', error);
  }
}

testFoodApi();