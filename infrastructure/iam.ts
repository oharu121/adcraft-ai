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

  // Required IAM roles for the service account - Following principle of least privilege
  const roles = [
    // Vertex AI access for Gemini and Veo APIs - minimal permissions
    'roles/aiplatform.user',
    // Note: aiplatform.serviceAgent removed - not needed for application service account
    
    // Cloud Storage access for file upload/download - restricted permissions
    'roles/storage.objectUser', // Changed from storage.admin for least privilege
    
    // Firestore access for database operations - minimal permissions
    'roles/datastore.user', // datastore.owner removed - user role sufficient
    
    // Cloud Run access for service deployment - minimal permissions
    'roles/run.invoker', // run.developer removed - only invoker needed for runtime
    
    // Monitoring and logging - minimal permissions
    'roles/monitoring.metricWriter', // Changed from monitoring.editor for least privilege
    'roles/logging.logWriter',
    
    // Cloud Functions access removed - not currently needed
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