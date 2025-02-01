import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Donor from '@/lib/db/models/donor';
import Inventory from '@/lib/db/models/inventory';

export async function GET(request, { params }) {
  try {
    await connectDB();
    
    // Get donor's donation history
    const donationHistory = await Inventory.find({
      donorId: params.id
    })
    .select('collectionDate volume status bloodType')
    .sort({ collectionDate: -1 });

    // Get donor details
    const donor = await Donor.findById(params.id)
      .select('firstName lastName bloodType lastDonation');

    if (!donor) {
      return NextResponse.json(
        { error: 'Donor not found' },
        { status: 404 }
      );
    }

    // Calculate donation statistics
    const stats = {
      totalDonations: donationHistory.length,
      totalVolume: donationHistory.reduce((sum, donation) => sum + donation.volume, 0),
      lastDonation: donationHistory[0]?.collectionDate || null,
      bloodType: donor.bloodType,
      statusCounts: donationHistory.reduce((acc, donation) => {
        acc[donation.status] = (acc[donation.status] || 0) + 1;
        return acc;
      }, {})
    };

    return NextResponse.json({
      donor: {
        id: donor._id,
        name: `${donor.firstName} ${donor.lastName}`,
        bloodType: donor.bloodType
      },
      history: donationHistory,
      stats
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch donation history' },
      { status: 500 }
    );
  }
}

// Add new donation record
export async function POST(request, { params }) {
  try {
    const body = await request.json();
    await connectDB();

    // Update donor's last donation date
    await Donor.findByIdAndUpdate(params.id, {
      lastDonation: new Date(),
      $push: {
        donationHistory: {
          donationDate: new Date(),
          units: body.volume,
          bloodBank: body.bloodBank || 'Main Center',
          notes: body.notes
        }
      }
    });

    // Create inventory record for the donation
    const inventory = await Inventory.create({
      bloodBagId: body.bloodBagId,
      donorId: params.id,
      bloodType: body.bloodType,
      volume: body.volume,
      collectionDate: new Date(),
      expiryDate: new Date(Date.now() + (42 * 24 * 60 * 60 * 1000)), // 42 days expiry
      status: 'available',
      location: body.location,
      notes: body.notes
    });

    return NextResponse.json({
      message: 'Donation recorded successfully',
      inventory
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to record donation' },
      { status: 500 }
    );
  }
}