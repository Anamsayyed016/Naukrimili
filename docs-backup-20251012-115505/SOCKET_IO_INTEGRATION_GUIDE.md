# 🔔 Socket.io Real-time Notification System - Integration Guide

## 🎯 **OVERVIEW**

This integration adds real-time notifications to your existing job portal using Socket.io, seamlessly working with your current NextAuth.js, PostgreSQL, and PM2 setup.

## 🏗️ **ARCHITECTURE**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend        │    │   Database      │
│   (React)       │◄──►│   (Next.js +     │◄──►│   (PostgreSQL)  │
│                 │    │    Socket.io)    │    │                 │
│ • useSocket()   │    │ • socket-server  │    │ • notifications │
│ • NotificationBell│  │ • auth middleware│    │ • applications  │
│ • Real-time UI  │    │ • room management│    │ • users         │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🚀 **INSTALLATION STEPS**

### **Step 1: Dependencies Installed**
```bash
npm install socket.io socket.io-client @types/socket.io @types/socket.io-client
```

### **Step 2: Files Created/Modified**

#### **New Files:**
- `lib/socket-server.ts` - Socket.io server with authentication
- `lib/socket-setup.ts` - Socket.io initialization
- `server.js` - Custom Next.js server
- `hooks/useSocket.ts` - React hook for Socket.io client
- `components/NotificationBell.tsx` - Real-time notification UI
- `app/api/notifications/socket/route.ts` - Socket notification API

#### **Modified Files:**
- `ecosystem.config.cjs` - Updated to use custom server
- `app/api/applications/route.ts` - Added real-time notifications
- `components/MainNavigation.tsx` - Added notification bell
- `package.json` - Added socket server script

## 🔧 **CONFIGURATION**

### **Environment Variables**
Add to your `.env` file:
```env
# Socket.io Configuration
NEXT_PUBLIC_BASE_URL=https://naukrimili.com
NEXTAUTH_SECRET=your_secret_key
```

### **PM2 Configuration**
The `ecosystem.config.cjs` now uses `server.js` instead of `npm start` to enable Socket.io.

## 🎯 **FEATURES IMPLEMENTED**

### **1. Real-time Notifications**
- ✅ Jobseeker applies → Employer notified instantly
- ✅ Employer posts job → Jobseekers notified (by category)
- ✅ Admin actions → Relevant users notified
- ✅ System notifications → All users

### **2. Authentication Integration**
- ✅ NextAuth.js JWT token verification
- ✅ Google OAuth user mapping
- ✅ User-specific rooms (`user_${userId}`)
- ✅ Automatic reconnection on auth changes

### **3. Notification Types**
```typescript
type NotificationType = 
  | 'WELCOME'                    // Welcome message
  | 'JOB_APPLICATION_RECEIVED'   // New application
  | 'JOB_POSTED'                 // New job posted
  | 'INTERVIEW_SCHEDULED'        // Interview scheduled
  | 'ADMIN_ACTION'               // Admin notifications
  | 'SYSTEM'                     // System messages
  | 'MESSAGE_RECEIVED';          // Chat messages
```

### **4. Frontend Components**
- ✅ `NotificationBell` - Bell icon with badge count
- ✅ Real-time notification popup
- ✅ Mark as read functionality
- ✅ Browser notifications (with permission)
- ✅ Connection status indicator

## 🔄 **WORKING FLOW**

### **Example: Jobseeker Applies for Job**

1. **User applies** via `/api/applications` endpoint
2. **Application saved** to PostgreSQL database
3. **Socket notification sent** to employer's room
4. **Employer receives** real-time notification
5. **Notification stored** in database for persistence
6. **UI updates** with new notification badge

```typescript
// In applications/route.ts
await socketService.sendNotificationToUsers(employerIds, {
  type: 'JOB_APPLICATION_RECEIVED',
  title: 'New Job Application Received! 🎉',
  message: `${applicantName} applied for ${jobTitle}`,
  data: {
    applicationId: application.id,
    actionUrl: `/employer/applications/${application.id}`
  }
});
```

## 🛠️ **USAGE EXAMPLES**

### **Send Notification to User**
```typescript
import { getSocketService } from '@/lib/socket-server';

const socketService = getSocketService();
await socketService.sendNotificationToUser(userId, {
  type: 'JOB_POSTED',
  title: 'New Job Posted',
  message: 'A new job matching your skills has been posted!',
  data: { jobId: '123', actionUrl: '/jobs/123' }
});
```

### **Send to All Jobseekers**
```typescript
await socketService.sendNotificationToRole('jobseeker', {
  type: 'JOB_POSTED',
  title: 'New Opportunities Available',
  message: 'Check out the latest job postings!'
});
```

### **Broadcast to All Users**
```typescript
await socketService.sendBroadcastNotification({
  type: 'SYSTEM',
  title: 'System Maintenance',
  message: 'Scheduled maintenance tonight at 2 AM'
});
```

## 🔌 **FRONTEND INTEGRATION**

### **Using the Hook**
```typescript
import { useSocket } from '@/hooks/useSocket';

function MyComponent() {
  const { 
    socket, 
    isConnected, 
    notifications, 
    unreadCount,
    markNotificationAsRead 
  } = useSocket();

  return (
    <div>
      <p>Connected: {isConnected ? 'Yes' : 'No'}</p>
      <p>Unread: {unreadCount}</p>
      {/* Your component */}
    </div>
  );
}
```

### **Using the Notification Bell**
```typescript
import { NotificationBell } from '@/components/NotificationBell';

function Navigation() {
  return (
    <nav>
      <NotificationBell />
    </nav>
  );
}
```

## 🚀 **DEPLOYMENT**

### **Local Development**
```bash
npm run dev
```

### **Production Deployment**
```bash
npm run build
pm2 start ecosystem.config.cjs --env production
```

### **Check Socket Status**
```bash
curl https://naukrimili.com/api/notifications/socket
```

## 🔧 **TROUBLESHOOTING**

### **Common Issues**

1. **Socket not connecting**
   - Check if `server.js` is running
   - Verify JWT token in browser
   - Check CORS configuration

2. **Notifications not appearing**
   - Check browser notification permissions
   - Verify user authentication
   - Check Socket.io connection status

3. **PM2 issues**
   - Restart PM2: `pm2 restart jobportal`
   - Check logs: `pm2 logs jobportal`
   - Verify `ecosystem.config.cjs` configuration

### **Debug Commands**
```bash
# Check Socket.io status
curl https://naukrimili.com/api/notifications/socket

# Check PM2 status
pm2 status

# View logs
pm2 logs jobportal --lines 50
```

## 🔐 **SECURITY FEATURES**

- ✅ JWT token authentication
- ✅ User-specific rooms
- ✅ Input validation
- ✅ CORS configuration
- ✅ Rate limiting (can be added)
- ✅ User permission checks

## 📊 **MONITORING**

### **Connection Tracking**
- Track connected users by role
- Monitor notification delivery
- Check system health via API

### **Performance**
- Socket.io handles connection pooling
- Efficient room management
- Minimal memory footprint

## 🎉 **SUCCESS METRICS**

- ✅ Real-time notifications working
- ✅ Google OAuth integration
- ✅ No conflicts with existing code
- ✅ PM2 integration successful
- ✅ Database persistence maintained
- ✅ Frontend UI responsive

## 🔮 **FUTURE ENHANCEMENTS**

- [ ] Chat functionality
- [ ] Typing indicators
- [ ] File sharing notifications
- [ ] Push notifications
- [ ] Notification preferences
- [ ] Analytics dashboard

---

**🎯 Integration Complete!** Your job portal now has real-time notifications that work seamlessly with your existing authentication and database systems.
