import mongoose from 'mongoose';

const RecipientSchema = new mongoose.Schema({
  // Personal Information
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: true
  },
  nationalId: {
    type: String,
    required: true,
    unique: true
  },

  // Contact Information
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  emergencyContact: {
    name: {
      type: String,
      required: true
    },
    relationship: String,
    phone: {
      type: String,
      required: true
    }
  },

  // Medical Information
  medicalHistory: {
    diagnosis: [{
      condition: String,
      diagnosedDate: Date,
      status: {
        type: String,
        enum: ['active', 'resolved', 'chronic']
      },
      notes: String
    }],
    allergies: [{
      allergen: String,
      severity: {
        type: String,
        enum: ['mild', 'moderate', 'severe']
      },
      reaction: String
    }],
    medications: [{
      name: String,
      dosage: String,
      frequency: String,
      startDate: Date,
      endDate: Date
    }],
    surgeries: [{
      procedure: String,
      date: Date,
      hospital: String,
      notes: String
    }]
  },

  // Transfusion History
  transfusionHistory: [{
    date: Date,
    bloodType: String,
    units: Number,
    hospital: String,
    reason: String,
    reactions: [{
      type: String,
      severity: String,
      notes: String
    }],
    outcome: {
      type: String,
      enum: ['successful', 'partial', 'failed', 'cancelled']
    }
  }],

  // Blood Requests
  bloodRequests: [{
    requestDate: Date,
    urgency: {
      type: String,
      enum: ['routine', 'urgent', 'emergency']
    },
    bloodType: String,
    unitsNeeded: Number,
    diagnosis: String,
    requestedBy: String,
    hospital: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'fulfilled', 'cancelled'],
      default: 'pending'
    },
    fulfillmentDate: Date,
    notes: String
  }],

  // Clinical Notes
  clinicalNotes: [{
    date: {
      type: Date,
      default: Date.now
    },
    note: String,
    recordedBy: String,
    category: {
      type: String,
      enum: ['general', 'pre-transfusion', 'post-transfusion', 'follow-up']
    }
  }],

  // System Fields
  status: {
    type: String,
    enum: ['active', 'inactive', 'deceased'],
    default: 'active'
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  registeredBy: String,
  registrationFacility: String
});

// Indexes for efficient querying
RecipientSchema.index({ firstName: 1, lastName: 1 });
RecipientSchema.index({ nationalId: 1 }, { unique: true });
RecipientSchema.index({ email: 1 }, { unique: true });
RecipientSchema.index({ bloodType: 1 });
RecipientSchema.index({ 'bloodRequests.status': 1 });
RecipientSchema.index({ 'bloodRequests.requestDate': -1 });

// Virtual for full name
RecipientSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware to update lastUpdated
RecipientSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Method to add blood request
RecipientSchema.methods.addBloodRequest = async function(requestData) {
  this.bloodRequests.push({
    requestDate: new Date(),
    ...requestData
  });
  return await this.save();
};

// Method to update blood request status
RecipientSchema.methods.updateRequestStatus = async function(requestId, status, notes) {
  const request = this.bloodRequests.id(requestId);
  if (!request) throw new Error('Blood request not found');
  
  request.status = status;
  if (status === 'fulfilled') {
    request.fulfillmentDate = new Date();
  }
  if (notes) request.notes = notes;
  
  return await this.save();
};

// Method to add transfusion record
RecipientSchema.methods.addTransfusion = async function(transfusionData) {
  this.transfusionHistory.push({
    date: new Date(),
    ...transfusionData
  });
  return await this.save();
};

// Method to check transfusion history
RecipientSchema.methods.hasReactions = function() {
  return this.transfusionHistory.some(transfusion => 
    transfusion.reactions && transfusion.reactions.length > 0
  );
};

const Recipient = mongoose.models.Recipient || mongoose.model('Recipient', RecipientSchema);

export default Recipient;