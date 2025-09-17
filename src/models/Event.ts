import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['online', 'hybrid', 'physical'],
    required: true
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'past'],
    required: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  registeredCount: {
    type: Number,
    default: 0
  },
  earlyBirdDeadline: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const Event = mongoose.models.Event || mongoose.model('Event', eventSchema);