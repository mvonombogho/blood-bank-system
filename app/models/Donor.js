import mongoose from 'mongoose';

const DonorSchema = new mongoose.Schema({
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
    name: String,
    relationship: String,
    phone: String
  },

  // Donation History
  lastDonationDate: {
    type: Date
  },
  totalDonations: {
    type: Number,
    default: 0
  },
  donationPreferences: {
    preferredLocation: String,
    preferredDayOfWeek: String,
    preferredTimeOfDay: String
  },

  // Medical Information
  medicalHistory: {
    chronicConditions: [String],
    allergies: [String],
    medications: [String],
    surgeries: [{
      procedure: String,
      date: Date
    }]
  },

  // Communication Preferences
  communicationPrefs: {
    email: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: true
    },
    push: {
      type: Boolean,
      default: false
    }
  },

  // Account Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending', 'blocked'],
    default: 'pending'
  },
  verified: {
    type: Boolean,
    default: false
  },
  verificationDate: {
    type: Date
  },

  // System Fields
  registrationDate: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  },
  notes: [{
    content: String,
    createdBy: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
});

// Indexes
DonorSchema.index({ firstName: 1, lastName: 1 });
DonorSchema.index({ email: 1 }, { unique: true });
DonorSchema.index({ nationalId: 1 }, { unique: true });
DonorSchema.index({ bloodType: 1 });
DonorSchema.index({ lastDonationDate: -1 });
DonorSchema.index({ status: 1 });

// Virtual for full name
DonorSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Method to check donation eligibility
DonorSchema.methods.isEligibleToDonate = async function() {
  // Check last donation date (minimum 56 days between donations)
  if (this.lastDonationDate) {
    const daysSinceLastDonation = Math.floor(
      (Date.now() - this.lastDonationDate) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceLastDonation < 56) return false;
  }

  // Check for active deferrals
  const DonorDeferral = mongoose.model('DonorDeferral');
  const activeDeferral = await DonorDeferral.findOne({
    donorId: this._id,
    active: true,
    $or: [
      { type: 'permanent' },
      { type: 'temporary', endDate: { $gt: new Date() } }
    ]
  });

  return !activeDeferral;
};

// Method to update donation count
DonorSchema.methods.recordDonation = async function() {
  this.lastDonationDate = new Date();
  this.totalDonations += 1;
  return await this.save();
};

// Middleware to update lastUpdated timestamp
DonorSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

const Donor = mongoose.models.Donor || mongoose.model('Donor', DonorSchema);

export default Donor;