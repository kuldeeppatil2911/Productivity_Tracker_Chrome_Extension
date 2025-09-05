const express = require('express');
const TimeEntry = require('../models/TimeEntry');
const router = express.Router();

// Get time entries for a date range
router.get('/entries', async (req, res) => {
    try {
        const { startDate, endDate, domain } = req.query;
        
        let query = {};
        
        if (startDate && endDate) {
            query.date = {
                $gte: startDate,
                $lte: endDate
            };
        }
        
        if (domain) {
            query.domain = domain;
        }

        const entries = await TimeEntry.find(query)
            .sort({ timestamp: -1 })
            .limit(1000);

        res.json({
            success: true,
            data: entries
        });
    } catch (error) {
        console.error('Error fetching time entries:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch time entries' });
    }
});

// Get aggregated time data by domain
router.get('/summary', async (req, res) => {
    try {
        const { date } = req.query;
        const targetDate = date || new Date().toDateString();

        const summary = await TimeEntry.aggregate([
            { $match: { date: targetDate } },
            {
                $group: {
                    _id: '$domain',
                    totalTime: { $sum: '$timeSpent' },
                    visits: { $sum: 1 },
                    lastVisit: { $max: '$timestamp' }
                }
            },
            { $sort: { totalTime: -1 } }
        ]);

        res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        console.error('Error fetching time summary:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch time summary' });
    }
});

// Get productivity trends
router.get('/trends', async (req, res) => {
    try {
        const { days = 7 } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        const trends = await TimeEntry.aggregate([
            {
                $match: {
                    timestamp: { $gte: startDate.getTime() }
                }
            },
            {
                $group: {
                    _id: '$date',
                    totalTime: { $sum: '$timeSpent' },
                    uniqueDomains: { $addToSet: '$domain' }
                }
            },
            {
                $addFields: {
                    domainCount: { $size: '$uniqueDomains' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            success: true,
            data: trends
        });
    } catch (error) {
        console.error('Error fetching trends:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch trends' });
    }
});

module.exports = router;
