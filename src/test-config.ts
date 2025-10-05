import { initChronos } from 'chronos-db';
import { envDbConfig } from './envDbConfig';

// Minimal test configuration to isolate the transaction issue
export const testConfig = {
  // MongoDB connection URIs - required
  mongoUris: [
    envDbConfig.mongoUri,
  ],
  
  // Database configuration - minimal setup
  databases: {
    runtime: {
      generic: {
        key: 'runtime-test',
        mongoUri: envDbConfig.mongoUri,
        dbName: 'runtime_test',
      },
    },
  },
  
  // Counters configuration for analytics
  counters: {
    mongoUri: envDbConfig.mongoUri,
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
  
  // Try completely removing transactions
  transactions: {
    enabled: false,
    autoDetect: false,
  },
  
  // Local storage configuration - fallback when S3 credentials are not available
  localStorage: {
    enabled: true,
    basePath: './local-storage',
  },
  
  // Collection maps - required field
  collectionMaps: {
    test: {
      indexedProps: ['name', 'value'],
      validation: {
        requiredIndexed: ['name'],
      },
    },
  },
};

// Initialize Chronos
export const testChronos = initChronos(testConfig);

// Export context-bound operations
export const testOps = testChronos.with({
  dbName: 'runtime_test',
  collection: 'test',
});
