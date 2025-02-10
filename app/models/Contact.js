import mongoose from 'mongoose';

const ContactSchema = new mongoose.Schema({
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donor',
    required: true
  },
  // Communication History
  communications: [{
    type: {
      type: String,
      enum: ['email', 'sms', 'phone', 'push', 'letter'],
      required: true
    },
    subject: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'failed', 'opened', 'clicked'],
      default: 'sent'
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    sentBy: {
      type: String,
      required: true
    }
  }],
  
  // Contact Preferences
  preferences: {
    preferredMethod: {
      type: String,
      enum: ['email', 'sms', 'phone', 'push', 'letter'],
      required: true
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly'],
      default: 'monthly'
    },
    optOut: {
      type: Boolean,
      default: false
    },
    timePreference: {
      type: String,
      enum: ['morning', 'afternoon', 'evening'],
      default: 'morning'
    },
    languages: [{
      type: String,
      enum: ['english', 'swahili', 'french'],
      default: ['english']
    }]
  },

  // Automated Reminders
  reminders: [{
    type: {
      type: String,
      enum: ['donation', 'appointment', 'followup', 'general'],
      required: true
    },
    scheduledFor: {
      type: Date,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'cancelled'],
      default: 'pending'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Do Not Contact Periods
  doNotContactPeriods: [{
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    reason: String
  }],

  // System Fields
  lastContactedAt: {
    type: Date
  },
  contactAttempts: {
    type: Number,
    default: 0
  },
  successfulContacts: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient querying
ContactSchema.index({ donorId: 1 });
ContactSchema.index({ 'communications.sentAt': -1 });
ContactSchema.index({ 'reminders.scheduledFor': 1 });
ContactSchema.index({ lastContactedAt: -1 });

// Method to add new communication
ContactSchema.methods.addCommunication = async function(communication) {
  this.communications.push(communication);
  this.lastContactedAt = new Date();
  this.contactAttempts += 1;
  if (communication.status === 'delivered' || communication.status === 'opened') {
    this.successfulContacts += 1;
  }
  return await this.save();
};

// Method to schedule reminder
ContactSchema.methods.scheduleReminder = async function(reminder) {
  this.reminders.push({
    ...reminder,
    createdAt: new Date()
  });
  return await this.save();
};

// Method to check if donor can be contacted
ContactSchema.methods.canBeContacted = function() {
  if (this.preferences.optOut) return false;
  
  const now = new Date();
  const inDoNotContactPeriod = this.doNotContactPeriods.some(period => 
    period.startDate <= now && period.endDate >= now
  );
  
  return !inDoNotContactPeriod;
};

// Update timestamps pre-save
ContactSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Contact = mongoose.models.Contact || mongoose.model('Contact', ContactSchema);

export default Contact;