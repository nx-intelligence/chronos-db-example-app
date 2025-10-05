// Function that creates 100 rows in a database called "test"
import { chronos, shutdownDatabase } from "../src/database";

// Create test operations for the "test" database
const testOps = chronos.with({
  dbName: 'runtime_generic',
  collection: 'test_data',
});

// Interface for test data structure
interface TestData extends Record<string, unknown> {
  id?: string;
  name: string;
  value: number;
  category: string;
  description?: string;
  createdAt?: Date;
  metadata?: Record<string, any>;
}

async function create100Rows(): Promise<void> {
  try {
    console.log('🚀 Starting to create 100 rows in "test" database...');
    
    const categories = ['electronics', 'clothing', 'books', 'home', 'sports'];
    const names = [
      'Laptop', 'Smartphone', 'Headphones', 'Tablet', 'Camera',
      'T-Shirt', 'Jeans', 'Shoes', 'Jacket', 'Hat',
      'Novel', 'Textbook', 'Magazine', 'Comic', 'Biography',
      'Chair', 'Table', 'Lamp', 'Clock', 'Mirror',
      'Ball', 'Racket', 'Shoes', 'Gloves', 'Helmet'
    ];
    
    const createdRows: Array<{ id: string; name: string; value: number }> = [];
    
    // Create 100 rows
    for (let i = 1; i <= 100; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const name = names[Math.floor(Math.random() * names.length)];
      const value = Math.floor(Math.random() * 1000) + 10;
      
      const testData: TestData = {
        name: `${name} ${i}`,
        value: value,
        category: category,
        description: `Test item ${i} in category ${category}`,
        metadata: {
          batchId: `batch-${Math.floor(i / 10) + 1}`,
          priority: Math.random() > 0.5 ? 'high' : 'normal',
          tags: [category, `item-${i}`]
        }
      };
      
      const result = await testOps.create(
        testData,
        'test-script',
        `Creating test row ${i}`
      );
      
      createdRows.push({
        id: result.id,
        name: testData.name,
        value: testData.value
      });
      
      // Log progress every 10 rows
      if (i % 10 === 0) {
        console.log(`✅ Created ${i}/100 rows...`);
      }
    }
    
    console.log('\n🎉 Successfully created 100 rows in "test" database!');
    console.log('📊 Summary:');
    console.log(`   - Total rows created: ${createdRows.length}`);
    console.log(`   - Database: test`);
    console.log(`   - Collection: test_data`);
    console.log(`   - Sample rows:`, createdRows.slice(0, 5));
    
  } catch (error) {
    console.error('❌ Error creating rows:', error);
    throw error;
  } finally {
    // Graceful shutdown
    await shutdownDatabase();
  }
}

// Export the function for use in other files
export { create100Rows };

// Run the function if this file is executed directly
if (require.main === module) {
  create100Rows().catch(console.error);
}
