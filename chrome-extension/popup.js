// Popup script for Productivity Tracker Chrome Extension

class ProductivityTracker {
    constructor() {
        this.currentTab = 'dashboard';
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadData();
        this.updateUI();
        this.startCurrentSiteTimer();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Blocking controls
        document.getElementById('blockingEnabled').addEventListener('change', (e) => {
            this.toggleBlocking(e.target.checked);
        });

        document.getElementById('addBlockedSite').addEventListener('click', () => {
            this.addBlockedSite();
        });

        // Focus mode
        document.getElementById('startFocus').addEventListener('click', () => {
            this.startFocusSession();
        });

        document.getElementById('stopFocus').addEventListener('click', () => {
            this.stopFocusSession();
        });

        // Settings
        document.getElementById('addProductiveSite').addEventListener('click', () => {
            this.addProductiveSite();
        });

        document.getElementById('addDistractingSite').addEventListener('click', () => {
            this.addDistractingSite();
        });

        document.getElementById('syncData').addEventListener('click', () => {
            this.syncData();
        });

        document.getElementById('exportData').addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('viewReport').addEventListener('click', () => {
            this.openFullReport();
        });

        // Enter key handlers
        document.getElementById('newBlockedSite').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addBlockedSite();
        });

        document.getElementById('newProductiveSite').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addProductiveSite();
        });

        document.getElementById('newDistractingSite').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addDistractingSite();
        });
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        this.currentTab = tabName;
    }

    async loadData() {
        try {
            const result = await chrome.storage.local.get([
                'timeData',
                'blockedSites',
                'productiveSites',
                'distractingSites',
                'blockingEnabled',
                'focusSession',
                'notificationsEnabled'
            ]);

            this.timeData = result.timeData || {};
            this.blockedSites = result.blockedSites || [];
            this.productiveSites = result.productiveSites || ['github.com', 'stackoverflow.com', 'docs.google.com'];
            this.distractingSites = result.distractingSites || ['facebook.com', 'twitter.com', 'youtube.com', 'reddit.com'];
            this.blockingEnabled = result.blockingEnabled || false;
            this.focusSession = result.focusSession || null;
            this.notificationsEnabled = result.notificationsEnabled !== false;

            // Set UI states
            document.getElementById('blockingEnabled').checked = this.blockingEnabled;
            document.getElementById('notificationsEnabled').checked = this.notificationsEnabled;
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    async updateUI() {
        await this.updateDashboard();
        this.updateBlockingTab();
        this.updateSettingsTab();
    }

    async updateDashboard() {
        const today = new Date().toDateString();
        const todayData = this.timeData[today] || {};

        // Calculate totals
        let totalTime = 0;
        let productiveTime = 0;
        let distractingTime = 0;

        Object.entries(todayData).forEach(([site, time]) => {
            totalTime += time;
            if (this.productiveSites.some(ps => site.includes(ps))) {
                productiveTime += time;
            } else if (this.distractingSites.some(ds => site.includes(ds))) {
                distractingTime += time;
            }
        });

        // Update stats
        document.getElementById('totalTime').textContent = this.formatTime(totalTime);
        document.getElementById('productiveTime').textContent = this.formatTime(productiveTime);
        document.getElementById('distractingTime').textContent = this.formatTime(distractingTime);

        // Update current site
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab) {
                const url = new URL(tab.url);
                const domain = url.hostname;
                document.getElementById('currentSite').textContent = domain;
                document.getElementById('currentSiteTime').textContent = 
                    this.formatTime(todayData[domain] || 0);
            }
        } catch (error) {
            console.error('Error getting current tab:', error);
        }

        // Update top sites
        this.updateTopSites(todayData);
    }

    updateTopSites(todayData) {
        const topSites = Object.entries(todayData)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);

        const container = document.getElementById('topSites');
        container.innerHTML = '';

        if (topSites.length === 0) {
            container.innerHTML = '<div class="site-item"><span class="site-name">No data yet</span></div>';
            return;
        }

        topSites.forEach(([site, time]) => {
            const siteItem = document.createElement('div');
            siteItem.className = 'site-item';
            siteItem.innerHTML = `
                <span class="site-name">${site}</span>
                <span class="site-time">${this.formatTime(time)}</span>
            `;
            container.appendChild(siteItem);
        });
    }

    updateBlockingTab() {
        const container = document.getElementById('blockedSitesList');
        container.innerHTML = '';

        this.blockedSites.forEach((site, index) => {
            const siteItem = document.createElement('div');
            siteItem.className = 'site-item';
            siteItem.innerHTML = `
                <span class="site-name">${site}</span>
                <button class="remove-btn" data-index="${index}">Remove</button>
            `;
            container.appendChild(siteItem);
        });

        // Add remove event listeners
        container.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.removeBlockedSite(parseInt(e.target.dataset.index));
            });
        });

        // Update focus session status
        if (this.focusSession && this.focusSession.active) {
            document.getElementById('focusStatus').style.display = 'block';
            this.updateFocusTimer();
        } else {
            document.getElementById('focusStatus').style.display = 'none';
        }
    }

    updateSettingsTab() {
        this.updateSitesList('productiveSitesList', this.productiveSites, 'removeProductiveSite');
        this.updateSitesList('distractingSitesList', this.distractingSites, 'removeDistractingSite');
    }

    updateSitesList(containerId, sites, removeMethod) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';

        sites.forEach((site, index) => {
            const siteItem = document.createElement('div');
            siteItem.className = 'site-item';
            siteItem.innerHTML = `
                <span class="site-name">${site}</span>
                <button class="remove-btn" data-index="${index}">Remove</button>
            `;
            container.appendChild(siteItem);
        });

        container.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this[removeMethod](parseInt(e.target.dataset.index));
            });
        });
    }

    async toggleBlocking(enabled) {
        this.blockingEnabled = enabled;
        await chrome.storage.local.set({ blockingEnabled: enabled });
        
        // Send message to background script
        chrome.runtime.sendMessage({ 
            action: 'toggleBlocking', 
            enabled: enabled 
        });
    }

    async addBlockedSite() {
        const input = document.getElementById('newBlockedSite');
        const site = input.value.trim();
        
        if (site && !this.blockedSites.includes(site)) {
            this.blockedSites.push(site);
            await chrome.storage.local.set({ blockedSites: this.blockedSites });
            input.value = '';
            this.updateBlockingTab();
            
            // Update blocking rules
            chrome.runtime.sendMessage({ 
                action: 'updateBlockingRules', 
                sites: this.blockedSites 
            });
        }
    }

    async removeBlockedSite(index) {
        this.blockedSites.splice(index, 1);
        await chrome.storage.local.set({ blockedSites: this.blockedSites });
        this.updateBlockingTab();
        
        chrome.runtime.sendMessage({ 
            action: 'updateBlockingRules', 
            sites: this.blockedSites 
        });
    }

    async startFocusSession() {
        const minutes = parseInt(document.getElementById('focusMinutes').value);
        if (minutes < 1 || minutes > 180) return;

        const endTime = Date.now() + (minutes * 60 * 1000);
        this.focusSession = {
            active: true,
            endTime: endTime,
            duration: minutes
        };

        await chrome.storage.local.set({ focusSession: this.focusSession });
        
        chrome.runtime.sendMessage({ 
            action: 'startFocusSession', 
            endTime: endTime 
        });

        this.updateBlockingTab();
    }

    async stopFocusSession() {
        this.focusSession = null;
        await chrome.storage.local.set({ focusSession: null });
        
        chrome.runtime.sendMessage({ action: 'stopFocusSession' });
        
        this.updateBlockingTab();
    }

    updateFocusTimer() {
        if (!this.focusSession || !this.focusSession.active) return;

        const remaining = Math.max(0, this.focusSession.endTime - Date.now());
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        
        document.getElementById('focusTimeRemaining').textContent = 
            `${minutes}:${seconds.toString().padStart(2, '0')}`;

        if (remaining > 0) {
            setTimeout(() => this.updateFocusTimer(), 1000);
        } else {
            this.stopFocusSession();
        }
    }

    async addProductiveSite() {
        const input = document.getElementById('newProductiveSite');
        const site = input.value.trim();
        
        if (site && !this.productiveSites.includes(site)) {
            this.productiveSites.push(site);
            await chrome.storage.local.set({ productiveSites: this.productiveSites });
            input.value = '';
            this.updateSettingsTab();
        }
    }

    async removeProductiveSite(index) {
        this.productiveSites.splice(index, 1);
        await chrome.storage.local.set({ productiveSites: this.productiveSites });
        this.updateSettingsTab();
    }

    async addDistractingSite() {
        const input = document.getElementById('newDistractingSite');
        const site = input.value.trim();
        
        if (site && !this.distractingSites.includes(site)) {
            this.distractingSites.push(site);
            await chrome.storage.local.set({ distractingSites: this.distractingSites });
            input.value = '';
            this.updateSettingsTab();
        }
    }

    async removeDistractingSite(index) {
        this.distractingSites.splice(index, 1);
        await chrome.storage.local.set({ distractingSites: this.distractingSites });
        this.updateSettingsTab();
    }

    async syncData() {
        const syncStatus = document.getElementById('syncStatus');
        syncStatus.textContent = 'Syncing...';
        
        try {
            // Send data to backend
            const response = await fetch('http://localhost:5001/api/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    timeData: this.timeData,
                    blockedSites: this.blockedSites,
                    productiveSites: this.productiveSites,
                    distractingSites: this.distractingSites
                })
            });

            if (response.ok) {
                syncStatus.textContent = `Last sync: ${new Date().toLocaleString()}`;
            } else {
                syncStatus.textContent = 'Sync failed';
            }
        } catch (error) {
            console.error('Sync error:', error);
            syncStatus.textContent = 'Sync failed - Server unavailable';
        }
    }

    exportData() {
        const data = {
            timeData: this.timeData,
            blockedSites: this.blockedSites,
            productiveSites: this.productiveSites,
            distractingSites: this.distractingSites,
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `productivity-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    }

    openFullReport() {
        chrome.tabs.create({ url: 'http://localhost:3001/dashboard' });
    }

    startCurrentSiteTimer() {
        setInterval(() => {
            this.updateCurrentSiteTime();
        }, 1000);
    }

    async updateCurrentSiteTime() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab) {
                const url = new URL(tab.url);
                const domain = url.hostname;
                const today = new Date().toDateString();
                
                if (!this.timeData[today]) {
                    this.timeData[today] = {};
                }
                
                this.timeData[today][domain] = (this.timeData[today][domain] || 0) + 1;
                
                // Update display
                document.getElementById('currentSiteTime').textContent = 
                    this.formatTime(this.timeData[today][domain]);
            }
        } catch (error) {
            // Ignore errors for non-web pages
        }
    }

    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }
}

// Initialize when popup opens
document.addEventListener('DOMContentLoaded', () => {
    new ProductivityTracker();
});
