# Fire Truck Check-In PWA

A **Progressive Web App** for fire department daily truck inspections. Works on iPhone, Android, and desktop - no app store needed!

## ✨ Why PWA?

- ✅ **Works on ALL devices** - iPhone, Android, tablets, computers
- ✅ **Install to home screen** - Feels like a native app
- ✅ **Works offline** - Complete check-ins without internet
- ✅ **No app store** - Instant access via URL
- ✅ **Auto-updates** - Always have the latest version
- ✅ **Simple deployment** - Just host on any web server

## 🚀 Quick Start

### Option 1: Open the HTML file directly
1. Extract the ZIP file
2. Double-click `index.html`
3. App opens in your browser!

### Option 2: Use a simple web server (Recommended)
1. Extract the ZIP file
2. Open terminal/command prompt in the folder
3. Run ONE of these commands:

**Python 3:**
```bash
python -m http.server 8000
```

**Python 2:**
```bash
python -m SimpleHTTPServer 8000
```

**Node.js (if you have it):**
```bash
npx http-server -p 8000
```

**PHP:**
```bash
php -S localhost:8000
```

4. Open browser to: `http://localhost:8000`

### Option 3: Deploy to a web server
Upload all files to your web hosting and access via your domain.

## 📱 Install on Your Phone

### iPhone:
1. Open the app in Safari
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add"
5. App appears on home screen like a native app!

### Android:
1. Open the app in Chrome
2. Tap the menu (three dots)
3. Tap "Add to Home screen" or "Install app"
4. Tap "Add"
5. App appears on home screen!

### Desktop:
- Chrome: Click the install icon in address bar
- Edge: Click the + icon in address bar

## 🎯 Features

### ✅ Core Functionality
- **Multiple Trucks**: Add unlimited apparatus (Engine, Ladder, Squad, etc.)
- **Custom Checklists**: Unique checklist for each truck
- **Pass/Fail Tracking**: Quick status for each item
- **Mileage & Fuel**: Record vehicle metrics
- **Expiration Dates**: Track medications and equipment
- **Deficiency Notes**: Document issues
- **Personnel Tracking**: Know who did each check-in

### 📊 History & Reports
- View all past check-ins
- Filter by truck and date
- Export monthly HTML reports
- Export yearly summaries
- Edit past check-ins
- Delete check-ins

### 💾 Data Management
- **All data stored locally** - Works completely offline
- **No internet required** - Perfect for stations without WiFi
- **Automatic backup** - Data persists on device
- **Export reports** - Save to computer/email

## 🔧 How to Use

### First Time Setup

1. **Add Your First Truck**
   - Click "Manage Trucks"
   - Click "Add New Truck"
   - Enter name (e.g., "Engine 1")
   - Select type
   - A default checklist is created

2. **Customize Checklist** (Optional)
   - Go to "Manage Trucks"
   - Click "Edit Checklist" on a truck
   - Add/remove items
   - Mark items as "Medication/Expiration Date" if needed

### Daily Check-Ins

1. **Start Check-In**
   - From home, click a truck name
   - Or use "Manage Trucks" → select truck

2. **Fill Out Form**
   - Enter your name (or select from list)
   - Verify date
   - Enter mileage and fuel level
   - Go through each checklist item:
     - Tap "Pass" or "Fail"
     - For medications, enter expiration date
     - For failures, add notes explaining the issue
   - Add any additional notes

3. **Submit**
   - Click "Complete Check-In"
   - Data is saved instantly

### View History

1. Click "View History" from home
2. See all past check-ins sorted by date
3. Click any check-in to view details
4. Edit or delete as needed

### Export Reports

1. Go to "View History"
2. Click "Export Monthly" or "Export Yearly"
3. Enter month/year when prompted (or leave blank for current)
4. HTML report downloads to your device
5. Open in browser, save, or email

## 📂 Files Included

```
FireTruckCheckIn-PWA/
├── index.html      # Main app file
├── styles.css      # All styling
├── app.js          # Complete app logic
├── sw.js           # Service worker (offline support)
├── manifest.json   # PWA configuration
└── README.md       # This file
```

## 🔒 Data & Privacy

- **All data stored locally** in your browser's localStorage
- **No cloud sync** - Data never leaves your device
- **No account required** - No login, no tracking
- **Export anytime** - You own your data

## 💡 Tips

### Multiple Users
- Up to 20 people can use the same device
- Each person selects/enters their name during check-in
- Personnel list builds automatically

### Backup Your Data
- Export reports regularly
- Reports contain all check-in information
- Keep HTML files as backup records

### Offline Use
- App works 100% offline after first load
- Perfect for stations without internet
- All features available offline

### Sharing Between Devices
- Data is per-device (not synced)
- To share: Export reports and email/share
- Or use all devices connected to same server

## 🐛 Troubleshooting

### App won't load
- Make sure you're using a modern browser (Chrome, Safari, Edge, Firefox)
- Try clearing browser cache
- Refresh the page

### Can't install to home screen
- **iPhone**: Must use Safari browser
- **Android**: Must use Chrome browser
- Some browsers don't support PWA installation

### Data disappeared
- Check if you're in Incognito/Private mode (data not saved)
- Check if browser data was cleared
- Always export important reports as backup

### Export not working
- Check if pop-ups are blocked
- Grant download permission when prompted
- Try a different browser

## 🚀 Deployment Options

### For Small Departments (1-10 users)
- Just open index.html in browser on each device
- Or run simple web server on station computer

### For Larger Departments
- Upload to web hosting (GoDaddy, Bluehost, etc.)
- Access via URL from any device
- One-time setup, everyone gets updates

### Advanced (Optional)
- Host on department server
- Use behind firewall for security
- Can customize code as needed

## 🆘 Support

This app is self-contained and requires no external services. Everything you need is in these files.

## 📋 Version

- **Version**: 1.0
- **Last Updated**: December 2024
- **Platform**: Progressive Web App (HTML5/JavaScript)

## 📜 License

Proprietary - Fire Department Use Only

---

## Quick Reference

**To run locally:**
```bash
python -m http.server 8000
# Then open: http://localhost:8000
```

**To install on phone:**
- iPhone: Safari → Share → Add to Home Screen
- Android: Chrome → Menu → Add to Home screen

**All data stored in**: Browser's localStorage (per-device)

**No internet needed**: Works 100% offline after first load!
