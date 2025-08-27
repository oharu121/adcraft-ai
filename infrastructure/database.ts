import * as gcp from '@pulumi/gcp';
import * as pulumi from '@pulumi/pulumi';

export function createDatabaseResources(projectId: string, region: string) {
  // Firestore database for storing session data and job status
  const database = new gcp.firestore.Database('adcraft-firestore', {
    name: '(default)',
    project: projectId,
    locationId: region,
    type: 'FIRESTORE_NATIVE',
    
    // Allow deletion for development/testing
    deleteProtectionState: 'DELETE_PROTECTION_DISABLED',
    deletionPolicy: 'DELETE',
  });

  // Create indexes for common queries
  const sessionIndex = new gcp.firestore.Index('session-index', {
    project: projectId,
    database: database.name,
    collection: 'sessions',
    
    fields: [
      {
        fieldPath: 'userId',
        order: 'ASCENDING',
      },
      {
        fieldPath: 'createdAt',
        order: 'DESCENDING',
      },
    ],
  });

  const jobIndex = new gcp.firestore.Index('job-index', {
    project: projectId,
    database: database.name,
    collection: 'videoJobs',
    
    fields: [
      {
        fieldPath: 'status',
        order: 'ASCENDING',
      },
      {
        fieldPath: 'createdAt',
        order: 'DESCENDING',
      },
    ],
  });

  return {
    database,
    sessionIndex,
    jobIndex,
  };
}