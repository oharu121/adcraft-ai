import * as gcp from '@pulumi/gcp';
import * as pulumi from '@pulumi/pulumi';

export function createIAMResources() {
  // Service account for the application
  const serviceAccount = new gcp.serviceaccount.Account('adcraft-service-account', {
    accountId: 'adcraft-service-account',
    displayName: 'AdCraft AI Service Account',
    description: 'Service account for AdCraft AI minimal video generator',
  });

  // Service account key for authentication
  const serviceAccountKey = new gcp.serviceaccount.Key('adcraft-service-key', {
    serviceAccountId: serviceAccount.name,
    publicKeyType: 'TYPE_X509_PEM_FILE',
    privateKeyType: 'TYPE_GOOGLE_CREDENTIALS_FILE',
  });

  // Required IAM roles for the service account
  const roles = [
    // Vertex AI access for Gemini and Veo APIs
    'roles/aiplatform.user',
    'roles/aiplatform.serviceAgent',
    
    // Cloud Storage access for file upload/download
    'roles/storage.admin',
    
    // Firestore access for database operations
    'roles/datastore.user',
    'roles/datastore.owner',
    
    // Cloud Run access for service deployment
    'roles/run.invoker',
    'roles/run.developer',
    
    // Monitoring and logging
    'roles/monitoring.editor',
    'roles/logging.logWriter',
    
    // Cloud Functions (if needed for processing)
    'roles/cloudfunctions.invoker',
  ];

  // Bind roles to service account
  const roleBindings = roles.map((role, index) => 
    new gcp.projects.IAMMember(`adcraft-iam-${index}`, {
      project: pulumi.interpolate`${gcp.config.project}`,
      role: role,
      member: pulumi.interpolate`serviceAccount:${serviceAccount.email}`,
    })
  );

  return {
    serviceAccount,
    serviceAccountKey,
    roleBindings,
  };
}