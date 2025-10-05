import { initChronos } from 'chronos-db';
import { envDbConfig } from './envDbConfig';

// Database configuration - chronos-db 1.5.2 format
export const dbConfig = {
  // MongoDB connections - define once, reference by key
  mongoConns: [
    {
      key: 'mongo-local',
      mongoUri: envDbConfig.mongoUri, // Load from environment variables
      // For production, use replica set:
      // mongoUri: 'mongodb://mongo1:27017,mongo2:27017,mongo3:27017/dbname?replicaSet=rs0'
    }
  ],
  
  // Database configuration - at least one database type required
  databases: {
    runtime: [
      {
        key: 'runtime-generic',
        mongoConnKey: 'mongo-local',
        spacesConnKey: 'do-spaces',
        dbName: 'runtime_generic',
      }
    ]
  },
  
  // DigitalOcean Spaces configuration (fixed for compatibility)
  spacesConns: [{
    key: 'do-spaces',
    endpoint: 'https://chronos-1.fra1.digitaloceanspaces.com', // DigitalOcean Spaces endpoint
    region: 'fra1', // DigitalOcean region (can also use 'us-east-1' for AWS SDK compatibility)
    accessKey: envDbConfig.spaceAccessKey, // Load from environment variables
    secretKey: envDbConfig.spaceSecretKey, // Load from environment variables
    buckets: {
      backup: 'chronos-backups',
      json: 'chronos-json',
      content: 'chronos-content',
      versions: 'chronos-versions',
    },
    forcePathStyle: true, // Path style to avoid SSL certificate hostname mismatch
  }],
  
  // Local storage configuration - fallback when S3 credentials are not available
  // localStorage: {
  //   enabled: true,
  //   basePath: './local-storage',
  // },
  
  // Counters configuration for analytics
  counters: {
    mongoUri: envDbConfig.mongoUri, // Use same MongoDB URI as main connection
    dbName: 'chronos_counters',
  },
  
  // Routing configuration
  routing: {
    hashAlgo: 'rendezvous' as const,
  },
  
  // Retention and rollup policies
  retention: {},
  rollup: {
    enabled: false,
  },
  
  // Disable transactions for non-replica set MongoDB
  transactions: {
    enabled: false,
    autoDetect: false,
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
  },
};

// Initialize Chronos
export const chronos = initChronos(dbConfig);

// Export context-bound operations for different collections
export const userOps = chronos.with({
  key: 'runtime-generic',
  dbName: 'runtime_generic',
  collection: 'users',
});

export const productOps = chronos.with({
  key: 'runtime-generic',
  dbName: 'runtime_generic',
  collection: 'products',
});

// Graceful shutdown function
export async function shutdownDatabase(): Promise<void> {
  try {
    await chronos.admin.shutdown();
    console.log('Database connection closed successfully');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
}
