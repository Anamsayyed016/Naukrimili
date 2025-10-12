# PostgreSQL Authentication Guide for Linux Server

## Problem
```
psql: error: FATAL: password authentication failed for user "postgres"
password retrieved from file "/root/.pgpass"
```

## Solutions

### 1. Interactive Password Prompt (Easiest)
```bash
psql -h localhost -U postgres -d jobportal -W
```
- The `-W` flag forces password prompt
- Enter your PostgreSQL password when prompted

### 2. Environment Variable (Quick Fix)
```bash
export PGPASSWORD="your_actual_postgres_password"
psql -h localhost -U postgres -d jobportal -f fix-database-permissions.sql
unset PGPASSWORD  # Clear password from environment
```

### 3. Fix .pgpass File (Most Secure)
```bash
# Check current .pgpass content
cat ~/.pgpass

# Remove incorrect entry
rm ~/.pgpass

# Create new .pgpass with correct password
echo "localhost:5432:jobportal:postgres:your_actual_password" > ~/.pgpass
chmod 600 ~/.pgpass

# Test connection
psql -h localhost -U postgres -d jobportal
```

### 4. Use sudo (If postgres user exists)
```bash
sudo -u postgres psql -d jobportal
```

### 5. Check PostgreSQL Configuration
```bash
# Check if PostgreSQL is running
systemctl status postgresql

# Check PostgreSQL configuration
sudo cat /etc/postgresql/*/main/pg_hba.conf | grep -E "(local|host)"
```

## Common Issues

### Issue 1: Wrong Password
- Verify your PostgreSQL password
- Try resetting it: `sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'new_password';"`

### Issue 2: PostgreSQL Not Running
```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Issue 3: Wrong Authentication Method
Check `/etc/postgresql/*/main/pg_hba.conf`:
```
# Should have these lines for local connections:
local   all             postgres                                peer
host    all             postgres        127.0.0.1/32            md5
host    all             postgres        ::1/128                 md5
```

## Quick Fix Commands

### Step 1: Try Interactive Login
```bash
psql -h localhost -U postgres -d jobportal -W
```

### Step 2: If that fails, use environment variable
```bash
export PGPASSWORD="your_password"
psql -h localhost -U postgres -d jobportal -f fix-database-permissions.sql
```

### Step 3: Verify the fix worked
```bash
npx prisma db push
```
