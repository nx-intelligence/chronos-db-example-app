# Chronos DB MongoDB Connection Example

This project demonstrates how to initialize and use a MongoDB connection with the `chronos-db` package for reading collections.

## Features

- ✅ MongoDB connection initialization with chronos-db
- ✅ S3-compatible storage integration
- ✅ TypeScript support with type safety
- ✅ CRUD operations with versioning
- ✅ Transaction locking for concurrent writes
- ✅ Enrichment API for incremental updates
- ✅ Multiple read strategies with presigned URLs
- ✅ Collection mapping with validation
- ✅ Graceful shutdown handling

## Prerequisites

- Node.js 18+ 
- MongoDB (local or remote)
- S3-compatible storage (AWS S3, DigitalOcean Spaces, MinIO, etc.)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure your database connection in `src/database.ts`:
   - Update MongoDB URIs
   - Configure S3-compatible storage credentials
   - Adjust collection mappings as needed

## Configuration

Edit `src/database.ts` to configure your connection:

```typescript
export const dbConfig = {
  mongoUris: ['mongodb://localhost:27017'],
  spacesConns: [{
    endpoint: 'https://your-s3-endpoint.com',
    region: 'your-region',
    accessKey: 'YOUR_ACCESS_KEY',
    secretKey: 'YOUR_SECRET_KEY',
    backupsBucket: 'chronos-backups',
    jsonBucket: 'chronos-json',
    contentBucket: 'chronos-content',
  }],
  // ... other configuration
};
```

## Usage

### Basic Operations

```typescript
import { userOps } from './database';

// Create a new document
const user = await userOps.create({
  email: 'user@example.com',
  status: 'active'
}, 'system', 'user registration');

// Read latest version
const latest = await userOps.getLatest(user.id);

// Update document
await userOps.update(user.id, {
  status: 'verified'
}, user.ov, 'system', 'email verification');

// List documents with filtering
const users = await userOps.listByMeta({
  filter: { status: 'active' },
  limit: 10
});
```

### Running the Examples

1. **Main example** (CRUD operations):
```bash
npm run dev
```

2. **Read examples** (various read strategies):
```typescript
import { runReadExamples } from './src/read-examples';
await runReadExamples();
```

## Key Features Demonstrated

### 1. Connection Initialization
- Unified Data Manager setup
- MongoDB replica set support
- S3-compatible storage configuration
- Collection mapping with validation

### 2. CRUD Operations
- Create with automatic versioning
- Update with optimistic locking
- Read with multiple strategies
- Delete with logical deletion

### 3. Advanced Read Operations
- Latest version reading
- Specific version access
- Historical data by timestamp
- Metadata filtering and pagination
- Batch operations
- Projection-based reads

### 4. Enrichment API
- Incremental data updates
- Deep merge semantics
- Array union operations
- Provenance tracking

### 5. Transaction Safety
- Automatic locking for concurrent writes
- Optimistic locking with version control
- Cross-server conflict prevention

## File Structure

```
src/
├── database.ts          # Database configuration and initialization
├── index.ts            # Main example with CRUD operations
├── read-examples.ts    # Comprehensive read operation examples
package.json            # Dependencies and scripts
tsconfig.json          # TypeScript configuration
README.md              # This file
```

## Production Considerations

1. **MongoDB Replica Set**: Use a 3-node replica set in production
2. **Connection Pooling**: Configure appropriate connection limits
3. **Error Handling**: Implement robust error handling and retry logic
4. **Monitoring**: Set up monitoring for database health and performance
5. **Security**: Use environment variables for sensitive credentials
6. **Backup**: Configure regular backups and disaster recovery

## Environment Variables (Optional)

For production, consider using environment variables:

```bash
# .env file
MONGODB_URI=mongodb://localhost:27017
S3_ENDPOINT=https://your-s3-endpoint.com
S3_ACCESS_KEY=your_access_key
S3_SECRET_KEY=your_secret_key
S3_REGION=your_region
```

## Troubleshooting

1. **Connection Issues**: Verify MongoDB is running and accessible
2. **S3 Errors**: Check credentials and endpoint configuration
3. **Type Errors**: Ensure TypeScript compilation passes
4. **Performance**: Monitor connection pooling and query performance

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request
