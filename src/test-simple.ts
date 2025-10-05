import { testOps, testChronos } from './test-config';

async function testSimple() {
  try {
    console.log('🧪 Testing simple configuration...');

    // Test basic create operation
    console.log('\n📝 Creating a test item...');
    const result = await testOps.create({
      name: 'Test Item',
      value: 123,
    }, 'test', 'simple test');

    console.log('✅ Create successful:', result);

    // Test read operation
    console.log('\n📖 Reading the item...');
    const item = await testOps.getLatest(result.id);
    console.log('✅ Read successful:', item);

    // Shutdown
    await testChronos.admin.shutdown();
    console.log('\n✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    await testChronos.admin.shutdown();
  }
}

testSimple();
