import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Donor from '@/models/donor';
import DonorHealth from '@/models/donorHealth';
import DonorDeferral from '@/models/donorDeferral';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const donorId = searchParams.get('donorId');

    // Get donor's basic information
    const donor = await Donor.findById(donorId);
    if (!donor) {
      return NextResponse.json(
        { success: false, error: 'Donor not found' },
        { status: 404 }
      );
    }

    // Get latest health metrics
    const latestHealth = await DonorHealth.findOne({ donorId })
      .sort({ recordedDate: -1 });

    // Get active deferrals
    const activeDeferred = await DonorDeferral.findOne({
      donorId,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });

    // Get deferral history
    const deferralHistory = await DonorDeferral.find({ donorId })
      .sort({ startDate: -1 });

    // Calculate eligibility
    const lastDonation = donor.lastDonationDate;
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const eligibilityStatus = {
      isEligible: !activeDeferred && (!lastDonation || lastDonation < threeMonthsAgo),
      nextEligibleDate: lastDonation ? new Date(lastDonation.getTime() + (90 * 24 * 60 * 60 * 1000)) : null,
      deferralReason: activeDeferred?.reason || null
    };

    // Get health history
    const healthHistory = await DonorHealth.find({ donorId })
      .sort({ recordedDate: -1 })
      .limit(10);

    // Calculate health trends
    const healthTrends = healthHistory.map(record => ({
      date: record.recordedDate,
      hemoglobin: record.hemoglobin,
      bloodPressure: record.bloodPressure,
      weight: record.weight,
      pulse: record.pulse
    }));

    return NextResponse.json({
      success: true,
      data: {
        donor: {
          name: donor.name,
          bloodType: donor.bloodType,
          lastDonation: donor.lastDonationDate,
          status: donor.status
        },
        currentHealth: latestHealth,
        eligibility: eligibilityStatus,
        deferrals: {
          active: activeDeferred,
          history: deferralHistory
        },
        healthTrends
      }
    });
  } catch (error) {
    console.error('Donor status error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const {
      donorId,
      healthMetrics,
      deferral
    } = await request.json();

    // Update health metrics if provided
    if (healthMetrics) {
      await DonorHealth.create({
        donorId,
        ...healthMetrics,
        recordedDate: new Date()
      });
    }

    // Create deferral if provided
    if (deferral) {
      await DonorDeferral.create({
        donorId,
        ...deferral,
        createdAt: new Date()
      });

      // Update donor status
      await Donor.findByIdAndUpdate(donorId, {
        status: 'deferred'
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Donor status updated successfully'
    });
  } catch (error) {
    console.error('Donor status update error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    const { donorId, deferralId } = await request.json();

    // End deferral early if provided
    if (deferralId) {
      await DonorDeferral.findByIdAndUpdate(deferralId, {
        endDate: new Date()
      });

      // Update donor status back to active if no other active deferrals
      const activeDeferred = await DonorDeferral.findOne({
        donorId,
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() }
      });

      if (!activeDeferred) {
        await Donor.findByIdAndUpdate(donorId, {
          status: 'active'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Donor status updated successfully'
    });
  } catch (error) {
    console.error('Donor status update error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}