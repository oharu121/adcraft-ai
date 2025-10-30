import * as pulumi from '@pulumi/pulumi';
import * as gcp from '@pulumi/gcp';
import { createIAMResources } from './iam';
import { createStorageResources } from './storage';
import { createDatabaseResources } from './database';
import { createComputeResources } from './compute';
import { createMonitoringResources } from './monitoring';

// Get configuration
const config = new pulumi.Config();
const gcpConfig = new pulumi.Config('gcp');
const projectId = gcpConfig.require('project');
const region = gcpConfig.get('region') || 'asia-northeast1';

// Get secrets from config (encrypted)
const geminiApiKey = config.requireSecret('gemini-api-key');

// Create resources in order
const iam = createIAMResources();
const storage = createStorageResources(region);
const database = createDatabaseResources(projectId, region);
const compute = createComputeResources(
  projectId,
  region,
  iam.serviceAccount,
  storage.bucket.name,
  database.database.name,
  geminiApiKey
);
const monitoring = createMonitoringResources(projectId);

// Export key outputs for application use
export const outputs = {
  // GCP Configuration
  projectId: projectId,
  region: region,
  
  // Service Account
  serviceAccountEmail: iam.serviceAccount.email,
  serviceAccountKey: iam.serviceAccountKey.privateKey,
  
  // Storage
  bucketName: storage.bucket.name,
  bucketUrl: storage.bucket.url,
  
  // Database  
  databaseName: database.database.name,
  databaseLocation: database.database.locationId,
  
  // Compute
  cloudRunUrl: compute.service.statuses[0].url,
  cloudRunServiceName: compute.service.name,
  
  // Monitoring
  budgetAlertTopic: monitoring.budgetAlert.name,
};