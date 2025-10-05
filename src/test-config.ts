import { initChronos } from 'chronos-db';
import { envDbConfig } from './envDbConfig';

// Minimal test configuration to isolate the transaction issue - chronos-db 1.5.3 format with transaction system compatibility
export const testConfig = {
  // MongoDB connections - define once, reference by key
  mongoConns: [
    {
      key: 'mongo-local',
      mongoUri: envDbConfig.mongoUri,
    }
  ],
  
  
  // Database configuration - minimal setup
  databases: {
    runtime: [
      {
        key: 'runtime-test',
        mongoConnKey: 'mongo-local',
        dbName: 'runtime_test',
      }
    ]
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
  key: 'runtime-test',
  dbName: 'runtime_test',
  collection: 'test',
});
