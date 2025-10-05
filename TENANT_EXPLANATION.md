# Understanding `tenantId` in chronos-db

## What is `tenantId`?

`tenantId` is a **multi-tenancy identifier** used in chronos-db to separate data belonging to different tenants (customers, organizations, or logical groupings) within the same database infrastructure.

## How it Works

### 1. **Data Isolation**
Each `tenantId` creates a logical boundary for data access. When you specify a `tenantId`, all operations are scoped to that tenant's data only.

### 2. **Routing Context**
The `tenantId` is part of the routing context that determines:
- Which backend (MongoDB/S3) to use
- How data is distributed across multiple backends
- Where to store and retrieve data

### 3. **Context Binding**
When you create bound operations with `udm.with()`, the `tenantId` becomes part of the context:

```typescript
// Context includes tenantId
interface RouteContext {
  tenantId?: string;
  dbName: string;
  collection: string;
  objectId?: string;
  forcedIndex?: number;
}
```

## Examples

### Single Tenant (Current Setup)
```typescript
export const userOps = udm.with({
  dbName: 'myapp',
  collection: 'users',
  tenantId: 'default', // Single tenant
});
```

### Multi-Tenant Setup
```typescript
// Tenant A operations
export const tenantAUserOps = udm.with({
  dbName: 'myapp',
  collection: 'users',
  tenantId: 'tenant_a', // Specific tenant
});

// Tenant B operations
export const tenantBUserOps = udm.with({
  dbName: 'myapp',
  collection: 'users',
  tenantId: 'tenant_b', // Different tenant
});

// Shared operations (no tenant)
export const globalOps = udm.with({
  dbName: 'myapp',
  collection: 'config',
  // No tenantId - accessible to all
});
```

## Use Cases

### 1. **SaaS Applications**
- Each customer gets their own `tenantId`
- Data is logically separated but physically shared
- Example: `tenantId: 'customer_123'`

### 2. **Multi-Environment**
- Different environments use different tenant IDs
- Example: `tenantId: 'production'`, `tenantId: 'staging'`

### 3. **Data Partitioning**
- Logical separation without physical database separation
- Example: `tenantId: 'region_us'`, `tenantId: 'region_eu'`

### 4. **A/B Testing**
- Different test groups use different tenant IDs
- Example: `tenantId: 'group_a'`, `tenantId: 'group_b'`

## Routing Configuration

The `tenantId` can be used in routing decisions:

```typescript
routing: {
  hashAlgo: 'rendezvous',
  chooseKey: 'tenantId|dbName', // Use tenantId in routing
}
```

This means:
- Different tenants can be routed to different backends
- Load balancing across multiple databases
- Geographic distribution based on tenant

## Data Storage

### MongoDB Collections
Data is stored with tenant context:
```
Database: myapp
Collection: users
Documents: 
  - { _id: "...", tenantId: "tenant_a", email: "user1@tenant-a.com", ... }
  - { _id: "...", tenantId: "tenant_b", email: "user2@tenant-b.com", ... }
```

### S3 Storage
Files are organized by tenant:
```
Bucket: chronos-json
Path: tenant_a/myapp/users/document_id.json
Path: tenant_b/myapp/users/document_id.json
```

## Best Practices

### 1. **Consistent Tenant ID**
- Use the same `tenantId` for all operations within a tenant
- Validate tenant ID format and consistency

### 2. **Tenant ID Format**
```typescript
// Good formats
tenantId: 'customer_123'
tenantId: 'org_abc'
tenantId: 'region_us'
tenantId: 'production'

// Avoid
tenantId: '' // Empty string
tenantId: null // Null values
```

### 3. **Security**
- Validate tenant access permissions
- Ensure users can only access their tenant's data
- Implement tenant-level authentication

### 4. **Performance**
- Use tenant ID in indexes for efficient queries
- Consider tenant-specific caching strategies

## Current Configuration Analysis

Looking at your current setup:

```typescript
export const userOps = udm.with({
  dbName: 'myapp',
  collection: 'users',
  tenantId: 'default', // Single tenant setup
});
```

This means:
- ✅ All data belongs to the 'default' tenant
- ✅ Simple single-tenant setup
- ✅ No multi-tenancy complexity
- ⚠️ Not suitable for multi-tenant SaaS applications

## Migration to Multi-Tenant

If you need multi-tenancy later:

1. **Add tenant context to operations**:
```typescript
function getUserOps(tenantId: string) {
  return udm.with({
    dbName: 'myapp',
    collection: 'users',
    tenantId: tenantId,
  });
}
```

2. **Update routing configuration**:
```typescript
routing: {
  hashAlgo: 'rendezvous',
  chooseKey: 'tenantId|dbName',
}
```

3. **Implement tenant-aware API**:
```typescript
async function createUser(tenantId: string, userData: any) {
  const ops = getUserOps(tenantId);
  return await ops.create(userData, 'system', 'user creation');
}
```

## Summary

- `tenantId` provides **logical data separation** within shared infrastructure
- Essential for **SaaS applications** and **multi-tenant systems**
- Enables **load balancing** and **geographic distribution**
- Your current setup uses `'default'` tenant (single-tenant)
- Easy to migrate to multi-tenant when needed
