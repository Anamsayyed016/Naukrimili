# User Management Scripts

This directory contains comprehensive scripts for managing users in your job portal database.

## 🚀 Quick Start

### Windows (PowerShell)
```powershell
.\scripts\remove-users.ps1
```

### Linux/macOS (Bash)
```bash
./scripts/remove-users.sh
```

### Direct Node.js
```bash
node scripts/server-user-management.js --help
```

## 📋 Available Scripts

### 1. `server-user-management.js` - Main Script
The comprehensive user management script with multiple options:

**Options:**
- `--list` - List all users with details
- `--remove-all` - Remove ALL users (DANGEROUS!)
- `--remove-test` - Remove test users only (SAFE)
- `--remove-oauth` - Remove OAuth users only
- `--remove-by-email user@example.com` - Remove specific user
- `--remove-by-role jobseeker` - Remove users by role
- `--remove-inactive` - Remove inactive users (30+ days)

**Examples:**
```bash
# List all users
node scripts/server-user-management.js --list

# Remove test users safely
node scripts/server-user-management.js --remove-test

# Remove OAuth users
node scripts/server-user-management.js --remove-oauth

# Remove specific user
node scripts/server-user-management.js --remove-by-email test@example.com

# Remove all job seekers
node scripts/server-user-management.js --remove-by-role jobseeker

# Remove inactive users
node scripts/server-user-management.js --remove-inactive
```

### 2. `remove-users.sh` - Linux/macOS Wrapper
Interactive shell script for easy user management.

### 3. `remove-users.ps1` - Windows Wrapper
Interactive PowerShell script for Windows users.

## 🛡️ Safety Features

### Confirmation Prompts
- All destructive operations require confirmation
- 5-second delay for critical operations
- Clear warnings for dangerous actions

### Data Integrity
- Proper foreign key constraint handling
- Deletion in correct order to avoid errors
- Rollback-safe operations

### Production Protection
- Blocks dangerous operations in production
- Requires `FORCE_RESET=true` to override
- Environment-specific safety checks

## 🎯 User Identification

### Test Users
Automatically identifies test users by:
- Email patterns: `test`, `example`, `demo`, `sample`, `gmail.com`, `yahoo.com`, etc.
- Name patterns: Contains test-related keywords
- Recent creation dates

### OAuth Users
Identifies users who:
- Have no password (OAuth-only)
- Have OAuth account connections
- Can be safely removed for testing

### Inactive Users
Identifies users who:
- Are marked as inactive (`isActive: false`)
- Haven't logged in for 30+ days
- Have never logged in and were created 30+ days ago

## 📊 Data Cleanup

The scripts properly clean up all related data:

1. **Notifications** - User notifications
2. **Applications** - Job applications
3. **Resumes** - Uploaded resumes
4. **Sessions** - Active sessions
5. **OAuth Accounts** - OAuth connections
6. **Job Bookmarks** - Saved jobs
7. **Search History** - Search queries
8. **Settings** - User preferences
9. **Mobile Errors** - Error logs
10. **Analytics Events** - User analytics

## ⚠️ Important Warnings

### Before Running
1. **Always backup your database** before running destructive operations
2. **Test on a development environment** first
3. **Verify your database connection** is correct
4. **Check the user list** before deletion

### Production Safety
- `--remove-all` is blocked in production
- Use `--remove-test` or `--remove-oauth` for production cleanup
- Set `FORCE_RESET=true` to override production protection

## 🔧 Troubleshooting

### Common Issues

**Database Connection Error:**
```
❌ Error: Database connection failed
```
- Check your `.env.local` file
- Verify `DATABASE_URL` is correct
- Ensure database is running

**Permission Denied:**
```
❌ Permission denied
```
- Make scripts executable: `chmod +x scripts/*.sh`
- Run with proper permissions

**No Users Found:**
```
✅ No users found to remove
```
- Database might be empty
- Check with `--list` option first

### Getting Help
```bash
node scripts/server-user-management.js --help
```

## 📝 Logs and Output

The scripts provide detailed output:
- ✅ Success operations
- ⚠️ Warnings and skipped operations
- ❌ Errors and failures
- 📊 Summary statistics
- 🔍 Verification results

## 🎉 Success Indicators

After successful cleanup:
- User count shows 0 or reduced number
- Related data counts show 0
- No foreign key constraint errors
- Database is clean and ready for testing

---

**Remember: Always backup your database before running destructive operations!**
