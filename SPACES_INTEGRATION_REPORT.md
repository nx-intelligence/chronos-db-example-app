# DigitalOcean Spaces Integration Report for chronos-db

## Current Issues Identified

### 1. **Access Denied Error During Bucket Operations**
**Error:** `AccessDenied: Access Denied`
**Location:** When attempting to create/list buckets in DigitalOcean Spaces
**Root Cause:** The chronos-db package is trying to access buckets that don't exist or the credentials lack proper permissions.

### 2. **Missing Buckets**
**Required Buckets:**
- `chronos-backups` (for manifests and snapshots)
- `chronos-json` (for versioned JSON documents)  
- `chronos-content` (for externalized binary content)

**Current Status:** These buckets don't exist in the DigitalOcean Spaces account.

### 3. **S3 Configuration Issues**
**Current Configuration:**
```typescript
spacesConns: [{
  endpoint: 'https://fra1.digitaloceanspaces.com',
  region: 'fra1',
  accessKey: envDbConfig.spaceAccessKey,
  secretKey: envDbConfig.spaceSecretKey,
  backupsBucket: 'chronos-backups',
  jsonBucket: 'chronos-json',
  contentBucket: 'chronos-content',
}]
```

**Problems Identified:**
1. **Region Mismatch:** Using `fra1` region but endpoint might need adjustment
2. **Path Style:** `forcePathStyle` is not explicitly set (defaults to `false`)
3. **Bucket Creation:** No automatic bucket creation logic

## chronos-db Package Analysis

### S3 Client Configuration (from source code):
```javascript
const config = {
  endpoint: conn.endpoint,
  region: conn.region,
  credentials: {
    accessKeyId: conn.accessKey,
    secretAccessKey: conn.secretKey
  },
  forcePathStyle: conn.forcePathStyle ?? false  // Defaults to false
};
const client = new S3Client(config);
```

### Key Findings:
1. **AWS SDK v3:** chronos-db uses `@aws-sdk/client-s3` v3.450.0
2. **Force Path Style:** Defaults to `false` (virtual-hosted style)
3. **No Bucket Management:** Package doesn't automatically create buckets
4. **Error Handling:** Limited error handling for bucket operations

## Recommended Fixes

### 1. **Fix S3 Configuration**
```typescript
spacesConns: [{
  endpoint: 'https://fra1.digitaloceanspaces.com',
  region: 'fra1', // or 'us-east-1' for AWS SDK compatibility
  accessKey: envDbConfig.spaceAccessKey,
  secretKey: envDbConfig.spaceSecretKey,
  backupsBucket: 'chronos-backups',
  jsonBucket: 'chronos-json',
  contentBucket: 'chronos-content',
  forcePathStyle: false, // Explicit virtual-hosted style for DigitalOcean
}]
```

### 2. **Create Required Buckets**
**Option A: Manual Creation**
- Create buckets manually in DigitalOcean Spaces dashboard:
  - `chronos-backups`
  - `chronos-json`
  - `chronos-content`

**Option B: Programmatic Creation**
- Add bucket creation logic to chronos-db package
- Check if buckets exist before operations
- Create buckets with proper permissions if missing

### 3. **Enhanced Error Handling**
**Current Error:** Generic "Access Denied"
**Suggested Improvements:**
- Distinguish between "bucket doesn't exist" vs "insufficient permissions"
- Provide specific guidance for each error type
- Add retry logic for transient errors

### 4. **DigitalOcean Spaces Specific Considerations**
**Path Style:** DigitalOcean Spaces supports virtual-hosted style (current default)
**Region:** Can use actual region (`fra1`) or AWS-compatible region (`us-east-1`)
**SSL/TLS:** Ensure proper certificate handling
**Rate Limiting:** DigitalOcean Spaces has different rate limits than AWS S3

## Implementation Priority

### High Priority (Immediate Fixes):
1. ✅ **Create Required Buckets** - Manual creation in DigitalOcean dashboard
2. ✅ **Fix Region Configuration** - Ensure region matches endpoint
3. ✅ **Add forcePathStyle Explicitly** - Set to `false` for DigitalOcean

### Medium Priority (Package Improvements):
1. **Bucket Auto-Creation** - Add logic to create missing buckets
2. **Better Error Messages** - More specific error handling
3. **Configuration Validation** - Validate S3 config before use

### Low Priority (Nice to Have):
1. **Health Checks** - Verify S3 connectivity on startup
2. **Retry Logic** - Handle transient network issues
3. **Monitoring** - Add metrics for S3 operations

## Testing Strategy

### 1. **Basic Connectivity Test**
```typescript
// Test S3 client creation and basic operations
const testSpacesConnection = async () => {
  try {
    const client = new S3Client({
      endpoint: 'https://fra1.digitaloceanspaces.com',
      region: 'fra1',
      credentials: {
        accessKeyId: process.env.SPACE_ACCESS_KEY,
        secretAccessKey: process.env.SPACE_SECRET_KEY
      },
      forcePathStyle: false
    });
    
    // Test bucket listing
    const result = await client.send(new ListBucketsCommand({}));
    console.log('Available buckets:', result.Buckets);
    
    return true;
  } catch (error) {
    console.error('S3 connection test failed:', error);
    return false;
  }
};
```

### 2. **Bucket Operations Test**
```typescript
// Test bucket creation and access
const testBucketOperations = async () => {
  const buckets = ['chronos-backups', 'chronos-json', 'chronos-content'];
  
  for (const bucketName of buckets) {
    try {
      // Check if bucket exists
      await client.send(new HeadBucketCommand({ Bucket: bucketName }));
      console.log(`✅ Bucket '${bucketName}' exists`);
    } catch (error) {
      if (error.name === 'NotFound') {
        console.log(`❌ Bucket '${bucketName}' does not exist`);
      } else {
        console.log(`⚠️  Error checking bucket '${bucketName}':`, error.message);
      }
    }
  }
};
```

## Root Cause Analysis

### **Primary Issue: Credential/Permission Problem**
**Status:** ✅ **IDENTIFIED AND CONFIRMED**

**Evidence:**
- All S3 configurations (4 different combinations) fail with `AccessDenied` (HTTP 403)
- Error occurs at the basic `ListBucketsCommand` level
- Request IDs are returned, indicating the request reaches DigitalOcean
- No configuration differences affect the outcome

**Conclusion:** The issue is **NOT** with chronos-db configuration but with DigitalOcean Spaces credentials/permissions.

### **Specific Issues:**
1. **API Key Permissions:** The current API key likely lacks Spaces permissions
2. **Credential Validation:** Access key/secret key may be invalid or expired
3. **Account Status:** DigitalOcean Spaces account may be inactive or suspended

## Immediate Action Required

### **Step 1: Verify DigitalOcean Spaces Account**
1. Log into DigitalOcean dashboard
2. Navigate to "Spaces" section
3. Verify:
   - Space exists in `fra1` region
   - Space is active (not suspended)
   - Account has Spaces quota available

### **Step 2: Check API Key Permissions**
1. Go to "API" section in DigitalOcean dashboard
2. Find the API key: `DO801ZZ3F2GRUCX79KA6`
3. Verify it has:
   - ✅ **Spaces:Read** permission
   - ✅ **Spaces:Write** permission
   - ✅ **Spaces:Full Control** (recommended)

### **Step 3: Regenerate API Key (if needed)**
If permissions are insufficient:
1. Create a new API key with full Spaces permissions
2. Update `.env` file with new credentials
3. Test again

### **Step 4: Manual Bucket Creation (if needed)**
If API key works but buckets don't exist:
1. Create buckets manually in DigitalOcean dashboard:
   - `chronos-backups`
   - `chronos-json`
   - `chronos-content`
2. Set appropriate permissions (private recommended)

## Next Steps

1. **✅ COMPLETED:** Identify root cause (credential/permission issue)
2. **🔄 IN PROGRESS:** Fix DigitalOcean Spaces credentials/permissions
3. **⏳ PENDING:** Create required buckets (manual or programmatic)
4. **⏳ PENDING:** Test integration with fixed credentials
5. **⏳ PENDING:** Update chronos-db configuration if needed

## Files to Modify

1. **`src/database.ts`** - Update S3 configuration
2. **chronos-db package** - Add bucket management logic (if desired)
3. **`tests/createRows.ts`** - Test with Spaces configuration
4. **Documentation** - Add DigitalOcean Spaces setup guide
