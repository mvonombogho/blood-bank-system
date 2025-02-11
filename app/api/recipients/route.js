import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Recipient from '@/models/Recipient';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    
    // Build query based on search parameters
    const query = {};
    
    if (searchParams.get('search')) {
      const searchRegex = new RegExp(searchParams.get('search'), 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { nationalId: searchRegex },
        { email: searchRegex }
      ];
    }
    
    if (searchParams.get('bloodType')) {
      query.bloodType = searchParams.get('bloodType');
    }
    
    if (searchParams.get('status')) {
      query.status = searchParams.get('status');
    }

    // Pagination
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const skip = (page - 1) * limit;

    const [recipients, total] = await Promise.all([
      Recipient.find(query)
        .sort({ registrationDate: -1 })
        .skip(skip)
        .limit(limit)
        .select('-medicalHistory.medications -medicalHistory.surgeries'),
      Recipient.countDocuments(query)
    ]);

    // Get active blood requests count
    const activeRequestsCount = await Recipient.countDocuments({
      'bloodRequests.status': { $in: ['pending', 'approved'] }
    });

    return NextResponse.json({
      status: 'success',
      data: {
        recipients,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page,
          limit
        },
        stats: {
          activeRequests: activeRequestsCount
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
    
    // Check for duplicate national ID or email
    const existingRecipient = await Recipient.findOne({
      $or: [
        { nationalId: data.nationalId },
        { email: data.email }
      ]
    });

    if (existingRecipient) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'A recipient with this national ID or email already exists' 
        },
        { status: 400 }
      );
    }

    const recipient = await Recipient.create({
      ...data,
      registrationDate: new Date(),
      lastUpdated: new Date()
    });

    return NextResponse.json({
      status: 'success',
      data: recipient
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
    const { id, ...updateData } = data;

    // Check if updating email or national ID
    if (updateData.email || updateData.nationalId) {
      const existingRecipient = await Recipient.findOne({
        _id: { $ne: id },
        $or: [
          updateData.nationalId ? { nationalId: updateData.nationalId } : null,
          updateData.email ? { email: updateData.email } : null
        ].filter(Boolean)
      });

      if (existingRecipient) {
        return NextResponse.json(
          { 
            status: 'error', 
            message: 'A recipient with this national ID or email already exists' 
          },
          { status: 400 }
        );
      }
    }

    const recipient = await Recipient.findByIdAndUpdate(
      id,
      {
        ...updateData,
        lastUpdated: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!recipient) {
      return NextResponse.json(
        { status: 'error', message: 'Recipient not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: 'success',
      data: recipient
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Instead of actually deleting, mark as inactive
    const recipient = await Recipient.findByIdAndUpdate(
      id,
      {
        status: 'inactive',
        lastUpdated: new Date()
      },
      { new: true }
    );

    if (!recipient) {
      return NextResponse.json(
        { status: 'error', message: 'Recipient not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: 'success',
      message: 'Recipient marked as inactive'
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}