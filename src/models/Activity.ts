import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  type: {
    type: String,
    enum: ['workshop', 'presentation', 'networking', 'qa'],
    required: true
  },
  capacity: {
    type: Number,
    required: true
  },
  registeredParticipants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  resources: [{
    title: String,
    url: String,
    type: String
  }],
  questions: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    question: String,
    upvotes: {
      type: Number,
      default: 0
    },
    answered: {
      type: Boolean,
      default: false
    }
  }]
});

export const Activity = mongoose.models.Activity || mongoose.model('Activity', activitySchema);