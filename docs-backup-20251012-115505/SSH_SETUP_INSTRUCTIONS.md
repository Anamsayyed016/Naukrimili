# 🔑 SSH Key Setup for Automated Deployment

## 📋 Public Key (copy to VPS)

```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDD7GXXEmNLtvAZa0Blyp1sCkywsnpZ6HeqjvyCKy6pVEtQFOGr3jCK0f0byMWN9x5uPQaxo6WMV7kPkWR3DXyiwvcpTctZs0dNU+rUckW5fMkHR+3afqn5Mo1eRnMv7NwGt0xJ4YdAP+JatIRSuzH3WdiTh5UCpkjUq+EbWPjc+++FoKc9H5Tk51QcxDtWu4alMnqA312fChDg/6FPEX2CtNotHd6/qQdoi61g4FZpsSHVQ732zYM4qERtfYhbryhbSyTpbZY9RdINQ6DIOwwutGEaviY+R4aBSa/7X4ixubQo9H6iiPcJimOEo/DSm7R2lSM1Jf9bXm8b+s21+VAG3EpFBfoe2dCdkCVl5NBCbaA+2Iqm3hWJF+X7GDPGazbGo2eaXd09j9gox0cADx45V3+P0vrZ/hdGOTQZAvgTV6BG1IkpI7HD7+utxoGKkWEnql6Mz/Mh+m6H6yYWd0xDb71dw8cx7c4dX7Cdp/md93i7fe1Adp7EfzGzIi41dgsdksk1o2UT9HEyW6cRNRH4NdI+V3MlMn4kjtAlsHsE0W0ss8lYflbAMj5EAy7Z7OO8Ss1hAZyJK7NUlotBc+1xRN65VCYCset1WptICTr+4WN7hPo8FT63pt9OgKfkPpujMj7bkNQ/Ix4ZYbT/nkQmPB+QaVdu7DZOYk9Bzm7g1w== anams@admin
```

## 🔐 Private Key (copy to GitHub SSH_KEY secret)

```
-----BEGIN OPENSSH PRIVATE KEY-----
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
-----END OPENSSH PRIVATE KEY-----
```

## 📋 Setup Instructions

### 1. Add Public Key to VPS
SSH into your VPS and run:
```bash
ssh root@69.62.73.84
echo 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDD7GXXEmNLtvAZa0Blyp1sCkywsnpZ6HeqjvyCKy6pVEtQFOGr3jCK0f0byMWN9x5uPQaxo6WMV7kPkWR3DXyiwvcpTctZs0dNU+rUckW5fMkHR+3afqn5Mo1eRnMv7NwGt0xJ4YdAP+JatIRSuzH3WdiTh5UCpkjUq+EbWPjc+++FoKc9H5Tk51QcxDtWu4alMnqA312fChDg/6FPEX2CtNotHd6/qQdoi61g4FZpsSHVQ732zYM4qERtfYhbryhbSyTpbZY9RdINQ6DIOwwutGEaviY+R4aBSa/7X4ixubQo9H6iiPcJimOEo/DSm7R2lSM1Jf9bXm8b+s21+VAG3EpFBfoe2dCdkCVl5NBCbaA+2Iqm3hWJF+X7GDPGazbGo2eaXd09j9gox0cADx45V3+P0vrZ/hdGOTQZAvgTV6BG1IkpI7HD7+utxoGKkWEnql6Mz/Mh+m6H6yYWd0xDb71dw8cx7c4dX7Cdp/md93i7fe1Adp7EfzGzIi41dgsdksk1o2UT9HEyW6cRNRH4NdI+V3MlMn4kjtAlsHsE0W0ss8lYflbAMj5EAy7Z7OO8Ss1hAZyJK7NUlotBc+1xRN65VCYCset1WptICTr+4WN7hPo8FT63pt9OgKfkPpujMj7bkNQ/Ix4ZYbT/nkQmPB+QaVdu7DZOYk9Bzm7g1w== anams@admin' >> ~/.ssh/authorized_keys
```

### 2. Update GitHub Secrets
Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**

Update these secrets:
- **SSH_KEY**: Copy the entire private key above (starts with `-----BEGIN OPENSSH PRIVATE KEY-----`)
- **HOST**: `69.62.73.84`
- **SSH_USER**: `root`
- **SSH_PORT**: `22`

### 3. Test Connection
Test the SSH connection:
```bash
ssh -i ~/.ssh/jobportal_new root@69.62.73.84
```

### 4. Push Changes
After updating the secrets, push a change to trigger the deployment:
```bash
git add .
git commit -m "Test automated deployment"
git push origin main
```

## 🔧 **What Was Fixed:**

The previous SSH key had a **libcrypto error** because it was corrupted or improperly formatted. This new key:
- ✅ **Properly formatted** OpenSSH private key
- ✅ **No passphrase** (empty passphrase for automation)
- ✅ **4096-bit RSA** (strong encryption)
- ✅ **Compatible** with GitHub Actions ssh-agent

## 🚀 **Next Steps:**

1. **Copy the public key** to your VPS (`~/.ssh/authorized_keys`)
2. **Update GitHub secrets** with the new private key
3. **Push changes** to trigger deployment
4. **Monitor GitHub Actions** for successful deployment

This should resolve the "error in libcrypto" and "ssh: no key found" errors! 🎉
