# 🔑 SSH Key Setup for Automated Deployment

## 📋 Public Key (copy to VPS)

```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDE6lO5FDdHmBYG89yDnGstxyWe4heJkgLROW/s+E6zd3f31V8DQ7Czb15hSi1GNiHDy/B7LJn2QtVi+DKvIILLapikLoHh5BsJ330JYycR6UfO9uHKnnTb5POBP3ZoFZVovyXT0yjekpp3uJP2K8vei7ws1hgavbCmYT4ZTrU8u+LNEEQpPHalB29Qzfo5g24Gw6Ll+n1aGt+JdgV7NaVFoe4/6L1mb4j6KTxeslK0PvZzDcRpmsuPjOrH4XHm1ToSWMs7PqXdolUUq8sD5MH+ZxHtUM6EJS5X/PieHpFajSnZTrjcyDgJ9t1GFG9TL2/Hej+njBp75mQ0dzGr87RXB6m02gMuWTsVqR8cwuzpXRvjmyj29lUhi68LDmQy9QnCJTzhI95AF6uildS8Et2QmX7lw37BNQVPeOaolIN/txfuo2n4meoRlA2q4W8UkpKYjIY2r/IR9hTpan4QbuH+uM56hP8AeP2UmXA6F0BwHyR/8xl92l0elut30ySfvnsgeLXS/iju+md4EcHJgw/NLcCDXor3+tLlZ0HryLZRVs3FQ1+OKkkzd7QownBvCiC9eIgpy2JMIMXkIbg9UIZtsjlpugt36knplkohJKIrt8R4cBwgDdCQVFMjdLhBBJbMIRvNkwTqE/eNcdyU0a537haTk8wRaQqO5vs5Zaz8Xw== deployment@jobportal.com
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
echo 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDE6lO5FDdHmBYG89yDnGstxyWe4heJkgLROW/s+E6zd3f31V8DQ7Czb15hSi1GNiHDy/B7LJn2QtVi+DKvIILLapikLoHh5BsJ330JYycR6UfO9uHKnnTb5POBP3ZoFZVovyXT0yjekpp3uJP2K8vei7ws1hgavbCmYT4ZTrU8u+LNEEQpPHalB29Qzfo5g24Gw6Ll+n1aGt+JdgV7NaVFoe4/6L1mb4j6KTxeslK0PvZzDcRpmsuPjOrH4XHm1ToSWMs7PqXdolUUq8sD5MH+ZxHtUM6EJS5X/PieHpFajSnZTrjcyDgJ9t1GFG9TL2/Hej+njBp75mQ0dzGr87RXB6m02gMuWTsVqR8cwuzpXRvjmyj29lUhi68LDmQy9QnCJTzhI95AF6uildS8Et2QmX7lw37BNQVPeOaolIN/txfuo2n4meoRlA2q4W8UkpKYjIY2r/IR9hTpan4QbuH+uM56hP8AeP2UmXA6F0BwHyR/8xl92l0elut30ySfvnsgeLXS/iju+md4EcHJgw/NLcCDXor3+tLlZ0HryLZRVs3FQ1+OKkkzd7QownBvCiC9eIgpy2JMIMXkIbg9UIZtsjlpugt36knplkohJKIrt8R4cBwgDdCQVFMjdLhBBJbMIRvNkwTqE/eNcdyU0a537haTk8wRaQqO5vs5Zaz8Xw== deployment@jobportal.com' >> ~/.ssh/authorized_keys
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
ssh -i ~/.ssh/jobportal_deploy root@69.62.73.84
```

### 4. Push Changes
After updating the secrets, push a change to trigger the deployment:
```bash
git add .
git commit -m "Test automated deployment"
git push origin main
```

## 🎯 What This Fixes
- **SSH authentication error** will be resolved
- **GitHub Actions** will be able to connect to your VPS
- **Automated deployment** will work correctly

## 🚨 Important Notes
- **SSH_KEY secret** must contain the **private key** (not the public key)
- **Public key** goes on the VPS
- **Private key** goes in GitHub secrets
- Keep both keys secure and never share the private key
