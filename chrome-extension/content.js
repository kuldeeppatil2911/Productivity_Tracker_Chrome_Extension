// Content script for time tracking
class TimeTracker {
    constructor() {
        this.startTime = Date.now();
        this.isActive = true;
        this.domain = window.location.hostname;
        this.lastActivity = Date.now();
        this.init();
    }

    init() {
        this.setupActivityListeners();
        this.startTracking();
        
        // Listen for focus/blur events
        window.addEventListener('focus', () => {
            this.isActive = true;
            this.lastActivity = Date.now();
        });

        window.addEventListener('blur', () => {
            this.isActive = false;
        });

        // Track user activity
        document.addEventListener('mousemove', () => this.updateActivity());
        document.addEventListener('keypress', () => this.updateActivity());
        document.addEventListener('scroll', () => this.updateActivity());
        document.addEventListener('click', () => this.updateActivity());
    }

    setupActivityListeners() {
        // Detect when user becomes inactive (no activity for 30 seconds)
        setInterval(() => {
            const now = Date.now();
            if (now - this.lastActivity > 30000) { // 30 seconds
                this.isActive = false;
            }
        }, 5000);
    }

    updateActivity() {
        this.lastActivity = Date.now();
        this.isActive = true;
    }

    startTracking() {
        // Send time data every 10 seconds
        setInterval(() => {
            if (this.isActive && document.visibilityState === 'visible') {
                this.sendTimeData();
            }
        }, 10000);

        // Send data when page is about to unload
        window.addEventListener('beforeunload', () => {
            this.sendTimeData();
        });
    }

    async sendTimeData() {
        try {
            const timeSpent = Math.floor((Date.now() - this.startTime) / 1000);
            
            chrome.runtime.sendMessage({
                action: 'updateTimeSpent',
                domain: this.domain,
                timeSpent: 10, // 10 seconds increment
                url: window.location.href,
                title: document.title
            });

            this.startTime = Date.now();
        } catch (error) {
            console.error('Error sending time data:', error);
        }
    }
}

// Initialize time tracker
if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
    new TimeTracker();
}
