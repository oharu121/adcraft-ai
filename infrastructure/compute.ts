import * as gcp from '@pulumi/gcp';
import * as pulumi from '@pulumi/pulumi';

export function createComputeResources(
  projectId: string,
  region: string,
  serviceAccount: gcp.serviceaccount.Account,
  bucketName: pulumi.Output<string>,
  databaseName: pulumi.Output<string>
) {
  // Artifact Registry repository for container images
  const repository = new gcp.artifactregistry.Repository('adcraft-repo', {
    repositoryId: 'adcraft-ai',
    location: region,
    format: 'DOCKER',
    description: 'AdCraft AI container repository',
  });

  // Use pre-built image (will be built manually or via Cloud Build)
  const imageName = pulumi.interpolate`${region}-docker.pkg.dev/${projectId}/adcraft-ai/adcraft-ai:latest`;

  // Cloud Run service for the Next.js application
  const service = new gcp.cloudrun.Service('adcraft-service', {
    name: 'adcraft-service',
    location: region,
    
    template: {
      metadata: {
        annotations: {
          'autoscaling.knative.dev/maxScale': '10',
          'autoscaling.knative.dev/minScale': '0',
          'run.googleapis.com/client-name': 'pulumi',
        },
      },
      
      spec: {
        serviceAccountName: serviceAccount.email,
        containerConcurrency: 1000,
        timeoutSeconds: 300, // 5 minutes
        
        containers: [{
          image: imageName,
          
          resources: {
            limits: {
              cpu: '2000m',    // 2 vCPU
              memory: '2Gi',   // 2GB RAM
            },
            requests: {
              cpu: '1000m',    // 1 vCPU
              memory: '512Mi', // 512MB RAM
            },
          },
          
          envs: [
            {
              name: 'APP_MODE',
              value: 'real',
            },
            {
              name: 'GCP_PROJECT_ID',
              value: projectId,
            },
            {
              name: 'GCP_REGION',
              value: region,
            },
            {
              name: 'STORAGE_BUCKET_NAME',
              value: bucketName,
            },
            {
              name: 'FIRESTORE_DATABASE_NAME',
              value: databaseName,
            },
            {
              name: 'NODE_ENV',
              value: 'production',
            },
          ],
          
          ports: [{
            name: 'http1',
            containerPort: 3000,
            protocol: 'TCP',
          }],
        }],
      },
    },
    
    traffics: [{
      percent: 100,
      latestRevision: true,
    }],
    
    metadata: {
      annotations: {
        'run.googleapis.com/ingress': 'all',
        'run.googleapis.com/ingress-status': 'all',
      },
    },
  });

  // IAM policy to allow public access to the Cloud Run service
  const serviceIAMPolicy = new gcp.cloudrun.IamPolicy('adcraft-service-policy', {
    service: service.name,
    location: region,
    policyData: JSON.stringify({
      bindings: [{
        role: 'roles/run.invoker',
        members: ['allUsers'],
      }],
    }),
  });

  return {
    repository,
    imageName,
    service,
    serviceIAMPolicy,
  };
}