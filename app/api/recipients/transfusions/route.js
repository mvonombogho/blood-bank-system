import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Recipient from '@/models/Recipient';
import BloodUnit from '@/models/BloodUnit';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const recipientId = searchParams.get('recipientId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = {};
    
    if (recipientId) {
      query._id = recipientId;
    }

    // Date range filter for transfusions
    if (startDate || endDate) {
      query['transfusionHistory.date'] = {};
      if (startDate) {
        query['transfusionHistory.date'].$gte = new Date(startDate);
      }
      if (endDate) {
        query['transfusionHistory.date'].$lte = new Date(endDate);
      }
    }

    const recipients = await Recipient.find(query)
      .select('firstName lastName bloodType transfusionHistory')
      .sort({ 'transfusionHistory.date': -1 });

    // Calculate statistics
    const transfusions = recipients.flatMap(r => r.transfusionHistory);
    const stats = {
      total: transfusions.length,
      byBloodType: transfusions.reduce((acc, t) => {
        acc[t.bloodType] = (acc[t.bloodType] || 0) + 1;
        return acc;
      }, {}),
      reactionRate: (transfusions.filter(t => 
        t.reactions && t.reactions.length > 0
      ).length / transfusions.length) * 100,
      successRate: (transfusions.filter(t => 
        t.outcome === 'successful'
      ).length / transfusions.length) * 100
    };

    return NextResponse.json({
      status: 'success',
      data: {
        recipients: recipients.map(r => ({
          recipientId: r._id,
          recipientName: `${r.firstName} ${r.lastName}`,
          bloodType: r.bloodType,
          transfusions: r.transfusionHistory
        })),
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
      recipientId, 
      bloodUnitIds, 
      hospital, 
      administeredBy, 
      notes 
    } = data;

    const recipient = await Recipient.findById(recipientId);
    if (!recipient) {
      return NextResponse.json(
        { status: 'error', message: 'Recipient not found' },
        { status: 404 }
      );
    }

    // Get blood units and validate
    const bloodUnits = await BloodUnit.find({
      unitId: { $in: bloodUnitIds },
      status: { $in: ['available', 'reserved'] }
    });

    if (bloodUnits.length !== bloodUnitIds.length) {
      return NextResponse.json(
        { status: 'error', message: 'Some blood units are not available' },
        { status: 400 }
      );
    }

    // Record transfusion
    const transfusion = {
      date: new Date(),
      bloodType: bloodUnits[0].bloodType,
      units: bloodUnits.length,
      hospital,
      administeredBy,
      outcome: 'successful',
      notes,
      bloodUnitIds: bloodUnits.map(u => u.unitId)
    };

    await recipient.addTransfusion(transfusion);

    // Update blood units status
    await BloodUnit.updateMany(
      { unitId: { $in: bloodUnitIds } },
      { 
        $set: { 
          status: 'transfused',
          transfusion: {
            recipientId,
            hospital,
            transfusionDate: new Date(),
            administeredBy,
            notes
          }
        }
      }
    );

    return NextResponse.json({
      status: 'success',
      data: transfusion
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
      recipientId, 
      transfusionId, 
      reactions, 
      outcome,
      notes 
    } = data;

    const recipient = await Recipient.findById(recipientId);
    if (!recipient) {
      return NextResponse.json(
        { status: 'error', message: 'Recipient not found' },
        { status: 404 }
      );
    }

    // Find and update the transfusion record
    const transfusion = recipient.transfusionHistory.id(transfusionId);
    if (!transfusion) {
      return NextResponse.json(
        { status: 'error', message: 'Transfusion record not found' },
        { status: 404 }
      );
    }

    // Update transfusion details
    if (reactions) transfusion.reactions = reactions;
    if (outcome) transfusion.outcome = outcome;
    if (notes) transfusion.notes = notes;

    await recipient.save();

    // If there were adverse reactions, update blood units for tracking
    if (reactions && reactions.length > 0) {
      await BloodUnit.updateMany(
        { unitId: { $in: transfusion.bloodUnitIds } },
        { 
          $set: { 
            'transfusion.reactions': reactions,
            'transfusion.outcome': outcome
          }
        }
      );
    }

    return NextResponse.json({
      status: 'success',
      data: transfusion
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}