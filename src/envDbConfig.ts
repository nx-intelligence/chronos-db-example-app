import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Environment-based database configuration
export const envDbConfig = {
  // MongoDB connection URI from environment
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017',
  
  // S3-compatible storage credentials from environment
  spaceAccessKey: process.env.SPACE_ACCESS_KEY || '',
  spaceSecretKey: process.env.SPACE_SECRET_KEY || '',
  
  // Validate that required environment variables are present
  validate(): void {
    const missing: string[] = [];
    
    if (!process.env.MONGO_URI) {
      missing.push('MONGO_URI');
    }
    
    // S3 credentials are optional - will use localStorage if not provided
    if (!process.env.SPACE_ACCESS_KEY) {
      console.warn('⚠️  SPACE_ACCESS_KEY not found - will use localStorage instead of S3');
    }
    
    if (!process.env.SPACE_SECRET_KEY) {
      console.warn('⚠️  SPACE_SECRET_KEY not found - will use localStorage instead of S3');
    }
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }
};

// Validate environment variables on import
envDbConfig.validate();
