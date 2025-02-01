import mongoose from 'mongoose';

const donorSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required']
  },
  bloodType: {
    type: String,
    required: [true, 'Blood type is required'],
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  lastDonation: {
    type: Date
  },
  medicalHistory: {
    conditions: [String],
    medications: [String],
    isEligible: {
      type: Boolean,
      default: true
    }
  },
  donationHistory: [{
    donationDate: Date,
    units: Number,
    bloodBank: String,
    notes: String
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
donorSchema.index({ firstName: 1, lastName: 1 });
donorSchema.index({ email: 1 }, { unique: true });
donorSchema.index({ bloodType: 1 });

const Donor = mongoose.models.Donor || mongoose.model('Donor', donorSchema);

export default Donor;