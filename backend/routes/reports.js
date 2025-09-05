const express = require('express');
const DailyReport = require('../models/DailyReport');
const TimeEntry = require('../models/TimeEntry');
const router = express.Router();

// Get daily reports
router.get('/daily', async (req, res) => {
    try {
        const { startDate, endDate, limit = 30 } = req.query;
        
        let query = {};
        if (startDate && endDate) {
            query.date = { $gte: startDate, $lte: endDate };
        }

        const reports = await DailyReport.find(query)
            .sort({ date: -1 })
            .limit(parseInt(limit));

        res.json({
            success: true,
            data: reports
        });
    } catch (error) {
        console.error('Error fetching daily reports:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch reports' });
    }
});

// Get weekly summary
router.get('/weekly', async (req, res) => {
    try {
        const { weeks = 4 } = req.query;
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - (parseInt(weeks) * 7));

        const weeklyData = await DailyReport.aggregate([
            {
                $match: {
                    date: {
                        $gte: startDate.toDateString(),
                        $lte: endDate.toDateString()
                    }
                }
            },
            {
                $addFields: {
                    week: {
                        $week: {
                            $dateFromString: { dateString: '$date' }
                        }
                    }
                }
            },
            {
                $group: {
                    _id: '$week',
                    totalTime: { $sum: '$totalTime' },
                    avgProductivityScore: { $avg: '$productivityScore' },
                    totalProductiveTime: { $sum: '$productiveTime' },
                    totalDistractingTime: { $sum: '$distractingTime' },
                    days: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            success: true,
            data: weeklyData
        });
    } catch (error) {
        console.error('Error fetching weekly reports:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch weekly reports' });
    }
});

// Get productivity insights
router.get('/insights', async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - parseInt(days));

        // Get recent reports
        const reports = await DailyReport.find({
            date: {
                $gte: startDate.toDateString(),
                $lte: endDate.toDateString()
            }
        }).sort({ date: -1 });

        // Calculate insights
        const totalDays = reports.length;
        const avgProductivityScore = reports.reduce((sum, r) => sum + r.productivityScore, 0) / totalDays;
        const totalTime = reports.reduce((sum, r) => sum + r.totalTime, 0);
        const totalProductiveTime = reports.reduce((sum, r) => sum + r.productiveTime, 0);
        
        // Find most productive day
        const mostProductiveDay = reports.reduce((max, r) => 
            r.productivityScore > max.productivityScore ? r : max, reports[0]);

        // Find most used sites
        const siteUsage = {};
        reports.forEach(report => {
            Object.entries(report.siteData || {}).forEach(([site, time]) => {
                siteUsage[site] = (siteUsage[site] || 0) + time;
            });
        });

        const topSites = Object.entries(siteUsage)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([site, time]) => ({ site, time }));

        res.json({
            success: true,
            data: {
                period: `${days} days`,
                totalDays,
                avgProductivityScore: Math.round(avgProductivityScore),
                totalTime,
                totalProductiveTime,
                productivityTrend: avgProductivityScore > 50 ? 'improving' : 'needs_attention',
                mostProductiveDay: mostProductiveDay?.date,
                topSites
            }
        });
    } catch (error) {
        console.error('Error fetching insights:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch insights' });
    }
});

module.exports = router;
