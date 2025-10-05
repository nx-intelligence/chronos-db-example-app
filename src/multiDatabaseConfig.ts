import { initChronos } from 'chronos-db';
import { envDbConfig } from './envDbConfig';

// Multi-database configuration example - chronos-db 1.5.3 format with transaction system compatibility
export const multiDbConfig = {
  // MongoDB connections - define once, reference by key
  mongoConns: [
    {
      key: 'mongo-primary',
      mongoUri: envDbConfig.mongoUri, // Primary connection
    },
    {
      key: 'mongo-backup',
      mongoUri: 'mongodb://backup-server:27017', // Backup connection
    },
    {
      key: 'mongo-analytics',
      mongoUri: 'mongodb://analytics-server:27017', // Analytics connection
    },
    // Add more connections as needed
  ],
  
  
  // Enhanced multi-tenant database configuration
  databases: {
    metadata: [
      {
        key: 'meta-generic',
        mongoConnKey: 'mongo-primary',
        spacesConnKey: 'do-spaces',
        dbName: 'meta_generic',
      },
      {
        key: 'meta-domain-1',
        mongoConnKey: 'mongo-primary',
        spacesConnKey: 'do-spaces',
        tenantId: 'domain-1',
        dbName: 'meta_domain_1',
      },
      {
        key: 'meta-tenant-a',
        mongoConnKey: 'mongo-primary',
        spacesConnKey: 'do-spaces',
        tenantId: 'tenant-a',
        dbName: 'meta_tenant_a',
      },
      {
        key: 'meta-tenant-b',
        mongoConnKey: 'mongo-primary',
        spacesConnKey: 'do-spaces',
        tenantId: 'tenant-b',
        dbName: 'meta_tenant_b',
      },
    ],
    knowledge: [
      {
        key: 'know-generic',
        mongoConnKey: 'mongo-primary',
        spacesConnKey: 'do-spaces',
        dbName: 'know_generic',
      },
      {
        key: 'know-domain-1',
        mongoConnKey: 'mongo-primary',
        spacesConnKey: 'do-spaces',
        tenantId: 'domain-1',
        dbName: 'know_domain_1',
      },
      {
        key: 'know-tenant-a',
        mongoConnKey: 'mongo-primary',
        spacesConnKey: 'do-spaces',
        tenantId: 'tenant-a',
        dbName: 'know_tenant_a',
      },
      {
        key: 'know-tenant-b',
        mongoConnKey: 'mongo-primary',
        spacesConnKey: 'do-spaces',
        tenantId: 'tenant-b',
        dbName: 'know_tenant_b',
      },
    ],
    runtime: [
      {
        key: 'runtime-generic',
        mongoConnKey: 'mongo-primary',
        spacesConnKey: 'do-spaces',
        dbName: 'runtime_generic',
      },
      {
        key: 'runtime-domain-1',
        mongoConnKey: 'mongo-primary',
        spacesConnKey: 'do-spaces',
        tenantId: 'domain-1',
        dbName: 'runtime_domain_1',
      },
      {
        key: 'runtime-tenant-a',
        mongoConnKey: 'mongo-primary',
        spacesConnKey: 'do-spaces',
        tenantId: 'tenant-a',
        dbName: 'runtime_tenant_a',
      },
      {
        key: 'runtime-tenant-b',
        mongoConnKey: 'mongo-primary',
        spacesConnKey: 'do-spaces',
        tenantId: 'tenant-b',
        dbName: 'runtime_tenant_b',
      },
    ],
  },
  
  // Multiple S3-compatible storage connections (1-10 supported)
  spacesConns: [
    {
      key: 'do-spaces',
      // Primary DigitalOcean Spaces
      endpoint: 'https://chronos-1.fra1.digitaloceanspaces.com',
      region: 'fra1',
      accessKey: envDbConfig.spaceAccessKey,
      secretKey: envDbConfig.spaceSecretKey,
      buckets: {
        backup: 'chronos-backups',
        json: 'chronos-json',
        content: 'chronos-content',
        versions: 'chronos-versions',
      },
      forcePathStyle: true,
    },
    {
      key: 'aws-s3',
      // Secondary AWS S3 (example)
      endpoint: 'https://s3.amazonaws.com',
      region: 'us-east-1',
      accessKey: process.env.AWS_ACCESS_KEY || '',
      secretKey: process.env.AWS_SECRET_KEY || '',
      buckets: {
        backup: 'chronos-backups-aws',
        json: 'chronos-json-aws',
        content: 'chronos-content-aws',
        versions: 'chronos-versions-aws',
      },
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
  key: 'runtime-generic',
  dbName: 'runtime_generic',
  collection: 'users',
});

export const productOps = multiChronos.with({
  key: 'runtime-generic',
  dbName: 'runtime_generic',
  collection: 'products',
});

export const orderOps = multiChronos.with({
  key: 'runtime-generic',
  dbName: 'runtime_generic',
  collection: 'orders',
});

export const analyticsOps = multiChronos.with({
  key: 'runtime-generic',
  dbName: 'runtime_generic',
  collection: 'events',
});

// Option B: Tenant-based routing (flexible)
export const tenantAUserOps = multiChronos.with({
  key: 'runtime-tenant-a',
  dbName: 'runtime_tenant_a',
  collection: 'users',
});

export const tenantBUserOps = multiChronos.with({
  key: 'runtime-tenant-b',
  dbName: 'runtime_tenant_b',
  collection: 'users',
});

// Option C: Generic tier (shared data)
export const systemConfigOps = multiChronos.with({
  key: 'meta-generic',
  dbName: 'meta_generic',
  collection: 'config',
});

// Option D: Domain tier (shared within domain)
export const domainContentOps = multiChronos.with({
  key: 'know-domain-1',
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
