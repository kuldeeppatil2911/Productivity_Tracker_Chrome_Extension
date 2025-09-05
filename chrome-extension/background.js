// Background service worker for Productivity Tracker
class ProductivityBackground {
    constructor() {
        this.focusSession = null;
        this.blockedSites = [];
        this.blockingEnabled = false;
        this.init();
    }

    init() {
        this.setupMessageListeners();
        this.setupAlarms();
        this.loadSettings();
        this.setupWebRequestListeners();
    }

    setupMessageListeners() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            switch (message.action) {
                case 'updateTimeSpent':
                    this.updateTimeSpent(message.domain, message.timeSpent, message.url, message.title);
                    break;
                case 'toggleBlocking':
                    this.toggleBlocking(message.enabled);
                    break;
                case 'updateBlockingRules':
                    this.updateBlockingRules(message.sites);
                    break;
                case 'startFocusSession':
                    this.startFocusSession(message.endTime);
                    break;
                case 'stopFocusSession':
                    this.stopFocusSession();
                    break;
                default:
                    break;
            }
        });
    }

    setupAlarms() {
        // Daily report alarm
        chrome.alarms.create('dailyReport', {
            when: this.getNextMidnight(),
            periodInMinutes: 24 * 60 // 24 hours
        });

        // Focus session check
        chrome.alarms.create('focusCheck', {
            periodInMinutes: 1
        });

        chrome.alarms.onAlarm.addListener((alarm) => {
            switch (alarm.name) {
                case 'dailyReport':
                    this.generateDailyReport();
                    break;
                case 'focusCheck':
                    this.checkFocusSession();
                    break;
            }
        });
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.local.get([
                'blockedSites',
                'blockingEnabled',
                'focusSession'
            ]);

            this.blockedSites = result.blockedSites || [];
            this.blockingEnabled = result.blockingEnabled || false;
            this.focusSession = result.focusSession || null;

            if (this.blockingEnabled || (this.focusSession && this.focusSession.active)) {
                this.updateBlockingRules(this.blockedSites);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    setupWebRequestListeners() {
        // Block requests to distracting sites
        chrome.webRequest.onBeforeRequest.addListener(
            (details) => {
                if (this.shouldBlockRequest(details.url)) {
                    return { cancel: true };
                }
            },
            { urls: ["<all_urls>"] },
            ["blocking"]
        );
    }

    shouldBlockRequest(url) {
        if (!this.blockingEnabled && (!this.focusSession || !this.focusSession.active)) {
            return false;
        }

        try {
            const urlObj = new URL(url);
            const domain = urlObj.hostname;

            return this.blockedSites.some(blockedSite => 
                domain.includes(blockedSite) || blockedSite.includes(domain)
            );
        } catch (error) {
            return false;
        }
    }

    async updateTimeSpent(domain, timeSpent, url, title) {
        try {
            const today = new Date().toDateString();
            const result = await chrome.storage.local.get(['timeData']);
            const timeData = result.timeData || {};

            if (!timeData[today]) {
                timeData[today] = {};
            }

            timeData[today][domain] = (timeData[today][domain] || 0) + timeSpent;

            await chrome.storage.local.set({ timeData });

            // Send to backend if available
            this.syncToBackend({
                date: today,
                domain,
                timeSpent,
                url,
                title,
                timestamp: Date.now()
            });

        } catch (error) {
            console.error('Error updating time spent:', error);
        }
    }

    async syncToBackend(data) {
        try {
            await fetch('http://localhost:5001/api/time-entry', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
        } catch (error) {
            // Backend not available, data is still stored locally
            console.log('Backend sync failed, data stored locally');
        }
    }

    async toggleBlocking(enabled) {
        this.blockingEnabled = enabled;
        await chrome.storage.local.set({ blockingEnabled: enabled });

        if (enabled) {
            this.updateBlockingRules(this.blockedSites);
        } else {
            this.clearBlockingRules();
        }
    }

    async updateBlockingRules(sites) {
        this.blockedSites = sites;
        await chrome.storage.local.set({ blockedSites: sites });

        // Clear existing rules
        await this.clearBlockingRules();

        if (!this.blockingEnabled && (!this.focusSession || !this.focusSession.active)) {
            return;
        }

        // Create new blocking rules
        const rules = sites.map((site, index) => ({
            id: index + 1,
            priority: 1,
            action: {
                type: 'redirect',
                redirect: {
                    url: chrome.runtime.getURL('blocked.html')
                }
            },
            condition: {
                urlFilter: `*://*.${site}/*`,
                resourceTypes: ['main_frame']
            }
        }));

        try {
            await chrome.declarativeNetRequest.updateDynamicRules({
                addRules: rules
            });
        } catch (error) {
            console.error('Error updating blocking rules:', error);
        }
    }

    async clearBlockingRules() {
        try {
            const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
            const ruleIds = existingRules.map(rule => rule.id);
            
            if (ruleIds.length > 0) {
                await chrome.declarativeNetRequest.updateDynamicRules({
                    removeRuleIds: ruleIds
                });
            }
        } catch (error) {
            console.error('Error clearing blocking rules:', error);
        }
    }

    async startFocusSession(endTime) {
        this.focusSession = {
            active: true,
            endTime: endTime
        };

        await chrome.storage.local.set({ focusSession: this.focusSession });

        // Enable blocking during focus session
        this.updateBlockingRules(this.blockedSites);

        // Show notification
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'Focus Session Started',
            message: 'Distracting sites are now blocked. Stay focused!'
        });
    }

    async stopFocusSession() {
        this.focusSession = null;
        await chrome.storage.local.set({ focusSession: null });

        // Disable blocking if not manually enabled
        if (!this.blockingEnabled) {
            this.clearBlockingRules();
        }

        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'Focus Session Ended',
            message: 'Great job staying focused!'
        });
    }

    async checkFocusSession() {
        if (this.focusSession && this.focusSession.active) {
            if (Date.now() >= this.focusSession.endTime) {
                await this.stopFocusSession();
            }
        }
    }

    async generateDailyReport() {
        try {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const dateString = yesterday.toDateString();

            const result = await chrome.storage.local.get(['timeData', 'productiveSites', 'distractingSites']);
            const timeData = result.timeData || {};
            const productiveSites = result.productiveSites || [];
            const distractingSites = result.distractingSites || [];

            const dayData = timeData[dateString] || {};

            let totalTime = 0;
            let productiveTime = 0;
            let distractingTime = 0;

            Object.entries(dayData).forEach(([site, time]) => {
                totalTime += time;
                if (productiveSites.some(ps => site.includes(ps))) {
                    productiveTime += time;
                } else if (distractingSites.some(ds => site.includes(ds))) {
                    distractingTime += time;
                }
            });

            // Show daily report notification
            const productivityScore = totalTime > 0 ? Math.round((productiveTime / totalTime) * 100) : 0;

            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon48.png',
                title: 'Daily Productivity Report',
                message: `Yesterday: ${this.formatTime(totalTime)} total, ${productivityScore}% productive`
            });

            // Send to backend
            await this.syncDailyReport({
                date: dateString,
                totalTime,
                productiveTime,
                distractingTime,
                productivityScore,
                siteData: dayData
            });

        } catch (error) {
            console.error('Error generating daily report:', error);
        }
    }

    async syncDailyReport(reportData) {
        try {
            await fetch('http://localhost:5001/api/daily-report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(reportData)
            });
        } catch (error) {
            console.log('Backend sync failed for daily report');
        }
    }

    getNextMidnight() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return tomorrow.getTime();
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

// Initialize background script
new ProductivityBackground();
