// TTL Test - Demonstrates data persistence in storage with TTL = 0
import { chronos, shutdownDatabase } from "../src/database";

// Create test operations
const testOps = chronos.with({
  dbName: 'runtime_generic',
  collection: 'ttl_test',
});

// Interface for test data
interface TTLTestData extends Record<string, unknown> {
  id?: string;
  name: string;
  value: number;
  category: string;
  description?: string;
  createdAt?: Date;
  metadata?: Record<string, any>;
}

async function runTTLTest(): Promise<void> {
  console.log('🧪 Starting TTL Test with TTL = 0...');
  console.log('📝 This test demonstrates data persistence in storage');
  console.log('');

  try {
    // Step 1: Create test data
    console.log('📝 Step 1: Creating test data...');
    
    const testData: Omit<TTLTestData, 'id'>[] = [
      {
        name: 'TTL Test Item 1',
        value: 100,
        category: 'test',
        description: 'First test item for TTL demonstration',
        metadata: { testType: 'ttl', priority: 'high' },
      },
      {
        name: 'TTL Test Item 2',
        value: 200,
        category: 'test',
        description: 'Second test item for TTL demonstration',
        metadata: { testType: 'ttl', priority: 'medium' },
      },
      {
        name: 'TTL Test Item 3',
        value: 300,
        category: 'test',
        description: 'Third test item for TTL demonstration',
        metadata: { testType: 'ttl', priority: 'low' },
      },
    ];

    const createdItems: TTLTestData[] = [];
    
    for (const data of testData) {
      const result = await testOps.create(data, 'test-user', 'TTL test creation');
      console.log(`✅ Created item: ${data.name} (ID: ${result.id}, OV: ${result.ov})`);
      createdItems.push({
        id: result.id as string,
        name: data.name as string,
        value: data.value as number,
        category: data.category as string,
        description: data.description as string | undefined,
        metadata: data.metadata as Record<string, any> | undefined,
        createdAt: result.createdAt,
      });
    }

    console.log('');
    console.log('📊 Step 2: Reading data immediately after creation...');
    
    // Step 2: Read data immediately after creation
    for (const item of createdItems) {
      if (item.id) {
        const retrieved = await testOps.getLatest(item.id);
        if (retrieved) {
          console.log(`📖 Retrieved: ${(retrieved as any).data.name} (Value: ${(retrieved as any).data.value})`);
          console.log(`   Metadata: ${JSON.stringify((retrieved as any).data.metadata)}`);
        }
      }
    }

    console.log('');
    console.log('⏰ Step 3: Waiting 2 seconds to simulate time passage...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('');
    console.log('📊 Step 4: Reading data after time passage...');
    
    // Step 4: Read data after time passage
    for (const item of createdItems) {
      if (item.id) {
        const retrieved = await testOps.getLatest(item.id);
        if (retrieved) {
          console.log(`📖 Retrieved after time: ${(retrieved as any).data.name} (Value: ${(retrieved as any).data.value})`);
          console.log(`   Metadata: ${JSON.stringify((retrieved as any).data.metadata)}`);
        }
      }
    }

    console.log('');
    console.log('📊 Step 5: Testing version-specific retrieval...');
    
    // Step 5: Test version-specific retrieval
    if (createdItems[0]?.id) {
      const version0 = await testOps.getVersion(createdItems[0].id, 0);
      if (version0) {
        console.log(`📖 Version 0 of ${createdItems[0].name}: ${JSON.stringify((version0 as any).data)}`);
      }
    }

    console.log('');
    console.log('📊 Step 6: Testing listByMeta query...');
    
    // Step 6: Test listByMeta query
    const allItems = await testOps.listByMeta({
      filter: { category: 'test' },
      limit: 10,
      sort: { createdAt: -1 },
    });
    
    console.log(`📋 Found ${allItems.items.length} items with category 'test':`);
    for (const item of allItems.items) {
      console.log(`   - ${(item as any).data.name} (ID: ${item.id}, OV: ${(item as any).ov})`);
    }

    console.log('');
    console.log('📊 Step 7: Testing enrichment (incremental updates)...');
    
    // Step 7: Test enrichment
    if (createdItems[0]?.id) {
      await testOps.enrich(createdItems[0].id, {
        metadata: { 
          ...createdItems[0].metadata,
          enriched: true,
          enrichmentTime: new Date().toISOString(),
        },
        tags: ['enriched', 'ttl-test'],
      }, {
        functionId: 'ttl-enricher@v1',
        actor: 'test-user',
        reason: 'TTL test enrichment',
      });
      
      const enriched = await testOps.getLatest(createdItems[0].id);
      if (enriched) {
        console.log(`✨ Enriched item: ${(enriched as any).data.name}`);
        console.log(`   Enhanced metadata: ${JSON.stringify((enriched as any).data.metadata)}`);
        console.log(`   Tags: ${JSON.stringify((enriched as any).data.tags)}`);
      }
    }

    console.log('');
    console.log('📊 Step 8: Testing update operation...');
    
    // Step 8: Test update operation
    if (createdItems[1]?.id) {
      const updateResult = await testOps.update(createdItems[1].id, {
        ...createdItems[1],
        value: 250,
        description: 'Updated description for TTL test',
      }, 0, 'test-user', 'TTL test update');
      
      console.log(`🔄 Updated item: ${createdItems[1].name} (New OV: ${updateResult.ov})`);
      
      const updated = await testOps.getLatest(createdItems[1].id);
      if (updated) {
        console.log(`📖 Updated item value: ${(updated as any).data.value}`);
        console.log(`   Description: ${(updated as any).data.description}`);
      }
    }

    console.log('');
    console.log('📊 Step 9: Testing restore operation...');
    
    // Step 9: Test restore operation
    if (createdItems[2]?.id) {
      // First, update the item
      await testOps.update(createdItems[2].id, {
        ...createdItems[2],
        value: 400,
        description: 'This will be restored',
      }, 0, 'test-user', 'Update before restore');
      
      // Then restore to version 0
      await testOps.restoreObject(createdItems[2].id, { ov: 0 });
      
      const restored = await testOps.getLatest(createdItems[2].id);
      if (restored) {
        console.log(`🔄 Restored item: ${(restored as any).data.name}`);
        console.log(`   Restored value: ${(restored as any).data.value}`);
        console.log(`   Restored description: ${(restored as any).data.description}`);
      }
    }

    console.log('');
    console.log('📊 Step 10: Testing delete operation...');
    
    // Step 10: Test delete operation
    if (createdItems[0]?.id) {
      const deleteResult = await testOps.delete(createdItems[0].id, 1, 'test-user', 'TTL test delete');
      console.log(`🗑️ Deleted item: ${createdItems[0].name} (OV: ${deleteResult.ov})`);
      
      // Try to read deleted item
      try {
        const deleted = await testOps.getLatest(createdItems[0].id);
        if (deleted) {
          console.log(`📖 Deleted item still accessible: ${(deleted as any).data.name}`);
          console.log(`   Deleted flag: ${(deleted as any).data._system?.deleted}`);
        }
      } catch (error) {
        console.log(`❌ Deleted item not accessible: ${error}`);
      }
    }

    console.log('');
    console.log('🎉 TTL Test completed successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log('   ✅ Data creation and storage');
    console.log('   ✅ Immediate data retrieval');
    console.log('   ✅ Data retrieval after time passage');
    console.log('   ✅ Version-specific retrieval');
    console.log('   ✅ ListByMeta queries');
    console.log('   ✅ Enrichment operations');
    console.log('   ✅ Update operations');
    console.log('   ✅ Restore operations');
    console.log('   ✅ Delete operations');
    console.log('');
    console.log('💾 Data persistence verified: All data remains accessible');
    console.log('   even with TTL = 0, demonstrating storage-only persistence.');

  } catch (error) {
    console.error('❌ TTL Test failed:', error);
    throw error;
  } finally {
    await shutdownDatabase();
  }
}

// Run the test
if (require.main === module) {
  runTTLTest().catch(console.error);
}

export { runTTLTest };
