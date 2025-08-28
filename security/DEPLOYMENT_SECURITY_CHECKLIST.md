# Deployment Security Checklist - AdCraft AI

This checklist ensures all security measures are properly configured before deploying the AdCraft AI application to production.

## 🔐 Pre-Deployment Security Checklist

### Infrastructure Security

#### ✅ Google Cloud IAM Configuration
- [ ] **Service Account Permissions**: Verify principle of least privilege is applied
  - [ ] Remove unnecessary `storage.admin` role (use `storage.objectUser`)
  - [ ] Remove unnecessary `datastore.owner` role (use `datastore.user`)  
  - [ ] Remove unnecessary `run.developer` role (use `run.invoker`)
  - [ ] Replace `monitoring.editor` with `monitoring.metricWriter`
- [ ] **Workload Identity**: Implement instead of service account keys where possible
- [ ] **Resource-Level IAM**: Apply fine-grained permissions to specific resources

#### ✅ Network Security
- [ ] **HTTPS Enforcement**: Ensure all traffic is encrypted in transit
- [ ] **VPC Configuration**: Configure appropriate network isolation
- [ ] **Firewall Rules**: Restrict access to necessary ports and IPs only
- [ ] **Load Balancer Security**: Configure appropriate security policies

#### ✅ Cloud Run Configuration
- [ ] **Container Security**: Verify non-root user configuration
- [ ] **Resource Limits**: Set appropriate CPU and memory limits
- [ ] **Environment Variables**: Secure handling of sensitive configuration
- [ ] **Ingress Control**: Configure ingress settings appropriately

### Application Security

#### ✅ Security Headers
- [ ] **Content Security Policy (CSP)**: Comprehensive CSP policy implemented
- [ ] **HSTS**: HTTP Strict Transport Security with preload enabled
- [ ] **X-Frame-Options**: Clickjacking protection enabled
- [ ] **X-Content-Type-Options**: MIME sniffing protection enabled
- [ ] **Permissions-Policy**: Feature policy restrictions applied
- [ ] **Cross-Origin Policies**: CORP, COEP, COOP configured appropriately

#### ✅ Input Validation & Sanitization
- [ ] **XSS Prevention**: Comprehensive XSS filtering implemented
- [ ] **Input Sanitization**: All user inputs properly sanitized
- [ ] **Content Policy**: Prohibited content filtering active
- [ ] **File Upload Security**: File type and content validation implemented
- [ ] **SQL Injection Prevention**: Parameterized queries used (N/A for Firestore)

#### ✅ Rate Limiting & DoS Protection
- [ ] **API Rate Limiting**: Per-IP and per-endpoint limits configured
- [ ] **Video Generation Limits**: Strict limits on expensive operations
- [ ] **Status Check Limits**: Reasonable polling rate limits
- [ ] **Memory-based Limiting**: In-memory rate limiting for demo deployment

#### ✅ Authentication & Authorization
- [ ] **API Authentication**: Consider API key authentication for production
- [ ] **Admin Endpoints**: Secure admin endpoints with proper authentication
- [ ] **Session Management**: Secure session handling implemented
- [ ] **Request Signing**: Consider request signing for sensitive operations

### Data Protection

#### ✅ Data Privacy & Retention
- [ ] **Data Retention Policy**: 12-hour automatic cleanup configured
- [ ] **Personal Data Handling**: No permanent storage of personal information
- [ ] **Encryption at Rest**: Google Cloud default encryption verified
- [ ] **Encryption in Transit**: HTTPS enforcement verified

#### ✅ Logging & Monitoring
- [ ] **Security Event Logging**: Security monitoring service active
- [ ] **Error Logging**: Structured logging without sensitive data exposure
- [ ] **Audit Trails**: Important operations logged with correlation IDs
- [ ] **Alert Configuration**: Security alerts configured for critical events

### Monitoring & Incident Response

#### ✅ Security Monitoring
- [ ] **Real-time Monitoring**: Security event monitoring active
- [ ] **Alert Thresholds**: Appropriate alert thresholds configured
- [ ] **Dashboard Access**: Security dashboard accessible to administrators
- [ ] **Incident Response Plan**: Basic incident response procedures documented

#### ✅ Performance & Availability
- [ ] **Health Checks**: Application health monitoring configured
- [ ] **Resource Monitoring**: CPU, memory, and request monitoring active
- [ ] **Error Rates**: Error rate monitoring and alerting configured
- [ ] **Uptime Monitoring**: External uptime monitoring configured

## 🚀 Deployment Commands

### 1. Infrastructure Security Update
```bash
# Update IAM permissions with least privilege
cd infrastructure
pulumi up --preview  # Review changes first
pulumi up           # Apply security updates
```

### 2. Application Security Test
```bash
# Run security tests
npm run test:security
npm run test:integration

# Build and test container
docker build -t adcraft-security-test .
docker run --rm adcraft-security-test npm run test
```

### 3. Security Configuration Verification
```bash
# Verify environment variables are set securely
# Check that no secrets are in source code
grep -r "password\|secret\|key" . --exclude-dir=node_modules --exclude-dir=.git

# Verify security headers in deployed application
curl -I https://your-domain.com/api/health
```

## 🔍 Post-Deployment Verification

### Security Headers Test
```bash
# Test security headers
curl -I https://adcraft-service-1029593129571.asia-northeast1.run.app/ | grep -E "(X-Frame-Options|X-Content-Type-Options|Content-Security-Policy|Strict-Transport-Security)"
```

### Rate Limiting Test
```bash
# Test rate limiting (adjust URL as needed)
for i in {1..65}; do
  curl -w "%{http_code}\n" -o /dev/null -s https://your-domain.com/api/status/test-job
done
# Should return 429 after exceeding limits
```

### Security Monitoring Test
```bash
# Test security monitoring endpoint (admin access required)
curl https://your-domain.com/api/admin/security
```

### Content Security Policy Test
```bash
# Verify CSP is working
curl -H "Accept: text/html" https://your-domain.com/ | grep -o "Content-Security-Policy.*"
```

## 🚨 Security Incident Response

### In Case of Security Alert

1. **Immediate Response**
   - Check security dashboard: `/api/admin/security`
   - Review recent security events and alerts
   - Identify affected endpoints and sources

2. **Threat Assessment**
   - Determine severity and scope of the incident
   - Check for signs of successful attacks
   - Review system integrity

3. **Containment**
   - Block suspicious IP addresses if necessary
   - Increase rate limiting for affected endpoints
   - Consider temporary service restrictions

4. **Investigation**
   - Export security report for analysis
   - Review logs for attack patterns
   - Document findings and remediation steps

5. **Recovery**
   - Apply necessary security patches
   - Update security configurations
   - Monitor for continued threats

## 📋 Security Maintenance Schedule

### Daily
- [ ] Review security alerts and events
- [ ] Check for failed authentication attempts
- [ ] Monitor error rates and unusual patterns

### Weekly
- [ ] Review security metrics and trends
- [ ] Update security rules if needed
- [ ] Check for new vulnerabilities in dependencies

### Monthly
- [ ] Full security audit and penetration testing
- [ ] Update security documentation
- [ ] Review and test incident response procedures

## 🔒 Production Security Recommendations

### Immediate (Pre-Production)
1. **Implement proper API authentication**
2. **Configure Workload Identity instead of service account keys**
3. **Set up comprehensive monitoring and alerting**
4. **Create proper backup and recovery procedures**

### Medium Term
1. **Implement user authentication system**
2. **Add comprehensive audit logging**
3. **Set up automated security testing in CI/CD**
4. **Implement Web Application Firewall (WAF)**

### Long Term
1. **Regular penetration testing**
2. **Security team training and awareness**
3. **Compliance auditing (SOC 2, ISO 27001, etc.)**
4. **Advanced threat detection and response**

---

**⚠️ IMPORTANT**: This checklist is specifically designed for the AdCraft AI minimal video generator. Adapt security measures based on your specific deployment environment, compliance requirements, and threat model.

**📞 Support**: For security questions or incident response, refer to your organization's security team or the development team responsible for this application.