import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Inventory from '@/lib/db/models/inventory';
import Recipient from '@/lib/db/models/recipient';

export async function POST(request) {
  try {
    const body = await request.json();
    await connectDB();

    const {
      recipientId,
      bloodType,
      units,
      urgency,
      hospitalName,
      doctorName,
      requiredDate
    } = body;

    // Check blood availability
    const availableBlood = await Inventory.find({
      bloodType,
      status: 'available',
      expiryDate: { $gt: new Date() }
    }).sort({ expiryDate: 1 }).limit(units);

    if (availableBlood.length < units) {
      return NextResponse.json({
        error: 'Insufficient blood units available',
        available: availableBlood.length,
        requested: units
      }, { status: 400 });
    }

    // Reserve the blood units
    const bloodBagIds = availableBlood.map(unit => unit._id);
    await Inventory.updateMany(
      { _id: { $in: bloodBagIds } },
      { 
        $set: { 
          status: 'reserved',
          reservedFor: recipientId
        }
      }
    );

    // Update recipient's transfusion history
    await Recipient.findByIdAndUpdate(
      recipientId,
      {
        $push: {
          transfusionHistory: {
            date: requiredDate || new Date(),
            bloodBagIds,
            units,
            hospital: hospitalName,
            doctorName
          }
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Blood units reserved successfully',
      bloodBagIds
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process blood request' },
      { status: 500 }
    );
  }
}

// GET blood requests status
export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const requests = await Inventory.find({
      status: status || 'reserved'
    })
    .populate('reservedFor', 'firstName lastName bloodType')
    .sort({ updatedAt: -1 });

    return NextResponse.json(requests);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch blood requests' },
      { status: 500 }
    );
  }
}