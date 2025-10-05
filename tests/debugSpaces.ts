// Debug script for DigitalOcean Spaces access issues
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';
import { envDbConfig } from '../src/envDbConfig';

async function debugSpacesAccess() {
  console.log('🔍 Debugging DigitalOcean Spaces access...');
  console.log(`📍 Endpoint: chronos-1.fra1.digitaloceanspaces.com`);
  console.log(`🔑 Access Key: ${envDbConfig.spaceAccessKey.substring(0, 8)}...`);
  console.log(`🔑 Secret Key: ${envDbConfig.spaceSecretKey.substring(0, 8)}...`);
  console.log(`🔑 Access Key Length: ${envDbConfig.spaceAccessKey.length}`);
  console.log(`🔑 Secret Key Length: ${envDbConfig.spaceSecretKey.length}`);
  
  // Test different configurations
  const configurations = [
    {
      name: 'Configuration 1: fra1 region, virtual-hosted style',
      config: {
        endpoint: 'https://chronos-1.fra1.digitaloceanspaces.com',
        region: 'fra1',
        credentials: {
          accessKeyId: envDbConfig.spaceAccessKey,
          secretAccessKey: envDbConfig.spaceSecretKey,
        },
        forcePathStyle: false,
      }
    },
    {
      name: 'Configuration 2: us-east-1 region, virtual-hosted style',
      config: {
        endpoint: 'https://chronos-1.fra1.digitaloceanspaces.com',
        region: 'us-east-1',
        credentials: {
          accessKeyId: envDbConfig.spaceAccessKey,
          secretAccessKey: envDbConfig.spaceSecretKey,
        },
        forcePathStyle: false,
      }
    },
    {
      name: 'Configuration 3: fra1 region, path style',
      config: {
        endpoint: 'https://chronos-1.fra1.digitaloceanspaces.com',
        region: 'fra1',
        credentials: {
          accessKeyId: envDbConfig.spaceAccessKey,
          secretAccessKey: envDbConfig.spaceSecretKey,
        },
        forcePathStyle: true,
      }
    },
    {
      name: 'Configuration 4: us-east-1 region, path style',
      config: {
        endpoint: 'https://chronos-1.fra1.digitaloceanspaces.com',
        region: 'us-east-1',
        credentials: {
          accessKeyId: envDbConfig.spaceAccessKey,
          secretAccessKey: envDbConfig.spaceSecretKey,
        },
        forcePathStyle: true,
      }
    }
  ];
  
  for (const { name, config } of configurations) {
    console.log(`\n🧪 Testing ${name}...`);
    
    try {
      const s3Client = new S3Client(config);
      const result = await s3Client.send(new ListBucketsCommand({}));
      console.log(`✅ SUCCESS! Found ${result.Buckets?.length || 0} buckets`);
      
      if (result.Buckets && result.Buckets.length > 0) {
        console.log('📋 Available buckets:');
        result.Buckets.forEach(bucket => {
          console.log(`   - ${bucket.Name} (created: ${bucket.CreationDate})`);
        });
      }
      
      // If we get here, this configuration works
      console.log(`\n🎉 Working configuration found: ${name}`);
      return config;
      
    } catch (error: any) {
      console.log(`❌ FAILED: ${error.message}`);
      
      if (error.name) {
        console.log(`   Error name: ${error.name}`);
      }
      
      if (error.$metadata) {
        console.log(`   HTTP Status: ${error.$metadata.httpStatusCode}`);
        console.log(`   Request ID: ${error.$metadata.requestId}`);
      }
      
      // Provide specific guidance based on error type
      if (error.message.includes('Access Denied')) {
        console.log(`   💡 This suggests credential/permission issues`);
      } else if (error.message.includes('UnknownEndpoint')) {
        console.log(`   💡 This suggests endpoint/region issues`);
      } else if (error.message.includes('InvalidAccessKeyId')) {
        console.log(`   💡 This suggests invalid access key`);
      } else if (error.message.includes('SignatureDoesNotMatch')) {
        console.log(`   💡 This suggests invalid secret key`);
      }
    }
  }
  
  console.log('\n❌ All configurations failed');
  console.log('\n💡 Troubleshooting steps:');
  console.log('   1. Verify your DigitalOcean Spaces credentials in the dashboard');
  console.log('   2. Check if your Space is in the fra1 region');
  console.log('   3. Ensure your API key has Spaces permissions');
  console.log('   4. Try creating a new API key with full Spaces access');
  console.log('   5. Check if your Space is active and not suspended');
  
  return null;
}

// Run the debug
if (require.main === module) {
  debugSpacesAccess().catch(console.error);
}

export { debugSpacesAccess };
