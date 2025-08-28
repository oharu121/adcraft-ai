# AdCraft AI Troubleshooting Guide

## Overview

This guide provides comprehensive solutions to common issues encountered when developing, deploying, and running AdCraft AI. Issues are organized by category and include step-by-step solutions, prevention strategies, and debugging techniques.

## Quick Diagnostic Commands

### Health Check Commands
```bash
# Application health check
curl https://your-domain.com/api/health

# Detailed monitoring dashboard (requires admin key)
curl -H "Authorization: Bearer $ADMIN_API_KEY" \
  https://your-domain.com/api/admin/monitoring?section=overview

# Check Cloud Run service status
gcloud run services describe adcraft-service --region=asia-northeast1

# Check application logs
gcloud run services logs read adcraft-service --region=asia-northeast1 --limit=50
```

### Service Status Commands
```bash
# Check all GCP services
gcloud services list --enabled --filter="name:(run.googleapis.com OR aiplatform.googleapis.com OR storage.googleapis.com)"

# Check service account permissions
gcloud projects get-iam-policy $GOOGLE_CLOUD_PROJECT --flatten="bindings[].members" --filter="bindings.members:serviceAccount:*adcraft*"

# Check budget status
gcloud beta billing budgets list --billing-account=$BILLING_ACCOUNT_ID
```

---

## Deployment and Infrastructure Issues

### Issue: Cloud Run Service Won't Start

**Symptoms:**
- Service shows as "Revision failed" in Cloud Console
- HTTP 503 errors when accessing the application
- Container exits immediately after startup

**Diagnostic Steps:**
```bash
# Check Cloud Run logs for startup errors
gcloud run services logs read adcraft-service \
  --region=asia-northeast1 \
  --limit=100

# Check service configuration
gcloud run services describe adcraft-service \
  --region=asia-northeast1 \
  --format="yaml"

# Test container locally
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e GOOGLE_CLOUD_PROJECT=your-project \
  gcr.io/your-project/adcraft-ai:latest
```

**Common Causes and Solutions:**

1. **Missing Environment Variables**
   ```bash
   # Solution: Set required environment variables
   gcloud run services update adcraft-service \
     --region=asia-northeast1 \
     --set-env-vars="NODE_ENV=production,GOOGLE_CLOUD_PROJECT=your-project"
   ```

2. **Service Account Authentication Issues**
   ```bash
   # Solution: Verify service account key is properly mounted
   gcloud run services update adcraft-service \
     --region=asia-northeast1 \
     --service-account=adcraft-app@your-project.iam.gserviceaccount.com
   ```

3. **Port Configuration Issues**
   ```bash
   # Solution: Ensure container listens on PORT environment variable (3000)
   # Check Dockerfile: EXPOSE 3000
   # Check application: app.listen(process.env.PORT || 3000)
   ```

4. **Memory or CPU Limits**
   ```bash
   # Solution: Increase resource limits
   gcloud run services update adcraft-service \
     --region=asia-northeast1 \
     --memory=2Gi \
     --cpu=2
   ```

### Issue: Docker Build Failures

**Symptoms:**
- Docker build command fails
- "Permission denied" errors
- Missing dependencies during build

**Diagnostic Steps:**
```bash
# Check Docker daemon status
docker info

# Check available disk space
df -h

# Build with verbose output
docker build --progress=plain --no-cache -t test-image .
```

**Solutions:**

1. **Docker Authentication Issues**
   ```bash
   # Solution: Re-authenticate with Google Container Registry
   gcloud auth configure-docker
   gcloud auth application-default login
   ```

2. **Disk Space Issues**
   ```bash
   # Solution: Clean up Docker resources
   docker system prune -af
   docker volume prune -f
   ```

3. **Build Context Too Large**
   ```bash
   # Solution: Optimize .dockerignore file
   echo "node_modules
   .git
   .env*
   *.log
   coverage/
   .nyc_output/
   dist/
   build/" >> .dockerignore
   ```

### Issue: Pulumi Deployment Failures

**Symptoms:**
- `pulumi up` command fails
- Resource creation errors
- State file conflicts

**Diagnostic Steps:**
```bash
# Check Pulumi status
pulumi stack ls
pulumi stack select prod
pulumi stack export

# Check GCP quotas
gcloud compute project-info describe --project=$GOOGLE_CLOUD_PROJECT

# Validate configuration
pulumi config
```

**Solutions:**

1. **Authentication Issues**
   ```bash
   # Solution: Refresh authentication
   pulumi logout
   pulumi login
   gcloud auth application-default login
   ```

2. **Resource Quota Exceeded**
   ```bash
   # Solution: Request quota increase or optimize resource usage
   gcloud compute regions describe asia-northeast1
   ```

3. **State File Conflicts**
   ```bash
   # Solution: Refresh state
   pulumi refresh
   
   # If necessary, recover from backup
   pulumi stack import < backup-state.json
   ```

---

## Application Runtime Issues

### Issue: Video Generation Failures

**Symptoms:**
- Video generation jobs stuck in "processing" status
- HTTP 500 errors on video generation endpoint
- "Insufficient budget" errors despite available budget

**Diagnostic Steps:**
```bash
# Check job status in admin dashboard
curl -H "Authorization: Bearer $ADMIN_API_KEY" \
  "https://your-domain.com/api/admin/monitoring?section=alerts"

# Check Vertex AI quota
gcloud alpha services quota list --service=aiplatform.googleapis.com

# Check Veo API status (manual verification required)
curl -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  "https://aiplatform.googleapis.com/v1/projects/$GOOGLE_CLOUD_PROJECT/locations/us-central1/publishers/google/models/veo-001"
```

**Solutions:**

1. **Vertex AI Authentication Issues**
   ```bash
   # Solution: Verify service account has aiplatform.user role
   gcloud projects add-iam-policy-binding $GOOGLE_CLOUD_PROJECT \
     --member="serviceAccount:adcraft-app@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com" \
     --role="roles/aiplatform.user"
   ```

2. **API Quota Exceeded**
   ```bash
   # Solution: Request quota increase
   gcloud alpha services quota list --service=aiplatform.googleapis.com --filter="quotaId:aiplatform-quota"
   ```

3. **Budget Threshold Reached**
   ```bash
   # Solution: Check and adjust budget limits
   curl -H "Authorization: Bearer $ADMIN_API_KEY" \
     "https://your-domain.com/api/admin/monitoring?section=costs"
   ```

4. **Firestore Connection Issues**
   ```bash
   # Solution: Verify Firestore is properly initialized
   gcloud firestore databases describe --database='(default)'
   
   # Initialize Firestore if needed
   gcloud firestore databases create --region=asia-northeast1
   ```

### Issue: High Response Times

**Symptoms:**
- API responses taking >5 seconds
- Frequent timeout errors
- Poor user experience

**Diagnostic Steps:**
```bash
# Check application performance metrics
curl -H "Authorization: Bearer $ADMIN_API_KEY" \
  "https://your-domain.com/api/admin/monitoring?section=performance"

# Check Cloud Run metrics
gcloud run services describe adcraft-service \
  --region=asia-northeast1 \
  --format="yaml"

# Test response times
time curl https://your-domain.com/api/health
```

**Solutions:**

1. **Insufficient Resources**
   ```bash
   # Solution: Increase CPU and memory allocation
   gcloud run services update adcraft-service \
     --region=asia-northeast1 \
     --memory=2Gi \
     --cpu=2 \
     --concurrency=50
   ```

2. **Cold Start Issues**
   ```bash
   # Solution: Set minimum instances
   gcloud run services update adcraft-service \
     --region=asia-northeast1 \
     --min-instances=1
   ```

3. **Database Connection Pooling**
   ```typescript
   // Solution: Optimize Firestore connection reuse
   const firestore = getFirestore();
   firestore.settings({
     ignoreUndefinedProperties: true,
     merge: true
   });
   ```

### Issue: Memory Leaks

**Symptoms:**
- Gradual increase in memory usage
- Application restarts due to memory limits
- Performance degradation over time

**Diagnostic Steps:**
```bash
# Monitor memory usage
curl -H "Authorization: Bearer $ADMIN_API_KEY" \
  "https://your-domain.com/api/admin/monitoring?section=performance" | jq '.performance.systemMetrics'

# Check Cloud Run metrics in console
# Navigate to Cloud Console → Cloud Run → adcraft-service → Metrics
```

**Solutions:**

1. **Optimize Service Instances**
   ```typescript
   // Solution: Ensure proper singleton cleanup
   class ServiceClass {
     private static instance?: ServiceClass;
     
     static getInstance(): ServiceClass {
       if (!this.instance) {
         this.instance = new ServiceClass();
       }
       return this.instance;
     }
     
     cleanup(): void {
       // Properly cleanup resources
       ServiceClass.instance = undefined;
     }
   }
   ```

2. **Clear Intervals and Timeouts**
   ```typescript
   // Solution: Clean up timers in service cleanup
   private intervalIds: NodeJS.Timeout[] = [];
   
   startMonitoring(): void {
     const id = setInterval(() => {
       // monitoring logic
     }, 30000);
     this.intervalIds.push(id);
   }
   
   cleanup(): void {
     this.intervalIds.forEach(id => clearInterval(id));
     this.intervalIds = [];
   }
   ```

---

## Security and Authentication Issues

### Issue: Admin Dashboard Access Denied

**Symptoms:**
- HTTP 401 errors on admin endpoints
- "Unauthorized" messages in admin dashboard
- Valid API key appears to be rejected

**Diagnostic Steps:**
```bash
# Test API key authentication
curl -H "Authorization: Bearer $ADMIN_API_KEY" \
  https://your-domain.com/api/admin/monitoring

# Check if API key is properly configured
gcloud run services describe adcraft-service \
  --region=asia-northeast1 \
  --format="value(spec.template.spec.template.spec.containers[0].env[?(@.name=='ADMIN_API_KEY')].value)"
```

**Solutions:**

1. **API Key Not Set**
   ```bash
   # Solution: Set admin API key
   gcloud run services update adcraft-service \
     --region=asia-northeast1 \
     --set-env-vars="ADMIN_API_KEY=your-secure-api-key"
   ```

2. **API Key in Wrong Format**
   ```bash
   # Solution: Ensure Bearer token format
   curl -H "Authorization: Bearer your-api-key" \
     https://your-domain.com/api/admin/monitoring
   ```

3. **Special Characters in API Key**
   ```bash
   # Solution: Use URL-safe API key
   export ADMIN_API_KEY="$(openssl rand -base64 32 | tr -d '/+=' | head -c 32)"
   ```

### Issue: Rate Limiting Not Working

**Symptoms:**
- Users can exceed expected rate limits
- No rate limit headers in responses
- Rate limit alerts not triggering

**Diagnostic Steps:**
```bash
# Test rate limiting behavior
curl -I https://your-domain.com/api/generate-video

# Check rate limiting configuration
curl -H "Authorization: Bearer $ADMIN_API_KEY" \
  "https://your-domain.com/api/admin/security"
```

**Solutions:**

1. **Rate Limiting Disabled**
   ```bash
   # Solution: Enable rate limiting
   gcloud run services update adcraft-service \
     --region=asia-northeast1 \
     --set-env-vars="RATE_LIMIT_ENABLED=true"
   ```

2. **Memory-based Store Issues**
   ```typescript
   // Solution: Implement Redis-based rate limiting for production
   const redis = new Redis(process.env.REDIS_URL);
   const rateLimiter = new RateLimiterRedis({
     storeClient: redis,
     keyPrefix: 'rl_adcraft',
     points: 1,
     duration: 3600, // 1 hour
   });
   ```

### Issue: Security Events Not Being Detected

**Symptoms:**
- No security events in admin dashboard
- Suspicious requests not being blocked
- No security alerts being generated

**Diagnostic Steps:**
```bash
# Check security monitoring status
curl -H "Authorization: Bearer $ADMIN_API_KEY" \
  "https://your-domain.com/api/admin/security?timeRange=1h"

# Test suspicious request detection
curl -X POST https://your-domain.com/api/generate-video \
  -H "User-Agent: curl/7.68.0" \
  -d "malicious-payload"
```

**Solutions:**

1. **Security Monitoring Disabled**
   ```bash
   # Solution: Enable security monitoring
   gcloud run services update adcraft-service \
     --region=asia-northeast1 \
     --set-env-vars="SECURITY_MONITORING_ENABLED=true"
   ```

2. **Insufficient Logging**
   ```typescript
   // Solution: Ensure security events are properly logged
   securityMonitor.trackSecurityEvent({
     type: 'suspicious_request',
     severity: 'medium',
     source: req.ip,
     message: 'Malformed request detected',
     metadata: { endpoint: req.path, method: req.method }
   });
   ```

---

## Performance and Scaling Issues

### Issue: High Error Rates

**Symptoms:**
- Error rate >5% in monitoring dashboard
- Frequent HTTP 5xx errors
- User complaints about failures

**Diagnostic Steps:**
```bash
# Check error metrics
curl -H "Authorization: Bearer $ADMIN_API_KEY" \
  "https://your-domain.com/api/admin/monitoring?section=performance"

# Review error logs
gcloud run services logs read adcraft-service \
  --region=asia-northeast1 \
  --filter="severity>=ERROR" \
  --limit=50
```

**Solutions:**

1. **Service Dependency Failures**
   ```typescript
   // Solution: Implement circuit breaker pattern
   class CircuitBreaker {
     private failures = 0;
     private lastFailure = 0;
     private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
     
     async call<T>(fn: () => Promise<T>): Promise<T> {
       if (this.state === 'OPEN') {
         if (Date.now() - this.lastFailure > 60000) {
           this.state = 'HALF_OPEN';
         } else {
           throw new Error('Circuit breaker is OPEN');
         }
       }
       
       try {
         const result = await fn();
         this.onSuccess();
         return result;
       } catch (error) {
         this.onFailure();
         throw error;
       }
     }
     
     private onSuccess(): void {
       this.failures = 0;
       this.state = 'CLOSED';
     }
     
     private onFailure(): void {
       this.failures++;
       this.lastFailure = Date.now();
       if (this.failures >= 5) {
         this.state = 'OPEN';
       }
     }
   }
   ```

2. **Resource Exhaustion**
   ```bash
   # Solution: Implement auto-scaling
   gcloud run services update adcraft-service \
     --region=asia-northeast1 \
     --max-instances=10 \
     --concurrency=50
   ```

### Issue: Database Connection Issues

**Symptoms:**
- "Connection refused" errors
- Firestore timeout errors
- Data consistency issues

**Diagnostic Steps:**
```bash
# Test Firestore connectivity
gcloud firestore operations list

# Check service account permissions
gcloud projects get-iam-policy $GOOGLE_CLOUD_PROJECT \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:*adcraft*" \
  --format="table(bindings.role,bindings.members)"
```

**Solutions:**

1. **Connection Pool Optimization**
   ```typescript
   // Solution: Implement connection pooling
   const firestorePool = {
     connections: new Map<string, FirebaseFirestore.Firestore>(),
     
     getConnection(projectId: string): FirebaseFirestore.Firestore {
       if (!this.connections.has(projectId)) {
         const connection = getFirestore(projectId);
         connection.settings({
           ignoreUndefinedProperties: true,
           merge: true,
           ssl: true
         });
         this.connections.set(projectId, connection);
       }
       return this.connections.get(projectId)!;
     }
   };
   ```

2. **Retry Logic Implementation**
   ```typescript
   // Solution: Add exponential backoff for database operations
   async function executeWithRetry<T>(
     operation: () => Promise<T>,
     maxRetries: number = 3,
     baseDelay: number = 1000
   ): Promise<T> {
     for (let attempt = 0; attempt < maxRetries; attempt++) {
       try {
         return await operation();
       } catch (error) {
         if (attempt === maxRetries - 1) throw error;
         
         const delay = baseDelay * Math.pow(2, attempt);
         await new Promise(resolve => setTimeout(resolve, delay));
       }
     }
     throw new Error('Max retries exceeded');
   }
   ```

---

## Cost and Budget Issues

### Issue: Unexpected High Costs

**Symptoms:**
- Budget alerts triggering unexpectedly
- Costs exceeding estimates
- Rapid budget consumption

**Diagnostic Steps:**
```bash
# Check current spending
curl -H "Authorization: Bearer $ADMIN_API_KEY" \
  "https://your-domain.com/api/admin/monitoring?section=costs"

# Check billing data
gcloud beta billing accounts describe $BILLING_ACCOUNT_ID

# Review cost breakdown
gcloud billing accounts get-billing-info $GOOGLE_CLOUD_PROJECT
```

**Solutions:**

1. **Runaway Video Generation**
   ```bash
   # Solution: Implement stricter rate limiting
   gcloud run services update adcraft-service \
     --region=asia-northeast1 \
     --set-env-vars="VIDEO_GENERATION_RATE_LIMIT=1/hour,2/day"
   ```

2. **API Quota Overuse**
   ```typescript
   // Solution: Implement cost-aware throttling
   class CostAwareThrottler {
     private currentSpend = 0;
     private budgetLimit: number;
     
     constructor(budgetLimit: number) {
       this.budgetLimit = budgetLimit;
     }
     
     async canProceed(estimatedCost: number): Promise<boolean> {
       const projectedSpend = this.currentSpend + estimatedCost;
       const safetyThreshold = this.budgetLimit * 0.9; // 90% threshold
       
       return projectedSpend <= safetyThreshold;
     }
     
     recordCost(actualCost: number): void {
       this.currentSpend += actualCost;
     }
   }
   ```

3. **Storage Costs**
   ```bash
   # Solution: Implement lifecycle policies for storage buckets
   gsutil lifecycle set lifecycle.json gs://your-bucket

   # lifecycle.json:
   {
     "lifecycle": {
       "rule": [
         {
           "action": {"type": "Delete"},
           "condition": {"age": 30}
         }
       ]
     }
   }
   ```

### Issue: Budget Alerts Not Working

**Symptoms:**
- No budget alert emails received
- Spending exceeds thresholds without notifications
- Budget dashboard shows incorrect data

**Diagnostic Steps:**
```bash
# Check budget configuration
gcloud beta billing budgets list --billing-account=$BILLING_ACCOUNT_ID

# Test budget alert configuration
gcloud alpha monitoring channels list
```

**Solutions:**

1. **Incorrect Budget Configuration**
   ```bash
   # Solution: Recreate budget with correct settings
   gcloud beta billing budgets create \
     --billing-account=$BILLING_ACCOUNT_ID \
     --display-name="AdCraft AI Production Budget" \
     --budget-amount=300USD \
     --threshold-rule="percent-of-budget=50,spend-basis=current-spend" \
     --threshold-rule="percent-of-budget=90,spend-basis=current-spend"
   ```

2. **Missing Notification Channels**
   ```bash
   # Solution: Add email notification channel
   gcloud alpha monitoring channels create \
     --display-name="Budget Alerts" \
     --type=email \
     --channel-labels=email_address="admin@your-domain.com"
   ```

---

## Monitoring and Alerting Issues

### Issue: Health Checks Failing

**Symptoms:**
- Cloud Run reports service as unhealthy
- Load balancer removing service from rotation
- Intermittent connectivity issues

**Diagnostic Steps:**
```bash
# Test health check endpoint directly
curl https://your-domain.com/api/health

# Check Cloud Run health check configuration
gcloud run services describe adcraft-service \
  --region=asia-northeast1 \
  --format="yaml"
```

**Solutions:**

1. **Health Check Timeout**
   ```typescript
   // Solution: Optimize health check response time
   app.get('/api/health', async (req, res) => {
     const startTime = Date.now();
     
     try {
       // Quick health checks only (< 5 seconds)
       const basicHealth = {
         status: 'healthy',
         timestamp: new Date().toISOString(),
         uptime: process.uptime()
       };
       
       res.json(basicHealth);
     } catch (error) {
       res.status(503).json({
         status: 'unhealthy',
         error: error.message
       });
     }
   });
   ```

2. **Dependency Health Checks Too Slow**
   ```typescript
   // Solution: Implement async health checks
   class HealthCheckService {
     private lastHealthCheck: HealthStatus | null = null;
     private lastCheckTime = 0;
     private readonly CACHE_DURATION = 30000; // 30 seconds
     
     async getHealthStatus(): Promise<HealthStatus> {
       const now = Date.now();
       
       if (this.lastHealthCheck && (now - this.lastCheckTime) < this.CACHE_DURATION) {
         return this.lastHealthCheck;
       }
       
       // Perform health check in background
       this.performBackgroundHealthCheck();
       
       return this.lastHealthCheck || {
         status: 'degraded',
         message: 'Health check in progress'
       };
     }
   }
   ```

### Issue: No Monitoring Alerts

**Symptoms:**
- Issues occur but no alerts are generated
- Alerting dashboard shows no active rules
- Email notifications not being sent

**Diagnostic Steps:**
```bash
# Check alerting configuration
curl -H "Authorization: Bearer $ADMIN_API_KEY" \
  "https://your-domain.com/api/admin/monitoring?section=alerts"

# Test alert rule evaluation
curl -X POST -H "Authorization: Bearer $ADMIN_API_KEY" \
  "https://your-domain.com/api/admin/monitoring" \
  -d '{"action": "force_health_check"}'
```

**Solutions:**

1. **Alerting Service Not Started**
   ```bash
   # Solution: Ensure alerting is enabled
   gcloud run services update adcraft-service \
     --region=asia-northeast1 \
     --set-env-vars="ALERT_CHECK_INTERVAL=60000"
   ```

2. **Alert Rules Not Configured**
   ```typescript
   // Solution: Initialize default alert rules
   const defaultRules = [
     {
       id: 'high-error-rate',
       name: 'High Error Rate',
       threshold: 5,
       operator: 'gt',
       duration: 5 * 60 * 1000, // 5 minutes
       severity: 'high'
     },
     {
       id: 'budget-exceeded',
       name: 'Budget Exceeded',
       threshold: 90,
       operator: 'gt',
       severity: 'critical'
     }
   ];
   
   defaultRules.forEach(rule => {
     alertingService.addRule(rule);
   });
   ```

---

## Development and Testing Issues

### Issue: Local Development Setup Problems

**Symptoms:**
- Application won't start locally
- Environment variable issues
- Mock services not working

**Diagnostic Steps:**
```bash
# Check Node.js version
node --version  # Should be v18.17.0+

# Check environment setup
npm run dev
```

**Solutions:**

1. **Node.js Version Mismatch**
   ```bash
   # Solution: Install correct Node.js version
   nvm install 18.17.0
   nvm use 18.17.0
   ```

2. **Missing Environment Variables**
   ```bash
   # Solution: Create .env.development file
   cp .env.example .env.development
   
   # Edit with development values:
   NODE_ENV=development
   MOCK_MODE_ENABLED=true
   GOOGLE_CLOUD_PROJECT=adcraft-dev-2025
   ```

3. **Service Account Issues in Development**
   ```bash
   # Solution: Set up local service account
   export GOOGLE_APPLICATION_CREDENTIALS="./keys/dev-service-account.json"
   gcloud auth application-default login
   ```

### Issue: Tests Failing

**Symptoms:**
- Unit tests failing unexpectedly
- Integration tests timing out
- Mocking not working properly

**Diagnostic Steps:**
```bash
# Run tests with verbose output
npm test -- --verbose

# Check test configuration
cat vitest.config.ts

# Run specific test suite
npm test -- tests/services/monitoring.test.ts
```

**Solutions:**

1. **Mock Configuration Issues**
   ```typescript
   // Solution: Proper mock setup in test files
   vi.mock('@/lib/services/vertex-ai', () => ({
     VertexAIService: {
       getInstance: vi.fn(() => ({
         analyzeImage: vi.fn().mockResolvedValue({
           analysis: 'test result'
         }),
         healthCheck: vi.fn().mockResolvedValue(true)
       }))
     }
   }));
   ```

2. **Test Timeout Issues**
   ```typescript
   // Solution: Increase timeout for integration tests
   describe('Video Generation Integration', () => {
     test('should generate video successfully', async () => {
       // Test implementation
     }, 30000); // 30 second timeout
   });
   ```

---

## General Debugging Strategies

### Application Logging Best Practices

```typescript
// Use structured logging with correlation IDs
const logger = Logger.getInstance();

app.use((req, res, next) => {
  const correlationId = logger.generateCorrelationId();
  req.correlationId = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);
  
  logger.info('Request received', {
    correlationId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  next();
});
```

### Performance Monitoring

```typescript
// Track performance metrics for all operations
async function trackPerformance<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  const correlationId = generateCorrelationId();
  
  try {
    logger.info(`${operation} started`, { correlationId });
    const result = await fn();
    const duration = Date.now() - startTime;
    
    logger.info(`${operation} completed`, { 
      correlationId, 
      duration 
    });
    
    metricsService.recordCustomMetric(`${operation}_duration`, duration);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`${operation} failed`, { 
      correlationId, 
      duration 
    }, error);
    throw error;
  }
}
```

### Emergency Response Procedures

### Incident Response Checklist

1. **Immediate Response (0-5 minutes)**
   - [ ] Check service health: `curl https://your-domain.com/api/health`
   - [ ] Check Cloud Run status in console
   - [ ] Review recent error logs
   - [ ] Check budget status for cost-related issues

2. **Investigation Phase (5-30 minutes)**
   - [ ] Access admin monitoring dashboard
   - [ ] Review performance metrics
   - [ ] Check security events
   - [ ] Verify external service status (Vertex AI, Veo)

3. **Mitigation Phase (30-60 minutes)**
   - [ ] Roll back to previous version if necessary
   - [ ] Scale up resources if performance issue
   - [ ] Block problematic IPs if security issue
   - [ ] Increase rate limits if abuse detected

4. **Resolution Phase (1+ hours)**
   - [ ] Implement permanent fix
   - [ ] Update monitoring and alerting
   - [ ] Document incident and lessons learned
   - [ ] Review and update procedures

### Emergency Rollback

```bash
# Emergency rollback to previous version
export PREVIOUS_IMAGE="gcr.io/$GOOGLE_CLOUD_PROJECT/adcraft-ai:previous-stable"

gcloud run services update adcraft-service \
  --region=asia-northeast1 \
  --image=$PREVIOUS_IMAGE

# Verify rollback
curl https://your-domain.com/api/health
```

### Contact Information

For production incidents:
- **Primary Contact**: System Administrator
- **Secondary Contact**: Development Team Lead
- **Escalation**: Project Manager

For non-urgent issues:
- Create issue in project repository
- Check documentation first
- Use troubleshooting guide

This comprehensive troubleshooting guide should help resolve most common issues encountered with AdCraft AI. Always start with the quick diagnostic commands and work through the solutions systematically.