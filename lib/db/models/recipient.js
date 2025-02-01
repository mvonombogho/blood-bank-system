import mongoose from 'mongoose';

const recipientSchema = new mongoose.Schema({
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
  hospital: {
    name: {
      type: String,
      required: true
    },
    address: String,
    doctorName: String,
    doctorPhone: String
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  medicalHistory: {
    diagnosis: String,
    allergies: [String],
    previousTransfusions: [{
      date: Date,
      units: Number,
      reaction: String
    }]
  },
  transfusionHistory: [{
    date: Date,
    bloodBagIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory'
    }],
    units: Number,
    hospital: String,
    doctorName: String,
    notes: String
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
recipientSchema.index({ firstName: 1, lastName: 1 });
recipientSchema.index({ bloodType: 1 });
recipientSchema.index({ 'hospital.name': 1 });

const Recipient = mongoose.models.Recipient || mongoose.model('Recipient', recipientSchema);

export default Recipient;