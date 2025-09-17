import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  type: {
    type: String,
    enum: ['visit', 'registration', 'activity', 'interaction'],
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

export const Analytics = mongoose.models.Analytics || mongoose.model('Analytics', analyticsSchema);