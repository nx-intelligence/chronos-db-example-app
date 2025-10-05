// Script to set up DigitalOcean Spaces buckets for chronos-db
import AWS from 'aws-sdk';
import { envDbConfig } from '../src/envDbConfig';

// Configure AWS SDK for DigitalOcean Spaces
const spacesEndpoint = new AWS.Endpoint('fra1.digitaloceanspaces.com');
const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: envDbConfig.spaceAccessKey,
  secretAccessKey: envDbConfig.spaceSecretKey,
  region: 'fra1',
  s3ForcePathStyle: false, // DigitalOcean Spaces requires virtual-hosted-style URLs
});

const requiredBuckets = [
  'chronos-backups',
  'chronos-json',
  'chronos-content'
];

async function setupSpaces() {
  console.log('🚀 Setting up DigitalOcean Spaces buckets...');
  
  try {
    // Check if buckets exist and create them if they don't
    for (const bucketName of requiredBuckets) {
      try {
        await s3.headBucket({ Bucket: bucketName }).promise();
        console.log(`✅ Bucket '${bucketName}' already exists`);
      } catch (error: any) {
        if (error.statusCode === 404) {
          console.log(`📦 Creating bucket '${bucketName}'...`);
          await s3.createBucket({ 
            Bucket: bucketName,
            ACL: 'private'
          }).promise();
          console.log(`✅ Bucket '${bucketName}' created successfully`);
        } else {
          console.error(`❌ Error checking bucket '${bucketName}':`, error.message);
        }
      }
    }
    
    console.log('\n🎉 All buckets are ready!');
    console.log('📊 Buckets created:');
    requiredBuckets.forEach(bucket => {
      console.log(`   - ${bucket}`);
    });
    
  } catch (error) {
    console.error('❌ Error setting up Spaces:', error);
  }
}

// Run the setup
if (require.main === module) {
  setupSpaces().catch(console.error);
}

export { setupSpaces };
