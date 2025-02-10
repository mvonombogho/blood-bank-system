import mongoose from 'mongoose';

const DonorDeferralSchema = new mongoose.Schema({
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donor',
    required: true
  },
  type: {
    type: String,
    enum: ['temporary', 'permanent'],
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  reasonCategory: {
    type: String,
    enum: [
      'medical_condition',
      'recent_surgery',
      'travel_history',
      'medication',
      'infectious_disease',
      'lifestyle_risk',
      'pregnancy_related',
      'low_hemoglobin',
      'vaccination',
      'other'
    ],
    required: true
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: function() {
      return this.type === 'temporary';
    }
  },
  active: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: String,
    required: true // ID or name of staff member who created the deferral
  },
  modifiedBy: {
    type: String
  },
  notes: {
    type: String
  },
  supportingDocuments: [{
    documentType: {
      type: String,
      enum: ['medical_report', 'lab_result', 'doctor_note', 'other'],
      required: true
    },
    documentReference: {
      type: String,
      required: true
    },
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  reviewRequired: {
    type: Boolean,
    default: false
  },
  reviewDate: {
    type: Date
  },
  reviewedBy: {
    type: String
  },
  reviewNotes: {
    type: String
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

// Middleware to update timestamps
DonorDeferralSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to check if deferral is expired
DonorDeferralSchema.methods.isExpired = function() {
  if (this.type === 'permanent') return false;
  return this.endDate < new Date();
};

// Method to reactivate a temporary deferral
DonorDeferralSchema.methods.reactivate = async function(userId, reason) {
  if (this.type === 'permanent') {
    throw new Error('Cannot reactivate a permanent deferral');
  }
  
  this.active = true;
  this.modifiedBy = userId;
  this.notes = this.notes + `\nReactivated by ${userId}: ${reason}`;
  this.updatedAt = new Date();
  
  return await this.save();
};

// Indexes for efficient querying
DonorDeferralSchema.index({ donorId: 1, active: 1 });
DonorDeferralSchema.index({ donorId: 1, startDate: -1 });
DonorDeferralSchema.index({ endDate: 1 }, { 
  expireAfterSeconds: 0,
  partialFilterExpression: { 
    active: true,
    type: 'temporary'
  }
});

const DonorDeferral = mongoose.models.DonorDeferral || mongoose.model('DonorDeferral', DonorDeferralSchema);

export default DonorDeferral;