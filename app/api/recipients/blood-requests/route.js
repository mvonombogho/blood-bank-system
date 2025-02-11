import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Recipient from '@/models/Recipient';
import BloodUnit from '@/models/BloodUnit';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const recipientId = searchParams.get('recipientId');
    const status = searchParams.get('status');
    const urgency = searchParams.get('urgency');

    let query = {};
    const bloodRequestsQuery = {};

    if (recipientId) {
      query._id = recipientId;
    }

    if (status) {
      bloodRequestsQuery['bloodRequests.status'] = status;
    }

    if (urgency) {
      bloodRequestsQuery['bloodRequests.urgency'] = urgency;
    }

    // Get recipients with their blood requests
    const recipients = await Recipient.find(query)
      .select('firstName lastName bloodType bloodRequests')
      .sort({ 'bloodRequests.requestDate': -1 });

    // Filter blood requests based on query parameters
    const filteredRequests = recipients.map(recipient => ({
      recipientId: recipient._id,
      recipientName: `${recipient.firstName} ${recipient.lastName}`,
      bloodType: recipient.bloodType,
      requests: recipient.bloodRequests
        .filter(request => {
          if (status && request.status !== status) return false;
          if (urgency && request.urgency !== urgency) return false;
          return true;
        })
        .sort((a, b) => b.requestDate - a.requestDate)
    }));

    // Get availability statistics for each blood type
    const bloodTypeStats = await BloodUnit.aggregate([
      {
        $match: { status: 'available' }
      },
      {
        $group: {
          _id: '$bloodType',
          available: { $sum: 1 }
        }
      }
    ]);

    return NextResponse.json({
      status: 'success',
      data: {
        requests: filteredRequests,
        stats: {
          bloodTypeAvailability: bloodTypeStats
        }
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
    const { recipientId, bloodType, unitsNeeded, urgency, diagnosis, hospital } = data;

    const recipient = await Recipient.findById(recipientId);
    if (!recipient) {
      return NextResponse.json(
        { status: 'error', message: 'Recipient not found' },
        { status: 404 }
      );
    }

    // Check blood type compatibility and availability
    const compatibleTypes = getCompatibleBloodTypes(bloodType);
    const availableUnits = await BloodUnit.countDocuments({
      bloodType: { $in: compatibleTypes },
      status: 'available'
    });

    // Create the blood request
    await recipient.addBloodRequest({
      bloodType,
      unitsNeeded,
      urgency,
      diagnosis,
      hospital,
      status: availableUnits >= unitsNeeded ? 'approved' : 'pending',
      notes: availableUnits >= unitsNeeded 
        ? 'Sufficient units available' 
        : `Only ${availableUnits} units available`
    });

    // If urgent and units available, reserve them
    if (urgency === 'emergency' && availableUnits > 0) {
      const unitsToReserve = Math.min(availableUnits, unitsNeeded);
      await BloodUnit.updateMany(
        {
          bloodType: { $in: compatibleTypes },
          status: 'available'
        },
        {
          $set: {
            status: 'reserved',
            'reservedFor.recipientId': recipientId,
            'reservedFor.requestDate': new Date(),
            'reservedFor.expiryDate': new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
          }
        },
        { limit: unitsToReserve }
      );
    }

    return NextResponse.json({
      status: 'success',
      data: {
        request: recipient.bloodRequests[recipient.bloodRequests.length - 1],
        availableUnits
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
    const { recipientId, requestId, status, notes } = data;

    const recipient = await Recipient.findById(recipientId);
    if (!recipient) {
      return NextResponse.json(
        { status: 'error', message: 'Recipient not found' },
        { status: 404 }
      );
    }

    // Update request status
    await recipient.updateRequestStatus(requestId, status, notes);

    // If cancelled, release any reserved units
    if (status === 'cancelled') {
      await BloodUnit.updateMany(
        {
          'reservedFor.recipientId': recipientId,
          'reservedFor.requestId': requestId
        },
        {
          $set: { status: 'available' },
          $unset: { reservedFor: '' }
        }
      );
    }

    return NextResponse.json({
      status: 'success',
      data: recipient.bloodRequests.id(requestId)
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}

// Helper function to get compatible blood types
function getCompatibleBloodTypes(bloodType) {
  const compatibility = {
    'A+': ['A+', 'A-', 'O+', 'O-'],
    'A-': ['A-', 'O-'],
    'B+': ['B+', 'B-', 'O+', 'O-'],
    'B-': ['B-', 'O-'],
    'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    'AB-': ['A-', 'B-', 'AB-', 'O-'],
    'O+': ['O+', 'O-'],
    'O-': ['O-']
  };
  return compatibility[bloodType] || [];
}