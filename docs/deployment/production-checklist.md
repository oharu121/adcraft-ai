# Production Deployment Checklist & Best Practices

## Overview

This comprehensive checklist ensures safe, secure, and reliable production deployments of AdCraft AI. Follow this checklist for every production deployment to maintain system reliability and security.

## Pre-Deployment Checklist

### 1. Code Quality and Testing ✅

- [ ] **All tests pass locally**
  ```bash
  npm test
  npm run test:coverage  # Ensure >80% coverage
  ```

- [ ] **TypeScript compilation successful**
  ```bash
  npm run typecheck
  ```

- [ ] **Linting passes without errors**
  ```bash
  npm run lint
  ```

- [ ] **Build completes successfully**
  ```bash
  npm run build
  ```

- [ ] **Security audit passes**
  ```bash
  npm audit --audit-level=high
  ```

- [ ] **Code review approved**
  - All PR comments addressed
  - Security review completed
  - Performance impact assessed
  - Breaking changes documented

### 2. Environment Preparation ✅

- [ ] **Production environment variables configured**
  ```bash
  # Verify required variables are set
  gcloud run services describe adcraft-service \
    --region=asia-northeast1 \
    --format="value(spec.template.spec.containers[0].env[].name)"
  ```

- [ ] **Secrets properly configured in Google Secret Manager**
  ```bash
  # Verify secrets exist and are accessible
  gcloud secrets versions access latest --secret=admin-api-key
  gcloud secrets versions access latest --secret=webhook-secret
  ```

- [ ] **Service account permissions validated**
  ```bash
  # Check service account has required roles
  gcloud projects get-iam-policy $GOOGLE_CLOUD_PROJECT \
    --flatten="bindings[].members" \
    --filter="bindings.members:serviceAccount:*adcraft*"
  ```

- [ ] **Budget alerts configured and tested**
  ```bash
  # Verify budget configuration
  gcloud beta billing budgets list --billing-account=$BILLING_ACCOUNT_ID
  ```

### 3. Infrastructure Validation ✅

- [ ] **Pulumi state is consistent**
  ```bash
  cd infrastructure/
  pulumi stack select prod
  pulumi preview  # Should show no changes if infrastructure is current
  ```

- [ ] **GCP APIs enabled and quota sufficient**
  ```bash
  # Check API enablement
  gcloud services list --enabled --filter="name:(run.googleapis.com OR aiplatform.googleapis.com)"
  
  # Check quotas
  gcloud alpha services quota list --service=aiplatform.googleapis.com
  ```

- [ ] **Container image built and pushed**
  ```bash
  # Build and push latest image
  docker build -t gcr.io/$GOOGLE_CLOUD_PROJECT/adcraft-ai:$(git rev-parse --short HEAD) .
  docker push gcr.io/$GOOGLE_CLOUD_PROJECT/adcraft-ai:$(git rev-parse --short HEAD)
  
  # Tag as latest
  docker tag gcr.io/$GOOGLE_CLOUD_PROJECT/adcraft-ai:$(git rev-parse --short HEAD) \
    gcr.io/$GOOGLE_CLOUD_PROJECT/adcraft-ai:latest
  docker push gcr.io/$GOOGLE_CLOUD_PROJECT/adcraft-ai:latest
  ```

### 4. Security Verification ✅

- [ ] **Security headers configured**
  ```bash
  # Test security headers
  curl -I https://your-domain.com/api/health | grep -E "(X-Content-Type-Options|X-Frame-Options|X-XSS-Protection|Strict-Transport-Security)"
  ```

- [ ] **Rate limiting functional**
  ```bash
  # Test rate limiting
  for i in {1..5}; do
    curl -X POST https://your-domain.com/api/generate-video \
      -H "Content-Type: application/json" \
      -d '{"productName":"Test","targetAudience":"Test","keyMessage":"Test"}'
  done
  # Should see 429 responses after first request
  ```

- [ ] **Admin authentication working**
  ```bash
  # Test admin authentication
  curl -H "Authorization: Bearer $ADMIN_API_KEY" \
    https://your-domain.com/api/admin/monitoring
  # Should return 200 with valid key, 401 without
  ```

- [ ] **HTTPS certificate valid**
  ```bash
  # Check SSL certificate
  openssl s_client -connect your-domain.com:443 -servername your-domain.com \
    < /dev/null 2>/dev/null | openssl x509 -noout -dates
  ```

---

## Deployment Process

### Stage 1: Staging Deployment (Required) ✅

- [ ] **Deploy to staging environment first**
  ```bash
  # Update Pulumi configuration for staging
  pulumi stack select staging
  pulumi config set adcraft:containerImage "gcr.io/$GOOGLE_CLOUD_PROJECT/adcraft-ai:$(git rev-parse --short HEAD)"
  pulumi up
  ```

- [ ] **Smoke tests pass on staging**
  ```bash
  # Health check
  curl https://staging.your-domain.com/api/health
  
  # Video generation test
  curl -X POST https://staging.your-domain.com/api/generate-video \
    -H "Content-Type: application/json" \
    -d '{
      "productName": "Staging Test Product",
      "targetAudience": "Test Audience",
      "keyMessage": "Staging Test"
    }'
  
  # Admin dashboard access
  curl -H "Authorization: Bearer $STAGING_ADMIN_API_KEY" \
    https://staging.your-domain.com/api/admin/monitoring
  ```

- [ ] **Performance acceptable on staging**
  ```bash
  # Load test staging environment
  ab -n 100 -c 10 https://staging.your-domain.com/api/health
  # Response times should be <500ms
  ```

- [ ] **No errors in staging logs**
  ```bash
  # Check for errors in staging
  gcloud run services logs read adcraft-service-staging \
    --region=asia-northeast1 \
    --filter="severity>=ERROR" \
    --limit=20
  ```

### Stage 2: Production Deployment ✅

- [ ] **Create deployment backup**
  ```bash
  # Backup current service configuration
  gcloud run services describe adcraft-service \
    --region=asia-northeast1 \
    --format=export > backup-$(date +%Y%m%d-%H%M%S).yaml
  
  # Backup Pulumi state
  pulumi stack export > state-backup-$(date +%Y%m%d-%H%M%S).json
  ```

- [ ] **Deploy infrastructure changes (if any)**
  ```bash
  # Deploy infrastructure first
  cd infrastructure/
  pulumi stack select prod
  pulumi up
  ```

- [ ] **Deploy application**
  ```bash
  # Update container image
  gcloud run services update adcraft-service \
    --region=asia-northeast1 \
    --image=gcr.io/$GOOGLE_CLOUD_PROJECT/adcraft-ai:$(git rev-parse --short HEAD)
  ```

- [ ] **Wait for deployment to complete**
  ```bash
  # Monitor deployment status
  gcloud run services describe adcraft-service \
    --region=asia-northeast1 \
    --format="value(status.conditions[0].status)"
  # Should show "True" when ready
  ```

### Stage 3: Post-Deployment Verification ✅

- [ ] **Health check passes**
  ```bash
  curl https://your-domain.com/api/health
  # Should return 200 with healthy status
  ```

- [ ] **Core functionality working**
  ```bash
  # Test video generation endpoint
  curl -X POST https://your-domain.com/api/generate-video \
    -H "Content-Type: application/json" \
    -d '{
      "productName": "Production Test",
      "targetAudience": "Test Audience", 
      "keyMessage": "Production Verification"
    }'
  ```

- [ ] **Admin dashboard accessible**
  ```bash
  curl -H "Authorization: Bearer $ADMIN_API_KEY" \
    https://your-domain.com/api/admin/monitoring?section=overview
  ```

- [ ] **Monitoring and alerting functional**
  ```bash
  # Check monitoring data
  curl -H "Authorization: Bearer $ADMIN_API_KEY" \
    https://your-domain.com/api/admin/monitoring?section=health
  ```

- [ ] **Logs are being generated**
  ```bash
  gcloud run services logs read adcraft-service \
    --region=asia-northeast1 \
    --limit=10
  ```

- [ ] **Performance metrics normal**
  ```bash
  # Check performance in admin dashboard
  curl -H "Authorization: Bearer $ADMIN_API_KEY" \
    https://your-domain.com/api/admin/monitoring?section=performance
  ```

---

## Post-Deployment Monitoring

### Immediate Monitoring (First 30 minutes) ✅

- [ ] **Monitor error rates**
  - Check admin dashboard every 5 minutes
  - Error rate should be <1%
  - No critical errors in logs

- [ ] **Monitor response times**
  - Health check: <500ms
  - API endpoints: <2s average
  - No timeout errors

- [ ] **Monitor resource usage**
  - Memory usage: <80% of allocated
  - CPU usage: <70% of allocated
  - No resource exhaustion alerts

- [ ] **Monitor budget impact**
  - Cost tracking updated correctly
  - No unexpected cost spikes
  - Budget alerts not triggered

### Extended Monitoring (First 24 hours) ✅

- [ ] **Set up monitoring alerts**
  ```bash
  # Verify alerting rules are active
  curl -H "Authorization: Bearer $ADMIN_API_KEY" \
    https://your-domain.com/api/admin/monitoring?section=alerts
  ```

- [ ] **Monitor user traffic patterns**
  - No unusual traffic spikes
  - Rate limiting working correctly
  - Security events at normal levels

- [ ] **Monitor service dependencies**
  - Vertex AI: Healthy response times
  - Veo API: Normal processing times
  - Firestore: No connection issues
  - Cloud Storage: No access errors

### Long-term Monitoring (First week) ✅

- [ ] **Review performance trends**
  - Response time trends stable
  - Memory usage patterns normal
  - No degradation over time

- [ ] **Review cost patterns**
  - Daily costs within expected range
  - No cost anomalies detected
  - Budget consumption on track

- [ ] **Review security events**
  - Security monitoring data normal
  - No suspicious activity patterns
  - Rate limiting effectiveness good

---

## Rollback Procedures

### When to Rollback ✅

Immediate rollback is required if:
- [ ] Health check failures persist >5 minutes
- [ ] Error rate exceeds 5% for >2 minutes
- [ ] Critical functionality completely broken
- [ ] Security vulnerability detected
- [ ] Budget consumption rate >10x expected

### Rollback Process ✅

#### 1. Emergency Rollback (< 5 minutes)
```bash
# Quick rollback to previous image
export PREVIOUS_IMAGE="gcr.io/$GOOGLE_CLOUD_PROJECT/adcraft-ai:previous-stable"

gcloud run services update adcraft-service \
  --region=asia-northeast1 \
  --image=$PREVIOUS_IMAGE

# Verify rollback
curl https://your-domain.com/api/health
```

#### 2. Full Rollback (< 15 minutes)
```bash
# Restore from backup configuration
gcloud run services replace backup-YYYYMMDD-HHMMSS.yaml \
  --region=asia-northeast1

# Restore Pulumi state if needed
pulumi stack import < state-backup-YYYYMMDD-HHMMSS.json
pulumi up
```

#### 3. Post-Rollback Verification
- [ ] Health check passes
- [ ] Core functionality restored
- [ ] Error rates back to normal
- [ ] Performance metrics stable
- [ ] No ongoing alerts

---

## Production Best Practices

### Deployment Timing ✅

#### Recommended Deployment Windows
- **Primary Window**: Tuesday-Thursday, 10:00-16:00 JST
- **Avoid**: Monday mornings, Friday afternoons, weekends
- **Emergency Only**: Outside business hours

#### Pre-Deployment Communication
- [ ] **Notify stakeholders 24 hours in advance**
- [ ] **Schedule maintenance window if needed**
- [ ] **Prepare rollback communication plan**
- [ ] **Ensure on-call engineer available**

### Change Management ✅

#### Version Tagging
```bash
# Tag releases properly
git tag -a v1.2.0 -m "Release v1.2.0: Add video generation improvements"
git push origin v1.2.0

# Use semantic versioning
# MAJOR.MINOR.PATCH
# - MAJOR: Breaking changes
# - MINOR: New features (backward compatible)
# - PATCH: Bug fixes (backward compatible)
```

#### Release Notes
- [ ] **Document all changes**
  - New features
  - Bug fixes
  - Performance improvements
  - Breaking changes
  - Migration steps (if needed)

#### Database Migrations
```bash
# For any database schema changes
# 1. Deploy migration script first
# 2. Verify migration success
# 3. Deploy application changes
# 4. Verify end-to-end functionality
```

### Security Considerations ✅

#### Secrets Management
- [ ] **Rotate secrets quarterly**
  ```bash
  # Generate new admin API key
  export NEW_ADMIN_KEY="$(openssl rand -base64 32 | tr -d '/+=' | head -c 32)"
  echo "$NEW_ADMIN_KEY" | gcloud secrets create admin-api-key-new --data-file=-
  
  # Update service to use new secret
  gcloud run services update adcraft-service \
    --region=asia-northeast1 \
    --update-secrets=ADMIN_API_KEY=admin-api-key-new:latest
  
  # Test and then delete old secret
  gcloud secrets delete admin-api-key
  ```

- [ ] **Regular security scans**
  ```bash
  # Scan container for vulnerabilities
  gcloud beta container images scan gcr.io/$GOOGLE_CLOUD_PROJECT/adcraft-ai:latest
  
  # Review scan results
  gcloud beta container images describe gcr.io/$GOOGLE_CLOUD_PROJECT/adcraft-ai:latest \
    --show-package-vulnerability
  ```

#### Access Control
- [ ] **Review and update IAM permissions**
  ```bash
  # Audit service account permissions
  gcloud projects get-iam-policy $GOOGLE_CLOUD_PROJECT \
    --flatten="bindings[].members" \
    --filter="bindings.members:serviceAccount:*adcraft*"
  ```

- [ ] **Monitor admin access**
  ```bash
  # Review admin dashboard access logs
  gcloud run services logs read adcraft-service \
    --region=asia-northeast1 \
    --filter="resource.labels.service_name=adcraft-service AND textPayload:/api/admin/"
  ```

### Performance Optimization ✅

#### Resource Management
- [ ] **Review resource allocation monthly**
  ```bash
  # Check current resource usage
  curl -H "Authorization: Bearer $ADMIN_API_KEY" \
    https://your-domain.com/api/admin/monitoring?section=performance
  
  # Adjust if needed
  gcloud run services update adcraft-service \
    --region=asia-northeast1 \
    --memory=2Gi \
    --cpu=2
  ```

- [ ] **Monitor cold starts**
  ```bash
  # Set minimum instances if cold starts are problematic
  gcloud run services update adcraft-service \
    --region=asia-northeast1 \
    --min-instances=1
  ```

#### Database Performance
- [ ] **Monitor Firestore performance**
  - Query performance metrics
  - Index usage optimization
  - Read/write patterns analysis

- [ ] **Optimize Cloud Storage access**
  - CDN configuration review
  - Lifecycle policy effectiveness
  - Access pattern analysis

### Cost Management ✅

#### Budget Monitoring
- [ ] **Weekly budget review**
  ```bash
  # Check current spending
  curl -H "Authorization: Bearer $ADMIN_API_KEY" \
    https://your-domain.com/api/admin/monitoring?section=costs
  ```

- [ ] **Monthly cost optimization review**
  - Unused resources cleanup
  - Service usage patterns analysis
  - Cost allocation optimization

#### Resource Cleanup
```bash
# Weekly cleanup script
#!/bin/bash

# Clean up old container images (keep latest 10)
gcloud container images list-tags gcr.io/$GOOGLE_CLOUD_PROJECT/adcraft-ai \
  --format="table(digest,timestamp.date())" \
  --sort-by=timestamp \
  --limit=999999 | tail -n +11 | \
  awk '{print $1}' | \
  xargs -I {} gcloud container images delete gcr.io/$GOOGLE_CLOUD_PROJECT/adcraft-ai@{} --quiet

# Clean up temporary files in Cloud Storage
gsutil -m rm -r gs://adcraft-temp-prod/$(date -d '7 days ago' '+%Y/%m/%d')/**

# Archive old logs (if using custom log storage)
# Implementation depends on your log archival strategy
```

---

## Compliance and Governance ✅

### Data Protection ✅

- [ ] **User data retention policies enforced**
  ```bash
  # Verify data lifecycle policies
  gsutil lifecycle get gs://adcraft-uploads-prod
  gsutil lifecycle get gs://adcraft-videos-prod
  ```

- [ ] **Data encryption verified**
  - Data at rest: Google Cloud default encryption
  - Data in transit: HTTPS/TLS for all communications
  - API keys and secrets: Google Secret Manager

### Audit and Logging ✅

- [ ] **Audit logs enabled**
  ```bash
  # Verify audit logging is enabled
  gcloud logging sinks list
  gcloud logging logs list --filter="name:cloudaudit"
  ```

- [ ] **Access logs reviewed monthly**
  - Admin dashboard access patterns
  - API usage patterns
  - Security event patterns
  - Unusual activity identification

### Compliance Monitoring ✅

- [ ] **Security compliance review quarterly**
  - OWASP Top 10 assessment
  - Security header verification
  - Vulnerability scan results
  - Access control review

- [ ] **Performance SLA monitoring**
  - Uptime: >99.9%
  - Response time: <2s average
  - Error rate: <1%
  - Customer satisfaction metrics

---

## Emergency Response Procedures ✅

### Incident Classification ✅

#### Severity 1 (Critical) - Response: Immediate
- Complete service outage
- Security breach detected  
- Data loss or corruption
- Budget exceeded by >50%

#### Severity 2 (High) - Response: Within 1 hour
- Partial service degradation
- Performance degradation >50%
- Security vulnerability discovered
- Major feature not working

#### Severity 3 (Medium) - Response: Within 4 hours
- Minor feature issues
- Performance degradation <50%
- Non-critical errors increase

#### Severity 4 (Low) - Response: Next business day
- Cosmetic issues
- Minor performance issues
- Feature enhancement requests

### Incident Response Process ✅

1. **Detection** (0-5 minutes)
   - [ ] Automated alerts trigger
   - [ ] Manual issue reported
   - [ ] Monitoring dashboard shows anomaly

2. **Assessment** (5-15 minutes)
   - [ ] Determine severity level
   - [ ] Identify affected components
   - [ ] Estimate user impact

3. **Response** (15-30 minutes)
   - [ ] Execute appropriate response plan
   - [ ] Communicate with stakeholders
   - [ ] Begin mitigation steps

4. **Resolution** (30 minutes - 4 hours)
   - [ ] Implement fix or rollback
   - [ ] Verify system recovery
   - [ ] Monitor for stability

5. **Post-Incident** (Within 24 hours)
   - [ ] Conduct post-mortem
   - [ ] Document lessons learned
   - [ ] Update procedures
   - [ ] Implement preventive measures

### Emergency Contacts ✅

- **Primary On-Call**: System Administrator
- **Secondary On-Call**: Development Team Lead  
- **Escalation**: Project Manager
- **Executive Escalation**: Technical Director

---

## Documentation Requirements ✅

### Deployment Documentation ✅

- [ ] **Update deployment history**
  ```markdown
  ## Deployment History
  - v1.2.0 - 2025-08-28 - Added video generation improvements
  - v1.1.5 - 2025-08-25 - Fixed memory leak in monitoring
  - v1.1.4 - 2025-08-22 - Enhanced security headers
  ```

- [ ] **Update configuration changes**
  - Environment variable updates
  - Infrastructure changes
  - Security policy updates

- [ ] **Update API documentation if needed**
  ```bash
  # Regenerate API docs if endpoints changed
  npm run docs:generate
  ```

### Operational Documentation ✅

- [ ] **Update monitoring runbooks**
  - New alert procedures
  - Updated troubleshooting steps
  - Performance baseline updates

- [ ] **Update security procedures**
  - New security measures
  - Updated incident response
  - Access control changes

### Communication ✅

- [ ] **Notify stakeholders of completion**
  - Deployment summary
  - Changes deployed
  - Impact on users
  - Next steps

- [ ] **Update status pages if applicable**
  - Service status
  - Maintenance windows
  - Known issues

---

## Final Verification Checklist ✅

### System Health ✅
- [ ] All health checks passing
- [ ] No active alerts
- [ ] Error rates <1%
- [ ] Response times normal
- [ ] Resource usage normal

### Functionality ✅
- [ ] Video generation working
- [ ] Chat refinement working
- [ ] Status tracking working
- [ ] Admin dashboard accessible
- [ ] Monitoring data flowing

### Security ✅
- [ ] Authentication working
- [ ] Rate limiting active
- [ ] Security headers present
- [ ] Audit logging enabled
- [ ] Secrets properly secured

### Performance ✅
- [ ] Response times acceptable
- [ ] Resource usage optimal
- [ ] No memory leaks
- [ ] Database performance good
- [ ] CDN functioning properly

### Business Continuity ✅
- [ ] Backups working
- [ ] Rollback plan tested
- [ ] Monitoring in place
- [ ] Documentation updated
- [ ] Team notified

---

**✅ Production Deployment Complete**

**Deployment Details:**
- **Date**: [YYYY-MM-DD HH:MM JST]
- **Version**: [v1.x.x]  
- **Deployed By**: [Name]
- **Review By**: [Name]
- **Rollback Plan**: [Verified/Ready]

**Post-Deployment Actions:**
- [ ] Monitor for first 30 minutes
- [ ] Review in 24 hours
- [ ] Weekly performance review scheduled
- [ ] Next deployment planning updated

This checklist ensures that every production deployment follows best practices and maintains the high reliability and security standards expected for AdCraft AI.