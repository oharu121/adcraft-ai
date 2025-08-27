import * as gcp from '@pulumi/gcp';
import * as pulumi from '@pulumi/pulumi';

export function createMonitoringResources(projectId: string) {
  // Pub/Sub topic for budget alerts
  const budgetAlert = new gcp.pubsub.Topic('adcraft-budget-alerts', {
    name: 'adcraft-budget-alerts',
  });

  // Billing budget with alerts at 50%, 75%, 90%
  const budget = new gcp.billing.Budget('adcraft-budget', {
    billingAccount: pulumi.interpolate`${gcp.config.billingProject}`,
    displayName: 'AdCraft AI Budget',
    
    budgetFilter: {
      projects: [pulumi.interpolate`projects/${projectId}`],
      services: [
        'services/aiplatform.googleapis.com', // Vertex AI
        'services/run.googleapis.com',         // Cloud Run
        'services/storage-api.googleapis.com', // Cloud Storage
        'services/firestore.googleapis.com',   // Firestore
      ],
    },
    
    amount: {
      specifiedAmount: {
        currencyCode: 'USD',
        units: '300', // $300 budget
      },
    },
    
    thresholdRules: [
      {
        thresholdPercent: 0.5, // 50%
        spendBasis: 'CURRENT_SPEND',
      },
      {
        thresholdPercent: 0.75, // 75%
        spendBasis: 'CURRENT_SPEND',
      },
      {
        thresholdPercent: 0.9, // 90%
        spendBasis: 'CURRENT_SPEND',
      },
    ],
    
    allUpdatesRule: {
      pubsubTopic: budgetAlert.id,
    },
  });

  // Log sink for application logs
  const logSink = new gcp.logging.ProjectSink('adcraft-logs', {
    name: 'adcraft-application-logs',
    destination: pulumi.interpolate`storage.googleapis.com/adcraft-logs-${pulumi.getStack()}`,
    filter: 'resource.type="cloud_run_revision" AND resource.labels.service_name="adcraft-service"',
    uniqueWriterIdentity: true,
  });

  // Monitoring dashboard for key metrics
  const dashboard = new gcp.monitoring.Dashboard('adcraft-dashboard', {
    dashboardJson: JSON.stringify({
      displayName: 'AdCraft AI Monitoring',
      mosaicLayout: {
        tiles: [
          {
            width: 6,
            height: 4,
            widget: {
              title: 'Cloud Run Request Count',
              xyChart: {
                dataSets: [{
                  timeSeriesQuery: {
                    timeSeriesFilter: {
                      filter: 'metric.type="run.googleapis.com/request_count" AND resource.type="cloud_run_revision"',
                      aggregation: {
                        alignmentPeriod: '60s',
                        perSeriesAligner: 'ALIGN_RATE',
                        crossSeriesReducer: 'REDUCE_SUM',
                      },
                    },
                  },
                }],
                timeshiftDuration: '0s',
                yAxis: {
                  label: 'Requests/sec',
                  scale: 'LINEAR',
                },
              },
            },
          },
          {
            width: 6,
            height: 4,
            xPos: 6,
            widget: {
              title: 'Cloud Run Response Latency',
              xyChart: {
                dataSets: [{
                  timeSeriesQuery: {
                    timeSeriesFilter: {
                      filter: 'metric.type="run.googleapis.com/request_latencies" AND resource.type="cloud_run_revision"',
                      aggregation: {
                        alignmentPeriod: '60s',
                        perSeriesAligner: 'ALIGN_MEAN',
                        crossSeriesReducer: 'REDUCE_MEAN',
                      },
                    },
                  },
                }],
                yAxis: {
                  label: 'Latency (ms)',
                  scale: 'LINEAR',
                },
              },
            },
          },
        ],
      },
    }),
  });

  return {
    budgetAlert,
    budget,
    logSink,
    dashboard,
  };
}