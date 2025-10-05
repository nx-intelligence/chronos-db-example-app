import { userOps, productOps } from './database';

// Define ItemView type based on chronos-db structure
interface ItemView {
  id: string;
  item: Record<string, unknown>;
  _meta?: {
    ov: number;
    cv: number;
    at: string;
    metaIndexed: Record<string, unknown>;
    deletedAt?: string;
  };
  presigned?: {
    [jsonPath: string]: {
      blobUrl?: string;
      textUrl?: string;
      expiresIn?: number;
    };
  };
}

/**
 * Examples of different read operations using chronos-db
 */
export class ReadExamples {
  
  /**
   * Read the latest version of a document
   */
  static async readLatest(id: string): Promise<ItemView | null> {
    console.log(`📖 Reading latest version of document: ${id}`);
    
    const result = await userOps.getLatest(id, {
      presign: true,        // Generate presigned URLs for S3 access
      ttlSeconds: 3600,     // URL expiration time
      projection: ['email', 'status', 'metadata'] // Only fetch specific fields
    });
    
    console.log('✅ Latest document:', result);
    return result;
  }

  /**
   * Read a specific version of a document
   */
  static async readSpecificVersion(id: string, version: number): Promise<ItemView | null> {
    console.log(`🕐 Reading version ${version} of document: ${id}`);
    
    const result = await userOps.getVersion(id, version);
    
    console.log('✅ Specific version:', result);
    return result;
  }

  /**
   * Read document as of a specific time
   */
  static async readAsOfTime(id: string, timestamp: string): Promise<ItemView | null> {
    console.log(`⏰ Reading document as of: ${timestamp}`);
    
    const result = await userOps.getAsOf(id, timestamp);
    
    console.log('✅ Historical document:', result);
    return result;
  }

  /**
   * List documents with metadata filtering and pagination
   */
  static async listWithFilter(): Promise<{ items: ItemView[]; pageToken?: string }> {
    console.log('🔍 Listing documents with filter...');
    
    const results = await userOps.listByMeta({
      filter: { 
        status: 'active',
        'metadata.tags': { $in: ['premium', 'verified'] }
      },
      limit: 10,
      sort: { createdAt: -1 },
      // afterId: 'lastDocumentId' // For pagination
    }, { 
      presign: true,
      ttlSeconds: 1800
    });
    
    console.log('✅ Filtered results:', results);
    return results;
  }

  /**
   * Search products by category and price range
   */
  static async searchProducts(category: string, minPrice: number, maxPrice: number): Promise<{ items: ItemView[]; pageToken?: string }> {
    console.log(`🛍️ Searching products in category: ${category}, price: $${minPrice}-$${maxPrice}`);
    
    const results = await productOps.listByMeta({
      filter: {
        category: category,
        price: { $gte: minPrice, $lte: maxPrice }
      },
      limit: 20,
      sort: { price: 1 } // Sort by price ascending
    });
    
    console.log('✅ Product search results:', results);
    return results;
  }

  /**
   * Get document with all versions (for audit trail)
   */
  static async getDocumentHistory(id: string): Promise<Array<{
    version: number;
    createdAt: Date;
    updatedAt?: Date;
    data: ItemView;
  }>> {
    console.log(`📚 Getting document history for: ${id}`);
    
    try {
      // Get latest first to know current version
      const latest = await userOps.getLatest(id);
      if (!latest || !latest._meta) {
        throw new Error(`Document with id ${id} not found`);
      }
      
      const currentVersion = latest._meta.ov;
      
      console.log(`Document has ${currentVersion + 1} versions`);
      
      // Read all versions
      const history = [];
      for (let version = 0; version <= currentVersion; version++) {
        const versionData = await userOps.getVersion(id, version);
        if (versionData && versionData._meta) {
          history.push({
            version: versionData._meta.ov,
            createdAt: new Date(versionData._meta.at),
            updatedAt: versionData._meta.deletedAt ? new Date(versionData._meta.deletedAt) : undefined,
            data: versionData
          });
        }
      }
      
      console.log('✅ Document history:', history);
      return history;
      
    } catch (error) {
      console.error('❌ Error getting document history:', error);
      throw error;
    }
  }

  /**
   * Batch read multiple documents
   */
  static async batchRead(ids: string[]): Promise<Array<{
    id: string;
    success: boolean;
    data?: ItemView | null;
    error?: string;
  }>> {
    console.log(`📦 Batch reading ${ids.length} documents...`);
    
    const results = await Promise.all(
      ids.map(async (id) => {
        try {
          const doc = await userOps.getLatest(id);
          return { id, success: true, data: doc };
        } catch (error) {
          return { id, success: false, error: error instanceof Error ? error.message : String(error) };
        }
      })
    );
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ Batch read completed: ${successful.length} successful, ${failed.length} failed`);
    
    if (failed.length > 0) {
      console.log('❌ Failed reads:', failed);
    }
    
    return results;
  }

  /**
   * Read with custom projection (only specific fields)
   */
  static async readWithProjection(id: string, fields: string[]): Promise<ItemView | null> {
    console.log(`🎯 Reading document with projection: ${fields.join(', ')}`);
    
    const result = await userOps.getLatest(id, {
      projection: fields,
      presign: false // Don't need presigned URLs for metadata-only reads
    });
    
    console.log('✅ Projected result:', result);
    return result;
  }

  /**
   * Read document metadata only (without payload)
   */
  static async readMetadataOnly(id: string): Promise<ItemView | null> {
    console.log(`📋 Reading metadata only for: ${id}`);
    
    const result = await userOps.getLatest(id, {
      projection: ['id', 'ov', 'cv', 'createdAt', 'updatedAt'],
      presign: false
    });
    
    console.log('✅ Metadata only:', result);
    return result;
  }
}

// Example usage function
export async function runReadExamples() {
  try {
    console.log('🚀 Running read examples...\n');
    
    // Create a test user first
    const testUser = await userOps.create({
      email: 'test@example.com',
      status: 'active',
      metadata: { tags: ['premium', 'verified'] }
    }, 'system', 'test user creation');
    
    console.log(`Created test user with ID: ${testUser.id}\n`);
    
    // Run various read examples
    await ReadExamples.readLatest(testUser.id);
    console.log('\n' + '='.repeat(50) + '\n');
    
    await ReadExamples.readSpecificVersion(testUser.id, 0);
    console.log('\n' + '='.repeat(50) + '\n');
    
    await ReadExamples.readWithProjection(testUser.id, ['email', 'status']);
    console.log('\n' + '='.repeat(50) + '\n');
    
    await ReadExamples.readMetadataOnly(testUser.id);
    console.log('\n' + '='.repeat(50) + '\n');
    
    await ReadExamples.listWithFilter();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await ReadExamples.getDocumentHistory(testUser.id);
    
    console.log('\n🎉 All read examples completed successfully!');
    
  } catch (error) {
    console.error('❌ Error running read examples:', error);
  }
}
