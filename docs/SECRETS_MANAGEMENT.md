# Secrets Management - Pulumi Best Practices

## ✅ What We Fixed

**Before (INSECURE):**

```typescript
// ❌ BAD: Hardcoded API key in code (checked into git)
{
  name: 'GEMINI_API_KEY',
  value: 'xxx',
}
```

**After (SECURE):**

```typescript
// ✅ GOOD: API key stored as encrypted Pulumi secret
const geminiApiKey = config.requireSecret('gemini-api-key');

{
  name: 'GEMINI_API_KEY',
  value: geminiApiKey,  // Pulumi Output<string>
}
```

---

## 🔐 How to Use Pulumi Secrets

### Step 1: Set the Secret (One-time Setup)

```bash
cd infrastructure
pulumi config set --secret gemini-api-key YOUR_API_KEY_HERE
```

**What this does:**

- Encrypts the value using Pulumi's encryption
- Stores it in `Pulumi.dev.yaml` (encrypted, safe to commit)
- Never exposes plaintext in your code

### Step 2: Verify the Secret is Set

```bash
pulumi config get gemini-api-key
# Output: [secret]
```

To see the actual value (for debugging):

```bash
pulumi config get gemini-api-key --show-secrets
# Output: xxx
```

### Step 3: Deploy with the Secret

```bash
pulumi up --yes
```

Pulumi will:

1. Decrypt the secret at runtime
2. Pass it to Cloud Run as an environment variable
3. Never log the plaintext value

---

## 📁 What Files Store Secrets?

### `Pulumi.dev.yaml` (SAFE to commit)

```yaml
config:
  gcp:project: adcraft-dev-2025
  gcp:region: asia-northeast1
  adcraft-ai:gemini-api-key:
    secure: AAABADfJ... # Encrypted ciphertext
```

✅ **This file is SAFE to commit to git** because the value is encrypted.

### `.env.local` (NEVER commit)

```bash
# Local development only
GEMINI_API_KEY=xxx
```

❌ **This file should NEVER be committed to git** (already in `.gitignore`)

---

## 🔄 How It Works

### Development vs Production

**Local Development (.env.local):**

- Next.js reads from `.env.local`
- Simple, no encryption needed (local only)
- File is git-ignored

**Production (Cloud Run):**

- Pulumi reads encrypted secret from `Pulumi.dev.yaml`
- Passes decrypted value to Cloud Run as environment variable
- Cloud Run receives: `GEMINI_API_KEY=AIzaSy...`

### Architecture Diagram

```
┌─────────────────┐
│  .env.local     │  (Local dev, git-ignored)
│  GEMINI_API_KEY │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│  Next.js App        │
│  (Development)      │
└─────────────────────┘


┌──────────────────────┐
│ Pulumi.dev.yaml      │  (Encrypted, safe to commit)
│ secure: AAABAD...    │
└────────┬─────────────┘
         │ pulumi up
         ▼
┌──────────────────────┐
│ infrastructure/      │
│ index.ts             │  config.requireSecret('gemini-api-key')
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ Cloud Run            │
│ env:                 │
│   GEMINI_API_KEY=... │  (Decrypted at runtime)
└──────────────────────┘
```

---

## 🛡️ Security Best Practices

### ✅ DO:

1. **Use Pulumi secrets for production:**

   ```bash
   pulumi config set --secret api-key VALUE
   ```

2. **Keep `.env.local` git-ignored:**

   ```bash
   # .gitignore
   .env.local
   .env*.local
   ```

3. **Use different secrets per environment:**

   ```bash
   # Development stack
   pulumi stack select dev
   pulumi config set --secret gemini-api-key DEV_KEY

   # Production stack
   pulumi stack select prod
   pulumi config set --secret gemini-api-key PROD_KEY
   ```

4. **Rotate secrets regularly:**
   ```bash
   # Update the secret
   pulumi config set --secret gemini-api-key NEW_KEY
   pulumi up --yes  # Redeploy with new key
   ```

### ❌ DON'T:

1. **Never hardcode secrets in TypeScript files:**

   ```typescript
   // ❌ BAD
   const apiKey = "AIzaSyC4DWI8zy...";
   ```

2. **Never commit `.env.local`:**

   ```bash
   # ❌ BAD - exposes secrets
   git add .env.local
   ```

3. **Never log secrets:**

   ```typescript
   // ❌ BAD
   console.log("API Key:", apiKey);

   // ✅ GOOD
   console.log("API Key:", apiKey ? "[REDACTED]" : "not set");
   ```

4. **Never expose secrets in client-side code:**

   ```typescript
   // ❌ BAD - client components can't use secrets
   "use client";
   const apiKey = process.env.GEMINI_API_KEY; // Exposed to browser!

   // ✅ GOOD - only use in API routes or server components
   export async function POST(request: Request) {
     const apiKey = process.env.GEMINI_API_KEY; // Safe, server-side only
   }
   ```

---

## 🔧 Troubleshooting

### Problem: Secret not found

```
error: missing required configuration variable 'adcraft-ai:gemini-api-key'
```

**Solution:**

```bash
pulumi config set --secret gemini-api-key YOUR_API_KEY
```

### Problem: Wrong secret value in production

**Check current value:**

```bash
pulumi config get gemini-api-key --show-secrets
```

**Update:**

```bash
pulumi config set --secret gemini-api-key CORRECT_VALUE
pulumi up --yes
```

### Problem: Secret appears as `[secret]` in logs

This is **correct behavior**! Pulumi automatically redacts secret values in output.

---

## 📚 Additional Secrets

If you need to add more secrets (e.g., database passwords, OAuth tokens):

```bash
# Set the secret
pulumi config set --secret database-password SUPER_SECRET_PASSWORD

# Use in code
const dbPassword = config.requireSecret('database-password');

// Pass to Cloud Run
{
  name: 'DATABASE_PASSWORD',
  value: dbPassword,
}
```

---

## 🌍 Multi-Environment Setup

### Development Stack

```bash
pulumi stack select dev
pulumi config set --secret gemini-api-key DEV_API_KEY
pulumi config set gcp:project adcraft-dev-2025
```

### Production Stack

```bash
pulumi stack select prod
pulumi config set --secret gemini-api-key PROD_API_KEY
pulumi config set gcp:project adcraft-prod-2025
```

Each stack has its own encrypted secrets in:

- `Pulumi.dev.yaml` (development)
- `Pulumi.prod.yaml` (production)

---

## ✅ Security Checklist

Before committing to git:

- [ ] No hardcoded API keys in `.ts` files
- [ ] `.env.local` is git-ignored
- [ ] Secrets are set via `pulumi config set --secret`
- [ ] `Pulumi.*.yaml` shows `secure: AAABA...` (encrypted)
- [ ] Deployment successful with secrets working
- [ ] No plaintext secrets in logs or console output

---

## 🎓 Why This Matters

### The Risk of Hardcoded Secrets

If you commit secrets to git:

1. **Anyone with repo access can see them** (past, present, future)
2. **Git history preserves them forever** (even if deleted later)
3. **GitHub secret scanning will detect and alert**
4. **Attackers can abuse leaked API keys** (cost you money)

### The Pulumi Solution

- ✅ Secrets encrypted at rest
- ✅ Decrypted only at deployment time
- ✅ Never appear in git history
- ✅ Per-stack isolation (dev/prod separate)
- ✅ Audit trail (who changed what, when)

---

## 📖 Further Reading

- [Pulumi Secrets Documentation](https://www.pulumi.com/docs/concepts/secrets/)
- [Google Cloud Secret Manager Integration](https://www.pulumi.com/registry/packages/gcp/api-docs/secretmanager/)
- [Environment Variables Best Practices](https://12factor.net/config)

---

**Last Updated:** October 31, 2025
**Status:** ✅ Secrets properly managed with Pulumi config
