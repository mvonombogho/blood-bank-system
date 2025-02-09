import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Donor from '@/lib/db/models/donor';

// Get single donor
export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const donor = await Donor.findById(params.id);
    
    if (!donor) {
      return NextResponse.json(
        { error: 'Donor not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(donor);
  } catch (error) {
    console.error('Error fetching donor:', error);
    return NextResponse.json(
      { error: 'Failed to fetch donor' },
      { status: 500 }
    );
  }
}

// Update donor
export async function PUT(request, { params }) {
  try {
    await connectDB();
    
    const donorData = await request.json();
    
    // Validate required fields
    if (!donorData.firstName || !donorData.lastName || !donorData.bloodType) {
      return NextResponse.json(
        { error: 'Required fields are missing' },
        { status: 400 }
      );
    }

    const updatedDonor = await Donor.findByIdAndUpdate(
      params.id,
      donorData,
      { new: true, runValidators: true }
    );
    
    if (!updatedDonor) {
      return NextResponse.json(
        { error: 'Donor not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedDonor);
  } catch (error) {
    console.error('Error updating donor:', error);
    
    // Handle duplicate email error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'A donor with this email already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update donor' },
      { status: 500 }
    );
  }
}

// Delete donor
export async function DELETE(request, { params }) {
  try {
    await connectDB();
    
    const donor = await Donor.findByIdAndDelete(params.id);
    
    if (!donor) {
      return NextResponse.json(
        { error: 'Donor not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      message: 'Donor deleted successfully',
      donor
    });
  } catch (error) {
    console.error('Error deleting donor:', error);
    return NextResponse.json(
      { error: 'Failed to delete donor' },
      { status: 500 }
    );
  }
}

// Add donation to donor's history
export async function PATCH(request, { params }) {
  try {
    await connectDB();
    
    const donationData = await request.json();
    
    // Validate donation data
    if (!donationData.donationDate || !donationData.units) {
      return NextResponse.json(
        { error: 'Required donation fields are missing' },
        { status: 400 }
      );
    }

    const donor = await Donor.findByIdAndUpdate(
      params.id,
      { 
        $push: { donationHistory: donationData },
        lastDonation: donationData.donationDate
      },
      { new: true, runValidators: true }
    );
    
    if (!donor) {
      return NextResponse.json(
        { error: 'Donor not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(donor);
  } catch (error) {
    console.error('Error adding donation:', error);
    return NextResponse.json(
      { error: 'Failed to add donation' },
      { status: 500 }
    );
  }
}