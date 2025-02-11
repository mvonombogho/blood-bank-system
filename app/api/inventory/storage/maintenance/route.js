import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import StorageLog from '@/models/StorageLog';
import BloodUnit from '@/models/BloodUnit';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get('facilityId');
    const refrigeratorId = searchParams.get('refrigeratorId');
    const status = searchParams.get('status'); // scheduled, completed, overdue

    let query = {
      type: 'maintenance'
    };

    if (facilityId) query.facilityId = facilityId;
    if (refrigeratorId) query.refrigeratorId = refrigeratorId;

    // Add status-based conditions
    if (status === 'scheduled') {
      query.resolved = false;
      query['scheduledDate'] = { $gt: new Date() };
    } else if (status === 'completed') {
      query.resolved = true;
    } else if (status === 'overdue') {
      query.resolved = false;
      query['scheduledDate'] = { $lt: new Date() };
    }

    const maintenanceLogs = await StorageLog.find(query)
      .sort({ recordedAt: -1 })
      .limit(100);

    // Get maintenance status for each refrigerator
    const maintenanceStatus = await Promise.all(
      maintenanceLogs.map(async (log) => {
        const check = await StorageLog.checkMaintenanceNeeded(
          log.facilityId,
          log.refrigeratorId
        );
        return {
          ...log.toObject(),
          maintenanceNeeded: check.maintenanceNeeded,
          reason: check.reason,
          temperatureIssues: check.temperatureIssues
        };
      })
    );

    return NextResponse.json({
      status: 'success',
      data: maintenanceStatus
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
      maintenanceType,
      scheduledDate,
      technician,
      notes
    } = data;

    // Create maintenance record
    const maintenanceLog = await StorageLog.create({
      facilityId,
      refrigeratorId,
      type: 'maintenance',
      value: maintenanceType,
      scheduledDate: new Date(scheduledDate),
      notes,
      recordedBy: technician,
      resolved: false
    });

    // If immediate maintenance, update storage unit status
    if (new Date(scheduledDate) <= new Date()) {
      // Update blood units to show storage unit is in maintenance
      await BloodUnit.updateMany(
        {
          'location.facility': facilityId,
          'location.refrigerator': refrigeratorId
        },
        {
          $set: {
            'location.status': 'maintenance'
          }
        }
      );
    }

    return NextResponse.json({
      status: 'success',
      data: maintenanceLog
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
    const { 
      maintenanceId, 
      completedBy, 
      completionNotes,
      outcome,
      nextMaintenanceDate
    } = data;

    // Find and update maintenance record
    const maintenanceLog = await StorageLog.findById(maintenanceId);
    if (!maintenanceLog) {
      return NextResponse.json(
        { status: 'error', message: 'Maintenance record not found' },
        { status: 404 }
      );
    }

    // Mark maintenance as completed
    await maintenanceLog.resolveAlert(completedBy, completionNotes);

    // Create new scheduled maintenance if provided
    if (nextMaintenanceDate) {
      await StorageLog.create({
        facilityId: maintenanceLog.facilityId,
        refrigeratorId: maintenanceLog.refrigeratorId,
        type: 'maintenance',
        value: 'Scheduled Maintenance',
        scheduledDate: new Date(nextMaintenanceDate),
        notes: 'Regular scheduled maintenance',
        recordedBy: completedBy,
        resolved: false
      });
    }

    // If maintenance was successful, update storage unit status
    if (outcome === 'successful') {
      // Update blood units to show storage unit is operational
      await BloodUnit.updateMany(
        {
          'location.facility': maintenanceLog.facilityId,
          'location.refrigerator': maintenanceLog.refrigeratorId
        },
        {
          $set: {
            'location.status': 'operational'
          }
        }
      );
    }

    return NextResponse.json({
      status: 'success',
      data: {
        completedMaintenance: maintenanceLog,
        nextMaintenance: nextMaintenanceDate ? {
          scheduledDate: nextMaintenanceDate
        } : null
      }
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}