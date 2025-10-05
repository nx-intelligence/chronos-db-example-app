# Chronos-DB Example Application

A comprehensive example application demonstrating how to use [chronos-db](https://github.com/nx-intelligence/chronos-db) - a production-ready persistence layer that combines MongoDB with S3-compatible storage for time-travel versioning, enrichment API, and lineage tracking.

## 🚀 What is Chronos-DB?

Chronos-DB is a unified persistence layer that provides:

- **MongoDB** for indexed metadata, head pointers, and bounded recent version index
- **S3-compatible storage** for authoritative payloads and full JSON per version
- **Automatic versioning** with explicit restore capabilities
- **Multi-backend routing** with connection pooling
- **Transaction locking** for concurrent write prevention
- **Enrichment API** for incremental updates
- **Fallback queues** for guaranteed durability
- **Type-safe** configuration with Zod validation

## 📁 Project Structure

```
chronos-db-app/
├── src/
│   ├── database.ts              # Main database configuration
│   ├── multiDatabaseConfig.ts   # Multi-tenant configuration example
│   ├── envDbConfig.ts          # Environment configuration
│   ├── index.ts                # Main application logic
│   ├── test-config.ts          # Minimal test configuration
│   └── test-simple.ts          # Simple test script
├── tests/
│   └── createRows.ts           # Test data creation
├── local-storage/              # Local storage for development
├── CHRONOS_DB_1.5.2_ISSUE_REPORT.md  # Bug report documentation
└── README.md                   # This file
```

## 🛠️ Installation & Setup

### Prerequisites

- Node.js 18+ 
- MongoDB (local or cloud instance)
- (Optional) S3-compatible storage (DigitalOcean Spaces, AWS S3, etc.)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/nx-intelligence/chronos-db-example-app.git
   cd chronos-db-example-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   MONGO_URI=mongodb://localhost:27017
   SPACE_ACCESS_KEY=your_digitalocean_spaces_access_key
   SPACE_SECRET_KEY=your_digitalocean_spaces_secret_key
   ```

4. **Build the project:**
   ```bash
   npm run build
   ```

## 🎯 Configuration Examples

### Basic Configuration (`src/database.ts`)

This example shows a simple single-database setup:

```typescript
import { initChronos } from 'chronos-db';

export const dbConfig = {
  // MongoDB connections - define once, reference by key
  mongoConns: [
    {
      key: 'mongo-local',
      mongoUri: envDbConfig.mongoUri,
    }
  ],
  
  // Database configuration
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
  
  // S3-compatible storage
  spacesConns: [{
    key: 'do-spaces',
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
  }],
  
  // Other required configuration...
};

export const chronos = initChronos(dbConfig);
```

### Multi-Tenant Configuration (`src/multiDatabaseConfig.ts`)

This example demonstrates a complex multi-tenant setup with multiple database types and tiers:

```typescript
export const multiDbConfig = {
  mongoConns: [
    { key: 'mongo-primary', mongoUri: envDbConfig.mongoUri },
    { key: 'mongo-backup', mongoUri: 'mongodb://backup-server:27017' },
  ],
  
  databases: {
    metadata: [
      { key: 'meta-generic', mongoConnKey: 'mongo-primary', spacesConnKey: 'do-spaces', dbName: 'meta_generic' },
      { key: 'meta-tenant-a', mongoConnKey: 'mongo-primary', spacesConnKey: 'do-spaces', tenantId: 'tenant-a', dbName: 'meta_tenant_a' },
    ],
    knowledge: [
      { key: 'know-generic', mongoConnKey: 'mongo-primary', spacesConnKey: 'do-spaces', dbName: 'know_generic' },
      { key: 'know-tenant-a', mongoConnKey: 'mongo-primary', spacesConnKey: 'do-spaces', tenantId: 'tenant-a', dbName: 'know_tenant_a' },
    ],
    runtime: [
      { key: 'runtime-generic', mongoConnKey: 'mongo-primary', spacesConnKey: 'do-spaces', dbName: 'runtime_generic' },
      { key: 'runtime-tenant-a', mongoConnKey: 'mongo-primary', spacesConnKey: 'do-spaces', tenantId: 'tenant-a', dbName: 'runtime_tenant_a' },
    ],
  },
  
  // Advanced features...
  counterRules: {
    rules: [
      { name: 'activeUsers', when: { status: 'active' }, on: ['CREATE', 'UPDATE'], scope: 'meta' },
    ],
  },
  
  devShadow: { enabled: true, ttlHours: 24 },
  fallback: { enabled: true, maxRetries: 3 },
};
```

## 🎮 Usage Examples

### Basic CRUD Operations

```typescript
import { userOps, productOps } from './database';

// Create a new user
const user = await userOps.create({
  email: 'john.doe@example.com',
  status: 'active',
}, 'system', 'user registration');

// Update user
await userOps.update(user.id, {
  status: 'verified',
}, user.ov, 'system', 'email verified');

// Read latest version
const latestUser = await userOps.getLatest(user.id);

// Read specific version
const version1 = await userOps.getVersion(user.id, 1);

// Logical delete
await userOps.delete(user.id, user.ov, 'system', 'user deactivated');
```

### Enrichment API

```typescript
// Incrementally add data without full rewrite
await userOps.enrich(user.id, {
  tags: ['premium', 'vip'],
  metadata: { 
    score: 100,
    preferences: { theme: 'dark' }
  },
}, {
  functionId: 'enricher@v1',
  actor: 'system',
  reason: 'automated enrichment',
});

// Batch enrichment
await userOps.enrich(user.id, [
  { tags: ['verified'] },
  { metadata: { lastLogin: new Date() } },
]);
```

### Multi-Tenant Operations

```typescript
import { tenantAUserOps, tenantBUserOps, systemConfigOps } from './multiDatabaseConfig';

// Tenant-specific operations
await tenantAUserOps.create({ email: 'user@tenant-a.com' });
await tenantBUserOps.create({ email: 'user@tenant-b.com' });

// Shared system configuration
await systemConfigOps.create({ 
  setting: 'global_value',
  version: '1.0.0'
});
```

### Restore Operations

```typescript
// Restore to specific version
await userOps.restoreObject(user.id, { ov: 2 });

// Restore to specific time
await userOps.restoreObject(user.id, { at: '2024-01-01T00:00:00Z' });

// Restore entire collection
await userOps.restoreCollection({ cv: 100 });
```

## 🏗️ Architecture Patterns

### Database Types

- **`metadata`** - System configuration, user settings, application metadata
- **`knowledge`** - Content, documents, knowledge base, static data  
- **`runtime`** - User data, transactions, dynamic application data
- **`logs`** - System logs and audit trails (no tiers)

### Tiers

- **`generic`** - Shared across all tenants (system-wide data)
- **`domain`** - Shared within a domain (multi-tenant within domain)
- **`tenant`** - Isolated per tenant (single-tenant data)

### Routing Options

**Option A: Direct Key Usage (Fastest)**
```typescript
const ops = chronos.with({
  key: 'runtime-tenant-a',
  dbName: 'runtime_tenant_a',
  collection: 'users'
});
```

**Option B: Tenant-Based Routing (Flexible)**
```typescript
const ops = chronos.with({
  databaseType: 'runtime',
  tier: 'tenant',
  tenantId: 'tenant-a',
  collection: 'users'
});
```

## 🔧 Development & Testing

### Running the Application

```bash
# Development mode with hot reload
npm run dev

# Build and run production
npm run build
npm start
```

### Testing

```bash
# Run simple test
npx ts-node src/test-simple.ts

# Create test data
npx ts-node tests/createRows.ts
```

### Local Storage Mode

For development without S3, use local storage:

```typescript
const config = {
  mongoConns: [{ key: 'mongo-local', mongoUri: 'mongodb://localhost:27017' }],
  localStorage: { enabled: true, basePath: './local-storage' },
  // ... other config
};
```

## 📊 Advanced Features

### Counter Rules

```typescript
counterRules: {
  rules: [
    {
      name: 'activeUsers',
      when: { status: 'active' },
      on: ['CREATE', 'UPDATE'],
      scope: 'meta',
    },
  ],
},

// Query counters
const totals = await chronos.counters.getTotals({
  dbName: 'runtime_generic',
  collection: 'users',
});
```

### Fallback Queues

```typescript
fallback: {
  enabled: true,
  maxRetries: 3,
  retryDelayMs: 1000,
  maxDelayMs: 60000,
  deadLetterCollection: 'chronos_fallback_dead',
},

// Start worker for automatic retries
await chronos.fallback?.startWorker();
```

### Collection Maps & Validation

```typescript
collectionMaps: {
  users: {
    indexedProps: ['email', 'status', 'createdAt'],
    validation: {
      requiredIndexed: ['email'],
    },
  },
  products: {
    indexedProps: ['name', 'category', 'price'],
    validation: {
      requiredIndexed: ['name', 'category'],
    },
  },
},
```

## 🚨 Known Issues

### Chronos-DB 1.5.1+ Transaction System Bug

**⚠️ CRITICAL**: Versions 1.5.1, 1.5.2, and 1.5.3 have a bug where the transaction system cannot resolve MongoDB URIs from the new `mongoConns` format. All write operations fail with "No MongoDB URI available for transaction check".

**Root Cause**: The transaction system still looks for `config.mongoUris[0]` but the configuration format changed to `mongoConns` array with key-based references.

**Workaround**: Use chronos-db@1.4.0 (last working version):
```bash
npm install chronos-db@1.4.0
```

**Status**: Bug persists in all versions 1.5.1+. See `CHRONOS_DB_1.5.2_ISSUE_REPORT.md` and `CHRONOS_DB_1.5.3_UPDATE_REPORT.md` for detailed analysis.

## 🎓 Learning Objectives

This example app teaches you:

### 1. **Configuration Management**
- How to structure chronos-db configurations
- Migration from old to new format
- Multi-tenant database setup
- S3-compatible storage configuration

### 2. **Data Operations**
- CRUD operations with versioning
- Enrichment API for incremental updates
- Restore operations for time-travel
- Multi-tenant data isolation

### 3. **Production Patterns**
- Connection pooling and routing
- Fallback queues for reliability
- Counter rules for analytics
- Collection validation and indexing

### 4. **Architecture Design**
- Database type organization
- Tenant isolation strategies
- Scalability considerations
- Error handling patterns

## 📚 Additional Resources

- [Chronos-DB GitHub Repository](https://github.com/nx-intelligence/chronos-db)
- [Chronos-DB Documentation](https://github.com/nx-intelligence/chronos-db#readme)
- [DigitalOcean Spaces Setup Guide](./SPACES_INTEGRATION_REPORT.md)
- [Multi-Tenant Architecture Explanation](./TENANT_EXPLANATION.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [chronos-db](https://github.com/nx-intelligence/chronos-db)
- MongoDB for document storage
- DigitalOcean Spaces for S3-compatible storage
- TypeScript for type safety

---

**Made with ❤️ for production-grade data management**