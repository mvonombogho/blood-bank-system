import mongoose from 'mongoose';

const StorageLogSchema = new mongoose.Schema({
  facilityId: {
    type: String,
    required: true
  },
  refrigeratorId: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['temperature', 'status', 'maintenance', 'alert'],
    required: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  notes: String,
  recordedAt: {
    type: Date,
    default: Date.now
  },
  recordedBy: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'critical'],
    default: 'info'
  },
  alertThresholds: {
    min: Number,
    max: Number
  },
  resolved: {
    type: Boolean,
    default: true
  },
  resolvedAt: Date,
  resolvedBy: String,
  resolutionNotes: String
});

// Automatically set severity for temperature logs
StorageLogSchema.pre('save', function(next) {
  if (this.type === 'temperature') {
    const temp = parseFloat(this.value);
    if (temp < 2 || temp > 6) {
      this.severity = 'critical';
      this.resolved = false;
    } else if (temp < 3 || temp > 5) {
      this.severity = 'warning';
    }
  }
  next();
});

// Indexes for efficient querying
StorageLogSchema.index({ facilityId: 1, refrigeratorId: 1 });
StorageLogSchema.index({ recordedAt: -1 });
StorageLogSchema.index({ type: 1, severity: 1 });
StorageLogSchema.index({ resolved: 1 });

// Method to resolve an alert
StorageLogSchema.methods.resolveAlert = async function(userId, notes) {
  if (!this.resolved) {
    this.resolved = true;
    this.resolvedAt = new Date();
    this.resolvedBy = userId;
    this.resolutionNotes = notes;
    await this.save();
  }
};

// Static method to get recent alerts
StorageLogSchema.statics.getRecentAlerts = async function(options = {}) {
  const {
    facilityId,
    refrigeratorId,
    severity,
    limit = 10,
    resolved = false
  } = options;

  const query = { resolved };
  
  if (facilityId) query.facilityId = facilityId;
  if (refrigeratorId) query.refrigeratorId = refrigeratorId;
  if (severity) query.severity = severity;

  return this.find(query)
    .sort({ recordedAt: -1 })
    .limit(limit);
};

// Static method to get temperature history
StorageLogSchema.statics.getTemperatureHistory = async function(
  facilityId,
  refrigeratorId,
  startDate,
  endDate
) {
  return this.find({
    facilityId,
    refrigeratorId,
    type: 'temperature',
    recordedAt: {
      $gte: startDate,
      $lte: endDate || new Date()
    }
  })
  .sort({ recordedAt: 1 })
  .select('value recordedAt');
};

// Static method to check if maintenance is needed
StorageLogSchema.statics.checkMaintenanceNeeded = async function(
  facilityId,
  refrigeratorId
) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const temperatureIssues = await this.countDocuments({
    facilityId,
    refrigeratorId,
    type: 'temperature',
    severity: 'critical',
    recordedAt: { $gte: thirtyDaysAgo }
  });

  const lastMaintenance = await this.findOne({
    facilityId,
    refrigeratorId,
    type: 'maintenance'
  })
  .sort({ recordedAt: -1 });

  const daysSinceLastMaintenance = lastMaintenance
    ? Math.floor((new Date() - lastMaintenance.recordedAt) / (1000 * 60 * 60 * 24))
    : Infinity;

  return {
    maintenanceNeeded: temperatureIssues > 3 || daysSinceLastMaintenance > 90,
    reason: temperatureIssues > 3 
      ? 'Multiple temperature issues detected'
      : daysSinceLastMaintenance > 90
        ? 'Regular maintenance due'
        : null,
    lastMaintenance: lastMaintenance?.recordedAt,
    temperatureIssues
  };
};

const StorageLog = mongoose.models.StorageLog || mongoose.model('StorageLog', StorageLogSchema);

export default StorageLog;