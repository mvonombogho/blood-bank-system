import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import StorageLog from '@/models/StorageLog';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get('facilityId');
    const refrigeratorId = searchParams.get('refrigeratorId');
    const duration = searchParams.get('duration') || '24h'; // Default to last 24 hours

    // Calculate start date based on duration
    const startDate = new Date();
    switch (duration) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      default:
        startDate.setHours(startDate.getHours() - 24);
    }

    // Get temperature history
    const temperatureHistory = await StorageLog.getTemperatureHistory(
      facilityId,
      refrigeratorId,
      startDate
    );

    // Get active alerts
    const activeAlerts = await StorageLog.find({
      facilityId,
      refrigeratorId,
      type: 'temperature',
      resolved: false,
      severity: { $in: ['warning', 'critical'] }
    }).sort({ recordedAt: -1 });

    // Calculate statistics
    const temperatures = temperatureHistory.map(log => parseFloat(log.value));
    const stats = {
      current: temperatures[temperatures.length - 1] || null,
      average: temperatures.length
        ? temperatures.reduce((a, b) => a + b) / temperatures.length
        : null,
      min: temperatures.length ? Math.min(...temperatures) : null,
      max: temperatures.length ? Math.max(...temperatures) : null,
      outOfRangeCount: temperatures.filter(t => t < 2 || t > 6).length
    };

    return NextResponse.json({
      status: 'success',
      data: {
        history: temperatureHistory,
        alerts: activeAlerts,
        stats
      }
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const data = await request.json();
    const { 
      facilityId, 
      refrigeratorId, 
      temperature,
      recordedBy
    } = data;

    // Validate temperature
    const temp = parseFloat(temperature);
    if (isNaN(temp)) {
      throw new Error('Invalid temperature value');
    }

    // Create temperature log
    const log = await StorageLog.create({
      facilityId,
      refrigeratorId,
      type: 'temperature',
      value: temp,
      recordedBy
    });

    // Check if maintenance is needed
    const maintenanceCheck = await StorageLog.checkMaintenanceNeeded(
      facilityId,
      refrigeratorId
    );

    // If maintenance is needed and no active maintenance alert exists,
    // create a maintenance alert
    if (maintenanceCheck.maintenanceNeeded) {
      const existingMaintenanceAlert = await StorageLog.findOne({
        facilityId,
        refrigeratorId,
        type: 'maintenance',
        resolved: false
      });

      if (!existingMaintenanceAlert) {
        await StorageLog.create({
          facilityId,
          refrigeratorId,
          type: 'maintenance',
          value: 'Maintenance Required',
          severity: 'warning',
          resolved: false,
          notes: maintenanceCheck.reason,
          recordedBy: 'system'
        });
      }
    }

    return NextResponse.json({
      status: 'success',
      data: {
        log,
        maintenanceNeeded: maintenanceCheck.maintenanceNeeded,
        maintenanceReason: maintenanceCheck.reason
      }
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    const data = await request.json();
    const { alertId, resolution, resolvedBy } = data;

    const alert = await StorageLog.findById(alertId);
    if (!alert) {
      return NextResponse.json(
        { status: 'error', message: 'Alert not found' },
        { status: 404 }
      );
    }

    await alert.resolveAlert(resolvedBy, resolution);

    // Get any remaining active alerts
    const activeAlerts = await StorageLog.find({
      facilityId: alert.facilityId,
      refrigeratorId: alert.refrigeratorId,
      resolved: false,
      severity: { $in: ['warning', 'critical'] }
    });

    return NextResponse.json({
      status: 'success',
      data: {
        resolvedAlert: alert,
        remainingAlerts: activeAlerts
      }
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}