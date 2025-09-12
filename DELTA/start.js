// Enhanced start script with automated setup and environment checks
import { spawn, execSync } from 'child_process';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import path from 'path';

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
    console.log('Created .env file from template. Please edit it with your configuration.');
    console.log('Exiting. Please configure your .env file and run npm start again.');
    process.exit(0);
  } else {
    console.error('Error: No .env file or template found.');
    process.exit(1);
  }
}

// Load environment variables from .env file
console.log(`Loading environment from: ${envPath}`);
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('Error loading .env file:', result.error);
  process.exit(1);
}

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
  console.error('Please update your .env file and try again.');
  process.exit(1);
}

console.log('Environment variables loaded successfully');

// Check if build exists, if not, build the application
if (!fileExists(join(__dirname, 'dist', 'index.js'))) {
  console.log('Application build not found. Building application...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('Application built successfully.');
  } catch (error) {
    console.error('Error building application:', error.message);
    process.exit(1);
  }
}

// Generate SSL certificates if ENABLE_HTTPS is true and certificates don't exist
if (process.env.ENABLE_HTTPS === 'true') {
  const certPath = join(__dirname, 'certs', 'certificate.pem');
  const keyPath = join(__dirname, 'certs', 'private-key.pem');
  
  if (!fileExists(certPath) || !fileExists(keyPath)) {
    console.log('HTTPS enabled but certificates not found. Generating SSL certificates...');
    try {
      execSync('bash ./generate-ssl-certs.sh', { stdio: 'inherit' });
      console.log('SSL certificates generated successfully.');
    } catch (error) {
      console.error('Error generating SSL certificates:', error.message);
      console.error('Continuing without HTTPS...');
    }
  }
}

// Check if database needs to be initialized
try {
  console.log('Checking database connection...');
  execSync('npm run db:push', { stdio: 'inherit' });
  console.log('Database schema updated successfully.');
} catch (error) {
  console.error('Error updating database schema:', error.message);
  console.error('Please check your DATABASE_URL in .env file.');
  process.exit(1);
}

console.log('Starting application...');

// Start the application with the loaded environment variables
const child = spawn('node', ['dist/index.js'], {
  env: process.env,
  stdio: 'inherit'
});

child.on('close', (code) => {
  console.log(`Application exited with code ${code}`);
  process.exit(code);
});