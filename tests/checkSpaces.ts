// Script to check DigitalOcean Spaces buckets
import AWS from 'aws-sdk';
import { envDbConfig } from '../src/envDbConfig';

// Configure AWS SDK for DigitalOcean Spaces
const spacesEndpoint = new AWS.Endpoint('fra1.digitaloceanspaces.com');
const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: envDbConfig.spaceAccessKey,
  secretAccessKey: envDbConfig.spaceSecretKey,
  region: 'fra1',
  s3ForcePathStyle: false,
});

const requiredBuckets = [
  'chronos-backups',
  'chronos-json',
  'chronos-content'
];

async function checkSpaces() {
  console.log('🔍 Checking DigitalOcean Spaces buckets...');
  console.log(`📍 Endpoint: fra1.digitaloceanspaces.com`);
  console.log(`🔑 Access Key: ${envDbConfig.spaceAccessKey.substring(0, 8)}...`);
  
  try {
    // List all buckets first
    console.log('\n📋 Listing all available buckets:');
    const result = await s3.listBuckets().promise();
    
    if (result.Buckets && result.Buckets.length > 0) {
      result.Buckets.forEach(bucket => {
        console.log(`   - ${bucket.Name} (created: ${bucket.CreationDate})`);
      });
    } else {
      console.log('   No buckets found');
    }
    
    // Check specific buckets
    console.log('\n🔍 Checking required buckets:');
    for (const bucketName of requiredBuckets) {
      try {
        await s3.headBucket({ Bucket: bucketName }).promise();
        console.log(`✅ Bucket '${bucketName}' exists and is accessible`);
      } catch (error: any) {
        if (error.statusCode === 404) {
          console.log(`❌ Bucket '${bucketName}' does not exist`);
        } else {
          console.log(`⚠️  Bucket '${bucketName}' error: ${error.message}`);
        }
      }
    }
    
  } catch (error: any) {
    console.error('❌ Error checking Spaces:', error.message);
    if (error.code === 'AccessDenied') {
      console.log('\n💡 Possible solutions:');
      console.log('   1. Check if the credentials have proper permissions');
      console.log('   2. Verify the credentials are correct');
      console.log('   3. Create buckets manually in DigitalOcean dashboard');
    }
  }
}

// Run the check
if (require.main === module) {
  checkSpaces().catch(console.error);
}

export { checkSpaces };
