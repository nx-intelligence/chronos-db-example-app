// Script to verify DigitalOcean Spaces setup and create required buckets
import { S3Client, ListBucketsCommand, HeadBucketCommand, CreateBucketCommand } from '@aws-sdk/client-s3';
import { envDbConfig } from '../src/envDbConfig';

// Configure S3 client for DigitalOcean Spaces
const s3Client = new S3Client({
  endpoint: 'https://chronos-1.fra1.digitaloceanspaces.com',
  region: 'us-east-1', // AWS SDK compatibility region
  credentials: {
    accessKeyId: envDbConfig.spaceAccessKey,
    secretAccessKey: envDbConfig.spaceSecretKey,
  },
  forcePathStyle: true, // Path style to avoid SSL certificate hostname mismatch
});

const requiredBuckets = [
  'chronos-backups',
  'chronos-json',
  'chronos-content'
];

async function verifySpacesSetup() {
  console.log('🔍 Verifying DigitalOcean Spaces setup...');
  console.log(`📍 Endpoint: chronos-1.fra1.digitaloceanspaces.com`);
  console.log(`🔑 Access Key: ${envDbConfig.spaceAccessKey.substring(0, 8)}...`);
  console.log(`🔑 Secret Key: ${envDbConfig.spaceSecretKey.substring(0, 8)}...`);
  
  try {
    // Test basic connectivity
    console.log('\n📡 Testing S3 connectivity...');
    const listResult = await s3Client.send(new ListBucketsCommand({}));
    console.log('✅ Successfully connected to DigitalOcean Spaces!');
    
    if (listResult.Buckets && listResult.Buckets.length > 0) {
      console.log('📋 Available buckets:');
      listResult.Buckets.forEach(bucket => {
        console.log(`   - ${bucket.Name} (created: ${bucket.CreationDate})`);
      });
    } else {
      console.log('📋 No buckets found');
    }
    
    // Check required buckets
    console.log('\n🔍 Checking required buckets:');
    const missingBuckets: string[] = [];
    
    for (const bucketName of requiredBuckets) {
      try {
        await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
        console.log(`✅ Bucket '${bucketName}' exists and is accessible`);
      } catch (error: any) {
        if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
          console.log(`❌ Bucket '${bucketName}' does not exist`);
          missingBuckets.push(bucketName);
        } else if (error.name === 'Forbidden' || error.$metadata?.httpStatusCode === 403) {
          console.log(`⚠️  Bucket '${bucketName}' exists but access is forbidden`);
        } else {
          console.log(`⚠️  Error checking bucket '${bucketName}':`, error.message);
        }
      }
    }
    
    // Create missing buckets
    if (missingBuckets.length > 0) {
      console.log(`\n📦 Creating ${missingBuckets.length} missing buckets...`);
      
      for (const bucketName of missingBuckets) {
        try {
          console.log(`Creating bucket '${bucketName}'...`);
          await s3Client.send(new CreateBucketCommand({ 
            Bucket: bucketName,
            ACL: 'private'
          }));
          console.log(`✅ Successfully created bucket '${bucketName}'`);
        } catch (error: any) {
          console.error(`❌ Failed to create bucket '${bucketName}':`, error.message);
          
          if (error.name === 'BucketAlreadyExists') {
            console.log(`   (Bucket might already exist in a different region)`);
          } else if (error.name === 'BucketAlreadyOwnedByYou') {
            console.log(`   (Bucket is already owned by you)`);
          }
        }
      }
    }
    
    // Final verification
    console.log('\n🔍 Final verification:');
    let allBucketsExist = true;
    
    for (const bucketName of requiredBuckets) {
      try {
        await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
        console.log(`✅ Bucket '${bucketName}' is ready`);
      } catch (error: any) {
        console.log(`❌ Bucket '${bucketName}' is not accessible`);
        allBucketsExist = false;
      }
    }
    
    if (allBucketsExist) {
      console.log('\n🎉 All required buckets are ready!');
      console.log('✅ DigitalOcean Spaces setup is complete');
      console.log('🚀 You can now run: npx ts-node tests/createRows.ts');
    } else {
      console.log('\n⚠️  Some buckets are still not accessible');
      console.log('💡 Try creating them manually in the DigitalOcean dashboard');
    }
    
  } catch (error: any) {
    console.error('❌ Error during setup verification:', error.message);
    
    if (error.name === 'CredentialsProviderError') {
      console.log('\n💡 Possible solutions:');
      console.log('   1. Check your SPACE_ACCESS_KEY and SPACE_SECRET_KEY');
      console.log('   2. Verify the credentials are correct in DigitalOcean dashboard');
      console.log('   3. Ensure the credentials have proper permissions');
    } else if (error.name === 'UnknownEndpoint') {
      console.log('\n💡 Possible solutions:');
      console.log('   1. Check the endpoint URL: https://fra1.digitaloceanspaces.com');
      console.log('   2. Verify your Space is in the fra1 region');
      console.log('   3. Try using region "us-east-1" for AWS SDK compatibility');
    }
  }
}

// Run the verification
if (require.main === module) {
  verifySpacesSetup().catch(console.error);
}

export { verifySpacesSetup };
