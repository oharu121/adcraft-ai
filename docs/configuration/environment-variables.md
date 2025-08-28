# Environment Variables and Configuration Management

## Overview

AdCraft AI uses a comprehensive configuration system that supports multiple environments (development, staging, production) with secure handling of secrets and environment-specific settings. Configuration is managed through environment variables, configuration files, and runtime updates.

## Configuration Sources (Priority Order)

1. **Runtime Configuration** (highest priority)
   - Admin dashboard updates
   - API configuration endpoints
   - Dynamic configuration changes

2. **Environment Variables**
   - Docker container environment
   - Cloud Run environment variables
   - Local development `.env` files

3. **Configuration Files** (lowest priority)
   - Default configuration in code
   - Development configuration overrides

## Environment Variables Reference

### Core Application Configuration

| Variable | Type | Default | Description | Required |
|----------|------|---------|-------------|----------|
| `NODE_ENV` | string | `development` | Application environment mode | ✅ |
| `PORT` | number | `3000` | HTTP server port | ✅ |
| `HOST` | string | `0.0.0.0` | HTTP server host | ❌ |
| `LOG_LEVEL` | string | `info` | Logging level (debug, info, warn, error, critical) | ❌ |

### Google Cloud Platform Configuration

| Variable | Type | Default | Description | Required |
|----------|------|---------|-------------|----------|
| `GOOGLE_CLOUD_PROJECT` | string | - | GCP project ID | ✅ |
| `GOOGLE_APPLICATION_CREDENTIALS` | string | - | Path to service account JSON key | ✅ |
| `GCP_REGION` | string | `asia-northeast1` | Default GCP region | ❌ |
| `GCP_ZONE` | string | `asia-northeast1-a` | Default GCP zone | ❌ |

### Service Configuration

| Variable | Type | Default | Description | Required |
|----------|------|---------|-------------|----------|
| `VERTEX_AI_REGION` | string | `asia-northeast1` | Vertex AI service region | ❌ |
| `VERTEX_AI_MODEL` | string | `gemini-1.5-pro` | Default Gemini model | ❌ |
| `VEO_REGION` | string | `us-central1` | Veo API service region | ❌ |
| `STORAGE_BUCKET_UPLOADS` | string | `adcraft-uploads-{env}` | Cloud Storage uploads bucket | ❌ |
| `STORAGE_BUCKET_VIDEOS` | string | `adcraft-videos-{env}` | Cloud Storage videos bucket | ❌ |
| `STORAGE_BUCKET_TEMP` | string | `adcraft-temp-{env}` | Cloud Storage temporary files bucket | ❌ |
| `FIRESTORE_DATABASE` | string | `(default)` | Firestore database ID | ❌ |

### Budget and Cost Management

| Variable | Type | Default | Description | Required |
|----------|------|---------|-------------|----------|
| `BUDGET_LIMIT` | number | `300` | Total budget limit in USD | ✅ |
| `BUDGET_ALERT_50` | number | `150` | 50% budget alert threshold | ❌ |
| `BUDGET_ALERT_75` | number | `225` | 75% budget alert threshold | ❌ |
| `BUDGET_ALERT_90` | number | `270` | 90% budget alert threshold | ❌ |
| `DAILY_BUDGET_LIMIT` | number | `20` | Daily spending limit in USD | ❌ |
| `PER_VIDEO_COST_LIMIT` | number | `3.00` | Maximum cost per video generation | ❌ |
| `COST_TRACKING_ENABLED` | boolean | `true` | Enable real-time cost tracking | ❌ |

### Rate Limiting Configuration

| Variable | Type | Default | Description | Required |
|----------|------|---------|-------------|----------|
| `RATE_LIMIT_ENABLED` | boolean | `true` | Enable rate limiting | ❌ |
| `RATE_LIMIT_MEMORY_SIZE` | number | `10000` | In-memory rate limit cache size | ❌ |
| `VIDEO_GENERATION_RATE_LIMIT` | string | `1/hour,3/day` | Video generation rate limits | ❌ |
| `CHAT_RATE_LIMIT` | string | `60/hour,300/day` | Chat refinement rate limits | ❌ |
| `STATUS_RATE_LIMIT` | string | `600/hour,5000/day` | Status check rate limits | ❌ |
| `ADMIN_RATE_LIMIT` | string | `100/hour,1000/day` | Admin endpoint rate limits | ❌ |

### Security Configuration

| Variable | Type | Default | Description | Required |
|----------|------|---------|-------------|----------|
| `ADMIN_API_KEY` | string | - | Admin dashboard API key | ✅ |
| `SECURITY_MONITORING_ENABLED` | boolean | `true` | Enable security event monitoring | ❌ |
| `AUTO_BLOCK_SUSPICIOUS_IPS` | boolean | `true` | Automatically block suspicious IP addresses | ❌ |
| `IP_BLOCK_DURATION` | number | `3600` | IP block duration in seconds (1 hour) | ❌ |
| `FAILED_REQUEST_THRESHOLD` | number | `10` | Failed requests before IP blocking | ❌ |
| `SECURITY_ALERT_ENABLED` | boolean | `true` | Enable security alerts | ❌ |

### Monitoring and Observability

| Variable | Type | Default | Description | Required |
|----------|------|---------|-------------|----------|
| `MONITORING_ENABLED` | boolean | `true` | Enable system monitoring | ❌ |
| `HEALTH_CHECK_INTERVAL` | number | `30000` | Health check interval in milliseconds | ❌ |
| `ALERT_CHECK_INTERVAL` | number | `60000` | Alert evaluation interval in milliseconds | ❌ |
| `METRICS_RETENTION_DAYS` | number | `30` | Days to retain metrics data | ❌ |
| `LOG_RETENTION_DAYS` | number | `90` | Days to retain log data | ❌ |
| `CORRELATION_ID_ENABLED` | boolean | `true` | Enable correlation ID tracking | ❌ |

### Internationalization

| Variable | Type | Default | Description | Required |
|----------|------|---------|-------------|----------|
| `DEFAULT_LOCALE` | string | `en` | Default application locale | ❌ |
| `SUPPORTED_LOCALES` | string | `en,ja` | Comma-separated list of supported locales | ❌ |
| `FALLBACK_LOCALE` | string | `en` | Fallback locale for missing translations | ❌ |

### Feature Flags

| Variable | Type | Default | Description | Required |
|----------|------|---------|-------------|----------|
| `MOCK_MODE_ENABLED` | boolean | `false` | Enable mock mode for development | ❌ |
| `VEO_MOCK_ENABLED` | boolean | `false` | Use mock Veo responses | ❌ |
| `GEMINI_MOCK_ENABLED` | boolean | `false` | Use mock Gemini responses | ❌ |
| `COST_TRACKING_MOCK` | boolean | `false` | Use mock cost tracking | ❌ |
| `ADMIN_DASHBOARD_ENABLED` | boolean | `true` | Enable admin dashboard | ❌ |

### Performance Configuration

| Variable | Type | Default | Description | Required |
|----------|------|---------|-------------|----------|
| `MAX_CONCURRENT_GENERATIONS` | number | `5` | Maximum concurrent video generations | ❌ |
| `REQUEST_TIMEOUT` | number | `120000` | Request timeout in milliseconds | ❌ |
| `UPLOAD_MAX_SIZE` | number | `10485760` | Maximum upload size in bytes (10MB) | ❌ |
| `VIDEO_GENERATION_TIMEOUT` | number | `600000` | Video generation timeout (10 minutes) | ❌ |
| `CACHE_TTL` | number | `3600` | Cache TTL in seconds (1 hour) | ❌ |

## Environment-Specific Configuration

### Development Environment

```bash
# .env.development
NODE_ENV=development
LOG_LEVEL=debug
GOOGLE_CLOUD_PROJECT=adcraft-dev-2025
BUDGET_LIMIT=50
RATE_LIMIT_ENABLED=false
MOCK_MODE_ENABLED=true
VEO_MOCK_ENABLED=true
SECURITY_MONITORING_ENABLED=false
ADMIN_API_KEY=dev-admin-key-not-secure
```

### Staging Environment

```bash
# .env.staging
NODE_ENV=staging
LOG_LEVEL=info
GOOGLE_CLOUD_PROJECT=adcraft-staging-2025
BUDGET_LIMIT=100
RATE_LIMIT_ENABLED=true
MOCK_MODE_ENABLED=false
VEO_MOCK_ENABLED=false
SECURITY_MONITORING_ENABLED=true
MONITORING_ENABLED=true
```

### Production Environment

```bash
# .env.production (stored in Cloud Run environment)
NODE_ENV=production
LOG_LEVEL=info
GOOGLE_CLOUD_PROJECT=adcraft-prod-2025
BUDGET_LIMIT=300
RATE_LIMIT_ENABLED=true
MOCK_MODE_ENABLED=false
SECURITY_MONITORING_ENABLED=true
MONITORING_ENABLED=true
AUTO_BLOCK_SUSPICIOUS_IPS=true
HEALTH_CHECK_INTERVAL=30000
```

## Secrets Management

### Google Cloud Secret Manager Integration

For production deployments, sensitive configuration is stored in Google Cloud Secret Manager:

```bash
# Create secrets
echo "your-secure-admin-key" | gcloud secrets create admin-api-key --data-file=-
echo "production-database-url" | gcloud secrets create database-url --data-file=-

# Mount secrets in Cloud Run
gcloud run services update adcraft-service \
  --update-secrets=ADMIN_API_KEY=admin-api-key:latest \
  --update-secrets=DATABASE_URL=database-url:latest \
  --region=asia-northeast1
```

### Secret Variables (Never in Environment Files)

| Secret | Description | Storage |
|--------|-------------|---------|
| `ADMIN_API_KEY` | Admin dashboard authentication key | Google Secret Manager |
| `SERVICE_ACCOUNT_KEY` | GCP service account private key | Kubernetes Secret / Cloud Run |
| `WEBHOOK_SECRET` | Webhook validation secret | Google Secret Manager |
| `ENCRYPTION_KEY` | Data encryption key | Google Secret Manager |

## Configuration Validation

The application validates configuration on startup:

### Required Configuration Check

```typescript
interface RequiredConfig {
  NODE_ENV: string;
  GOOGLE_CLOUD_PROJECT: string;
  BUDGET_LIMIT: number;
  ADMIN_API_KEY: string;
}

function validateConfig(): RequiredConfig {
  const config = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    GOOGLE_CLOUD_PROJECT: process.env.GOOGLE_CLOUD_PROJECT,
    BUDGET_LIMIT: Number(process.env.BUDGET_LIMIT || 300),
    ADMIN_API_KEY: process.env.ADMIN_API_KEY
  };

  // Validate required fields
  if (!config.GOOGLE_CLOUD_PROJECT) {
    throw new Error('GOOGLE_CLOUD_PROJECT is required');
  }

  if (!config.ADMIN_API_KEY && config.NODE_ENV === 'production') {
    throw new Error('ADMIN_API_KEY is required in production');
  }

  return config as RequiredConfig;
}
```

### Configuration Schema

```typescript
const ConfigSchema = z.object({
  // Core configuration
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  PORT: z.coerce.number().int().min(1000).max(65535).default(3000),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'critical']).default('info'),

  // GCP configuration
  GOOGLE_CLOUD_PROJECT: z.string().min(1),
  GCP_REGION: z.string().default('asia-northeast1'),

  // Budget configuration
  BUDGET_LIMIT: z.coerce.number().positive().default(300),
  BUDGET_ALERT_50: z.coerce.number().positive().optional(),
  BUDGET_ALERT_75: z.coerce.number().positive().optional(),
  BUDGET_ALERT_90: z.coerce.number().positive().optional(),

  // Feature flags
  RATE_LIMIT_ENABLED: z.coerce.boolean().default(true),
  MONITORING_ENABLED: z.coerce.boolean().default(true),
  SECURITY_MONITORING_ENABLED: z.coerce.boolean().default(true),

  // Performance
  MAX_CONCURRENT_GENERATIONS: z.coerce.number().int().positive().default(5),
  REQUEST_TIMEOUT: z.coerce.number().int().positive().default(120000),
});

type Config = z.infer<typeof ConfigSchema>;
```

## Runtime Configuration Updates

### Admin Dashboard Configuration

The admin dashboard provides real-time configuration updates:

```typescript
// Update monitoring configuration
POST /api/admin/monitoring
{
  "action": "update_config",
  "config": {
    "healthCheckInterval": 60000,
    "alertCheckInterval": 120000,
    "enabled": true
  }
}

// Update rate limiting configuration
POST /api/admin/security
{
  "action": "update_rate_limits",
  "config": {
    "videoGenerationLimit": "2/hour,5/day",
    "chatLimit": "100/hour,500/day"
  }
}
```

### Configuration Service

```typescript
class ConfigurationService {
  private static instance: ConfigurationService;
  private config: Config;

  static getInstance(): ConfigurationService {
    if (!ConfigurationService.instance) {
      ConfigurationService.instance = new ConfigurationService();
    }
    return ConfigurationService.instance;
  }

  public updateConfig(updates: Partial<Config>): void {
    this.config = { ...this.config, ...updates };
    this.validateConfig();
    this.notifyConfigChange(updates);
  }

  public getConfig(): Config {
    return { ...this.config };
  }

  private validateConfig(): void {
    const result = ConfigSchema.safeParse(this.config);
    if (!result.success) {
      throw new Error(`Invalid configuration: ${result.error.message}`);
    }
  }

  private notifyConfigChange(updates: Partial<Config>): void {
    // Notify services of configuration changes
    // Services can reactively update their behavior
  }
}
```

## Docker Configuration

### Dockerfile Environment Setup

```dockerfile
# Use Node.js 18 alpine as base
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Set permissions
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3000

# Environment variables with defaults
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start application
CMD ["npm", "start"]
```

### Docker Compose Development Setup

```yaml
# docker-compose.yml
version: '3.8'

services:
  adcraft-ai:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - LOG_LEVEL=debug
      - GOOGLE_CLOUD_PROJECT=adcraft-dev-2025
      - BUDGET_LIMIT=50
      - RATE_LIMIT_ENABLED=false
      - MOCK_MODE_ENABLED=true
    env_file:
      - .env.development
    volumes:
      - ./keys:/app/keys:ro
    depends_on:
      - redis
    
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

volumes:
  redis_data:
```

## Cloud Run Configuration

### Environment Variable Configuration

```bash
# Set environment variables for Cloud Run service
gcloud run services update adcraft-service \
  --region=asia-northeast1 \
  --set-env-vars="NODE_ENV=production" \
  --set-env-vars="LOG_LEVEL=info" \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=adcraft-prod-2025" \
  --set-env-vars="BUDGET_LIMIT=300" \
  --set-env-vars="RATE_LIMIT_ENABLED=true" \
  --set-env-vars="MONITORING_ENABLED=true" \
  --set-env-vars="SECURITY_MONITORING_ENABLED=true"
```

### Secret Environment Variables

```bash
# Mount secrets as environment variables
gcloud run services update adcraft-service \
  --region=asia-northeast1 \
  --update-secrets=ADMIN_API_KEY=admin-api-key:latest \
  --update-secrets=WEBHOOK_SECRET=webhook-secret:latest
```

### Cloud Run Service Configuration YAML

```yaml
# service.yaml for Cloud Run deployment
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: adcraft-service
  annotations:
    run.googleapis.com/ingress: all
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/maxScale: '10'
        autoscaling.knative.dev/minScale: '0'
        run.googleapis.com/cpu-throttling: 'false'
    spec:
      containerConcurrency: 100
      timeoutSeconds: 300
      containers:
      - image: gcr.io/adcraft-prod-2025/adcraft-ai:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: production
        - name: PORT
          value: "3000"
        - name: GOOGLE_CLOUD_PROJECT
          value: adcraft-prod-2025
        - name: BUDGET_LIMIT
          value: "300"
        - name: ADMIN_API_KEY
          valueFrom:
            secretKeyRef:
              name: admin-api-key
              key: latest
        resources:
          limits:
            cpu: "2"
            memory: "2Gi"
          requests:
            cpu: "1"
            memory: "1Gi"
```

## Configuration Best Practices

### 1. Environment Separation

- **Development**: Permissive settings, debug logging, mock services
- **Staging**: Production-like settings, realistic data, performance testing
- **Production**: Strict security, minimal logging, real services

### 2. Secret Management

- Never commit secrets to version control
- Use Google Secret Manager for production secrets
- Rotate secrets regularly (quarterly minimum)
- Use different secrets for each environment

### 3. Configuration Validation

- Validate configuration on application startup
- Provide meaningful error messages for invalid configuration
- Use schema validation (Zod) for type safety
- Document all configuration options

### 4. Monitoring Configuration Changes

```typescript
// Log configuration changes
logger.info('Configuration updated', {
  correlationId: generateCorrelationId(),
  updatedFields: Object.keys(updates),
  environment: process.env.NODE_ENV,
  timestamp: new Date().toISOString()
});

// Alert on critical configuration changes
if (updates.BUDGET_LIMIT || updates.RATE_LIMIT_ENABLED) {
  alertingService.triggerAlert({
    title: 'Critical Configuration Change',
    message: `Configuration updated: ${Object.keys(updates).join(', ')}`,
    severity: 'medium'
  });
}
```

### 5. Configuration Backup and Recovery

```bash
# Backup current Cloud Run configuration
gcloud run services describe adcraft-service \
  --region=asia-northeast1 \
  --format=export > service-backup-$(date +%Y%m%d).yaml

# Restore configuration from backup
gcloud run services replace service-backup-20250828.yaml \
  --region=asia-northeast1
```

## Troubleshooting Configuration Issues

### Common Configuration Problems

1. **Missing Required Environment Variables**
   ```bash
   # Check current environment
   env | grep -E "(NODE_ENV|GOOGLE_CLOUD_PROJECT|ADMIN_API_KEY)"
   
   # Verify Cloud Run environment
   gcloud run services describe adcraft-service --region=asia-northeast1 \
     --format="value(spec.template.spec.template.spec.containers[0].env[].name)"
   ```

2. **Invalid Configuration Values**
   ```bash
   # Test configuration validation
   node -e "require('./lib/utils/config').validateConfig()"
   ```

3. **Secret Access Issues**
   ```bash
   # Test secret access
   gcloud secrets access latest --secret=admin-api-key
   
   # Check service account permissions
   gcloud projects get-iam-policy $GOOGLE_CLOUD_PROJECT \
     --flatten="bindings[].members" \
     --filter="bindings.members:serviceAccount:*adcraft*"
   ```

### Configuration Debugging

```typescript
// Debug configuration in development
if (process.env.NODE_ENV === 'development') {
  console.log('Configuration Debug:', {
    nodeEnv: process.env.NODE_ENV,
    project: process.env.GOOGLE_CLOUD_PROJECT,
    budgetLimit: process.env.BUDGET_LIMIT,
    rateLimitEnabled: process.env.RATE_LIMIT_ENABLED,
    mockMode: process.env.MOCK_MODE_ENABLED,
    // Never log secrets!
    adminKeyPresent: !!process.env.ADMIN_API_KEY
  });
}
```

This configuration system provides comprehensive, secure, and maintainable environment management for AdCraft AI across all deployment environments.