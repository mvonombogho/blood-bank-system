import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import BloodUnit from '@/models/BloodUnit';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get('facilityId');

    // Get storage statistics
    const stats = await BloodUnit.aggregate([
      {
        $match: facilityId ? {
          'location.facility': facilityId,
          status: { $in: ['available', 'reserved', 'quarantine'] }
        } : {
          status: { $in: ['available', 'reserved', 'quarantine'] }
        }
      },
      {
        $group: {
          _id: {
            facility: '$location.facility',
            refrigerator: '$location.refrigerator'
          },
          count: { $sum: 1 },
          byBloodType: {
            $push: {
              bloodType: '$bloodType',
              status: '$status'
            }
          }
        }
      },
      {
        $group: {
          _id: '$_id.facility',
          refrigerators: {
            $push: {
              id: '$_id.refrigerator',
              occupied: '$count',
              bloodTypes: '$byBloodType'
            }
          },
          totalUnits: { $sum: '$count' }
        }
      }
    ]);

    return NextResponse.json({
      status: 'success',
      data: stats
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
    const { facilityId, refrigeratorId, temperature, status, notes } = data;

    // Update temperature log
    await StorageLog.create({
      facilityId,
      refrigeratorId,
      type: 'temperature',
      value: temperature,
      recordedAt: new Date(),
      recordedBy: data.userId // should come from auth session
    });

    // If status changed, update status log
    if (status) {
      await StorageLog.create({
        facilityId,
        refrigeratorId,
        type: 'status',
        value: status,
        notes,
        recordedAt: new Date(),
        recordedBy: data.userId // should come from auth session
      });
    }

    return NextResponse.json({
      status: 'success',
      message: 'Storage update recorded successfully'
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
      facilityId, 
      refrigeratorId, 
      fromShelf, 
      toShelf,
      positions,
      notes 
    } = data;

    // Update blood unit locations
    await BloodUnit.updateMany(
      {
        'location.facility': facilityId,
        'location.refrigerator': refrigeratorId,
        'location.shelf': fromShelf,
        unitId: { $in: positions.map(p => p.unitId) }
      },
      {
        $set: {
          'location.shelf': toShelf,
          'location.position': positions.unitId,
          'statusHistory': {
            $push: {
              status: 'relocated',
              changedAt: new Date(),
              changedBy: data.userId, // should come from auth session
              reason: notes || 'Unit relocated'
            }
          }
        }
      }
    );

    return NextResponse.json({
      status: 'success',
      message: 'Storage positions updated successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}