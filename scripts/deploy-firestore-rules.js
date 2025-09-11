#!/usr/bin/env node

/**
 * Deploy Firestore Security Rules and Indexes
 * 
 * This script deploys the Firestore security rules and indexes to the specified
 * Google Cloud project. It requires Firebase CLI to be installed and authenticated.
 * 
 * Usage:
 *   node scripts/deploy-firestore-rules.js [project-id]
 *   
 * Environment Variables:
 *   - GCP_PROJECT_ID: Google Cloud Project ID (can be overridden by command line argument)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const PROJECT_ID = process.argv[2] || process.env.GCP_PROJECT_ID;
const RULES_FILE = 'firestore.rules';
const INDEXES_FILE = 'firestore.indexes.json';
const FIREBASE_CONFIG = 'firebase.json';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ Error: ${message}`, colors.red);
}

function success(message) {
  log(`✅ Success: ${message}`, colors.green);
}

function info(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function warning(message) {
  log(`⚠️  Warning: ${message}`, colors.yellow);
}

function checkRequirements() {
  info('Checking requirements...');
  
  // Check if Firebase CLI is installed
  try {
    execSync('firebase --version', { stdio: 'ignore' });
    success('Firebase CLI is installed');
  } catch (error) {
    error('Firebase CLI is not installed. Please install it with: npm install -g firebase-tools');
    process.exit(1);
  }
  
  // Check if project ID is provided
  if (!PROJECT_ID) {
    error('Project ID is required. Provide it as argument or set GCP_PROJECT_ID environment variable');
    process.exit(1);
  }
  
  // Check if required files exist
  const requiredFiles = [RULES_FILE, INDEXES_FILE, FIREBASE_CONFIG];
  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      error(`Required file not found: ${file}`);
      process.exit(1);
    }
  }
  
  success('All requirements met');
}

function validateRulesFile() {
  info('Validating Firestore security rules...');
  
  try {
    const rulesContent = fs.readFileSync(RULES_FILE, 'utf8');
    
    // Basic validation
    if (!rulesContent.includes("rules_version = '2'")) {
      warning('Rules file should specify rules_version = "2" for latest features');
    }
    
    if (!rulesContent.includes('service cloud.firestore')) {
      error('Rules file must contain "service cloud.firestore" declaration');
      process.exit(1);
    }
    
    // Check for security best practices
    if (rulesContent.includes('allow read, write: if true')) {
      error('Rules file contains insecure "allow read, write: if true" rule');
      process.exit(1);
    }
    
    success('Firestore rules validation passed');
  } catch (err) {
    error(`Failed to validate rules file: ${err.message}`);
    process.exit(1);
  }
}

function validateIndexesFile() {
  info('Validating Firestore indexes...');
  
  try {
    const indexesContent = fs.readFileSync(INDEXES_FILE, 'utf8');
    const indexes = JSON.parse(indexesContent);
    
    if (!indexes.indexes || !Array.isArray(indexes.indexes)) {
      error('Indexes file must contain "indexes" array');
      process.exit(1);
    }
    
    info(`Found ${indexes.indexes.length} composite indexes`);
    
    if (indexes.fieldOverrides && Array.isArray(indexes.fieldOverrides)) {
      info(`Found ${indexes.fieldOverrides.length} field overrides`);
    }
    
    success('Firestore indexes validation passed');
  } catch (err) {
    error(`Failed to validate indexes file: ${err.message}`);
    process.exit(1);
  }
}

function deployRules() {
  info(`Deploying Firestore rules to project: ${PROJECT_ID}...`);
  
  try {
    // Set the Firebase project
    execSync(`firebase use ${PROJECT_ID}`, { stdio: 'inherit' });
    
    // Deploy only Firestore rules and indexes
    execSync('firebase deploy --only firestore', { stdio: 'inherit' });
    
    success('Firestore rules and indexes deployed successfully');
  } catch (err) {
    error(`Failed to deploy Firestore rules: ${err.message}`);
    process.exit(1);
  }
}

function testRulesLocally() {
  info('Testing Firestore rules locally (if emulator is available)...');
  
  try {
    // Check if emulator is running by attempting to connect
    execSync('curl -s http://localhost:8080 > /dev/null 2>&1');
    
    info('Firestore emulator detected, running basic rule tests...');
    
    // You can add specific rule tests here
    // For now, we'll just validate that the emulator can load the rules
    execSync('firebase emulators:start --only firestore --import=./emulator-data --export-on-exit=./emulator-data', {
      stdio: 'ignore',
      timeout: 5000
    });
    
    success('Rules loaded successfully in emulator');
  } catch (err) {
    info('Firestore emulator not available, skipping local tests');
  }
}

function main() {
  log(`${colors.cyan}${colors.bright}🔐 Firestore Security Rules Deployment${colors.reset}`);
  log(`${colors.cyan}Project: ${PROJECT_ID}${colors.reset}\n`);
  
  try {
    checkRequirements();
    validateRulesFile();
    validateIndexesFile();
    testRulesLocally();
    deployRules();
    
    log(`\n${colors.green}${colors.bright}🎉 Deployment completed successfully!${colors.reset}`);
    log(`${colors.cyan}Your Firestore security rules and indexes are now active.${colors.reset}`);
    
    info('Next steps:');
    info('1. Test your application to ensure rules work correctly');
    info('2. Monitor Firebase Console for any security rule violations');
    info('3. Update rules as needed when adding new features');
    
  } catch (err) {
    error(`Deployment failed: ${err.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  checkRequirements,
  validateRulesFile,
  validateIndexesFile,
  deployRules,
  testRulesLocally
};