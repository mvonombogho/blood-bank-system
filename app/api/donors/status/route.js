import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { DonorHealth, DonorDeferral } from '@/models';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const donorId = searchParams.get('donorId');

    const healthRecord = await DonorHealth.findOne({ donorId }).sort({ createdAt: -1 });
    const deferralRecord = await DonorDeferral.findOne({ donorId, active: true });

    return NextResponse.json({
      status: 'success',
      data: {
        health: healthRecord,
        deferral: deferralRecord
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
    const { donorId, healthMetrics } = data;

    const healthRecord = await DonorHealth.create({
      donorId,
      ...healthMetrics,
      createdAt: new Date()
    });

    return NextResponse.json({
      status: 'success',
      data: healthRecord
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
    const { donorId, deferralStatus, reason, endDate } = data;

    // Update existing active deferral if exists
    await DonorDeferral.updateMany(
      { donorId, active: true },
      { $set: { active: false } }
    );

    if (deferralStatus) {
      await DonorDeferral.create({
        donorId,
        reason,
        endDate,
        active: true,
        createdAt: new Date()
      });
    }

    return NextResponse.json({
      status: 'success',
      message: 'Deferral status updated successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}