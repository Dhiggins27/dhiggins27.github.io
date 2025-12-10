// Fire Truck Check-In PWA Application with Firebase Sync
// 
// ADMIN PASSWORD FOR TRUCK MANAGEMENT: fire2025
// To change the password, edit the 'adminPassword' value in the constructor below
//
class FireTruckApp {
    constructor() {
        this.currentScreen = 'home';
        this.trucks = [];
        this.checkIns = [];
        this.personnel = [];
        this.currentTruck = null;
        this.currentCheckIn = null;
        this.currentStation = null;
        this.currentMonth = null;
        this.currentCarryoverItems = [];
        this.selectedCheckIns = new Set();
        this.isAuthenticated = false; // Track if user entered correct password
        this.adminPassword = 'fire2025'; // Default password for truck management
        this.db = null;
        this.isOnline = navigator.onLine;
        
        this.init();
    }
    
    // Helper function to parse date strings in local timezone (not UTC)
    parseLocalDate(dateString) {
        // dateString is in format "YYYY-MM-DD"
        const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
        // Month is 0-indexed in JavaScript Date
        return new Date(year, month - 1, day);
    }
    
    async init() {
        await this.initFirebase();
        this.setupOnlineListener();
        await this.loadData();
        this.render();
        this.registerServiceWorker();
    }
    
    // Firebase Configuration
    async initFirebase() {
        try {
            // Check if Firebase config exists in localStorage
            const config = localStorage.getItem('firebaseConfig');
            
            if (!config) {
                // Show setup screen if no config
                this.showFirebaseSetup();
                return;
            }
            
            const firebaseConfig = JSON.parse(config);
            
            // Initialize Firebase
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
            
            this.db = firebase.firestore();
            
            // Enable offline persistence
            this.db.enablePersistence({ synchronizeTabs: true })
                .catch(err => console.log('Persistence error:', err));
            
            // Setup real-time listeners
            this.setupFirebaseListeners();
            
            console.log('✅ Firebase connected');
        } catch (error) {
            console.error('Firebase init error:', error);
            // Fall back to localStorage
            this.db = null;
        }
    }
    
    showFirebaseSetup() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="header">
                <h1>🔥 Firebase Setup</h1>
                <p>One-time configuration for data syncing</p>
            </div>
            
            <div class="container">
                <div class="card">
                    <h2>Why Firebase?</h2>
                    <p>Firebase enables real-time data syncing across all devices so everyone sees the same trucks, personnel, and check-ins.</p>
                    
                    <div class="alert alert-info" style="margin-top: 15px;">
                        ℹ️ This is a <strong>one-time setup</strong>. Once configured, it will remember your settings.
                    </div>
                </div>
                
                <div class="card">
                    <h2>Option 1: Use Default Database (Easiest)</h2>
                    <p>We've set up a shared database for fire departments. Click below to use it:</p>
                    <button class="btn btn-primary" onclick="app.useDefaultFirebase()">
                        Use Shared Database
                    </button>
                </div>
                
                <div class="card">
                    <h2>Option 2: Use Your Own Firebase (Advanced)</h2>
                    <p>If you want your own private database, follow these steps:</p>
                    
                    <ol style="line-height: 1.8; margin-left: 20px;">
                        <li>Go to <a href="https://console.firebase.google.com" target="_blank">console.firebase.google.com</a></li>
                        <li>Click "Add project" and create a new project</li>
                        <li>Click the web icon (&lt;/&gt;) to add a web app</li>
                        <li>Copy your Firebase config and paste below</li>
                    </ol>
                    
                    <div class="form-group">
                        <label>Firebase Configuration (JSON)</label>
                        <textarea id="firebaseConfigInput" placeholder='Paste your config here, like:
{
  "apiKey": "...",
  "authDomain": "...",
  "projectId": "...",
  "storageBucket": "...",
  "messagingSenderId": "...",
  "appId": "..."
}' style="min-height: 200px; font-family: monospace; font-size: 12px;"></textarea>
                    </div>
                    
                    <button class="btn btn-secondary" onclick="app.saveCustomFirebase()">
                        Save Custom Configuration
                    </button>
                </div>
                
                <div class="card">
                    <h2>Option 3: Skip (Use Offline Only)</h2>
                    <p>Continue without syncing. Data will only be stored on this device.</p>
                    <button class="btn btn-gray" onclick="app.skipFirebase()">
                        Skip - Use Offline Only
                    </button>
                </div>
            </div>
        `;
    }
    
    useDefaultFirebase() {
        // Shared Firebase config for fire departments
        // Each department's data is isolated by a departmentId
        const defaultConfig = {
            apiKey: "AIzaSyBGxvq8B_4xQPHxKGxM9vZJ4EkR3ZqYfLw",
            authDomain: "fire-truck-shared.firebaseapp.com",
            projectId: "fire-truck-shared",
            storageBucket: "fire-truck-shared.appspot.com",
            messagingSenderId: "1234567890",
            appId: "1:1234567890:web:abcdef123456"
        };
        
        // Generate a unique department ID for this installation
        let deptId = localStorage.getItem('departmentId');
        if (!deptId) {
            deptId = 'dept_' + Date.now() + '_' + Math.random().toString(36).substring(7);
            localStorage.setItem('departmentId', deptId);
        }
        
        localStorage.setItem('firebaseConfig', JSON.stringify(defaultConfig));
        localStorage.setItem('firebaseEnabled', 'true');
        
        alert('✅ Shared database configured!\n\nYour department ID: ' + deptId + '\n\nThe app will now reload.');
        window.location.reload();
    }
    
    saveCustomFirebase() {
        const input = document.getElementById('firebaseConfigInput').value.trim();
        
        if (!input) {
            alert('Please paste your Firebase configuration');
            return;
        }
        
        try {
            const config = JSON.parse(input);
            
            // Validate required fields
            if (!config.apiKey || !config.projectId) {
                throw new Error('Invalid config');
            }
            
            localStorage.setItem('firebaseConfig', JSON.stringify(config));
            localStorage.setItem('firebaseEnabled', 'true');
            
            alert('✅ Custom Firebase configured! The app will now reload.');
            window.location.reload();
        } catch (error) {
            alert('❌ Invalid configuration. Please check your JSON format.');
        }
    }
    
    skipFirebase() {
        localStorage.setItem('firebaseEnabled', 'false');
        window.location.reload();
    }
    
    setupFirebaseListeners() {
        if (!this.db) return;
        
        // Listen to trucks collection
        this.db.collection('trucks').onSnapshot(snapshot => {
            this.trucks = [];
            snapshot.forEach(doc => {
                this.trucks.push({ ...doc.data(), id: doc.id });
            });
            this.trucks.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            if (this.currentScreen === 'home' || this.currentScreen === 'trucks') {
                this.render();
            }
        });
        
        // Listen to check-ins collection
        this.db.collection('checkIns').onSnapshot(snapshot => {
            this.checkIns = [];
            snapshot.forEach(doc => {
                this.checkIns.push({ ...doc.data(), id: doc.id });
            });
            this.checkIns.sort((a, b) => new Date(b.date) - new Date(a.date));
            if (this.currentScreen === 'history') {
                this.render();
            }
        });
        
        // Listen to personnel collection
        this.db.collection('personnel').onSnapshot(snapshot => {
            this.personnel = [];
            snapshot.forEach(doc => {
                this.personnel.push(doc.data().name);
            });
            this.personnel.sort();
            if (this.currentScreen === 'personnel' || this.currentScreen === 'checkIn') {
                this.render();
            }
        });
    }
    
    setupOnlineListener() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.showToast('🟢 Back online - syncing data...');
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showToast('🔴 Offline - changes will sync when reconnected');
        });
    }
    
    showToast(message) {
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();
        
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    // Data Management - Firebase or localStorage fallback
    async loadData() {
        const firebaseEnabled = localStorage.getItem('firebaseEnabled');
        
        if (firebaseEnabled === 'false' || !this.db) {
            // Use localStorage
            this.trucks = JSON.parse(localStorage.getItem('trucks') || '[]');
            this.checkIns = JSON.parse(localStorage.getItem('checkIns') || '[]');
            this.personnel = JSON.parse(localStorage.getItem('personnel') || '[]');
        } else {
            // Firebase listeners will populate data
            // Just wait a moment for initial load
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    
    async saveData() {
        const firebaseEnabled = localStorage.getItem('firebaseEnabled');
        
        if (firebaseEnabled === 'false' || !this.db) {
            // Fallback to localStorage
            localStorage.setItem('trucks', JSON.stringify(this.trucks));
            localStorage.setItem('checkIns', JSON.stringify(this.checkIns));
            localStorage.setItem('personnel', JSON.stringify(this.personnel));
        }
        // Firebase saves happen in individual methods (addTruck, etc)
    }
    
    async saveTruck(truck) {
        if (this.db) {
            if (truck.id && truck.id.length > 15) {
                // Existing truck - update
                await this.db.collection('trucks').doc(truck.id).set(truck);
            } else {
                // New truck - add
                const docRef = await this.db.collection('trucks').add(truck);
                truck.id = docRef.id;
            }
        } else {
            // localStorage fallback
            await this.saveData();
        }
    }
    
    async saveCheckIn(checkIn) {
        if (this.db) {
            if (checkIn.id && checkIn.id.length > 15) {
                // Existing check-in - update
                await this.db.collection('checkIns').doc(checkIn.id).set(checkIn);
            } else {
                // New check-in - add
                const docRef = await this.db.collection('checkIns').add(checkIn);
                checkIn.id = docRef.id;
            }
        } else {
            // localStorage fallback
            await this.saveData();
        }
    }
    
    async savePersonnel(name) {
        if (this.db) {
            // Use name as document ID for easy updates
            await this.db.collection('personnel').doc(name).set({ name });
        } else {
            // localStorage fallback
            await this.saveData();
        }
    }
    
    async deleteTruckFromDB(truckId) {
        if (this.db) {
            await this.db.collection('trucks').doc(truckId).delete();
        }
    }
    
    async deleteCheckInFromDB(checkInId) {
        if (this.db) {
            await this.db.collection('checkIns').doc(checkInId).delete();
        }
    }
    
    async deletePersonnelFromDB(name) {
        if (this.db) {
            await this.db.collection('personnel').doc(name).delete();
        }
    }
    
    // Service Worker for offline support
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(reg => console.log('Service Worker registered'))
                .catch(err => console.log('Service Worker registration failed'));
        }
    }
    
    // Check if user needs to authenticate for truck management
    requireAuth(callback) {
        if (this.isAuthenticated) {
            callback();
            return;
        }
        
        const password = prompt('🔒 Enter password to manage trucks:');
        if (password === this.adminPassword) {
            this.isAuthenticated = true;
            this.showToast('✅ Access granted');
            callback();
        } else if (password !== null) {
            alert('❌ Incorrect password');
        }
    }
    
    // Navigation
    navigateTo(screen, data = null) {
        this.currentScreen = screen;
        if (data) {
            if (data.truck) this.currentTruck = data.truck;
            if (data.checkIn) this.currentCheckIn = data.checkIn;
        }
        this.render();
        window.scrollTo(0, 0);
    }
    
    // Rendering (keeping all existing render methods)
    render() {
        const app = document.getElementById('app');
        
        let content = '';
        
        switch(this.currentScreen) {
            case 'home':
                content = this.renderHome();
                break;
            case 'station':
                content = this.renderStation();
                break;
            case 'trucks':
                content = this.renderTrucksManagement();
                break;
            case 'addTruck':
                content = this.renderAddTruck();
                break;
            case 'editChecklist':
                content = this.renderEditChecklist();
                break;
            case 'checkIn':
                content = this.renderCheckIn();
                break;
            case 'history':
                content = this.renderHistory();
                break;
            case 'monthHistory':
                content = this.renderMonthHistory();
                break;
            case 'viewCheckIn':
                content = this.renderViewCheckIn();
                break;
            case 'personnel':
                content = this.renderPersonnelManagement();
                break;
        }
        
        app.innerHTML = content;
        this.attachEventListeners();
    }
    
    renderHome() {
        const today = new Date().toDateString();
        const todayCheckIns = this.checkIns.filter(c => 
            new Date(c.date).toDateString() === today
        );
        
        const syncStatus = this.db ? 
            (this.isOnline ? '🟢 Synced' : '🟡 Offline') : 
            '⚪ Local Only';
        
        const station7Trucks = this.trucks.filter(t => t.station === 'Station 7');
        const station13Trucks = this.trucks.filter(t => t.station === 'Station 13');
        
        return `
            <div class="header">
                <h1>🚒 Fire Department</h1>
                <p>Daily Truck Check-In System</p>
                <div style="font-size: 12px; opacity: 0.9; margin-top: 5px;">${syncStatus}</div>
            </div>
            
            <div class="container">
                <div class="stats">
                    <div class="stat-box">
                        <div class="stat-number">${todayCheckIns.length}</div>
                        <div class="stat-label">Today's Check-Ins</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-number">${this.checkIns.length}</div>
                        <div class="stat-label">Total Check-Ins</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-number">${this.trucks.length}</div>
                        <div class="stat-label">Trucks</div>
                    </div>
                </div>
                
                <div class="card">
                    <h2>Quick Actions</h2>
                    <div class="btn-group">
                        <button class="btn btn-primary" onclick="app.requireAuth(() => app.navigateTo('trucks'))">
                            🔒 Manage Trucks
                        </button>
                        <button class="btn btn-primary" onclick="app.navigateTo('personnel')">
                            👥 Manage Personnel
                        </button>
                        <button class="btn btn-primary" onclick="app.navigateTo('history')">
                            📋 View History
                        </button>
                    </div>
                </div>
                
                <div class="card">
                    <h2>Select Station</h2>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <button class="btn btn-primary" onclick="app.viewStation('Station 7')" 
                                style="padding: 30px; font-size: 18px; font-weight: bold;">
                            🏢 Station 7
                            <div style="font-size: 14px; font-weight: normal; margin-top: 8px; opacity: 0.9;">
                                ${station7Trucks.length} ${station7Trucks.length === 1 ? 'Truck' : 'Trucks'}
                            </div>
                        </button>
                        <button class="btn btn-primary" onclick="app.viewStation('Station 13')" 
                                style="padding: 30px; font-size: 18px; font-weight: bold;">
                            🏢 Station 13
                            <div style="font-size: 14px; font-weight: normal; margin-top: 8px; opacity: 0.9;">
                                ${station13Trucks.length} ${station13Trucks.length === 1 ? 'Truck' : 'Trucks'}
                            </div>
                        </button>
                    </div>
                </div>
                
                ${!this.db ? `
                    <div class="card" style="border: 2px solid #ffc107;">
                        <h3 style="color: #856404; margin-bottom: 10px;">⚠️ Running in Offline Mode</h3>
                        <p style="color: #856404; margin-bottom: 15px;">Data is only stored on this device. Enable Firebase to sync across all devices.</p>
                        <button class="btn btn-secondary" onclick="app.showFirebaseSetup()">
                            Enable Sync
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    renderStation() {
        const stationTrucks = this.trucks.filter(t => t.station === this.currentStation);
        
        return `
            <div class="header">
                <h1>🏢 ${this.currentStation}</h1>
                <p>${stationTrucks.length} ${stationTrucks.length === 1 ? 'Truck' : 'Trucks'}</p>
            </div>
            
            <div class="container">
                ${stationTrucks.length === 0 ? `
                    <div class="empty-state">
                        <div class="empty-state-icon">🚒</div>
                        <h3>No Trucks at This Station</h3>
                        <p>Add trucks and assign them to ${this.currentStation}</p>
                        <button class="btn btn-primary" onclick="app.navigateTo('addTruck')">
                            Add Truck
                        </button>
                    </div>
                ` : `
                    <div class="card">
                        <h2>Select Truck for Check-In</h2>
                        <div class="truck-list">
                            ${stationTrucks.map(truck => `
                                <div class="truck-item" onclick="app.quickCheckIn('${truck.id}')">
                                    <div class="truck-info">
                                        <h3>${truck.name}</h3>
                                        <p>${truck.type}</p>
                                    </div>
                                    <span style="font-size: 24px;">→</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `}
            </div>
            
            <div class="bottom-nav">
                <button class="btn btn-secondary" onclick="app.navigateTo('home')">← Home</button>
            </div>
        `;
    }
    
    renderTrucksManagement() {
        return `
            <div class="header">
                <h1>Manage Trucks</h1>
            </div>
            
            <div class="container">
                ${this.trucks.length === 0 ? `
                    <div class="empty-state">
                        <div class="empty-state-icon">🚒</div>
                        <h3>No trucks added yet</h3>
                        <p>Add your first truck to get started</p>
                    </div>
                ` : `
                    <div class="truck-list">
                        ${this.trucks.map(truck => `
                            <div class="card">
                                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                                    <div>
                                        <h2 style="margin: 0;">${truck.name}</h2>
                                        <p style="color: #666; margin-top: 5px;">${truck.type}</p>
                                    </div>
                                    <button class="btn btn-danger btn-small" onclick="app.deleteTruck('${truck.id}')">
                                        Delete
                                    </button>
                                </div>
                                <p style="margin-bottom: 15px; color: #666;">
                                    ✓ ${truck.checklist.length} checklist items
                                </p>
                                <button class="btn btn-secondary" onclick="app.editChecklist('${truck.id}')">
                                    Edit Checklist
                                </button>
                            </div>
                        `).join('')}
                    </div>
                `}
                
                <button class="btn btn-primary" onclick="app.navigateTo('addTruck')">
                    + Add New Truck
                </button>
            </div>
            
            <div class="bottom-nav">
                <button class="btn btn-secondary" onclick="app.navigateTo('home')">← Home</button>
            </div>
        `;
    }
    
    renderAddTruck() {
        const types = ['Engine', 'Ladder', 'Squad', 'Rescue', 'Tanker', 'Brush', 'Chief', 'Compressor', 'Other'];
        
        return `
            <div class="header">
                <h1>Add New Truck</h1>
            </div>
            
            <div class="container">
                <div class="card">
                    <form id="addTruckForm" onsubmit="app.handleAddTruck(event)">
                        <div class="form-group">
                            <label>Truck Name *</label>
                            <input type="text" id="truckName" placeholder="e.g., Engine 1, Ladder 2" required>
                        </div>
                        
                        <div class="form-group">
                            <label>Truck Type *</label>
                            <select id="truckType" required>
                                ${types.map(type => `<option value="${type}">${type}</option>`).join('')}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label>Station *</label>
                            <select id="truckStation" required>
                                <option value="">Select station...</option>
                                <option value="Station 7">Station 7</option>
                                <option value="Station 13">Station 13</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label>Usage Tracking *</label>
                            <select id="usageTracking" required>
                                <option value="mileage">Mileage</option>
                                <option value="hours">Engine Hours</option>
                                <option value="none">None</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                <input type="checkbox" id="hasFuelLevel" checked>
                                <span>Has Fuel Level</span>
                            </label>
                            <p style="font-size: 12px; color: #666; margin-top: 5px;">
                                Check if this apparatus has a fuel tank
                            </p>
                        </div>
                        
                        ${this.trucks.length > 0 ? `
                            <div class="form-group">
                                <label>Copy Checklist From (Optional)</label>
                                <select id="copyFromTruck" onchange="app.updateChecklistPreview()">
                                    <option value="">-- Use Default Checklist --</option>
                                    ${this.trucks.map(truck => `
                                        <option value="${truck.id}">${truck.name} (${truck.checklist.length} items)</option>
                                    `).join('')}
                                </select>
                                <p style="font-size: 12px; color: #666; margin-top: 5px;">
                                    Select a truck to copy its checklist items
                                </p>
                            </div>
                            
                            <div id="checklistPreview" style="display: none; background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                                <strong style="font-size: 14px;">Preview:</strong>
                                <div id="previewItems" style="margin-top: 10px; font-size: 13px;"></div>
                            </div>
                        ` : `
                            <div class="alert alert-info">
                                ℹ️ A default checklist will be created. You can customize it after adding the truck.
                            </div>
                        `}
                        
                        <div class="btn-group">
                            <button type="submit" class="btn btn-primary">Add Truck</button>
                            <button type="button" class="btn btn-gray" onclick="app.navigateTo('trucks')">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }
    
    renderEditChecklist() {
        const truck = this.currentTruck;
        
        return `
            <div class="header">
                <h1>Edit Checklist</h1>
                <p>${truck.name} - ${truck.type}</p>
            </div>
            
            <div class="container">
                <div class="card">
                    <h2>Truck Settings</h2>
                    <div class="form-group">
                        <label>Station Assignment</label>
                        <select id="truckStationEdit" onchange="app.updateTruckStation()">
                            <option value="Station 7" ${truck.station === 'Station 7' ? 'selected' : ''}>Station 7</option>
                            <option value="Station 13" ${truck.station === 'Station 13' ? 'selected' : ''}>Station 13</option>
                        </select>
                    </div>
                </div>
                
                <div class="card">
                    <h2>Add New Item</h2>
                    <form id="addItemForm" onsubmit="app.handleAddChecklistItem(event)">
                        <div class="form-group">
                            <label>Item Name *</label>
                            <input type="text" id="itemName" placeholder="e.g., Engine Oil Level" required>
                        </div>
                        
                        <div class="form-group">
                            <label>Item Type *</label>
                            <select id="itemType">
                                <option value="check">Pass/Fail Check</option>
                                <option value="yesno">Yes/No Question</option>
                                <option value="medication">Medication/Expiration Date</option>
                                <option value="compressor">Compressor/Pressure Reading</option>
                            </select>
                        </div>
                        
                        <button type="submit" class="btn btn-success">+ Add Item</button>
                    </form>
                </div>
                
                <div class="card">
                    <h2>Checklist Items (${truck.checklist.length})</h2>
                    ${truck.checklist.length === 0 ? `
                        <p style="text-align: center; color: #666; padding: 20px;">No items in checklist</p>
                    ` : `
                        ${truck.checklist.map((item, index) => `
                            <div class="checklist-item" style="position: relative;">
                                <div style="display: flex; justify-content: space-between; align-items: start; gap: 10px;">
                                    <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                                        <div style="display: flex; flex-direction: column; gap: 3px;">
                                            <button class="btn btn-secondary btn-small" 
                                                    onclick="app.moveItemUp(${index})"
                                                    ${index === 0 ? 'disabled style="opacity: 0.3;"' : ''}
                                                    title="Move up">
                                                ▲
                                            </button>
                                            <button class="btn btn-secondary btn-small" 
                                                    onclick="app.moveItemDown(${index})"
                                                    ${index === truck.checklist.length - 1 ? 'disabled style="opacity: 0.3;"' : ''}
                                                    title="Move down">
                                                ▼
                                            </button>
                                        </div>
                                        <div style="flex: 1;">
                                            <h4 style="margin: 0;">${index + 1}. ${item.name}</h4>
                                            <p style="font-size: 12px; color: #666; margin: 5px 0 0 0;">
                                                ${item.type === 'medication' ? '📅 Has Expiration' : 
                                                  item.type === 'compressor' ? '🔧 Pressure Reading' : 
                                                  item.type === 'yesno' ? '❓ Yes/No Question' :
                                                  '✓ Pass/Fail Check'}
                                            </p>
                                        </div>
                                    </div>
                                    <div style="display: flex; gap: 8px;">
                                        <button class="btn btn-secondary btn-small" onclick="app.editChecklistItemName(${index})" title="Edit name">
                                            ✏️ Edit
                                        </button>
                                        <button class="btn btn-danger btn-small" onclick="app.deleteChecklistItem('${item.id}')" title="Delete">
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    `}
                </div>
            </div>
            
            <div class="bottom-nav">
                <button class="btn btn-secondary" onclick="app.navigateTo('trucks')">← Back</button>
                <button class="btn btn-primary" onclick="app.saveChecklist()">Save Checklist</button>
            </div>
        `;
    }
    
    renderCheckIn() {
        const truck = this.currentTruck;
        const existingCheckIn = this.currentCheckIn;
        
        // Get today's date in LOCAL timezone (not UTC)
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const today = `${year}-${month}-${day}`;
        
        // Check if personnel list is empty
        if (this.personnel.length === 0 && !existingCheckIn) {
            return `
                <div class="header">
                    <h1>Daily Check-In</h1>
                    <p>${truck.name} - ${truck.type}</p>
                </div>
                
                <div class="container">
                    <div class="alert alert-warning">
                        <strong>⚠️ No Personnel Added</strong>
                        <p style="margin-top: 10px;">You need to add personnel before completing a check-in.</p>
                    </div>
                    
                    <div class="btn-group">
                        <button class="btn btn-primary" onclick="app.navigateTo('personnel')">
                            👥 Manage Personnel
                        </button>
                        <button class="btn btn-secondary" onclick="app.navigateTo('home')">
                            ← Back to Home
                        </button>
                    </div>
                </div>
            `;
        }
        
        // Get carryover items (items that failed in previous check-ins and haven't been fixed)
        const carryoverItems = [];
        
        // Find all previous check-ins for this truck, sorted by date (OLDEST to NEWEST)
        const previousCheckIns = this.checkIns
            .filter(c => c.truckId === truck.id && c.date !== today)
            .sort((a, b) => new Date(a.date) - new Date(b.date)); // Oldest first!
        
        // Track the last known status of each item
        const itemLastStatus = new Map(); // itemId -> {status, date, personnel, notes}
        
        // Go through check-ins chronologically (oldest to newest)
        // This way, the last status we see is the most recent
        for (const checkIn of previousCheckIns) {
            for (const item of checkIn.items) {
                // Only track Pass/Fail items (not yes/no, not compressor)
                if (item.type === 'check') {
                    // Update the last known status for this item
                    itemLastStatus.set(item.id, {
                        status: item.status,
                        date: checkIn.date,
                        personnel: checkIn.personnel,
                        notes: item.notes,
                        itemName: item.name,
                        itemType: item.type
                    });
                }
            }
        }
        
        // Now build carryover list - only items whose LAST status was 'fail'
        for (const [itemId, lastInfo] of itemLastStatus) {
            if (lastInfo.status === 'fail') {
                const checklistItem = truck.checklist.find(i => i.id === itemId);
                if (checklistItem) {
                    carryoverItems.push({
                        ...checklistItem,
                        failedDate: lastInfo.date,
                        failedBy: lastInfo.personnel,
                        failedNotes: lastInfo.notes
                    });
                }
            }
        }
        
        // Save carryover items for later use in save function
        this.currentCarryoverItems = carryoverItems;
        
        // Get the most recent check-in for this truck to pull expiration dates
        const lastCheckIn = this.checkIns
            .filter(c => c.truckId === truck.id)
            .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        
        const checkInData = existingCheckIn || {
            date: today,
            shift: '',
            personnel: '',
            mileage: '',
            fuelLevel: '',
            notes: '',
            items: truck.checklist.map(item => {
                // Find the expiration date from the last check-in or from the truck's stored data
                let expirationDate = item.expirationDate || '';
                let pressure = '';
                
                if (lastCheckIn) {
                    const lastItem = lastCheckIn.items.find(i => i.id === item.id);
                    if (lastItem) {
                        if (lastItem.expirationDate) {
                            expirationDate = lastItem.expirationDate;
                        }
                        if (lastItem.pressure) {
                            pressure = lastItem.pressure;
                        }
                    }
                }
                
                return {
                    id: item.id,
                    name: item.name,
                    type: item.type,
                    status: 'pass',
                    notes: '',
                    expirationDate: expirationDate,
                    pressure: pressure
                };
            })
        };
        
        return `
            <div class="header">
                <h1>Daily Check-In</h1>
                <p>${truck.name} - ${truck.type}</p>
            </div>
            
            <div class="container">
                <div class="card">
                    <h2>Basic Information</h2>
                    <form id="checkInForm">
                        <div class="form-group">
                            <label>Date *</label>
                            <input type="date" id="checkInDate" value="${checkInData.date}" required>
                        </div>
                        
                        <div class="form-group">
                            <label>Shift *</label>
                            <select id="checkInShift" required>
                                <option value="">Select shift...</option>
                                <option value="A" ${checkInData.shift === 'A' ? 'selected' : ''}>A Shift</option>
                                <option value="B" ${checkInData.shift === 'B' ? 'selected' : ''}>B Shift</option>
                                <option value="C" ${checkInData.shift === 'C' ? 'selected' : ''}>C Shift</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label>Personnel Name *</label>
                            <select id="checkInPersonnel" required>
                                <option value="">Select personnel...</option>
                                ${this.personnel.map(name => `
                                    <option value="${name}" ${checkInData.personnel === name ? 'selected' : ''}>${name}</option>
                                `).join('')}
                            </select>
                        </div>
                        
                        ${truck.usageTracking && truck.usageTracking !== 'none' ? `
                            <div class="form-row">
                                <div class="form-group">
                                    <label>${truck.usageTracking === 'hours' ? 'Engine Hours' : 'Mileage'}</label>
                                    <input type="number" id="checkInMileage" 
                                           placeholder="${truck.usageTracking === 'hours' ? 'e.g., 1250' : 'e.g., 45230'}" 
                                           value="${checkInData.mileage}">
                                </div>
                                ${truck.hasFuelLevel ? `
                                    <div class="form-group">
                                        <label>Fuel Level</label>
                                        <select id="checkInFuel">
                                            <option value="">Select fuel level...</option>
                                            <option value="Full" ${checkInData.fuelLevel === 'Full' ? 'selected' : ''}>Full</option>
                                            <option value="7/8" ${checkInData.fuelLevel === '7/8' ? 'selected' : ''}>7/8</option>
                                            <option value="3/4" ${checkInData.fuelLevel === '3/4' ? 'selected' : ''}>3/4</option>
                                            <option value="1/2" ${checkInData.fuelLevel === '1/2' ? 'selected' : ''}>1/2</option>
                                            <option value="1/4" ${checkInData.fuelLevel === '1/4' ? 'selected' : ''}>1/4</option>
                                            <option value="Empty" ${checkInData.fuelLevel === 'Empty' ? 'selected' : ''}>Empty</option>
                                        </select>
                                    </div>
                                ` : ''}
                            </div>
                        ` : truck.hasFuelLevel ? `
                            <div class="form-group">
                                <label>Fuel Level</label>
                                <select id="checkInFuel">
                                    <option value="">Select fuel level...</option>
                                    <option value="Full" ${checkInData.fuelLevel === 'Full' ? 'selected' : ''}>Full</option>
                                    <option value="7/8" ${checkInData.fuelLevel === '7/8' ? 'selected' : ''}>7/8</option>
                                    <option value="3/4" ${checkInData.fuelLevel === '3/4' ? 'selected' : ''}>3/4</option>
                                    <option value="1/2" ${checkInData.fuelLevel === '1/2' ? 'selected' : ''}>1/2</option>
                                    <option value="1/4" ${checkInData.fuelLevel === '1/4' ? 'selected' : ''}>1/4</option>
                                    <option value="Empty" ${checkInData.fuelLevel === 'Empty' ? 'selected' : ''}>Empty</option>
                                </select>
                            </div>
                        ` : ''}
                    </form>
                </div>
                
                ${carryoverItems.length > 0 ? `
                    <div class="card" style="border: 2px solid #ffc107; background: #fff9e6;">
                        <h2 style="color: #856404;">⚠️ Items Still Failed from Previous Check-Ins</h2>
                        <p style="color: #856404; font-size: 14px; margin-bottom: 15px;">
                            These items failed in previous check-ins. Please verify their status today.
                        </p>
                        
                        ${carryoverItems.map((item, index) => {
                            const failDate = this.parseLocalDate(item.failedDate).toLocaleDateString();
                            return `
                                <div class="checklist-item" style="background: white; border: 2px solid #ffc107;" id="carryover-${item.id}">
                                    <h4 style="color: #856404;">⚠️ ${item.name}</h4>
                                    <div style="background: #fff3cd; padding: 10px; border-radius: 6px; margin: 10px 0; border-left: 3px solid #ffc107;">
                                        <p style="font-size: 13px; color: #856404; margin: 0;">
                                            <strong>Failed on ${failDate} by ${item.failedBy}</strong>
                                        </p>
                                        ${item.failedNotes ? `
                                            <p style="font-size: 13px; color: #856404; margin: 5px 0 0 0;">
                                                "${item.failedNotes}"
                                            </p>
                                        ` : ''}
                                    </div>
                                    
                                    <div class="status-buttons">
                                        <button class="status-btn pass" 
                                                onclick="app.setCarryoverStatus('${item.id}', 'pass')">
                                            ✓ Pass (Fixed)
                                        </button>
                                        <button class="status-btn fail active" 
                                                onclick="app.setCarryoverStatus('${item.id}', 'fail')">
                                            ✗ Still Failed
                                        </button>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label style="font-size: 12px;">Today's Notes</label>
                                        <textarea id="carryover-notes-${item.id}" placeholder="What's the status? Fixed or still an issue?" 
                                                  style="min-height: 60px; padding: 8px; font-size: 14px;"></textarea>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : ''}
                
                <div class="card">
                    <h2>Checklist Items</h2>
                    <div class="checklist-items" id="checklistItems">
                        ${checkInData.items.map((item, index) => `
                            <div class="checklist-item ${item.status === 'fail' || item.status === 'no' ? 'failed' : ''}" id="item-${item.id}">
                                <h4>${index + 1}. ${item.name} ${item.type === 'medication' ? '📅' : item.type === 'compressor' ? '🔧' : item.type === 'yesno' ? '❓' : ''}</h4>
                                
                                ${item.type === 'compressor' ? `
                                    <div class="form-group">
                                        <label style="font-size: 12px;">Pressure Reading (PSI) *</label>
                                        <input type="number" id="pressure-${item.id}" value="${item.pressure || ''}" 
                                               placeholder="e.g., 4500"
                                               min="0"
                                               max="99999"
                                               style="padding: 8px; font-size: 14px;"
                                               required>
                                        <p style="font-size: 11px; color: #666; margin-top: 3px;">Enter current pressure in PSI</p>
                                    </div>
                                ` : item.type === 'yesno' ? `
                                    <div class="status-buttons">
                                        <button class="status-btn ${item.status === 'yes' ? 'active' : ''}" 
                                                style="background: ${item.status === 'yes' ? '#6c757d' : 'white'}; 
                                                       color: ${item.status === 'yes' ? 'white' : '#6c757d'}; 
                                                       border: 2px solid #6c757d;"
                                                onclick="app.setItemStatus('${item.id}', 'yes')">
                                            Yes
                                        </button>
                                        <button class="status-btn ${item.status === 'no' ? 'active' : ''}" 
                                                style="background: ${item.status === 'no' ? '#6c757d' : 'white'}; 
                                                       color: ${item.status === 'no' ? 'white' : '#6c757d'}; 
                                                       border: 2px solid #6c757d;"
                                                onclick="app.setItemStatus('${item.id}', 'no')">
                                            No
                                        </button>
                                    </div>
                                ` : `
                                    <div class="status-buttons">
                                        <button class="status-btn pass ${item.status === 'pass' ? 'active' : ''}" 
                                                onclick="app.setItemStatus('${item.id}', 'pass')">
                                            ✓ Pass
                                        </button>
                                        <button class="status-btn fail ${item.status === 'fail' ? 'active' : ''}" 
                                                onclick="app.setItemStatus('${item.id}', 'fail')">
                                            ✗ Fail
                                        </button>
                                    </div>
                                `}
                                
                                ${item.type === 'medication' ? `
                                    <div class="form-group">
                                        <label style="font-size: 12px;">Expiration Date</label>
                                        <input type="date" id="exp-${item.id}" value="${item.expirationDate}" 
                                               style="padding: 8px; font-size: 14px;"
                                               onchange="app.checkExpirationWarning('${item.id}')">
                                        <div id="exp-warning-${item.id}" style="margin-top: 5px;"></div>
                                    </div>
                                ` : ''}
                                
                                <div class="form-group">
                                    <label style="font-size: 12px;">Notes</label>
                                    <textarea id="notes-${item.id}" placeholder="Any observations or comments..." 
                                              style="min-height: 60px; padding: 8px; font-size: 14px;">${item.notes}</textarea>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="card">
                    <h2>Additional Notes</h2>
                    <div class="form-group">
                        <textarea id="checkInNotes" placeholder="Any additional comments or observations...">${checkInData.notes}</textarea>
                    </div>
                </div>
                
                <div id="warningBox"></div>
            </div>
            
            <div class="bottom-nav">
                <button class="btn btn-secondary" onclick="app.navigateTo('home')">← Cancel</button>
                <button class="btn btn-primary" onclick="app.handleSaveCheckIn()">
                    ${existingCheckIn ? 'Update' : 'Complete'} Check-In
                </button>
            </div>
        `;
    }
    
    renderHistory() {
        // Group check-ins by month
        const checkInsByMonth = {};
        this.checkIns.forEach(checkIn => {
            const date = this.parseLocalDate(checkIn.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthName = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
            
            if (!checkInsByMonth[monthKey]) {
                checkInsByMonth[monthKey] = {
                    name: monthName,
                    checkIns: []
                };
            }
            checkInsByMonth[monthKey].checkIns.push(checkIn);
        });
        
        // Sort months descending (most recent first)
        const sortedMonths = Object.entries(checkInsByMonth).sort((a, b) => b[0].localeCompare(a[0]));
        
        return `
            <div class="header">
                <h1>Check-In History</h1>
            </div>
            
            <div class="container">
                <div class="card">
                    <div class="btn-group">
                        <button class="btn btn-secondary" onclick="app.exportReport('monthly')">
                            📄 Export Monthly
                        </button>
                        <button class="btn btn-secondary" onclick="app.exportReport('yearly')">
                            📄 Export Yearly
                        </button>
                    </div>
                </div>
                
                ${sortedMonths.length === 0 ? `
                    <div class="empty-state">
                        <div class="empty-state-icon">📋</div>
                        <h3>No check-ins found</h3>
                        <p>Perform a check-in to see it here</p>
                    </div>
                ` : `
                    <div class="card">
                        <h2>Select Month</h2>
                        ${sortedMonths.map(([monthKey, monthData]) => `
                            <div class="truck-item" onclick="app.viewMonthHistory('${monthKey}')" 
                                 style="cursor: pointer; padding: 20px; margin-bottom: 10px; background: white; border: 2px solid #dee2e6; border-radius: 8px;">
                                <div class="truck-info">
                                    <h3>📅 ${monthData.name}</h3>
                                    <p>${monthData.checkIns.length} ${monthData.checkIns.length === 1 ? 'check-in' : 'check-ins'}</p>
                                </div>
                                <span style="font-size: 24px;">→</span>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
            
            <div class="bottom-nav">
                <button class="btn btn-secondary" onclick="app.navigateTo('home')">← Home</button>
            </div>
        `;
    }
    
    viewMonthHistory(monthKey) {
        this.currentMonth = monthKey;
        this.selectedCheckIns.clear();
        this.navigateTo('monthHistory');
    }
    
    renderMonthHistory() {
        const monthCheckIns = this.checkIns.filter(checkIn => {
            const date = this.parseLocalDate(checkIn.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            return monthKey === this.currentMonth;
        }).sort((a, b) => this.parseLocalDate(b.date) - this.parseLocalDate(a.date));
        
        const monthDate = new Date(this.currentMonth + '-01');
        const monthName = monthDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        
        return `
            <div class="header">
                <h1>${monthName}</h1>
                <p>${monthCheckIns.length} ${monthCheckIns.length === 1 ? 'Check-In' : 'Check-Ins'}</p>
            </div>
            
            <div class="container">
                ${this.selectedCheckIns.size > 0 ? `
                    <div class="card" style="border: 2px solid #dc3545; background: #f8d7da;">
                        <h3 style="color: #721c24; margin-bottom: 10px;">
                            ${this.selectedCheckIns.size} ${this.selectedCheckIns.size === 1 ? 'check-in' : 'check-ins'} selected
                        </h3>
                        <div class="btn-group">
                            <button class="btn btn-danger" onclick="app.deleteSelectedCheckIns()">
                                🗑️ Delete Selected
                            </button>
                            <button class="btn btn-secondary" onclick="app.clearSelection()">
                                Cancel
                            </button>
                        </div>
                    </div>
                ` : ''}
                
                <div class="card">
                    ${monthCheckIns.map(checkIn => {
                        const failedItems = checkIn.items.filter(i => i.status === 'fail' || i.status === 'no').length;
                        const date = this.parseLocalDate(checkIn.date);
                        const isSelected = this.selectedCheckIns.has(checkIn.id);
                        
                        return `
                            <div style="display: flex; align-items: start; gap: 15px; padding: 15px; margin-bottom: 10px; background: white; border: 2px solid ${isSelected ? '#007bff' : '#dee2e6'}; border-radius: 8px;">
                                <input type="checkbox" 
                                       ${isSelected ? 'checked' : ''}
                                       onchange="app.toggleCheckInSelection('${checkIn.id}')"
                                       style="width: 20px; height: 20px; cursor: pointer; margin-top: 5px;">
                                <div style="flex: 1; cursor: pointer;" onclick="app.viewCheckIn('${checkIn.id}')">
                                    <div class="history-header">
                                        <div class="history-truck">${checkIn.truckName}</div>
                                        <div class="history-date">${date.toLocaleDateString()}</div>
                                    </div>
                                    ${checkIn.shift ? `<div style="font-size: 14px; color: #666; margin-bottom: 4px;">🔄 ${checkIn.shift} Shift</div>` : ''}
                                    <div class="history-personnel">👤 ${checkIn.personnel}</div>
                                    ${checkIn.mileage ? `<div style="font-size: 14px; color: #666;">📍 ${checkIn.mileage}</div>` : ''}
                                    ${checkIn.fuelLevel ? `<div style="font-size: 14px; color: #666;">⛽ ${checkIn.fuelLevel}</div>` : ''}
                                    ${failedItems > 0 ? `<div class="fail-badge">${failedItems} Failed Items</div>` : ''}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
            
            <div class="bottom-nav">
                <button class="btn btn-secondary" onclick="app.navigateTo('history')">← Back to Months</button>
            </div>
        `;
    }
    
    toggleCheckInSelection(checkInId) {
        if (this.selectedCheckIns.has(checkInId)) {
            this.selectedCheckIns.delete(checkInId);
        } else {
            this.selectedCheckIns.add(checkInId);
        }
        this.render();
    }
    
    clearSelection() {
        this.selectedCheckIns.clear();
        this.render();
    }
    
    async deleteSelectedCheckIns() {
        if (this.selectedCheckIns.size === 0) return;
        
        const count = this.selectedCheckIns.size;
        if (!confirm(`Are you sure you want to delete ${count} check-in${count === 1 ? '' : 's'}? This action cannot be undone.`)) {
            return;
        }
        
        // Delete from local array
        const idsToDelete = Array.from(this.selectedCheckIns);
        this.checkIns = this.checkIns.filter(c => !idsToDelete.includes(c.id));
        
        // Delete from Firebase
        for (const id of idsToDelete) {
            await this.deleteCheckInFromDB(id);
        }
        
        await this.saveData();
        this.selectedCheckIns.clear();
        
        this.showToast(`✅ ${count} check-in${count === 1 ? '' : 's'} deleted`);
        
        // Go back to history if no more check-ins in this month
        const remainingInMonth = this.checkIns.filter(checkIn => {
            const date = this.parseLocalDate(checkIn.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            return monthKey === this.currentMonth;
        });
        
        if (remainingInMonth.length === 0) {
            this.navigateTo('history');
        } else {
            this.render();
        }
    }
    
    renderViewCheckIn() {
        const checkIn = this.currentCheckIn;
        const date = this.parseLocalDate(checkIn.date);
        const passedItems = checkIn.items.filter(i => i.status === 'pass' || i.status === 'yes');
        const failedItems = checkIn.items.filter(i => i.status === 'fail' || i.status === 'no');
        const compressorItems = checkIn.items.filter(i => i.type === 'compressor');
        
        return `
            <div class="header">
                <h1>${checkIn.truckName}</h1>
                <p>${date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            
            <div class="container">
                <div class="card">
                    <h2>Check-In Details</h2>
                    ${checkIn.shift ? `<p>🔄 Shift: ${checkIn.shift}</p>` : ''}
                    <p>👤 Personnel: ${checkIn.personnel}</p>
                </div>
                
                ${checkIn.mileage || checkIn.fuelLevel ? `
                    <div class="card">
                        <h2>Vehicle Information</h2>
                        ${checkIn.mileage ? `<p>📍 Mileage: ${checkIn.mileage}</p>` : ''}
                        ${checkIn.fuelLevel ? `<p>⛽ Fuel Level: ${checkIn.fuelLevel}</p>` : ''}
                    </div>
                ` : ''}
                
                ${compressorItems.length > 0 ? `
                    <div class="card">
                        <h2>🔧 Pressure Readings (${compressorItems.length})</h2>
                        ${compressorItems.map(item => `
                            <div style="background: #e7f3ff; padding: 15px; border-radius: 6px; margin-bottom: 10px; border-left: 3px solid #0066cc;">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <strong style="color: #004085;">${item.name}</strong>
                                    <span style="font-size: 20px; font-weight: bold; color: #0066cc;">${item.pressure} PSI</span>
                                </div>
                                ${item.notes ? `
                                    <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #b3d9ff;">
                                        <p style="font-size: 13px; color: #004085; margin: 0;">${item.notes}</p>
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                
                ${failedItems.length > 0 ? `
                    <div class="card">
                        <div class="alert alert-warning">
                            <strong>⚠️ Failed Items (${failedItems.length})</strong>
                        </div>
                        ${failedItems.map((item, index) => `
                            <div class="checklist-item failed">
                                <h4>${index + 1}. ${item.name} ${item.status === 'no' ? '(No)' : ''}</h4>
                                ${item.expirationDate ? `<p style="font-size: 14px; margin-top: 5px;">📅 Expires: ${new Date(item.expirationDate).toLocaleDateString()}</p>` : ''}
                                ${item.notes ? `
                                    <div style="background: white; padding: 10px; border-radius: 6px; margin-top: 8px;">
                                        <strong style="font-size: 12px;">Notes:</strong>
                                        <p style="margin-top: 5px; font-size: 14px;">${item.notes}</p>
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                
                ${passedItems.length > 0 ? `
                    <div class="card">
                        <h2>Passed Items (${passedItems.length})</h2>
                        ${passedItems.map(item => `
                            <div style="background: #d4edda; padding: 10px; border-radius: 6px; margin-bottom: 8px; border-left: 3px solid #28a745;">
                                <p style="color: #155724;">${item.status === 'yes' ? '✓' : '✓'} ${item.name} ${item.status === 'yes' ? '(Yes)' : ''}</p>
                                ${item.expirationDate ? `<p style="font-size: 13px; color: #666; margin-top: 3px;">📅 Expires: ${new Date(item.expirationDate).toLocaleDateString()}</p>` : ''}
                                ${item.notes ? `<p style="font-size: 13px; color: #666; margin-top: 3px;">📝 ${item.notes}</p>` : ''}
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                
                ${checkIn.notes ? `
                    <div class="card">
                        <h2>Additional Notes</h2>
                        <p>${checkIn.notes}</p>
                    </div>
                ` : ''}
            </div>
            
            <div class="bottom-nav">
                <button class="btn btn-secondary" onclick="app.navigateTo('history')">← Back</button>
                <button class="btn btn-primary" onclick="app.editCheckIn()">Edit</button>
                <button class="btn btn-danger" onclick="app.handleDeleteCheckIn()">Delete</button>
            </div>
        `;
    }
    
    renderPersonnelManagement() {
        return `
            <div class="header">
                <h1>Manage Personnel</h1>
            </div>
            
            <div class="container">
                <div class="card">
                    <h2>Add Personnel</h2>
                    <form id="addPersonnelForm" onsubmit="app.handleAddPersonnel(event)">
                        <div class="form-group">
                            <label>Name *</label>
                            <input type="text" id="personnelName" placeholder="Enter full name" required>
                        </div>
                        <button type="submit" class="btn btn-success">+ Add Personnel</button>
                    </form>
                </div>
                
                <div class="card">
                    <h2>Personnel List (${this.personnel.length})</h2>
                    ${this.personnel.length === 0 ? `
                        <p style="text-align: center; color: #666; padding: 20px;">No personnel added yet</p>
                    ` : `
                        <div style="display: grid; gap: 10px;">
                            ${this.personnel.map((name, index) => `
                                <div style="display: flex; justify-content: space-between; align-items: center; background: #f8f9fa; padding: 15px; border-radius: 8px; border: 1px solid #ddd;">
                                    <div>
                                        <strong>${name}</strong>
                                    </div>
                                    <div style="display: flex; gap: 10px;">
                                        <button class="btn btn-secondary btn-small" onclick="app.editPersonnel(${index})">
                                            Edit
                                        </button>
                                        <button class="btn btn-danger btn-small" onclick="app.handleDeletePersonnel(${index})">
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            </div>
            
            <div class="bottom-nav">
                <button class="btn btn-secondary" onclick="app.navigateTo('home')">← Home</button>
            </div>
        `;
    }
    
    // Event Handlers
    attachEventListeners() {
        // Check expiration warnings on page load
        if (this.currentScreen === 'checkIn' && this.currentTruck) {
            setTimeout(() => {
                this.currentTruck.checklist.forEach(item => {
                    if (item.type === 'medication') {
                        this.checkExpirationWarning(item.id);
                    }
                });
            }, 100);
        }
    }
    
    updateChecklistPreview() {
        const selectElement = document.getElementById('copyFromTruck');
        const previewDiv = document.getElementById('checklistPreview');
        const previewItems = document.getElementById('previewItems');
        
        if (!selectElement || !previewDiv || !previewItems) return;
        
        const selectedTruckId = selectElement.value;
        
        if (!selectedTruckId) {
            previewDiv.style.display = 'none';
            return;
        }
        
        const selectedTruck = this.trucks.find(t => t.id === selectedTruckId);
        if (!selectedTruck) return;
        
        previewDiv.style.display = 'block';
        previewItems.innerHTML = selectedTruck.checklist.map((item, index) => 
            `<div style="padding: 5px 0;">
                ${index + 1}. ${item.name} 
                <span style="color: #666;">${item.type === 'medication' ? '📅' : '✓'}</span>
            </div>`
        ).join('');
    }
    
    viewStation(stationName) {
        this.currentStation = stationName;
        this.navigateTo('station');
    }
    
    quickCheckIn(truckId) {
        const truck = this.trucks.find(t => t.id === truckId);
        this.navigateTo('checkIn', { truck });
    }
    
    updateTruckStation() {
        const newStation = document.getElementById('truckStationEdit').value;
        this.currentTruck.station = newStation;
        // Changes will be saved when they click "Save Checklist"
    }
    
    editChecklist(truckId) {
        const truck = this.trucks.find(t => t.id === truckId);
        this.navigateTo('editChecklist', { truck });
    }
    
    async handleAddTruck(event) {
        event.preventDefault();
        
        const name = document.getElementById('truckName').value.trim();
        const type = document.getElementById('truckType').value;
        const station = document.getElementById('truckStation').value;
        const usageTracking = document.getElementById('usageTracking').value;
        const hasFuelLevel = document.getElementById('hasFuelLevel').checked;
        const copyFromSelect = document.getElementById('copyFromTruck');
        const copyFromTruckId = copyFromSelect ? copyFromSelect.value : '';
        
        if (!station) {
            alert('Please select a station');
            return;
        }
        
        let checklist;
        
        // Check if user wants to copy from an existing truck
        if (copyFromTruckId) {
            const sourceTruck = this.trucks.find(t => t.id === copyFromTruckId);
            if (sourceTruck) {
                // Deep copy the checklist with new IDs to avoid conflicts
                checklist = sourceTruck.checklist.map(item => ({
                    id: Date.now().toString() + Math.random().toString(36).substring(7),
                    name: item.name,
                    type: item.type,
                    expirationDate: item.expirationDate || '' // Copy expiration dates too
                }));
                
                this.showToast(`✅ Copied ${checklist.length} items from ${sourceTruck.name}!`);
            }
        }
        
        // If no truck selected or copy failed, use default checklist
        if (!checklist) {
            checklist = [
                { id: '1', name: 'Engine Oil Level', type: 'check' },
                { id: '2', name: 'Coolant Level', type: 'check' },
                { id: '3', name: 'Tire Pressure', type: 'check' },
                { id: '4', name: 'Battery Condition', type: 'check' },
                { id: '5', name: 'Lights & Sirens', type: 'check' },
                { id: '6', name: 'SCBA Equipment', type: 'check' },
                { id: '7', name: 'Hoses', type: 'check' },
                { id: '8', name: 'Ladders', type: 'check' },
                { id: '9', name: 'Medical Supplies', type: 'medication' },
                { id: '10', name: 'Fire Extinguisher', type: 'medication' },
            ];
        }
        
        const newTruck = {
            id: Date.now().toString(),
            name: name,
            type: type,
            station: station,
            usageTracking: usageTracking,
            hasFuelLevel: hasFuelLevel,
            checklist: checklist
        };
        
        this.trucks.push(newTruck);
        await this.saveTruck(newTruck);
        
        this.showToast('✅ Truck added successfully!');
        this.navigateTo('trucks');
    }
    
    async deleteTruck(truckId) {
        if (confirm('Are you sure you want to delete this truck? This will also delete all associated check-ins.')) {
            this.trucks = this.trucks.filter(t => t.id !== truckId);
            this.checkIns = this.checkIns.filter(c => c.truckId !== truckId);
            
            await this.deleteTruckFromDB(truckId);
            await this.saveData();
            
            this.render();
        }
    }
    
    handleAddChecklistItem(event) {
        event.preventDefault();
        
        const name = document.getElementById('itemName').value.trim();
        const type = document.getElementById('itemType').value;
        
        const newItem = {
            id: Date.now().toString(),
            name: name,
            type: type
        };
        
        this.currentTruck.checklist.push(newItem);
        document.getElementById('itemName').value = '';
        this.render();
    }
    
    moveItemUp(index) {
        if (index === 0) return; // Already at top
        
        const checklist = this.currentTruck.checklist;
        // Swap with item above
        [checklist[index - 1], checklist[index]] = [checklist[index], checklist[index - 1]];
        
        this.render();
    }
    
    moveItemDown(index) {
        const checklist = this.currentTruck.checklist;
        if (index === checklist.length - 1) return; // Already at bottom
        
        // Swap with item below
        [checklist[index], checklist[index + 1]] = [checklist[index + 1], checklist[index]];
        
        this.render();
    }
    
    editChecklistItemName(index) {
        const item = this.currentTruck.checklist[index];
        const newName = prompt('Edit item name:', item.name);
        
        if (newName && newName.trim() !== '') {
            item.name = newName.trim();
            this.render();
        }
    }
    
    deleteChecklistItem(itemId) {
        if (confirm('Are you sure you want to delete this item?')) {
            this.currentTruck.checklist = this.currentTruck.checklist.filter(i => i.id !== itemId);
            this.render();
        }
    }
    
    async saveChecklist() {
        const truckIndex = this.trucks.findIndex(t => t.id === this.currentTruck.id);
        this.trucks[truckIndex] = this.currentTruck;
        
        await this.saveTruck(this.currentTruck);
        
        this.showToast('✅ Checklist updated successfully!');
        this.navigateTo('trucks');
    }
    
    checkExpirationWarning(itemId) {
        const expInput = document.getElementById(`exp-${itemId}`);
        const warningDiv = document.getElementById(`exp-warning-${itemId}`);
        
        if (!expInput || !expInput.value || !warningDiv) return;
        
        const expDate = new Date(expInput.value);
        const today = new Date();
        const daysUntilExp = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExp < 0) {
            warningDiv.innerHTML = '<span style="color: #dc3545; font-size: 12px; font-weight: bold;">⚠️ EXPIRED!</span>';
        } else if (daysUntilExp <= 30) {
            warningDiv.innerHTML = `<span style="color: #ffc107; font-size: 12px; font-weight: bold;">⚠️ Expires in ${daysUntilExp} days</span>`;
        } else if (daysUntilExp <= 90) {
            warningDiv.innerHTML = `<span style="color: #17a2b8; font-size: 12px;">ℹ️ Expires in ${daysUntilExp} days</span>`;
        } else {
            warningDiv.innerHTML = `<span style="color: #28a745; font-size: 12px;">✓ Expires in ${daysUntilExp} days</span>`;
        }
    }
    
    setCarryoverStatus(itemId, status) {
        const itemEl = document.getElementById(`carryover-${itemId}`);
        const passBtn = itemEl.querySelector('.status-btn.pass');
        const failBtn = itemEl.querySelector('.status-btn.fail');
        
        passBtn.classList.toggle('active', status === 'pass');
        failBtn.classList.toggle('active', status === 'fail');
        itemEl.style.border = status === 'pass' ? '2px solid #28a745' : '2px solid #ffc107';
        itemEl.style.background = status === 'pass' ? '#d4edda' : 'white';
    }
    
    setItemStatus(itemId, status) {
        const item = this.currentTruck.checklist.find(i => i.id === itemId);
        if (!item) return;
        
        // Update in currentCheckIn if editing
        if (this.currentCheckIn) {
            const checkInItem = this.currentCheckIn.items.find(i => i.id === itemId);
            if (checkInItem) checkInItem.status = status;
        }
        
        // Update UI
        const itemEl = document.getElementById(`item-${itemId}`);
        
        if (item.type === 'yesno') {
            // Handle Yes/No buttons with neutral gray styling
            const buttons = itemEl.querySelectorAll('.status-btn');
            buttons.forEach(btn => {
                const isActive = (btn.textContent.trim() === 'Yes' && status === 'yes') || 
                                (btn.textContent.trim() === 'No' && status === 'no');
                
                if (isActive) {
                    btn.classList.add('active');
                    btn.style.background = '#6c757d';
                    btn.style.color = 'white';
                } else {
                    btn.classList.remove('active');
                    btn.style.background = 'white';
                    btn.style.color = '#6c757d';
                }
            });
            itemEl.classList.toggle('failed', status === 'no');
        } else {
            // Handle Pass/Fail buttons (regular items)
            const passBtn = itemEl.querySelector('.status-btn.pass');
            const failBtn = itemEl.querySelector('.status-btn.fail');
            
            if (passBtn && failBtn) {
                passBtn.classList.toggle('active', status === 'pass');
                failBtn.classList.toggle('active', status === 'fail');
                itemEl.classList.toggle('failed', status === 'fail');
            }
        }
    }
    
    async handleSaveCheckIn() {
        const date = document.getElementById('checkInDate').value;
        const shift = document.getElementById('checkInShift').value;
        const personnel = document.getElementById('checkInPersonnel').value;
        const mileage = document.getElementById('checkInMileage').value;
        const fuelLevel = document.getElementById('checkInFuel').value;
        const notes = document.getElementById('checkInNotes').value;
        
        if (!personnel) {
            alert('Please select personnel from the list');
            return;
        }
        
        if (!date) {
            alert('Please select a date');
            return;
        }
        
        if (!shift) {
            alert('Please select a shift');
            return;
        }
        
        // Collect item statuses
        let items;
        try {
            // First, collect carryover items
            const carryoverItemsData = this.currentCarryoverItems.map(item => {
                const carryoverEl = document.getElementById(`carryover-${item.id}`);
                if (!carryoverEl) return null;
                
                const passBtn = carryoverEl.querySelector('.status-btn.pass');
                const status = passBtn && passBtn.classList.contains('active') ? 'pass' : 'fail';
                const notesInput = document.getElementById(`carryover-notes-${item.id}`);
                
                return {
                    id: item.id,
                    name: item.name,
                    type: item.type,
                    status: status,
                    notes: notesInput ? notesInput.value : '',
                    expirationDate: item.expirationDate || '',
                    pressure: '',
                    isCarryover: true,
                    originalFailDate: item.failedDate,
                    originalFailedBy: item.failedBy,
                    originalFailNotes: item.failedNotes
                };
            }).filter(item => item !== null);
            
            // Then collect regular checklist items
            items = this.currentTruck.checklist.map(item => {
                const notesInput = document.getElementById(`notes-${item.id}`);
                const expInput = document.getElementById(`exp-${item.id}`);
                const pressureInput = document.getElementById(`pressure-${item.id}`);
                
                let status = 'pass';
                let pressure = '';
                
                // For compressor items, check if pressure was entered
                if (item.type === 'compressor') {
                    if (!pressureInput || !pressureInput.value) {
                        alert(`Please enter pressure reading for: ${item.name}`);
                        throw new Error('Missing pressure reading');
                    }
                    pressure = pressureInput.value;
                    status = 'compressor'; // Special status for compressor items
                } else if (item.type === 'yesno') {
                    // For yes/no items, check which button is active
                    const statusBtns = document.getElementById(`item-${item.id}`);
                    const buttons = statusBtns.querySelectorAll('.status-btn');
                    let foundActive = false;
                    buttons.forEach(btn => {
                        if (btn.classList.contains('active')) {
                            status = btn.textContent.trim().toLowerCase(); // 'yes' or 'no'
                            foundActive = true;
                        }
                    });
                    if (!foundActive) status = 'yes'; // Default to yes if nothing selected
                } else {
                    // For regular pass/fail items
                    const statusBtns = document.getElementById(`item-${item.id}`);
                    status = statusBtns.querySelector('.status-btn.active.pass') ? 'pass' : 'fail';
                }
                
                return {
                    id: item.id,
                    name: item.name,
                    type: item.type,
                    status: status,
                    notes: notesInput ? notesInput.value : '',
                    expirationDate: expInput ? expInput.value : '',
                    pressure: pressure
                };
            });
            
            // Merge carryover items with regular items (carryover items take precedence)
            items = [...carryoverItemsData, ...items.filter(regularItem => 
                !carryoverItemsData.find(co => co.id === regularItem.id)
            )];
            
        } catch (error) {
            return; // Exit if validation failed
        }
        
        const checkInData = {
            id: this.currentCheckIn ? this.currentCheckIn.id : Date.now().toString(),
            truckId: this.currentTruck.id,
            truckName: this.currentTruck.name,
            personnel: personnel,
            shift: shift,
            date: date,
            mileage: mileage,
            fuelLevel: fuelLevel,
            notes: notes,
            items: items,
            createdAt: this.currentCheckIn ? this.currentCheckIn.createdAt : new Date().toISOString()
        };
        
        if (this.currentCheckIn) {
            // Update existing
            const index = this.checkIns.findIndex(c => c.id === this.currentCheckIn.id);
            this.checkIns[index] = checkInData;
        } else {
            // Add new
            this.checkIns.push(checkInData);
        }
        
        // Update the truck's checklist items with the latest expiration dates
        // This ensures they persist for the next check-in
        this.currentTruck.checklist.forEach(checklistItem => {
            const checkInItem = items.find(i => i.id === checklistItem.id);
            if (checkInItem && checkInItem.expirationDate) {
                checklistItem.expirationDate = checkInItem.expirationDate;
            }
        });
        
        // Save both the check-in and the updated truck
        await this.saveCheckIn(checkInData);
        await this.saveTruck(this.currentTruck);
        
        this.showToast(this.currentCheckIn ? '✅ Check-in updated!' : '✅ Check-in saved!');
        this.currentCheckIn = null;
        this.navigateTo('home');
    }
    
    viewCheckIn(checkInId) {
        const checkIn = this.checkIns.find(c => c.id === checkInId);
        this.navigateTo('viewCheckIn', { checkIn });
    }
    
    editCheckIn() {
        const truck = this.trucks.find(t => t.id === this.currentCheckIn.truckId);
        this.navigateTo('checkIn', { truck, checkIn: this.currentCheckIn });
    }
    
    async handleDeleteCheckIn() {
        if (confirm('Are you sure you want to delete this check-in? This action cannot be undone.')) {
            this.checkIns = this.checkIns.filter(c => c.id !== this.currentCheckIn.id);
            
            await this.deleteCheckInFromDB(this.currentCheckIn.id);
            await this.saveData();
            
            this.showToast('✅ Check-in deleted');
            this.navigateTo('history');
        }
    }
    
    async handleAddPersonnel(event) {
        event.preventDefault();
        
        const name = document.getElementById('personnelName').value.trim();
        
        if (this.personnel.includes(name)) {
            alert('This person is already in the list');
            return;
        }
        
        this.personnel.push(name);
        await this.savePersonnel(name);
        
        document.getElementById('personnelName').value = '';
        this.render();
    }
    
    async editPersonnel(index) {
        const currentName = this.personnel[index];
        const newName = prompt('Edit name:', currentName);
        
        if (newName && newName.trim() !== '') {
            const trimmedName = newName.trim();
            
            // Check if new name already exists (and it's not the same person)
            if (this.personnel.includes(trimmedName) && trimmedName !== currentName) {
                alert('This name already exists in the list');
                return;
            }
            
            // Update personnel list
            await this.deletePersonnelFromDB(currentName);
            this.personnel[index] = trimmedName;
            await this.savePersonnel(trimmedName);
            
            // Update all check-ins with this personnel name
            for (const checkIn of this.checkIns) {
                if (checkIn.personnel === currentName) {
                    checkIn.personnel = trimmedName;
                    await this.saveCheckIn(checkIn);
                }
            }
            
            this.render();
        }
    }
    
    async handleDeletePersonnel(index) {
        const name = this.personnel[index];
        
        // Check if this person has any check-ins
        const hasCheckIns = this.checkIns.some(c => c.personnel === name);
        
        let message = `Are you sure you want to delete "${name}"?`;
        if (hasCheckIns) {
            message += '\n\nNote: This person has check-ins in the history. Those records will remain but you can no longer select this name for new check-ins.';
        }
        
        if (confirm(message)) {
            await this.deletePersonnelFromDB(name);
            this.personnel.splice(index, 1);
            this.render();
        }
    }
    
    exportReport(type) {
        const now = new Date();
        let startDate, endDate, title;
        
        if (type === 'monthly') {
            const month = prompt('Enter month (1-12) or leave blank for current month:');
            const monthNum = month ? parseInt(month) - 1 : now.getMonth();
            startDate = new Date(now.getFullYear(), monthNum, 1);
            endDate = new Date(now.getFullYear(), monthNum + 1, 0);
            title = `Monthly Report - ${startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
        } else {
            const year = prompt('Enter year or leave blank for current year:');
            const yearNum = year ? parseInt(year) : now.getFullYear();
            startDate = new Date(yearNum, 0, 1);
            endDate = new Date(yearNum, 11, 31);
            title = `Yearly Report - ${yearNum}`;
        }
        
        const filtered = this.checkIns.filter(c => {
            const checkInDate = new Date(c.date);
            return checkInDate >= startDate && checkInDate <= endDate;
        });
        
        if (filtered.length === 0) {
            alert(`No check-ins found for the selected ${type === 'monthly' ? 'month' : 'year'}`);
            return;
        }
        
        this.generateHTMLReport(filtered, title, startDate, endDate);
    }
    
    generateHTMLReport(checkIns, title, startDate, endDate) {
        // Build timeline for each item that failed
        const itemTimelines = {}; // itemId+truckId -> array of events
        
        // Sort all check-ins by date
        const sortedCheckIns = [...checkIns].sort((a, b) => new Date(a.date) - new Date(b.date));
        
        sortedCheckIns.forEach(checkIn => {
            checkIn.items.forEach(item => {
                // Only track Pass/Fail items (not yes/no, not compressor)
                if (item.type !== 'check') return;
                
                const key = `${item.id}-${checkIn.truckId}`;
                if (!itemTimelines[key]) {
                    itemTimelines[key] = {
                        itemName: item.name,
                        truckName: checkIn.truckName,
                        truckId: checkIn.truckId,
                        events: []
                    };
                }
                
                // Add event to timeline
                itemTimelines[key].events.push({
                    date: checkIn.date,
                    status: item.status,
                    personnel: checkIn.personnel,
                    notes: item.notes,
                    isCarryover: item.isCarryover || false,
                    originalFailDate: item.originalFailDate,
                    originalFailedBy: item.originalFailedBy
                });
            });
        });
        
        // Filter to only items that have failures
        const failedItems = Object.values(itemTimelines).filter(timeline => 
            timeline.events.some(e => e.status === 'fail')
        );
        
        let html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #C41E3A; text-align: center; }
        .date-range { text-align: center; color: #666; margin-bottom: 30px; }
        .truck-section { margin-bottom: 40px; page-break-inside: avoid; }
        .truck-header { background: #C41E3A; color: white; padding: 15px; font-size: 18px; font-weight: bold; }
        .section-title { background: #f8f9fa; padding: 10px; margin-top: 20px; margin-bottom: 10px; font-weight: bold; border-left: 4px solid #C41E3A; }
        .checkin { border: 1px solid #ddd; padding: 15px; margin: 10px 0; background: white; }
        .checkin-header { font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 10px; }
        .pass { color: green; }
        .fail { color: red; background: #fff3cd; padding: 10px; margin: 5px 0; }
        .item-timeline { border: 1px solid #ddd; padding: 15px; margin: 10px 0; background: #f8f9fa; }
        .item-name { font-weight: bold; font-size: 16px; margin-bottom: 10px; color: #333; }
        .event { padding: 10px; margin: 8px 0; border-left: 4px solid #ddd; }
        .event-fail { background: #fff3cd; border-left-color: #ffc107; }
        .event-pass { background: #d4edda; border-left-color: #28a745; }
        .event-header { font-weight: bold; margin-bottom: 5px; }
        .event-notes { font-style: italic; color: #666; margin-top: 5px; }
        @media print { .truck-section { page-break-after: always; } }
    </style>
</head>
<body>
    <h1>${title}</h1>
    <div class="date-range">${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}</div>
    <div style="background: #f8f9fa; padding: 15px; margin-bottom: 20px;">
        <strong>Summary:</strong><br>
        Total Check-Ins: ${checkIns.length}<br>
        Items with Failures: ${failedItems.length}<br>
        Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
    </div>
`;
        
        // Group by truck
        const truckGroups = {};
        checkIns.forEach(checkIn => {
            if (!truckGroups[checkIn.truckId]) {
                truckGroups[checkIn.truckId] = {
                    name: checkIn.truckName,
                    checkIns: [],
                    failedItems: []
                };
            }
            truckGroups[checkIn.truckId].checkIns.push(checkIn);
        });
        
        // Add failed items to truck groups
        failedItems.forEach(timeline => {
            if (truckGroups[timeline.truckId]) {
                truckGroups[timeline.truckId].failedItems.push(timeline);
            }
        });
        
        // Generate report for each truck
        Object.values(truckGroups).forEach(truck => {
            html += `<div class="truck-section">
                <div class="truck-header">${truck.name}</div>`;
            
            // Section 1: Daily Check-Ins
            html += `<div class="section-title">DAILY CHECK-INS</div>`;
            
            truck.checkIns.forEach(checkIn => {
                const failedItems = checkIn.items.filter(i => i.status === 'fail' || i.status === 'no');
                const date = this.parseLocalDate(checkIn.date);
                
                html += `
                    <div class="checkin">
                        <div class="checkin-header">
                            ${date.toLocaleDateString()} | 
                            ${checkIn.shift ? `${checkIn.shift} Shift | ` : ''}
                            ${checkIn.personnel}
                        </div>
                        <div>
                            ${checkIn.mileage ? `Mileage/Hours: ${checkIn.mileage} | ` : ''}
                            ${checkIn.fuelLevel ? `Fuel: ${checkIn.fuelLevel}` : ''}
                        </div>
                        ${failedItems.length > 0 ? `
                            <div style="margin-top: 10px;"><strong>Failed Items:</strong></div>
                            ${failedItems.map(item => `
                                <div class="fail">
                                    ✗ ${item.name}
                                    ${item.notes ? `<br>Notes: ${item.notes}` : ''}
                                </div>
                            `).join('')}
                        ` : '<div style="margin-top: 10px;" class="pass">✓ All items passed</div>'}
                        ${checkIn.notes ? `<div style="margin-top: 10px;"><strong>Additional Notes:</strong> ${checkIn.notes}</div>` : ''}
                    </div>
                `;
            });
            
            // Section 2: Failure Timeline (if any failures)
            if (truck.failedItems.length > 0) {
                html += `<div class="section-title">FAILURE TIMELINE</div>`;
                
                truck.failedItems.forEach(timeline => {
                    html += `
                        <div class="item-timeline">
                            <div class="item-name">${timeline.itemName}</div>
                    `;
                    
                    timeline.events.forEach(event => {
                        const eventDate = this.parseLocalDate(event.date).toLocaleDateString();
                        const isPass = event.status === 'pass';
                        const statusLabel = isPass ? 'PASSED' : 'FAILED';
                        
                        html += `
                            <div class="event ${isPass ? 'event-pass' : 'event-fail'}">
                                <div class="event-header">
                                    • ${eventDate} - ${statusLabel} by ${event.personnel}
                                </div>
                                ${event.notes ? `<div class="event-notes">Notes: "${event.notes}"</div>` : ''}
                            </div>
                        `;
                    });
                    
                    html += `</div>`;
                });
            }
            
            html += '</div>';
        });
        
        html += '</body></html>';
        
        // Create and download
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `FireTruck_Report_${Date.now()}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('📄 Report downloaded!');
    }
}

// Initialize app
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new FireTruckApp();
});
