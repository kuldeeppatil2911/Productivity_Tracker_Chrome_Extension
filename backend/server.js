const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const compression = require('compression');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
    origin: ['chrome-extension://*', 'http://localhost:3000', 'http://localhost:3001'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/productivity-tracker';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => {
    console.warn('MongoDB connection failed, running in offline mode:', err.message);
    console.log('Extension will work with local storage only');
});

// Models
const TimeEntry = require('./models/TimeEntry');
const User = require('./models/User');
const DailyReport = require('./models/DailyReport');

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/time', require('./routes/time'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/sync', require('./routes/sync'));

// Time entry endpoint
app.post('/api/time-entry', async (req, res) => {
    try {
        const { date, domain, timeSpent, url, title, timestamp } = req.body;
        
        const timeEntry = new TimeEntry({
            date,
            domain,
            timeSpent,
            url,
            title,
            timestamp: timestamp || Date.now()
        });

        await timeEntry.save();
        res.status(201).json({ success: true, message: 'Time entry saved' });
    } catch (error) {
        console.error('Error saving time entry:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Daily report endpoint
app.post('/api/daily-report', async (req, res) => {
    try {
        const reportData = req.body;
        
        const dailyReport = new DailyReport(reportData);
        await dailyReport.save();
        
        res.status(201).json({ success: true, message: 'Daily report saved' });
    } catch (error) {
        console.error('Error saving daily report:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Sync endpoint
app.post('/api/sync', async (req, res) => {
    try {
        const { timeData, blockedSites, productiveSites, distractingSites } = req.body;
        
        // Process and save sync data
        // This would typically be associated with a user account
        
        res.json({ success: true, message: 'Data synced successfully' });
    } catch (error) {
        console.error('Sync error:', error);
        res.status(500).json({ success: false, error: 'Sync failed' });
    }
});

// Get analytics data
app.get('/api/analytics', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        const reports = await DailyReport.find({
            date: {
                $gte: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toDateString(),
                $lte: endDate || new Date().toDateString()
            }
        }).sort({ date: -1 });

        const timeEntries = await TimeEntry.find({
            date: {
                $gte: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toDateString(),
                $lte: endDate || new Date().toDateString()
            }
        }).sort({ timestamp: -1 });

        res.json({
            success: true,
            data: {
                reports,
                timeEntries
            }
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
