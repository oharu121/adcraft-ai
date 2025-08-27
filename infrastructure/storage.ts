import * as gcp from '@pulumi/gcp';
import * as pulumi from '@pulumi/pulumi';

export function createStorageResources(region: string) {
  // Cloud Storage bucket for temporary files with lifecycle policy
  const bucket = new gcp.storage.Bucket('adcraft-storage', {
    name: `adcraft-storage-${pulumi.getStack()}`,
    location: region,
    storageClass: 'STANDARD',
    uniformBucketLevelAccess: true,
    
    // Enable versioning for safety
    versioning: {
      enabled: true,
    },
    
    // CORS configuration for web uploads
    cors: [{
      origins: ['*'],
      methods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE'],
      responseHeaders: ['*'],
      maxAgeSeconds: 3600,
    }],
    
    // Lifecycle policy: delete files after 12 hours
    lifecycleRules: [{
      condition: {
        age: 1, // 1 day (minimum)
        createdBefore: '2024-01-01', // Will be updated dynamically
      },
      action: {
        type: 'Delete',
      },
    }],
  });

  // Bucket IAM: Allow public read access to generated videos
  const bucketIAMPolicy = new gcp.storage.BucketIAMPolicy('adcraft-bucket-policy', {
    bucket: bucket.name,
    policyData: pulumi.interpolate`{
      "bindings": [
        {
          "role": "roles/storage.objectViewer",
          "members": ["allUsers"]
        }
      ]
    }`,
  });

  return {
    bucket,
    bucketIAMPolicy,
  };
}