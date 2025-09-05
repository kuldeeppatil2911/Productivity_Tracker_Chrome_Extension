const mongoose = require('mongoose');

const timeEntrySchema = new mongoose.Schema({
    date: {
        type: String,
        required: true,
        index: true
    },
    domain: {
        type: String,
        required: true,
        index: true
    },
    timeSpent: {
        type: Number,
        required: true,
        min: 0
    },
    url: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    timestamp: {
        type: Number,
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, {
    timestamps: true
});

// Index for efficient queries
timeEntrySchema.index({ date: 1, domain: 1 });
timeEntrySchema.index({ userId: 1, date: 1 });

module.exports = mongoose.model('TimeEntry', timeEntrySchema);
