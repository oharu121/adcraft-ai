# AdCraft AI - Deployment Quick Reference

One-page guide for quick deployments.

---

## 🚀 Quick Deploy (2 Minutes)

```bash
# 1. Build, tag, and push Docker image
npm run docker:deploy

# 2. Deploy to Cloud Run
cd infrastructure
pulumi stack select dev
pulumi up --yes
cd ..

# 3. Verify
npm run gcloud:url
curl $(npm run gcloud:url --silent)/api/health
```

---

## 📋 Prerequisites Checklist

- [ ] Docker installed and running
- [ ] gcloud CLI installed
- [ ] Authenticated: `gcloud auth login`
- [ ] Project set: `gcloud config set project adcraft-dev-2025`
- [ ] Docker auth: `gcloud auth configure-docker asia-northeast1-docker.pkg.dev`
- [ ] Pulumi installed (optional, can use gcloud instead)

---

## 🔧 Individual Steps

### Build
```bash
npm run docker:build
# Duration: ~48s
# Creates: Local image 'adcraft-ai'
```

### Tag
```bash
npm run docker:tag
# Duration: <1s
# Creates: Remote tag for Artifact Registry
```

### Push
```bash
npm run docker:push
# Duration: ~10s (only changed layers)
# Uploads to: asia-northeast1-docker.pkg.dev
```

### Deploy
```bash
cd infrastructure
pulumi stack select dev
pulumi up --yes
# Duration: ~23s
# Updates: Cloud Run service
```

---

## 🐛 Common Issues

### Docker Build Fails
```bash
# Clean and retry
rm -rf .next node_modules
npm install
npm run docker:build
```

### Push Unauthorized
```bash
# Re-authenticate
gcloud auth configure-docker asia-northeast1-docker.pkg.dev
```

### Pulumi Stack Error
```bash
# Select stack
cd infrastructure
pulumi stack ls
pulumi stack select dev
```

### Service Not Responding
```bash
# Check logs
gcloud run logs tail adcraft-service --region=asia-northeast1
```

---

## 📊 Verify Deployment

```bash
# Get URL
npm run gcloud:url

# Test health
curl https://adcraft-service-ybvh3xrona-an.a.run.app/api/health

# Check logs
gcloud run logs read adcraft-service --region=asia-northeast1 --limit=20

# View metrics
gcloud run services describe adcraft-service --region=asia-northeast1
```

---

## 🔄 Update Deployment

### Code Changes Only
```bash
npm run docker:deploy
cd infrastructure && pulumi up --yes
```

### Infrastructure Changes
```bash
# Edit infrastructure/*.ts
cd infrastructure
pulumi preview  # See changes
pulumi up       # Apply changes
```

---

## 🎯 Key URLs

- **Live App**: https://adcraft-service-ybvh3xrona-an.a.run.app
- **GCP Console**: https://console.cloud.google.com/run/detail/asia-northeast1/adcraft-service
- **Pulumi**: https://app.pulumi.com/oharu121/adcraft-ai-infrastructure/dev
- **Artifact Registry**: https://console.cloud.google.com/artifacts

---

## 💰 Cost Monitoring

```bash
# View current spend
gcloud billing accounts list

# Check budget
gcloud alpha billing budgets list --billing-account=YOUR_BILLING_ACCOUNT_ID
```

**Estimated Costs**:
- Idle: ~$1/month
- Light use: ~$30/month
- Heavy use: ~$150/month

---

## 📝 Configuration Files

| File | Purpose |
|------|---------|
| `Dockerfile` | Container build instructions |
| `infrastructure/compute.ts` | Cloud Run configuration |
| `infrastructure/iam.ts` | Permissions |
| `package.json` | Deployment scripts |

---

## 🆘 Emergency Rollback

```bash
# List recent revisions
gcloud run revisions list --service=adcraft-service --region=asia-northeast1

# Rollback to previous
gcloud run services update-traffic adcraft-service \
  --region=asia-northeast1 \
  --to-revisions=PREVIOUS_REVISION=100
```

---

## 📞 Support

- **Documentation**: [DEPLOYMENT_WALKTHROUGH.md](./DEPLOYMENT_WALKTHROUGH.md)
- **Logs**: `gcloud run logs tail adcraft-service --region=asia-northeast1`
- **Status**: `curl https://adcraft-service-ybvh3xrona-an.a.run.app/api/health`
