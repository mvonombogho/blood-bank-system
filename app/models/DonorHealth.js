import mongoose from 'mongoose';

const DonorHealthSchema = new mongoose.Schema({
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donor',
    required: true
  },
  hemoglobin: {
    type: Number,
    required: true,
    min: 0,
    max: 25 // Maximum realistic hemoglobin level
  },
  bloodPressure: {
    systolic: {
      type: Number,
      required: true,
      min: 70,
      max: 200
    },
    diastolic: {
      type: Number,
      required: true,
      min: 40,
      max: 130
    }
  },
  pulse: {
    type: Number,
    required: true,
    min: 40,
    max: 200
  },
  temperature: {
    type: Number,
    required: true,
    min: 35,
    max: 42
  },
  weight: {
    type: Number,
    required: true,
    min: 45 // Minimum weight for donation
  },
  lastMeal: {
    type: Date,
    required: true
  },
  recentIllness: {
    type: Boolean,
    default: false
  },
  recentIllnessDetails: {
    type: String,
    required: function() {
      return this.recentIllness === true;
    }
  },
  medications: [{
    name: String,
    dosage: String,
    frequency: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  assessedBy: {
    type: String,
    required: true // Healthcare worker who performed the assessment
  },
  status: {
    type: String,
    enum: ['eligible', 'temporary_deferral', 'permanent_deferral'],
    required: true
  },
  notes: {
    type: String
  }
});

// Update the updatedAt timestamp before saving
DonorHealthSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Add indexes for frequent queries
DonorHealthSchema.index({ donorId: 1, createdAt: -1 });
DonorHealthSchema.index({ status: 1 });

// Compound index for finding recent health records by status
DonorHealthSchema.index({ donorId: 1, status: 1, createdAt: -1 });

const DonorHealth = mongoose.models.DonorHealth || mongoose.model('DonorHealth', DonorHealthSchema);

export default DonorHealth;