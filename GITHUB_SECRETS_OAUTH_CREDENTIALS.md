# 🔑 GitHub Secrets - OAuth Credentials

## ✅ **Your Google OAuth Credentials for GitHub Secrets**

Add these secrets to your GitHub repository:

---

### **Secret 1: Google Client ID**

**Name:** `GOOGLE_CLIENT_ID`

**Value:**
```
493126917457-h7vj7vlrjhke57pbrang2b6pc0b0q88j.apps.googleusercontent.com
```

---

### **Secret 2: Google Client Secret**

**Name:** `GOOGLE_CLIENT_SECRET`

**Value:**
```
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--
```

---

## 📋 **How to Add Secrets**

1. Go to your GitHub repository
2. Click **Settings** (top navigation)
3. Click **Secrets and variables** → **Actions** (left sidebar)
4. Click **"New repository secret"** button
5. Enter the **Name** and **Value** for each secret above
6. Click **"Add secret"**
7. Repeat for the second secret

---

## ✅ **Verification**

After adding secrets, they will be automatically used in your deployment workflow. The workflow already exports these environment variables to your server.

---

## 🔒 **Security Note**

These credentials are sensitive. Never commit them to your repository. Always use GitHub Secrets for production credentials.
