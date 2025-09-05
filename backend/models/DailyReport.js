const mongoose = require('mongoose');

const dailyReportSchema = new mongoose.Schema({
    date: {
        type: String,
        required: true,
        index: true
    },
    totalTime: {
        type: Number,
        required: true,
        min: 0
    },
    productiveTime: {
        type: Number,
        required: true,
        min: 0
    },
    distractingTime: {
        type: Number,
        required: true,
        min: 0
    },
    productivityScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    siteData: {
        type: Map,
        of: Number,
        default: {}
    },
    topSites: [{
        domain: String,
        timeSpent: Number,
        category: {
            type: String,
            enum: ['productive', 'distracting', 'neutral']
        }
    }],
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, {
    timestamps: true
});

// Index for efficient queries
dailyReportSchema.index({ date: 1, userId: 1 });

module.exports = mongoose.model('DailyReport', dailyReportSchema);
