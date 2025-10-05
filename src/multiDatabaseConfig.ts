import { initChronos } from 'chronos-db';
import { envDbConfig } from './envDbConfig';

// Multi-database configuration example - chronos-db 1.5.1 format
export const multiDbConfig = {
  // Multiple MongoDB connection URIs (1-10 supported)
  mongoUris: [
    envDbConfig.mongoUri, // Primary connection
    'mongodb://backup-server:27017', // Backup connection
    'mongodb://analytics-server:27017', // Analytics connection
    // Add more connections as needed
  ],
  
  // Enhanced multi-tenant database configuration
  databases: {
    metadata: {
      generic: {
        key: 'meta-generic',
        mongoUri: envDbConfig.mongoUri,
        dbName: 'meta_generic',
      },
      domains: [
        {
          key: 'meta-domain-1',
          extIdentifier: 'domain-1',
          mongoUri: envDbConfig.mongoUri,
          dbName: 'meta_domain_1',
        },
      ],
      tenants: [
        {
          key: 'meta-tenant-a',
          extIdentifier: 'tenant-a',
          mongoUri: envDbConfig.mongoUri,
          dbName: 'meta_tenant_a',
        },
        {
          key: 'meta-tenant-b',
          extIdentifier: 'tenant-b',
          mongoUri: envDbConfig.mongoUri,
          dbName: 'meta_tenant_b',
        },
      ],
    },
    knowledge: {
      generic: {
        key: 'know-generic',
        mongoUri: envDbConfig.mongoUri,
        dbName: 'know_generic',
      },
      domains: [
        {
          key: 'know-domain-1',
          extIdentifier: 'domain-1',
          mongoUri: envDbConfig.mongoUri,
          dbName: 'know_domain_1',
        },
      ],
      tenants: [
        {
          key: 'know-tenant-a',
          extIdentifier: 'tenant-a',
          mongoUri: envDbConfig.mongoUri,
          dbName: 'know_tenant_a',
        },
        {
          key: 'know-tenant-b',
          extIdentifier: 'tenant-b',
          mongoUri: envDbConfig.mongoUri,
          dbName: 'know_tenant_b',
        },
      ],
    },
    runtime: {
      generic: {
        key: 'runtime-generic',
        mongoUri: envDbConfig.mongoUri,
        dbName: 'runtime_generic',
      },
      domains: [
        {
          key: 'runtime-domain-1',
          extIdentifier: 'domain-1',
          mongoUri: envDbConfig.mongoUri,
          dbName: 'runtime_domain_1',
        },
      ],
      tenants: [
        {
          key: 'runtime-tenant-a',
          extIdentifier: 'tenant-a',
          mongoUri: envDbConfig.mongoUri,
          dbName: 'runtime_tenant_a',
        },
        {
          key: 'runtime-tenant-b',
          extIdentifier: 'tenant-b',
          mongoUri: envDbConfig.mongoUri,
          dbName: 'runtime_tenant_b',
        },
      ],
    },
  },
  
  // Multiple S3-compatible storage connections (1-10 supported)
  spacesConns: [
    {
      // Primary DigitalOcean Spaces
      endpoint: 'https://chronos-1.fra1.digitaloceanspaces.com',
      region: 'fra1',
      accessKey: envDbConfig.spaceAccessKey,
      secretKey: envDbConfig.spaceSecretKey,
      backupsBucket: 'chronos-backups',
      jsonBucket: 'chronos-json',
      contentBucket: 'chronos-content',
      forcePathStyle: true,
    },
    {
      // Secondary AWS S3 (example)
      endpoint: 'https://s3.amazonaws.com',
      region: 'us-east-1',
      accessKey: process.env.AWS_ACCESS_KEY || '',
      secretKey: process.env.AWS_SECRET_KEY || '',
      backupsBucket: 'chronos-backups-aws',
      jsonBucket: 'chronos-json-aws',
      contentBucket: 'chronos-content-aws',
      forcePathStyle: false,
    },
    // Add more S3 connections as needed
  ],
  
  // Counters configuration for analytics
  counters: {
    mongoUri: envDbConfig.mongoUri, // Use same MongoDB URI as main connection
    dbName: 'chronos_counters',
  },
  
  // Routing configuration for load balancing
  routing: {
    hashAlgo: 'rendezvous' as const, // or 'jump' for different distribution
    chooseKey: 'tenantId|dbName', // Custom routing key
  },
  
  // Retention and rollup policies
  retention: {
    ver: {
      days: 90, // Keep versions for 90 days
      maxPerItem: 10, // Keep max 10 versions per item
    },
    counters: {
      days: 7,
      weeks: 4,
      months: 12,
    },
  },
  rollup: {
    enabled: true,
  },
  
  // Disable transactions for non-replica set MongoDB
  transactions: {
    enabled: false,
  },
  
  // Collection mappings with validation
  collectionMaps: {
    users: {
      indexedProps: ['email', 'status', 'createdAt'],
      validation: {
        requiredIndexed: ['email'],
      },
    },
    products: {
      indexedProps: ['name', 'category', 'price', 'createdAt'],
      validation: {
        requiredIndexed: ['name', 'category'],
      },
    },
    orders: {
      indexedProps: ['userId', 'status', 'createdAt', 'total'],
      validation: {
        requiredIndexed: ['userId', 'status'],
      },
    },
    analytics: {
      indexedProps: ['eventType', 'userId', 'timestamp'],
      validation: {
        requiredIndexed: ['eventType', 'timestamp'],
      },
    },
  },
  
  // Counter rules for conditional totals
  counterRules: {
    rules: [
      {
        name: 'activeUsers',
        when: { status: 'active' },
        on: ['CREATE' as const, 'UPDATE' as const],
        scope: 'meta' as const,
      },
      {
        name: 'electronicsProducts',
        when: { category: 'electronics' },
        on: ['CREATE' as const, 'UPDATE' as const],
        scope: 'meta' as const,
      },
      {
        name: 'completedOrders',
        when: { status: 'completed' },
        on: ['CREATE' as const, 'UPDATE' as const],
        scope: 'meta' as const,
      },
    ],
  },
  
  // Dev shadow configuration for full snapshots in Mongo
  devShadow: {
    enabled: true,
    ttlHours: 24, // TTL for shadow data
  },
  
  // Write optimization configuration
  writeOptimization: {
    enabled: true,
    batchSize: 100,
    batchS3: true,
    batchWindowMs: 1000, // 1 second
    debounceCountersMs: 500,
    allowShadowSkip: true,
  },
};

// Initialize Chronos with multi-database config
export const multiChronos = initChronos(multiDbConfig);

// Export context-bound operations for different databases and collections
// Option A: Direct key usage (fastest)
export const userOps = multiChronos.with({
  dbName: 'runtime_generic',
  collection: 'users',
});

export const productOps = multiChronos.with({
  dbName: 'runtime_generic',
  collection: 'products',
});

export const orderOps = multiChronos.with({
  dbName: 'runtime_generic',
  collection: 'orders',
});

export const analyticsOps = multiChronos.with({
  dbName: 'runtime_generic',
  collection: 'events',
});

// Option B: Tier + extIdentifier usage (flexible)
export const tenantAUserOps = multiChronos.with({
  dbName: 'runtime_tenant_a',
  collection: 'users',
});

export const tenantBUserOps = multiChronos.with({
  dbName: 'runtime_tenant_b',
  collection: 'users',
});

// Option C: Generic tier (shared data)
export const systemConfigOps = multiChronos.with({
  dbName: 'meta_generic',
  collection: 'config',
});

// Option D: Domain tier (shared within domain)
export const domainContentOps = multiChronos.with({
  dbName: 'know_domain_1',
  collection: 'articles',
});

// Graceful shutdown function
export async function shutdownMultiDatabase(): Promise<void> {
  try {
    await multiChronos.admin.shutdown();
    console.log('Multi-database connection closed successfully');
  } catch (error) {
    console.error('Error closing multi-database connection:', error);
  }
}
