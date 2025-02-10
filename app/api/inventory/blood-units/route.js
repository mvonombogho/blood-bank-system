import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import BloodUnit from '@/models/BloodUnit';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    
    // Build query based on search parameters
    const query = {};
    
    if (searchParams.get('bloodType')) {
      query.bloodType = searchParams.get('bloodType');
    }
    
    if (searchParams.get('status')) {
      query.status = searchParams.get('status');
    }
    
    if (searchParams.get('facility')) {
      query['location.facility'] = searchParams.get('facility');
    }

    // Handle expiry date filtering
    if (searchParams.get('expiryBefore')) {
      query.expiryDate = { 
        ...query.expiryDate,
        $lt: new Date(searchParams.get('expiryBefore'))
      };
    }
    
    if (searchParams.get('expiryAfter')) {
      query.expiryDate = {
        ...query.expiryDate,
        $gt: new Date(searchParams.get('expiryAfter'))
      };
    }

    // Pagination
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const skip = (page - 1) * limit;

    const [units, total] = await Promise.all([
      BloodUnit.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('donorId', 'firstName lastName bloodType'),
      BloodUnit.countDocuments(query)
    ]);

    // Get inventory summary
    const summary = await BloodUnit.aggregate([
      {
        $match: { status: 'available' }
      },
      {
        $group: {
          _id: '$bloodType',
          count: { $sum: 1 },
          totalVolume: { $sum: '$volume' }
        }
      }
    ]);

    return NextResponse.json({
      status: 'success',
      data: {
        units,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page,
          limit
        },
        summary
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
    
    // Generate unique unit ID
    const date = new Date();
    const count = await BloodUnit.countDocuments({
      createdAt: {
        $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate())
      }
    });
    
    const unitId = `BU${date.getFullYear()}${(date.getMonth() + 1)
      .toString()
      .padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}${(count + 1)
      .toString()
      .padStart(4, '0')}`;

    // Set expiry date (42 days from collection)
    const expiryDate = new Date(data.collectionDate);
    expiryDate.setDate(expiryDate.getDate() + 42);

    const bloodUnit = await BloodUnit.create({
      ...data,
      unitId,
      expiryDate,
      statusHistory: [{
        status: 'quarantine',
        changedBy: data.collectedBy,
        reason: 'Initial collection'
      }]
    });

    return NextResponse.json({
      status: 'success',
      data: bloodUnit
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
    const { unitId, status, changedBy, reason, ...updateData } = data;

    const bloodUnit = await BloodUnit.findOne({ unitId });
    
    if (!bloodUnit) {
      return NextResponse.json(
        { status: 'error', message: 'Blood unit not found' },
        { status: 404 }
      );
    }

    // Update status if provided
    if (status) {
      await bloodUnit.updateStatus(status, changedBy, reason);
    }

    // Update other fields
    Object.assign(bloodUnit, updateData);
    await bloodUnit.save();

    return NextResponse.json({
      status: 'success',
      data: bloodUnit
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}