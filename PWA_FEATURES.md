# PayVault PWA Features Documentation

## Overview

PayVault has been transformed into a **Progressive Web App (PWA)** with the following capabilities:

- ✅ **Installable** on all devices (Windows, Mac, Linux, iOS, Android)
- ✅ **Offline capability** with automatic sync
- ✅ **Location tracking** for audit trails
- ✅ **Push notifications** for real-time updates
- ✅ **Auto-updates** when new versions are deployed

---

## 🚀 New Features

### 1. Progressive Web App (Installable)

Users can install PayVault as a standalone application directly from their browser.

**Desktop Installation:**
1. Visit PayVault URL in Chrome/Edge/Brave
2. Click "Install" icon in address bar
3. App opens in standalone window without browser UI
4. Icon added to desktop/start menu

**Mobile Installation:**
1. Visit PayVault URL in Safari (iOS) or Chrome (Android)
2. Tap "Add to Home Screen" banner
3. Icon appears on home screen
4. Opens in full-screen mode

**Benefits:**
- Launches like a native app
- No app store required
- Always up-to-date
- Smaller download size

---

### 2. Offline Capability & Sync

Work seamlessly even without internet connection.

**Features:**
- View all employees and salary data offline
- Create/edit employees while offline
- Changes saved locally in IndexedDB
- Automatic sync when connection restored
- Visual offline indicator
- Pending sync queue with count

**How it works:**
1. User goes offline (airplane mode, no WiFi, etc.)
2. Red "Offline" banner appears at top
3. User continues working (view, create, edit)
4. Changes stored in local sync queue
5. When online, automatic sync begins
6. Blue "Syncing..." banner shows progress
7. All changes synced to server
8. WebSocket broadcasts updates to other devices

**Technical Details:**
- **Service Worker**: Caches app shell and API responses
- **IndexedDB**: Local database for offline storage
- **Sync Queue**: Tracks pending operations
- **Conflict Resolution**: Server-side timestamp comparison

---

### 3. Location Tracking

Track user locations for audit compliance and security.

**What's Tracked:**
- Login location
- Employee creation/edit location
- Salary processing location
- All locations stored with timestamp

**Data Captured:**
- Latitude & Longitude
- Accuracy (meters)
- IP Address
- Device information
- Action type
- Timestamp

**Privacy & Compliance:**
- User permission required (browser prompt)
- Opt-in/opt-out control
- Data encrypted in transit (HTTPS)
- Encrypted in database
- Auto-deletion after 90 days (configurable)
- GDPR-compliant data export

**API Endpoints:**
- `POST /api/location/track` - Track a location event
- `GET /api/location/history` - Get user's location history
- `GET /api/location/logs` - Get all logs (admin only)
- `GET /api/location/stats` - Get location statistics

**Admin Dashboard Features:**
- View all location logs
- Filter by user, action type, date range
- Export location data to CSV
- View on map (Google Maps integration)

---

### 4. Push Notifications

Real-time notifications even when app is closed.

**Notification Types:**
1. **Salary Generated** - "Monthly salary for December 2024 has been generated for 50 employees"
2. **Payment Status Changed** - "Payment for Employee #123 marked as Processed"
3. **New Employee Added** - "John Doe has been added to the system"
4. **System Updates** - "PayVault v2.0 is available"
5. **Custom Notifications** - Admins can send custom messages

**Features:**
- Works even when app is closed
- Clickable notifications open the app
- Notification history in app
- Mark as read/unread
- Customizable per-user preferences
- Device-specific subscriptions

**Setup Process:**
1. User visits app
2. Browser prompts for notification permission
3. User clicks "Allow"
4. Subscription saved to database
5. Notifications sent via Web Push API
6. Service Worker displays notification

**API Endpoints:**
- `GET /api/push/vapid-public-key` - Get public VAPID key
- `POST /api/push/subscribe` - Subscribe to notifications
- `POST /api/push/unsubscribe` - Unsubscribe
- `POST /api/push/test` - Send test notification
- `GET /api/push/history` - Get notification history
- `POST /api/push/send-all` - Send to all users (admin)

**Notification Preferences:**
- Enable/disable push notifications
- Choose notification types to receive
- Quiet hours (no notifications at night)
- Per-device settings

---

### 5. Auto-Updates

App automatically updates when new version is deployed.

**Update Flow:**
1. New version deployed to server
2. Service Worker detects update
3. Downloads new files in background
4. Green banner appears: "New version available!"
5. User clicks "Update Now"
6. Page reloads with new version
7. User sees latest features

**Features:**
- Background download (no interruption)
- Optional update (user can dismiss)
- Force update for critical security fixes
- Version display in app
- Changelog shown after update

---

## 📁 New Files Created

### Frontend

**Services:**
- `src/services/offlineStorage.js` - IndexedDB wrapper
- `src/services/syncQueue.js` - Offline sync management
- `src/services/locationService.js` - Location tracking
- `src/services/pushService.js` - Push notifications

**Components:**
- `src/components/InstallPrompt.jsx` - Install app prompt
- `src/components/OfflineIndicator.jsx` - Online/offline status
- `src/components/UpdateBanner.jsx` - Update available banner

**PWA Files:**
- `public/manifest.json` - PWA manifest
- `public/service-worker.js` - Service worker
- `public/icons/icon.svg` - App icon (source)
- `public/icons/icon-*.png` - App icons (various sizes)

### Backend

**Services:**
- `src/services/locationService.js` - Location tracking logic
- `src/services/pushNotificationService.js` - Push notifications

**Controllers:**
- `src/controllers/locationController.js` - Location endpoints
- `src/controllers/pushController.js` - Push notification endpoints

**Routes:**
- `src/routes/locationRoutes.js` - Location API routes
- `src/routes/pushRoutes.js` - Push notification routes

**Config:**
- `src/config/generateVapidKeys.js` - VAPID key generator

---

## 🗄️ Database Changes

### New Tables (5)

1. **location_logs** - Location tracking data
   ```sql
   - user_id, action_type, latitude, longitude
   - accuracy, ip_address, device_info, action_data
   - created_at
   ```

2. **push_subscriptions** - Push notification subscribers
   ```sql
   - user_id, endpoint, p256dh_key, auth_key
   - device_info, created_at
   - UNIQUE(user_id, endpoint)
   ```

3. **notifications** - Notification history
   ```sql
   - user_id, title, body, type, data
   - sent_at, read_at
   ```

4. **sync_queue** - Offline sync operations
   ```sql
   - user_id, action, entity_type, entity_data
   - created_at, synced, synced_at
   ```

5. **Indexes** - Performance optimization
   ```sql
   - idx_location_logs_user, idx_location_logs_action
   - idx_push_subscriptions_user
   - idx_notifications_user, idx_notifications_read
   - idx_sync_queue_user
   ```

---

## ⚙️ Setup Instructions

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

New dependencies added:
- `web-push@^3.6.6` - Push notifications
- `node-cron@^3.0.3` - Scheduled tasks

**Frontend:**
```bash
cd frontend
npm install
```

No new dependencies needed (using browser APIs).

### 2. Generate VAPID Keys

Push notifications require VAPID keys for security.

```bash
cd backend
npm run generate-vapid
```

This will output:
```
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_EMAIL=mailto:your-email@example.com
```

### 3. Update Environment Variables

Add to `backend/.env`:

```env
# Push Notification Configuration
VAPID_PUBLIC_KEY=<your-public-key>
VAPID_PRIVATE_KEY=<your-private-key>
VAPID_EMAIL=mailto:admin@yourdomain.com
```

### 4. Run Database Migration

```bash
cd backend
npm run migrate
```

This creates all new tables (location_logs, push_subscriptions, notifications, sync_queue).

### 5. Generate App Icons

The app needs PNG icons in multiple sizes. You can:

**Option A: Use Online Tool**
1. Upload `frontend/public/icons/icon.svg` to https://realfavicongenerator.net/
2. Download generated icons
3. Place in `frontend/public/icons/`

**Option B: Use ImageMagick**
```bash
cd frontend/public/icons
magick icon.svg -resize 72x72 icon-72x72.png
magick icon.svg -resize 96x96 icon-96x96.png
magick icon.svg -resize 128x128 icon-128x128.png
magick icon.svg -resize 144x144 icon-144x144.png
magick icon.svg -resize 152x152 icon-152x152.png
magick icon.svg -resize 192x192 icon-192x192.png
magick icon.svg -resize 384x384 icon-384x384.png
magick icon.svg -resize 512x512 icon-512x512.png
```

### 6. Start Servers

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

### 7. Test PWA Features

1. **Install App:**
   - Visit http://localhost:3000
   - Look for install banner at bottom
   - Click "Install"

2. **Test Offline:**
   - Open DevTools → Network → Offline
   - Navigate app (should still work)
   - Create an employee
   - Go back online
   - Changes should sync automatically

3. **Test Location:**
   - Browser will prompt for location permission
   - Allow location access
   - Perform actions (login, create employee)
   - Check location logs in database

4. **Test Push Notifications:**
   - Browser will prompt for notification permission
   - Allow notifications
   - Click "Send Test Notification" button
   - Notification should appear

---

## 🔧 Configuration Options

### Service Worker Caching Strategy

Edit `frontend/public/service-worker.js`:

```javascript
// Cache version - increment to force update
const CACHE_VERSION = 'payvault-v1.0.0';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];
```

### Offline Sync Retry Policy

Edit `frontend/src/services/syncQueue.js`:

```javascript
// Max retry attempts for failed syncs
if (operation.attempts >= 3) {
  // Failed after 3 attempts
}
```

### Location Tracking Settings

Edit `frontend/src/services/locationService.js`:

```javascript
// Location accuracy settings
{
  enableHighAccuracy: true,  // More accurate, uses GPS
  timeout: 10000,             // 10 seconds
  maximumAge: 60000           // Cache for 1 minute
}
```

### Push Notification Settings

Edit `backend/src/services/pushNotificationService.js`:

```javascript
// Notification payload
{
  title: 'PayVault Notification',
  body: 'Your notification message',
  icon: '/icons/icon-192x192.png',
  badge: '/icons/icon-72x72.png',
  vibrate: [200, 100, 200],
  requireInteraction: false
}
```

---

## 📊 Monitoring & Analytics

### Check PWA Status

**Chrome DevTools:**
1. Open DevTools (F12)
2. Go to "Application" tab
3. Check:
   - Manifest
   - Service Workers
   - Storage → IndexedDB
   - Storage → Cache Storage

### View Offline Storage

```javascript
// Open browser console
const storage = await getOfflineStorage();
const employees = await storage.getEmployees();
console.log(employees);
```

### Check Sync Queue

```javascript
const syncQueue = getSyncQueue();
const pending = await syncQueue.getPendingOperations();
console.log(pending);
```

### Monitor Push Subscriptions

```sql
-- Check active subscriptions
SELECT u.username, ps.endpoint, ps.created_at
FROM push_subscriptions ps
JOIN users u ON ps.user_id = u.id;
```

### Location Tracking Stats

```sql
-- Most common actions
SELECT action_type, COUNT(*) as count
FROM location_logs
GROUP BY action_type
ORDER BY count DESC;

-- Recent locations
SELECT u.username, l.action_type, l.latitude, l.longitude, l.created_at
FROM location_logs l
JOIN users u ON l.user_id = u.id
ORDER BY l.created_at DESC
LIMIT 20;
```

---

## 🐛 Troubleshooting

### PWA Not Installing

**Issue:** Install banner doesn't appear

**Solutions:**
1. Check if app is already installed (check desktop/home screen)
2. Clear browser cache and reload
3. Check DevTools → Application → Manifest for errors
4. Ensure HTTPS is enabled (or localhost for dev)
5. Check service worker is registered (DevTools → Application → Service Workers)

### Offline Mode Not Working

**Issue:** App shows error when offline

**Solutions:**
1. Check service worker is active (DevTools → Application → Service Workers)
2. Clear cache and reload
3. Check IndexedDB has data (DevTools → Application → Storage → IndexedDB)
4. Look for errors in console

### Push Notifications Not Working

**Issue:** Notifications not received

**Solutions:**
1. Check browser permission (Settings → Site Settings → Notifications)
2. Verify VAPID keys are configured correctly in `.env`
3. Check subscription in database: `SELECT * FROM push_subscriptions`
4. Test with: `npm run generate-vapid` and re-subscribe
5. Check browser console for errors
6. Verify backend is running

### Location Tracking Not Working

**Issue:** Location permission denied

**Solutions:**
1. Check browser permission (Settings → Site Settings → Location)
2. Reset permissions and reload
3. Check if HTTPS is enabled (location requires secure context)
4. Test with: `navigator.geolocation.getCurrentPosition(console.log)`

### Sync Failing

**Issue:** Changes not syncing when back online

**Solutions:**
1. Check network connection
2. View sync queue: DevTools → Application → IndexedDB → sync_queue
3. Check backend logs for errors
4. Verify auth token is still valid
5. Try manual sync: Call `syncQueue.sync()` in console

---

## 🔒 Security Considerations

### Location Privacy

- Always request explicit user permission
- Provide opt-out mechanism
- Encrypt location data in transit (HTTPS)
- Encrypt at rest in database
- Auto-delete old logs (90 days default)
- Allow users to export their data (GDPR)
- Never share location data with third parties

### Push Notification Security

- VAPID keys kept secret (not in version control)
- Subscriptions tied to specific users
- No sensitive data in notification payload
- Users can unsubscribe anytime
- Device-specific subscriptions

### Offline Data Security

- IndexedDB encrypted by browser
- Auto-clear on logout
- Session timeout
- No sensitive data in service worker cache

---

## 📈 Performance Impact

### Bundle Size

- Service Worker: ~8KB
- Offline Storage: ~6KB
- Sync Queue: ~5KB
- Location Service: ~4KB
- Push Service: ~5KB
- **Total:** ~28KB additional JS

### Database Storage

- Location logs: ~500 bytes/log
- Push subscriptions: ~1KB/device
- Notifications: ~300 bytes/notification
- Sync queue: ~500 bytes/operation

### Network Usage

- Initial PWA install: ~200KB (one-time)
- Service worker update: ~10KB (periodic)
- Push notification: ~1KB/notification
- Location tracking: ~500 bytes/action

---

## 🚢 Deployment Checklist

Before deploying to production:

- [ ] Generate VAPID keys
- [ ] Add VAPID keys to production `.env`
- [ ] Run database migration
- [ ] Generate all PNG icons
- [ ] Test PWA installation
- [ ] Test offline mode
- [ ] Test push notifications
- [ ] Test location tracking
- [ ] Configure HTTPS (required for PWA)
- [ ] Update manifest.json with production URLs
- [ ] Test on multiple devices
- [ ] Test on multiple browsers
- [ ] Set up monitoring and analytics
- [ ] Document any changes for team

---

## 🎯 Future Enhancements

Potential future features:

1. **Biometric Authentication** - Face ID, Touch ID, fingerprint
2. **Background Sync API** - More reliable offline sync
3. **Periodic Background Sync** - Auto-refresh data
4. **Share Target API** - Share data with PayVault
5. **Contacts API** - Import employee contacts
6. **Camera API** - Capture employee photos
7. **File System Access** - Better CSV export
8. **Badging API** - Show unread count on app icon
9. **Shortcuts API** - Quick actions from home screen
10. **Screen Wake Lock** - Prevent screen sleep during data entry

---

## 📚 Resources

- [Progressive Web Apps (PWA) - MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Service Worker API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [IndexedDB API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Push API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Geolocation API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)
- [Web Push Protocol - RFC 8030](https://datatracker.ietf.org/doc/html/rfc8030)
- [VAPID - RFC 8292](https://datatracker.ietf.org/doc/html/rfc8292)

---

## 💬 Support

For issues or questions:
1. Check this documentation
2. Check browser console for errors
3. Check backend logs
4. Open issue on GitHub
5. Contact development team

---

**Version:** 1.0.0
**Last Updated:** November 2025
**Maintainer:** PayVault Development Team
