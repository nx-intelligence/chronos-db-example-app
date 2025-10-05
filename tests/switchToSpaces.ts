// Script to switch from localStorage to DigitalOcean Spaces
// Run this after creating the required buckets manually in DigitalOcean dashboard

import fs from 'fs';
import path from 'path';

const databaseConfigPath = path.join(__dirname, '../src/database.ts');

async function switchToSpaces() {
  console.log('🔄 Switching from localStorage to DigitalOcean Spaces...');
  
  try {
    // Read the current database configuration
    let configContent = fs.readFileSync(databaseConfigPath, 'utf8');
    
    // Replace localStorage configuration with Spaces configuration
    const localStorageConfig = `  // Local storage configuration for testing (Spaces setup pending)
  localStorage: {
    enabled: true,
    basePath: './local-storage',
  },
  
  // DigitalOcean Spaces configuration (commented out until buckets are created)
  // spacesConns: [{
  //   endpoint: 'https://fra1.digitaloceanspaces.com', // DigitalOcean Spaces endpoint
  //   region: 'fra1', // DigitalOcean region
  //   accessKey: envDbConfig.spaceAccessKey, // Load from environment variables
  //   secretKey: envDbConfig.spaceSecretKey, // Load from environment variables
  //   backupsBucket: 'chronos-backups',
  //   jsonBucket: 'chronos-json',
  //   contentBucket: 'chronos-content',
  // }],`;

    const spacesConfig = `  // DigitalOcean Spaces configuration
  spacesConns: [{
    endpoint: 'https://fra1.digitaloceanspaces.com', // DigitalOcean Spaces endpoint
    region: 'fra1', // DigitalOcean region
    accessKey: envDbConfig.spaceAccessKey, // Load from environment variables
    secretKey: envDbConfig.spaceSecretKey, // Load from environment variables
    backupsBucket: 'chronos-backups',
    jsonBucket: 'chronos-json',
    contentBucket: 'chronos-content',
  }],
  
  // Local storage configuration - disabled when using S3
  // localStorage: {
  //   enabled: true,
  //   basePath: './local-storage',
  // },`;

    // Replace the configuration
    configContent = configContent.replace(localStorageConfig, spacesConfig);
    
    // Write the updated configuration
    fs.writeFileSync(databaseConfigPath, configContent);
    
    console.log('✅ Successfully switched to DigitalOcean Spaces configuration!');
    console.log('\n📋 Next steps:');
    console.log('   1. Create the following buckets in your DigitalOcean Spaces dashboard:');
    console.log('      - chronos-backups');
    console.log('      - chronos-json');
    console.log('      - chronos-content');
    console.log('   2. Ensure your credentials have proper permissions');
    console.log('   3. Run: npx ts-node tests/createRows.ts');
    
  } catch (error) {
    console.error('❌ Error switching to Spaces:', error);
  }
}

// Run the switch
if (require.main === module) {
  switchToSpaces().catch(console.error);
}

export { switchToSpaces };
