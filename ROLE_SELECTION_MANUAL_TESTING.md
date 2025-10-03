# 🧪 Manual Testing Checklist - OAuth Role Selection

## 📋 **Pre-Testing Setup**

### 1. **Database Migration**
```bash
# Apply the role constraints migration
npx prisma db push

# Verify constraints are applied
psql $DATABASE_URL -c "SELECT conname, contype FROM pg_constraint WHERE conrelid = 'User'::regclass AND conname LIKE '%role%';"
```

### 2. **Clear Test Users**
```bash
# Remove any existing test users
node scripts/clear-users.js
```

### 3. **Start Application**
```bash
npm run dev
```

---

## 🎯 **Test Scenarios**

### **Scenario 1: New OAuth User Flow**

#### **Test Steps:**
1. **Open incognito/private browser window**
2. **Navigate to:** `http://localhost:3000/auth/signin`
3. **Click "Sign in with Google"**
4. **Complete Google OAuth flow**

#### **Expected Results:**
- ✅ User is redirected to `/roles/choose` (NOT dashboard)
- ✅ Role selection page loads with two cards: "Job Seeker" and "Employer"
- ✅ User cannot access dashboard without selecting role

#### **Test Data:**
- Use a fresh Google account that hasn't been used before
- Or clear existing user data first

---

### **Scenario 2: Job Seeker Role Selection**

#### **Test Steps:**
1. **Complete Scenario 1 first**
2. **Click on "Job Seeker" card**
3. **Click "Choose Job Seeker" button**
4. **Wait for redirect**

#### **Expected Results:**
- ✅ Role is set to "jobseeker" in database
- ✅ `roleLocked` is set to `true`
- ✅ `lockedRole` is set to "jobseeker"
- ✅ User is redirected to `/dashboard/jobseeker`
- ✅ User cannot change role after selection

#### **Database Verification:**
```sql
SELECT id, email, role, "roleLocked", "lockedRole", "roleLockReason" 
FROM "User" 
WHERE email = 'your-test-email@gmail.com';
```

---

### **Scenario 3: Employer Role Selection**

#### **Test Steps:**
1. **Complete Scenario 1 first (with different Google account)**
2. **Click on "Employer" card**
3. **Click "Choose Employer" button**
4. **Wait for redirect**

#### **Expected Results:**
- ✅ Role is set to "employer" in database
- ✅ `roleLocked` is set to `true`
- ✅ `lockedRole` is set to "employer"
- ✅ User is redirected to `/dashboard/company`
- ✅ User cannot change role after selection

---

### **Scenario 4: Existing User with Role**

#### **Test Steps:**
1. **Use a Google account that already has a role set**
2. **Sign in with Google**
3. **Check redirect behavior**

#### **Expected Results:**
- ✅ User is redirected directly to their dashboard (NOT role selection)
- ✅ Job seekers go to `/dashboard/jobseeker`
- ✅ Employers go to `/dashboard/company`
- ✅ No role selection page is shown

---

### **Scenario 5: Role Lock Enforcement**

#### **Test Steps:**
1. **Complete Scenario 2 or 3 first**
2. **Try to access `/roles/choose` directly**
3. **Try to change role via API**

#### **Expected Results:**
- ✅ User is redirected away from `/roles/choose`
- ✅ API returns 403 error for role change attempts
- ✅ Error message: "Role is locked and cannot be changed"

---

### **Scenario 6: Database Constraints**

#### **Test Steps:**
1. **Connect to database directly**
2. **Try to insert invalid role values**

#### **Expected Results:**
```sql
-- This should FAIL
UPDATE "User" SET role = 'invalid_role' WHERE email = 'test@example.com';

-- This should FAIL  
UPDATE "User" SET "lockedRole" = 'invalid_role' WHERE email = 'test@example.com';

-- This should FAIL
UPDATE "User" SET "roleLocked" = true, "lockedRole" = NULL WHERE email = 'test@example.com';
```

---

## 🔍 **API Testing**

### **Test /api/auth/set-role Endpoint**

#### **Valid Role Setting:**
```bash
curl -X POST http://localhost:3000/api/auth/set-role \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{"role": "jobseeker"}'
```

#### **Invalid Role:**
```bash
curl -X POST http://localhost:3000/api/auth/set-role \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{"role": "invalid"}'
```

#### **Expected Results:**
- ✅ Valid role: 200 status, role set successfully
- ✅ Invalid role: 400 status, error message
- ✅ Unauthenticated: 401 status, authentication required

---

## 🐛 **Common Issues & Troubleshooting**

### **Issue: User not redirected to role selection**
- **Check:** OAuth redirect configuration in `lib/nextauth-config.ts`
- **Verify:** User has `role: null` in database
- **Fix:** Clear user data and try again

### **Issue: Role selection page shows for existing users**
- **Check:** User's role in database
- **Verify:** AuthContext logic for role checking
- **Fix:** Update user's role in database

### **Issue: Database constraint errors**
- **Check:** Migration was applied correctly
- **Verify:** Database connection and permissions
- **Fix:** Re-run migration: `npx prisma db push`

### **Issue: API returns 500 errors**
- **Check:** Database connection
- **Verify:** Prisma client configuration
- **Fix:** Restart application and check logs

---

## ✅ **Success Criteria**

### **All tests must pass:**
- [ ] New OAuth users → `/roles/choose`
- [ ] Role selection works for both roles
- [ ] Roles are locked after selection
- [ ] Existing users skip role selection
- [ ] Database constraints enforced
- [ ] API endpoints work correctly
- [ ] No console errors
- [ ] Proper redirects after role selection

### **Performance checks:**
- [ ] Page loads in < 2 seconds
- [ ] API responses in < 500ms
- [ ] No memory leaks
- [ ] Database queries optimized

---

## 📊 **Test Results Template**

```
Date: ___________
Tester: ___________
Environment: ___________

Scenario 1 - New OAuth User: ✅/❌
Scenario 2 - Job Seeker Selection: ✅/❌  
Scenario 3 - Employer Selection: ✅/❌
Scenario 4 - Existing User: ✅/❌
Scenario 5 - Role Lock: ✅/❌
Scenario 6 - DB Constraints: ✅/❌

Issues Found:
- Issue 1: ___________
- Issue 2: ___________

Overall Status: ✅ PASS / ❌ FAIL
```
