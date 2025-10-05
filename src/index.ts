import { userOps, productOps, shutdownDatabase } from './database';

// Define ItemView type based on chronos-db structure
interface ItemView {
  id: string;
  item: Record<string, unknown>;
  _meta?: {
    ov: number;
    cv: number;
    at: string;
    metaIndexed: Record<string, unknown>;
    deletedAt?: string;
  };
  presigned?: {
    [jsonPath: string]: {
      blobUrl?: string;
      textUrl?: string;
      expiresIn?: number;
    };
  };
}

// Example interfaces for type safety
interface User {
  id?: string;
  email: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt?: Date;
  updatedAt?: Date;
  metadata?: Record<string, any>;
}

interface Product {
  id?: string;
  name: string;
  category: string;
  price: number;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

async function main() {
  try {
    console.log('🚀 Starting Chronos DB example...');

    // Example 1: Create a new user
    console.log('\n📝 Creating a new user...');
    const newUser = await userOps.create({
      email: 'john.doe@example.com',
      status: 'active',
      metadata: {
        firstName: 'John',
        lastName: 'Doe',
        preferences: ['email', 'sms']
      }
    }, 'system', 'user registration');

    console.log('✅ User created:', {
      id: newUser.id,
      version: newUser.ov,
      createdAt: newUser.createdAt
    });

    // Example 2: Read the latest version of the user
    console.log('\n📖 Reading latest user data...');
    const latestUser = await userOps.getLatest(newUser.id, {
      presign: true,
      ttlSeconds: 3600,
      projection: ['email', 'status', 'metadata']
    });

    console.log('✅ Latest user data:', latestUser);

    // Example 3: Update the user
    console.log('\n✏️ Updating user...');
    const updatedUser = await userOps.update(newUser.id, {
      status: 'verified',
      metadata: {
        ...(latestUser?.item?.metadata || {}),
        verifiedAt: new Date().toISOString(),
        score: 100
      }
    }, newUser.ov, 'system', 'email verification');

    console.log('✅ User updated:', {
      id: updatedUser.id,
      newVersion: updatedUser.ov,
      updatedAt: updatedUser.updatedAt
    });

    // Example 4: Create a product
    console.log('\n📦 Creating a new product...');
    const newProduct = await productOps.create({
      name: 'Wireless Headphones',
      category: 'Electronics',
      price: 199.99,
      description: 'High-quality wireless headphones with noise cancellation',
      metadata: {
        brand: 'TechBrand',
        color: 'Black',
        warranty: '2 years'
      }
    }, 'system', 'product catalog update');

    console.log('✅ Product created:', {
      id: newProduct.id,
      version: newProduct.ov,
      createdAt: newProduct.createdAt
    });

    // Example 5: List products by metadata with pagination
    console.log('\n🔍 Listing products by category...');
    const products = await productOps.listByMeta({
      filter: { category: 'Electronics' },
      limit: 10,
      sort: { createdAt: -1 }
    }, { presign: true });

    console.log('✅ Found products:', products.items.map(p => ({
      id: p.id,
      name: p.item.name,
      price: p.item.price,
      version: p._meta?.ov
    })));

    // Example 6: Enrich user data incrementally
    console.log('\n🎯 Enriching user data...');
    await userOps.enrich(newUser.id, {
      metadata: {
        tags: ['premium', 'verified'],
        lastLoginAt: new Date().toISOString(),
        loginCount: 1
      }
    }, {
      functionId: 'user-enricher@v1',
      actor: 'system',
      reason: 'user activity tracking'
    });

    console.log('✅ User data enriched');

    // Example 7: Get user with enriched data
    console.log('\n📊 Reading enriched user data...');
    const enrichedUser = await userOps.getLatest(newUser.id);
    console.log('✅ Enriched user data:', {
      id: enrichedUser?.id,
      email: enrichedUser?.item?.email,
      status: enrichedUser?.item?.status,
      metadata: enrichedUser?.item?.metadata
    });

    // Example 8: Get specific version of user
    console.log('\n🕐 Reading specific version of user...');
    const userV0 = await userOps.getVersion(newUser.id, 0);
    console.log('✅ User version 0:', {
      id: userV0?.id,
      email: userV0?.item?.email,
      status: userV0?.item?.status,
      version: userV0?._meta?.ov
    });

    // Example 9: List users with filtering
    console.log('\n👥 Listing active users...');
    const activeUsers = await userOps.listByMeta({
      filter: { status: 'active' },
      limit: 5,
      sort: { createdAt: -1 }
    });

    console.log('✅ Active users:', activeUsers.items.map(u => ({
      id: u.id,
      email: u.item.email,
      status: u.item.status,
      version: u._meta?.ov
    })));

    console.log('\n🎉 All operations completed successfully!');

  } catch (error) {
    console.error('❌ Error during operations:', error);
  } finally {
    // Graceful shutdown
    await shutdownDatabase();
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  await shutdownDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  await shutdownDatabase();
  process.exit(0);
});

// Run the main function
if (require.main === module) {
  main().catch(console.error);
}
