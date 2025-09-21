import * as gcp from '@pulumi/gcp';
import * as pulumi from '@pulumi/pulumi';

export function createMonitoringResources(projectId: string) {
  // Pub/Sub topic for budget alerts
  const budgetAlert = new gcp.pubsub.Topic('adcraft-budget-alerts', {
    name: 'adcraft-budget-alerts',
  });

  // Billing budget - temporarily disabled due to authentication issues
  // TODO: Enable billing budget after proper billing account setup
  // const budget = new gcp.billing.Budget('adcraft-budget', {
  //   billingAccount: pulumi.interpolate`${gcp.config.billingProject}`,
  //   displayName: 'AdCraft AI Budget',
  //   // ... budget configuration
  // });

  // Log sink for application logs  
  const logSink = new gcp.logging.ProjectSink('adcraft-logs', {
    name: 'adcraft-application-logs',
    destination: pulumi.interpolate`storage.googleapis.com/adcraft-storage-${pulumi.getStack()}`,
    filter: 'resource.type="cloud_run_revision" AND resource.labels.service_name="adcraft-service"',
    uniqueWriterIdentity: true,
  });

  // Monitoring dashboard for key metrics
  const dashboard = new gcp.monitoring.Dashboard('adcraft-dashboard', {
    dashboardJson: JSON.stringify({
      displayName: 'AdCraft AI Monitoring',
      mosaicLayout: {
        columns: 12,
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
    // budget, // Temporarily disabled
    logSink,
    dashboard,
  };
}