# Chronos-DB 1.5.0 Configuration Issue Report

## Problem

**Version**: chronos-db@1.5.0  
**Issue**: Configuration validation fails with `mongoUris` required error  
**Status**: BLOCKING - Cannot initialize chronos-db with new configuration format

## Error Details

```
ZodError: [
  {
    "code": "invalid_type",
    "expected": "array",
    "received": "undefined",
    "path": ["mongoUris"],
    "message": "Required"
  }
]
```

## Root Cause Analysis

### 1. **Validation Logic Bug in chronos-db**

**Confirmed Bug**: The validation logic in `node_modules/chronos-db/src/config.ts:512` has a bug:

```typescript
// Line 512 - BUG: config.databases is undefined/null despite being passed correctly
databasesCount: Object.keys(config.databases || {}).length
```

**Debug Evidence**:
```
Configuration being passed to initChronos:
mongoUris: [ 'mongodb://ki:AQ5Ty8X3Cx4x3x60@x3:27017/kiDB?authSource=admin' ]
databases: {
  runtime: {
    generic: {
      key: 'runtime-generic',
      mongoUri: 'mongodb://ki:AQ5Ty8X3Cx4x3x60@x3:27017/kiDB?authSource=admin',
      dbName: 'runtime_generic'
    }
  }
}
databases type: object
databases keys: [ 'runtime' ]
```

**But validation still fails with**: `Cannot convert undefined or null to object`

This indicates the `config` object is being modified or corrupted between our code and the validation function.

### 2. **Configuration Structure Conflict**

The README.md shows the new `databases` structure:
```typescript
const chronos = initChronos({
  databases: {
    runtime: {
      generic: { key: 'runtime-generic', mongoUri: '...', dbName: 'runtime_generic' }
    }
  }
  // No mongoUris field
});
```

But the implementation still expects the old format:
```typescript
// Old format that still works
const chronos = initChronos({
  mongoUris: ['mongodb://localhost:27017'],
  // Other config...
});
```

### 3. **Backward Compatibility Issue**

The package appears to be in a transitional state where:
- ✅ TypeScript definitions updated to new format
- ✅ README updated to new format  
- ❌ Runtime validation still expects old format
- ❌ No backward compatibility layer

## Current Configuration Attempts

### Attempt 1: New Format Only
```typescript
export const dbConfig = {
  databases: {
    runtime: {
      generic: {
        key: 'runtime-generic',
        mongoUri: envDbConfig.mongoUri,
        dbName: 'runtime_generic',
      },
    },
  },
  // ... other config
};
```
**Result**: ❌ Fails - `mongoUris` required

### Attempt 2: Both Formats
```typescript
export const dbConfig = {
  mongoUris: [envDbConfig.mongoUri],
  databases: {
    runtime: {
      generic: {
        key: 'runtime-generic',
        mongoUri: envDbConfig.mongoUri,
        dbName: 'runtime_generic',
      },
    },
  },
  // ... other config
};
```
**Result**: ❌ Fails - `databases` validation error

## Recommended Solutions

### Option 1: Fix Package Implementation
The chronos-db package needs to:
1. Update runtime validation to accept new `databases` format
2. Remove `mongoUris` requirement when `databases` is provided
3. Add proper migration path from old to new format

### Option 2: Use Old Format Until Fixed
```typescript
export const dbConfig = {
  mongoUris: [envDbConfig.mongoUri],
  // Remove databases field entirely
  spacesConns: [...],
  counters: {...},
  // ... other config
};
```

### Option 3: Wait for Package Fix
The package appears to be in an incomplete state. Wait for the maintainers to fix the validation logic.

## Impact Assessment

- **Development**: Blocked - cannot use new features
- **Production**: Should use stable version until fixed
- **Migration**: Cannot migrate to new format

## Next Steps

1. **Immediate**: Use old configuration format to unblock development
2. **Short-term**: Report issue to chronos-db maintainers
3. **Long-term**: Wait for package fix or contribute fix

## Files Affected

- `src/database.ts` - Main configuration
- `tests/createRows.ts` - Test script
- `src/multiDatabaseConfig.ts` - Multi-database example

## Environment

- **chronos-db**: 1.5.0
- **Node.js**: Current
- **TypeScript**: Current
- **OS**: Windows 10

---

**Conclusion**: chronos-db 1.5.0 has a **CRITICAL SCHEMA BUG** where the Zod validation schema is missing the `databases` field, causing it to be stripped during validation.

**Root Cause**: 
- TypeScript interface `ChronosConfig` requires `databases` field
- Zod schema `chronosConfigSchema` is missing `databases` field
- Validation at line 512 tries to access `config.databases` which was stripped by Zod parsing

**Evidence**:
```javascript
// Line 4459-4476: chronosConfigSchema definition
var chronosConfigSchema = zod.z.object({
  mongoUris: zod.z.array(...),
  spacesConns: zod.z.array(...),
  // ... other fields
  // MISSING: databases field!
});

// Line 4555: Validation tries to access stripped field
const validated = chronosConfigSchema.parse(config); // Strips 'databases'
// Line 4558: Later tries to access it
databasesCount: Object.keys(resolved.databases).length // FAILS!
```

**Status**: CRITICAL BUG - Package is unusable until schema is fixed.
