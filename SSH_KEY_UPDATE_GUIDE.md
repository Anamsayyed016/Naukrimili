# SSH Key Update Guide - Critical Fix

Your GitHub Actions deployment is failing because the stored SSH key is encrypted or corrupted. Here's how to fix it:

## Step 1: Update GitHub Secret with New Private Key

1. Go to: https://github.com/Anamsayyed016/Naukrimili/settings/secrets/actions
2. Click on the **SSH_KEY** secret (or create it if it doesn't exist)
3. Click "Update secret"
4. **Replace** the entire value with this new private key (everything below):

```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACCJzB7jn4YVj2bB2/iY40isQ8VSz3kQCJ1c5qn0dto92gAAAJD2DbLP9g2y
zwAAAAtzc2gtZWQyNTUxOQAAACCJzB7jn4YVj2bB2/iY40isQ8VSz3kQCJ1c5qn0dto92g
AAAECBBbXnayE0lpJspicw+PzjUu7ICqRC1/zL4tlNA8KJ7InMHuOfhhWPZsHb+JjjSKxD
xVLPeRAInVzmqfR22j3aAAAADWdpdGh1Yi1kZXBsb3k=
-----END OPENSSH PRIVATE KEY-----
```

⚠️ **CRITICAL**: 
- Do NOT include any extra spaces or blank lines before/after
- Paste EXACTLY as shown above
- Do NOT use a code block editor; paste as plain text

5. Click "Update secret"

## Step 2: Add Public Key to Server

SSH into your server and add the public key to authorized_keys:

```bash
ssh -p 22 root@srv1054971.hstgr.cloud
```

Then run this command on the server to add the new public key:

```bash
cat >> ~/.ssh/authorized_keys << 'EOF'
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIInMHuOfhhWPZsHb+JjjSKxDxVLPeRAInVzmqfR22j3a github-deploy
EOF
```

Verify it was added:
```bash
cat ~/.ssh/authorized_keys
```

You should see a line starting with `ssh-ed25519` and containing `github-deploy`.

## Step 3: Trigger Deployment

After updating both the secret and the server, the next GitHub Actions run will use the new key.

You can trigger it immediately by:
1. Going to: https://github.com/Anamsayyed016/Naukrimili/actions
2. Click "Deploy to Production" workflow
3. Click "Run workflow" button

Or just push an empty commit:
```bash
git commit --allow-empty -m "trigger: deploy with new SSH key"
git push origin main
```

## Step 4: Monitor the Workflow

Watch the GitHub Actions "Deploy to Production" job:
1. Go to Actions tab
2. Click the latest "Deploy to Production" run
3. Click "Fast upload and deploy" step
4. You should now see:
   - ✅ Derived public key from private key
   - ✅ SSH verified - ready to deploy
   - ✅ Upload complete
   - ✅ Deployment script executed successfully

If successful, your website should be live at: **https://naukrimili.com**

---

## Troubleshooting

If deployment still fails after following these steps:

1. **SSH verification failed?** 
   - Verify authorized_keys was updated: `cat ~/.ssh/authorized_keys`
   - Check the public key line is complete (should be one very long line)

2. **Upload failed?**
   - Check server disk space: `df -h`
   - Check /var/www/naukrimili exists: `ls -la /var/www/naukrimili`

3. **Application won't start?**
   - Check PM2 logs: `pm2 logs jobportal --lines 50`
   - Check database connection: `echo $DATABASE_URL`

---

**Questions?** The workflow logs have detailed output for each step.
