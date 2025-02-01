import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
  bloodBagId: {
    type: String,
    required: true,
    unique: true
  },
  bloodType: {
    type: String,
    required: [true, 'Blood type is required'],
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
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
  status: {
    type: String,
    enum: ['available', 'reserved', 'used', 'expired', 'discarded'],
    default: 'available'
  },
  location: {
    storageUnit: String,
    shelf: String,
    position: String
  },
  volume: {
    type: Number,
    required: true,
    min: 0
  },
  testResults: {
    hiv: Boolean,
    hepatitisB: Boolean,
    hepatitisC: Boolean,
    syphilis: Boolean,
    malaria: Boolean,
    completed: {
      type: Boolean,
      default: false
    }
  },
  notes: String
}, {
  timestamps: true
});

// Indexes for better query performance
inventorySchema.index({ bloodType: 1, status: 1 });
inventorySchema.index({ expiryDate: 1 });
inventorySchema.index({ bloodBagId: 1 }, { unique: true });

// Virtual for checking if blood bag is expired
inventorySchema.virtual('isExpired').get(function() {
  return new Date() > this.expiryDate;
});

// Pre-save middleware to update status if expired
inventorySchema.pre('save', function(next) {
  if (this.isExpired && this.status === 'available') {
    this.status = 'expired';
  }
  next();
});

const Inventory = mongoose.models.Inventory || mongoose.model('Inventory', inventorySchema);

export default Inventory;