// Automated setup script for DELTA
import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Function to check if a file exists
const fileExists = (path) => {
  try {
    fs.accessSync(path, fs.constants.F_OK);
    return true;
  } catch (err) {
    return false;
  }
};

// Function to create directory if it doesn't exist
const ensureDirectoryExists = (dirPath) => {
  if (!fileExists(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
};

// Function to get public IP address
const getPublicIP = async () => {
  return new Promise((resolve, reject) => {
    https.get('https://api.ipify.org', (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve(data.trim());
      });
    }).on('error', (err) => {
      console.error('Error getting public IP:', err.message);
      reject(err);
    });
  });
};

// Main setup function
const setup = async () => {
  console.log('===== DELTA Automated Setup =====');
  
  // Setup required directories
  ensureDirectoryExists(join(__dirname, 'certs'));
  ensureDirectoryExists(join(__dirname, 'bot_logs'));
  ensureDirectoryExists(join(__dirname, 'bot_workspace'));
  
  // Check if .env file exists, if not, create from template
  const envPath = join(__dirname, '.env');
  if (!fileExists(envPath)) {
    const templatePath = join(__dirname, '.env.template');
    if (fileExists(templatePath)) {
      console.log('No .env file found. Creating from template...');
      fs.copyFileSync(templatePath, envPath);
      console.log('Created .env file from template.');
    } else {
      console.error('Error: No .env template found.');
      process.exit(1);
    }
  }
  
  // Load environment variables
  dotenv.config({ path: envPath });
  
  // Check for required environment variables
  const requiredEnvVars = [
    'DATABASE_URL',
    'DISCORD_CLIENT_ID',
    'DISCORD_CLIENT_SECRET',
    'SESSION_SECRET'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    console.error('Error: The following required environment variables are missing:');
    missingVars.forEach(varName => console.error(`- ${varName}`));
    console.error('Please update your .env file and run this setup again.');
    process.exit(1);
  }
  
  // Setup HTTPS if enabled
  if (process.env.ENABLE_HTTPS === 'true' || process.env.NODE_ENV === 'production') {
    // Get public IP
    console.log('Setting up HTTPS with public IP...');
    let publicIP;
    try {
      publicIP = await getPublicIP();
      console.log(`Detected public IP: ${publicIP}`);
    } catch (error) {
      console.error('Could not detect public IP automatically.');
      console.error('Please manually set your APP_URL in the .env file.');
      publicIP = 'localhost';
    }
    
    // Get port
    const PORT = process.env.PORT || 5000;
    
    // Update APP_URL in .env
    const APP_URL = `https://${publicIP}:${PORT}`;
    const envContent = fs.readFileSync(envPath, 'utf8');
    const updatedEnvContent = envContent
      .replace(/APP_URL=.*/, `APP_URL=${APP_URL}`)
      .replace(/ENABLE_HTTPS=.*/, 'ENABLE_HTTPS=true');
    
    fs.writeFileSync(envPath, updatedEnvContent);
    console.log(`Updated APP_URL to ${APP_URL}`);
    
    // Generate SSL certificates if they don't exist
    const certPath = join(__dirname, 'certs', 'certificate.pem');
    const keyPath = join(__dirname, 'certs', 'private-key.pem');
    
    if (!fileExists(certPath) || !fileExists(keyPath)) {
      console.log('Generating SSL certificates...');
      try {
        execSync('bash ./generate-ssl-certs.sh', { stdio: 'inherit' });
        console.log('SSL certificates generated successfully.');
      } catch (error) {
        console.error('Error generating SSL certificates:', error.message);
        console.error('Continuing without HTTPS...');
      }
    }
    
    console.log('\nIMPORTANT: You need to update your Discord application settings:');
    console.log('1. Go to https://discord.com/developers/applications');
    console.log('2. Select your application');
    console.log('3. Go to the OAuth2 tab');
    console.log(`4. Add the following redirect URL: ${APP_URL}/api/auth/callback`);
    console.log('5. Save changes');
  }
  
  // Install dependencies
  console.log('\nInstalling dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('Dependencies installed successfully.');
  } catch (error) {
    console.error('Error installing dependencies:', error.message);
    process.exit(1);
  }
  
  // Build the application
  console.log('\nBuilding application...');
  try {
    // Install vite globally if needed
    console.log('Installing build dependencies...');
    execSync('npm install -g vite', { stdio: 'inherit' });
    
    // Run the build
    execSync('npm run build', { stdio: 'inherit' });
    console.log('Application built successfully.');
  } catch (error) {
    console.error('Error building application:', error.message);
    process.exit(1);
  }
  
  // Initialize database
  console.log('\nInitializing database...');
  try {
    execSync('npm run db:push', { stdio: 'inherit' });
    console.log('Database initialized successfully.');
  } catch (error) {
    console.error('Error initializing database:', error.message);
    console.error('Please check your DATABASE_URL in .env file.');
    process.exit(1);
  }
  
  console.log('\n===== Setup Complete =====');
  console.log('You can now start the application with: npm start');
};

// Run setup with immediate console output
console.log('Starting DELTA setup process...');
setup().catch(error => {
  console.error('Setup failed:', error);
  process.exit(1);
});