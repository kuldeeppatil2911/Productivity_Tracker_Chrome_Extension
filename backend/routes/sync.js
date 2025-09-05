const express = require('express');
const TimeEntry = require('../models/TimeEntry');
const DailyReport = require('../models/DailyReport');
const User = require('../models/User');
const router = express.Router();

// Sync data from extension
router.post('/', async (req, res) => {
    try {
        const { timeData, blockedSites, productiveSites, distractingSites, userId } = req.body;
        
        // Process time data
        if (timeData) {
            for (const [date, siteData] of Object.entries(timeData)) {
                for (const [domain, timeSpent] of Object.entries(siteData)) {
                    // Check if entry already exists
                    const existingEntry = await TimeEntry.findOne({ date, domain, userId });
                    
                    if (existingEntry) {
                        existingEntry.timeSpent = Math.max(existingEntry.timeSpent, timeSpent);
                        await existingEntry.save();
                    } else {
                        const timeEntry = new TimeEntry({
                            date,
                            domain,
                            timeSpent,
                            url: `https://${domain}`,
                            title: domain,
                            timestamp: Date.now(),
                            userId
                        });
                        await timeEntry.save();
                    }
                }
            }
        }

        // Update user preferences if userId provided
        if (userId && (blockedSites || productiveSites || distractingSites)) {
            const updateData = {};
            if (blockedSites) updateData['preferences.blockedSites'] = blockedSites;
            if (productiveSites) updateData['preferences.productiveSites'] = productiveSites;
            if (distractingSites) updateData['preferences.distractingSites'] = distractingSites;
            updateData.lastSync = new Date();

            await User.findByIdAndUpdate(userId, updateData);
        }

        res.json({
            success: true,
            message: 'Data synced successfully',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Sync error:', error);
        res.status(500).json({ success: false, error: 'Sync failed' });
    }
});

// Get sync status
router.get('/status/:userId?', async (req, res) => {
    try {
        const { userId } = req.params;
        
        let lastSync = null;
        if (userId) {
            const user = await User.findById(userId);
            lastSync = user?.lastSync;
        }

        // Get latest data timestamps
        const latestTimeEntry = await TimeEntry.findOne(
            userId ? { userId } : {},
            {},
            { sort: { timestamp: -1 } }
        );

        const latestReport = await DailyReport.findOne(
            userId ? { userId } : {},
            {},
            { sort: { createdAt: -1 } }
        );

        res.json({
            success: true,
            data: {
                lastSync,
                latestTimeEntry: latestTimeEntry?.timestamp,
                latestReport: latestReport?.createdAt,
                syncNeeded: lastSync ? Date.now() - new Date(lastSync).getTime() > 3600000 : true // 1 hour
            }
        });
    } catch (error) {
        console.error('Sync status error:', error);
        res.status(500).json({ success: false, error: 'Failed to get sync status' });
    }
});

module.exports = router;
