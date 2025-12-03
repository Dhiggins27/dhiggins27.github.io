# Firebase Setup Guide

This guide will help you set up Firebase for real-time data syncing across all devices.

## 🎯 What You'll Get

With Firebase enabled:
- ✅ All devices see the same trucks
- ✅ All devices see the same personnel
- ✅ All devices see all check-ins
- ✅ Real-time updates (changes appear instantly)
- ✅ Still works offline (syncs when reconnected)
- ✅ 100% FREE (Firebase Spark plan)
- ✅ Cloud backup of all data

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Create Firebase Project

1. Go to **https://console.firebase.google.com**
2. Click **"Add project"** or **"Create a project"**
3. **Project name:** Enter "Fire-Truck-CheckIn" (or any name)
4. **Google Analytics:** You can disable this (not needed)
5. Click **"Create project"**
6. Wait 30 seconds for it to finish
7. Click **"Continue"**

---

### Step 2: Add Web App

1. On the Firebase console home page, click the **web icon** `</>`
   - It's in the circle with iOS and Android icons
2. **App nickname:** Enter "Fire Truck App"
3. **DO NOT** check "Firebase Hosting" (not needed)
4. Click **"Register app"**
5. You'll see a code snippet - **COPY THIS!** It looks like:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "fire-truck-checkin.firebaseapp.com",
  projectId: "fire-truck-checkin",
  storageBucket: "fire-truck-checkin.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

6. **Copy ONLY the config object** (everything between `{` and `}`)
7. Click **"Continue to console"**

---

### Step 3: Enable Firestore Database

1. In the left sidebar, click **"Firestore Database"**
2. Click **"Create database"**
3. **Start in:** Select **"Production mode"** 
4. Click **"Next"**
5. **Cloud Firestore location:** Choose closest to you (e.g., `us-central`)
6. Click **"Enable"**
7. Wait 30-60 seconds

---

### Step 4: Set Database Rules

1. Click the **"Rules"** tab at the top
2. **Replace ALL the code** with this:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

3. Click **"Publish"**

**⚠️ NOTE:** These rules allow anyone to read/write. This is fine for a department app, but if you want to add password protection, let me know!

---

### Step 5: Configure the App

1. **Open your Fire Truck Check-In app** in browser
2. You'll see the **"Firebase Setup"** screen
3. Click **"Use Your Own Firebase (Advanced)"**
4. **Paste your config** that you copied in Step 2
5. Click **"Save Custom Configuration"**
6. App will reload
7. **Done!** 🎉

---

## ✅ Testing It Works

1. **Open the app on your phone**
2. **Add a truck** on your phone
3. **Open the app on another device** (computer, tablet, another phone)
4. **You should see the truck appear** on the other device!

If it works - you're all set! Everyone can now see the same data.

---

## 🔐 Optional: Add Password Protection

Want to add a simple password so only your department can access it?

**Let me know** and I'll add a login screen with a department password!

---

## 💾 Data Storage

**Your data is now stored:**
- ✅ In Firebase cloud (accessible from any device)
- ✅ Locally on each device (works offline)
- ✅ Automatically synced when online

**Firebase Free Tier Limits:**
- 1 GB storage (plenty for years of check-ins)
- 50,000 reads per day
- 20,000 writes per day
- 20,000 deletes per day

You'll never hit these limits with normal use!

---

## 🆘 Troubleshooting

### "Permission denied" errors

**Fix:** Go to Firebase console → Firestore Database → Rules → Make sure you have:
```
allow read, write: if true;
```

### Not seeing data sync

1. Check internet connection
2. Wait 5-10 seconds (initial sync can be slow)
3. Refresh the page
4. Check Firebase console to see if data is there:
   - Go to Firestore Database
   - Click "Data" tab
   - You should see collections: trucks, checkIns, personnel

### Need to start over?

1. In the app, open browser console (F12)
2. Type: `localStorage.clear()`
3. Press Enter
4. Refresh page
5. You'll see setup screen again

---

## 📊 Viewing Your Data

Want to see all your data in Firebase?

1. Go to **Firebase console**
2. Click **"Firestore Database"**
3. Click **"Data"** tab
4. You'll see three collections:
   - **trucks** - All your apparatus
   - **checkIns** - All check-in records
   - **personnel** - All personnel names

You can click on any to see the data!

---

## 💡 Tips

### Multiple Fire Departments

Each department should create their OWN Firebase project so data doesn't mix.

### Backup

Firebase automatically backs up your data, but you can also:
- Export reports regularly (app has this feature)
- Download data from Firebase console

### Cost

Firebase is **100% free** for your use case. You'd need millions of check-ins per month to pay anything.

---

## 🎓 What If I Get Stuck?

Just keep using the app - it works fine without Firebase (stores locally).

When you're ready to enable syncing:
1. Follow steps above
2. Or ask for help with specific step

---

That's it! Once configured, Firebase works invisibly in the background keeping everything in sync.
