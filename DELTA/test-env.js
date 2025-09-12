// Simple script to test environment variable loading
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);

// Try to load .env file
try {
  // Try multiple paths for .env file
  const envPaths = [
    join(__dirname, '.env'),
    join(process.cwd(), '.env'),
    '.env'
  ];

  let loaded = false;
  for (const envPath of envPaths) {
    try {
      console.log(`Trying to load .env from: ${envPath}`);
      console.log(`File exists: ${fs.existsSync(envPath)}`);
      
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        console.log(`File content (first 100 chars): ${content.substring(0, 100)}...`);
      }
      
      const result = dotenv.config({ path: envPath });
      console.log(`Dotenv config result for ${envPath}:`, result);
      
      if (result.parsed) {
        loaded = true;
        console.log(`Successfully loaded .env from ${envPath}`);
        break;
      }
    } catch (error) {
      console.error(`Error loading .env from ${envPath}:`, error);
    }
  }

  // Print DATABASE_URL
  console.log('\nDATABASE_URL:', process.env.DATABASE_URL);
  
  // Print all environment variables
  console.log('\nAll environment variables related to DATABASE:');
  Object.keys(process.env).forEach(key => {
    if (key.includes('DATABASE')) {
      console.log(`${key}: ${process.env[key]}`);
    }
  });
} catch (error) {
  console.error('Error in script:', error);
}