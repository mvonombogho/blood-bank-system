import mongoose from 'mongoose';

const BloodUnitSchema = new mongoose.Schema({
  // Unit Information
  unitId: {
    type: String,
    required: true,
    unique: true
  },
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: true
  },
  volume: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['available', 'reserved', 'quarantine', 'discarded', 'transfused'],
    default: 'quarantine'
  },

  // Collection Details
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donor',
    required: true
  },
  collectionDate: {
    type: Date,
    required: true
  },
  expiryDate: {
    type: Date,
    required: true
  },
  collectedBy: {
    type: String,
    required: true
  },

  // Storage Information
  location: {
    facility: {
      type: String,
      required: true
    },
    refrigerator: {
      type: String,
      required: true
    },
    shelf: {
      type: String,
      required: true
    },
    position: String
  },
  temperatureLog: [{
    temperature: Number,
    recordedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Quality Control
  testResults: {
    hiv: {
      result: Boolean,
      testedAt: Date,
      testedBy: String
    },
    hbv: {
      result: Boolean,
      testedAt: Date,
      testedBy: String
    },
    hcv: {
      result: Boolean,
      testedAt: Date,
      testedBy: String
    },
    syphilis: {
      result: Boolean,
      testedAt: Date,
      testedBy: String
    },
    malaria: {
      result: Boolean,
      testedAt: Date,
      testedBy: String
    }
  },
  qualityCheck: {
    checkedBy: String,
    checkedAt: Date,
    result: {
      type: String,
      enum: ['passed', 'failed', 'pending'],
      default: 'pending'
    },
    notes: String
  },

  // Transfusion Details (if used)
  transfusion: {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipient'
    },
    hospital: String,
    transfusionDate: Date,
    administeredBy: String,
    notes: String
  },

  // Tracking
  statusHistory: [{
    status: {
      type: String,
      enum: ['available', 'reserved', 'quarantine', 'discarded', 'transfused']
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    changedBy: String,
    reason: String
  }],
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
BloodUnitSchema.index({ unitId: 1 }, { unique: true });
BloodUnitSchema.index({ bloodType: 1, status: 1 });
BloodUnitSchema.index({ expiryDate: 1 });
BloodUnitSchema.index({ 'location.facility': 1 });
BloodUnitSchema.index({ donorId: 1 });

// Pre-save middleware to update timestamps
BloodUnitSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to check if unit is expired
BloodUnitSchema.methods.isExpired = function() {
  return new Date() > this.expiryDate;
};

// Method to update status with history tracking
BloodUnitSchema.methods.updateStatus = async function(newStatus, changedBy, reason) {
  this.statusHistory.push({
    status: this.status,
    changedBy,
    reason
  });
  this.status = newStatus;
  return await this.save();
};

// Method to add temperature log
BloodUnitSchema.methods.logTemperature = async function(temperature) {
  this.temperatureLog.push({
    temperature,
    recordedAt: new Date()
  });
  return await this.save();
};

// Method to record transfusion
BloodUnitSchema.methods.recordTransfusion = async function(transfusionData) {
  this.transfusion = {
    ...transfusionData,
    transfusionDate: new Date()
  };
  await this.updateStatus('transfused', transfusionData.administeredBy, 'Unit transfused to recipient');
  return await this.save();
};

const BloodUnit = mongoose.models.BloodUnit || mongoose.model('BloodUnit', BloodUnitSchema);

export default BloodUnit;