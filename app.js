// Fire Truck Check-In PWA Application
class FireTruckApp {
    constructor() {
        this.currentScreen = 'home';
        this.trucks = [];
        this.checkIns = [];
        this.personnel = [];
        this.currentTruck = null;
        this.currentCheckIn = null;
        
        this.init();
    }
    
    async init() {
        await this.loadData();
        this.render();
        this.registerServiceWorker();
    }
    
    // Data Management
    async loadData() {
        this.trucks = JSON.parse(localStorage.getItem('trucks') || '[]');
        this.checkIns = JSON.parse(localStorage.getItem('checkIns') || '[]');
        this.personnel = JSON.parse(localStorage.getItem('personnel') || '[]');
    }
    
    async saveData() {
        localStorage.setItem('trucks', JSON.stringify(this.trucks));
        localStorage.setItem('checkIns', JSON.stringify(this.checkIns));
        localStorage.setItem('personnel', JSON.stringify(this.personnel));
    }
    
    // Service Worker for offline support
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(reg => console.log('Service Worker registered'))
                .catch(err => console.log('Service Worker registration failed'));
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
    
    // Rendering
    render() {
        const app = document.getElementById('app');
        
        let content = '';
        
        switch(this.currentScreen) {
            case 'home':
                content = this.renderHome();
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
        
        return `
            <div class="header">
                <h1>🚒 Fire Department</h1>
                <p>Daily Truck Check-In System</p>
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
                        <button class="btn btn-primary" onclick="app.navigateTo('trucks')">
                            🚒 Manage Trucks
                        </button>
                        <button class="btn btn-primary" onclick="app.navigateTo('personnel')">
                            👥 Manage Personnel
                        </button>
                        <button class="btn btn-primary" onclick="app.navigateTo('history')">
                            📋 View History
                        </button>
                    </div>
                </div>
                
                ${this.trucks.length > 0 ? `
                    <div class="card">
                        <h2>Quick Check-In</h2>
                        <div class="truck-list">
                            ${this.trucks.map(truck => `
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
                ` : `
                    <div class="empty-state">
                        <div class="empty-state-icon">🚒</div>
                        <h3>No Trucks Configured</h3>
                        <p>Add your first truck to get started</p>
                        <button class="btn btn-primary" onclick="app.navigateTo('addTruck')">
                            Add First Truck
                        </button>
                    </div>
                `}
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
        const types = ['Engine', 'Ladder', 'Squad', 'Rescue', 'Tanker', 'Brush', 'Chief', 'Other'];
        
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
                        
                        <div class="alert alert-info">
                            ℹ️ A default checklist will be created. You can customize it after adding the truck.
                        </div>
                        
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
                    <h2>Add New Item</h2>
                    <form id="addItemForm" onsubmit="app.handleAddChecklistItem(event)">
                        <div class="form-group">
                            <label>Item Name *</label>
                            <input type="text" id="itemName" placeholder="e.g., Engine Oil Level" required>
                        </div>
                        
                        <div class="form-group">
                            <label>Item Type *</label>
                            <select id="itemType">
                                <option value="check">Regular Check</option>
                                <option value="medication">Medication/Expiration Date</option>
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
                            <div class="checklist-item">
                                <div style="display: flex; justify-content: space-between; align-items: start;">
                                    <div style="flex: 1;">
                                        <h4>${index + 1}. ${item.name}</h4>
                                        <p style="font-size: 12px; color: #666;">
                                            ${item.type === 'medication' ? '📅 Has Expiration' : '✓ Regular Check'}
                                        </p>
                                    </div>
                                    <button class="btn btn-danger btn-small" onclick="app.deleteChecklistItem('${item.id}')">
                                        Delete
                                    </button>
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
        const today = new Date().toISOString().split('T')[0];
        
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
        
        const checkInData = existingCheckIn || {
            date: today,
            shift: '',
            personnel: '',
            mileage: '',
            fuelLevel: '',
            notes: '',
            items: truck.checklist.map(item => ({
                id: item.id,
                name: item.name,
                type: item.type,
                status: 'pass',
                notes: '',
                expirationDate: ''
            }))
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
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Mileage</label>
                                <input type="number" id="checkInMileage" placeholder="e.g., 45230" value="${checkInData.mileage}">
                            </div>
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
                        </div>
                    </form>
                </div>
                
                <div class="card">
                    <h2>Checklist Items</h2>
                    <div class="checklist-items" id="checklistItems">
                        ${checkInData.items.map((item, index) => `
                            <div class="checklist-item ${item.status === 'fail' ? 'failed' : ''}" id="item-${item.id}">
                                <h4>${index + 1}. ${item.name} ${item.type === 'medication' ? '📅' : ''}</h4>
                                
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
                                
                                ${item.type === 'medication' ? `
                                    <div class="form-group">
                                        <label style="font-size: 12px;">Expiration Date</label>
                                        <input type="date" id="exp-${item.id}" value="${item.expirationDate}" 
                                               style="padding: 8px; font-size: 14px;">
                                    </div>
                                ` : ''}
                                
                                <div id="notes-container-${item.id}" style="display: ${item.status === 'fail' ? 'block' : 'none'};">
                                    <div class="form-group">
                                        <label style="font-size: 12px;">Deficiency Notes</label>
                                        <textarea id="notes-${item.id}" placeholder="Describe the issue..." 
                                                  style="min-height: 60px; padding: 8px; font-size: 14px;">${item.notes}</textarea>
                                    </div>
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
                <button class="btn btn-primary" onclick="app.saveCheckIn()">
                    ${existingCheckIn ? 'Update' : 'Complete'} Check-In
                </button>
            </div>
        `;
    }
    
    renderHistory() {
        const sortedCheckIns = [...this.checkIns].sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );
        
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
                
                <div class="card">
                    <h2>${sortedCheckIns.length} Check-Ins</h2>
                </div>
                
                ${sortedCheckIns.length === 0 ? `
                    <div class="empty-state">
                        <div class="empty-state-icon">📋</div>
                        <h3>No check-ins found</h3>
                        <p>Perform a check-in to see it here</p>
                    </div>
                ` : `
                    ${sortedCheckIns.map(checkIn => {
                        const failedItems = checkIn.items.filter(i => i.status === 'fail').length;
                        const date = new Date(checkIn.date);
                        
                        return `
                            <div class="history-item" onclick="app.viewCheckIn('${checkIn.id}')">
                                <div class="history-header">
                                    <div class="history-truck">${checkIn.truckName}</div>
                                    <div class="history-date">${date.toLocaleDateString()}</div>
                                </div>
                                ${checkIn.shift ? `<div style="font-size: 14px; color: #666; margin-bottom: 4px;">🔄 ${checkIn.shift} Shift</div>` : ''}
                                <div class="history-personnel">👤 ${checkIn.personnel}</div>
                                ${checkIn.mileage ? `<div style="font-size: 14px; color: #666;">📍 ${checkIn.mileage} miles</div>` : ''}
                                ${checkIn.fuelLevel ? `<div style="font-size: 14px; color: #666;">⛽ ${checkIn.fuelLevel}</div>` : ''}
                                ${failedItems > 0 ? `<div class="fail-badge">${failedItems} Failed Items</div>` : ''}
                            </div>
                        `;
                    }).join('')}
                `}
            </div>
            
            <div class="bottom-nav">
                <button class="btn btn-secondary" onclick="app.navigateTo('home')">← Home</button>
            </div>
        `;
    }
    
    renderViewCheckIn() {
        const checkIn = this.currentCheckIn;
        const date = new Date(checkIn.date);
        const passedItems = checkIn.items.filter(i => i.status === 'pass');
        const failedItems = checkIn.items.filter(i => i.status === 'fail');
        
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
                
                ${failedItems.length > 0 ? `
                    <div class="card">
                        <div class="alert alert-warning">
                            <strong>⚠️ Failed Items (${failedItems.length})</strong>
                        </div>
                        ${failedItems.map((item, index) => `
                            <div class="checklist-item failed">
                                <h4>${index + 1}. ${item.name}</h4>
                                ${item.expirationDate ? `<p style="font-size: 14px; margin-top: 5px;">📅 Expires: ${new Date(item.expirationDate).toLocaleDateString()}</p>` : ''}
                                ${item.notes ? `
                                    <div style="background: white; padding: 10px; border-radius: 6px; margin-top: 8px;">
                                        <strong style="font-size: 12px;">Deficiency Notes:</strong>
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
                                <p style="color: #155724;">✓ ${item.name}</p>
                                ${item.expirationDate ? `<p style="font-size: 13px; color: #666; margin-top: 3px;">📅 Expires: ${new Date(item.expirationDate).toLocaleDateString()}</p>` : ''}
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
                <button class="btn btn-danger" onclick="app.deleteCheckIn()">Delete</button>
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
                                        <button class="btn btn-danger btn-small" onclick="app.deletePersonnel(${index})">
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
        // Add any dynamic event listeners here if needed
    }
    
    quickCheckIn(truckId) {
        const truck = this.trucks.find(t => t.id === truckId);
        this.navigateTo('checkIn', { truck });
    }
    
    editChecklist(truckId) {
        const truck = this.trucks.find(t => t.id === truckId);
        this.navigateTo('editChecklist', { truck });
    }
    
    handleAddTruck(event) {
        event.preventDefault();
        
        const name = document.getElementById('truckName').value.trim();
        const type = document.getElementById('truckType').value;
        
        const newTruck = {
            id: Date.now().toString(),
            name: name,
            type: type,
            checklist: [
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
            ]
        };
        
        this.trucks.push(newTruck);
        this.saveData();
        alert('Truck added successfully!');
        this.navigateTo('trucks');
    }
    
    deleteTruck(truckId) {
        if (confirm('Are you sure you want to delete this truck? This will also delete all associated check-ins.')) {
            this.trucks = this.trucks.filter(t => t.id !== truckId);
            this.checkIns = this.checkIns.filter(c => c.truckId !== truckId);
            this.saveData();
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
    
    deleteChecklistItem(itemId) {
        if (confirm('Are you sure you want to delete this item?')) {
            this.currentTruck.checklist = this.currentTruck.checklist.filter(i => i.id !== itemId);
            this.render();
        }
    }
    
    saveChecklist() {
        const truckIndex = this.trucks.findIndex(t => t.id === this.currentTruck.id);
        this.trucks[truckIndex] = this.currentTruck;
        this.saveData();
        alert('Checklist updated successfully!');
        this.navigateTo('trucks');
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
        const passBtn = itemEl.querySelector('.status-btn.pass');
        const failBtn = itemEl.querySelector('.status-btn.fail');
        const notesContainer = document.getElementById(`notes-container-${itemId}`);
        
        passBtn.classList.toggle('active', status === 'pass');
        failBtn.classList.toggle('active', status === 'fail');
        itemEl.classList.toggle('failed', status === 'fail');
        
        if (notesContainer) {
            notesContainer.style.display = status === 'fail' ? 'block' : 'none';
        }
    }
    
    saveCheckIn() {
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
        const items = this.currentTruck.checklist.map(item => {
            const statusBtns = document.getElementById(`item-${item.id}`);
            const status = statusBtns.querySelector('.status-btn.active.pass') ? 'pass' : 'fail';
            const notesInput = document.getElementById(`notes-${item.id}`);
            const expInput = document.getElementById(`exp-${item.id}`);
            
            return {
                id: item.id,
                name: item.name,
                type: item.type,
                status: status,
                notes: notesInput ? notesInput.value : '',
                expirationDate: expInput ? expInput.value : ''
            };
        });
        
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
        
        // Personnel is already in the list since they selected from dropdown
        // No need to add to personnel array
        
        if (this.currentCheckIn) {
            // Update existing
            const index = this.checkIns.findIndex(c => c.id === this.currentCheckIn.id);
            this.checkIns[index] = checkInData;
        } else {
            // Add new
            this.checkIns.push(checkInData);
        }
        
        this.saveData();
        alert(this.currentCheckIn ? 'Check-in updated successfully!' : 'Check-in saved successfully!');
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
    
    deleteCheckIn() {
        if (confirm('Are you sure you want to delete this check-in? This action cannot be undone.')) {
            this.checkIns = this.checkIns.filter(c => c.id !== this.currentCheckIn.id);
            this.saveData();
            alert('Check-in deleted successfully');
            this.navigateTo('history');
        }
    }
    
    handleAddPersonnel(event) {
        event.preventDefault();
        
        const name = document.getElementById('personnelName').value.trim();
        
        if (this.personnel.includes(name)) {
            alert('This person is already in the list');
            return;
        }
        
        this.personnel.push(name);
        this.saveData();
        document.getElementById('personnelName').value = '';
        this.render();
    }
    
    editPersonnel(index) {
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
            this.personnel[index] = trimmedName;
            
            // Update all check-ins with this personnel name
            this.checkIns.forEach(checkIn => {
                if (checkIn.personnel === currentName) {
                    checkIn.personnel = trimmedName;
                }
            });
            
            this.saveData();
            this.render();
        }
    }
    
    deletePersonnel(index) {
        const name = this.personnel[index];
        
        // Check if this person has any check-ins
        const hasCheckIns = this.checkIns.some(c => c.personnel === name);
        
        let message = `Are you sure you want to delete "${name}"?`;
        if (hasCheckIns) {
            message += '\n\nNote: This person has check-ins in the history. Those records will remain but you can no longer select this name for new check-ins.';
        }
        
        if (confirm(message)) {
            this.personnel.splice(index, 1);
            this.saveData();
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
        .checkin { border: 1px solid #ddd; padding: 15px; margin: 10px 0; }
        .checkin-header { font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 10px; }
        .pass { color: green; }
        .fail { color: red; background: #fff3cd; padding: 10px; margin: 5px 0; }
        @media print { .truck-section { page-break-after: always; } }
    </style>
</head>
<body>
    <h1>${title}</h1>
    <div class="date-range">${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}</div>
    <div style="background: #f8f9fa; padding: 15px; margin-bottom: 20px;">
        <strong>Summary:</strong><br>
        Total Check-Ins: ${checkIns.length}<br>
        Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
    </div>
`;
        
        // Group by truck
        const truckGroups = {};
        checkIns.forEach(checkIn => {
            if (!truckGroups[checkIn.truckId]) {
                truckGroups[checkIn.truckId] = [];
            }
            truckGroups[checkIn.truckId].push(checkIn);
        });
        
        Object.values(truckGroups).forEach(truckCheckIns => {
            const firstCheckIn = truckCheckIns[0];
            html += `<div class="truck-section">
                <div class="truck-header">${firstCheckIn.truckName}</div>`;
            
            truckCheckIns.forEach(checkIn => {
                const failedItems = checkIn.items.filter(i => i.status === 'fail');
                html += `
                    <div class="checkin">
                        <div class="checkin-header">
                            Date: ${new Date(checkIn.date).toLocaleDateString()} | 
                            ${checkIn.shift ? `Shift: ${checkIn.shift} | ` : ''}
                            Personnel: ${checkIn.personnel}
                        </div>
                        <div>Mileage: ${checkIn.mileage || 'N/A'} | Fuel: ${checkIn.fuelLevel || 'N/A'}</div>
                        ${failedItems.length > 0 ? `
                            <div style="margin-top: 10px;"><strong>Failed Items:</strong></div>
                            ${failedItems.map(item => `
                                <div class="fail">
                                    ✗ ${item.name}
                                    ${item.notes ? `<br>Notes: ${item.notes}` : ''}
                                </div>
                            `).join('')}
                        ` : '<div style="margin-top: 10px;" class="pass">✓ All items passed</div>'}
                    </div>
                `;
            });
            
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
        
        alert('Report downloaded! Check your downloads folder.');
    }
}

// Initialize app
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new FireTruckApp();
});
