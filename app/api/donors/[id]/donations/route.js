import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Donor from '@/lib/db/models/donor';

// Get donor's donation history with filtering
export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const minUnits = searchParams.get('minUnits');
    
    // Build query
    const query = { _id: params.id };
    let donationMatch = {};
    
    if (startDate || endDate) {
      donationMatch.donationDate = {};
      if (startDate) donationMatch.donationDate.$gte = new Date(startDate);
      if (endDate) donationMatch.donationDate.$lte = new Date(endDate);
    }
    
    if (minUnits) {
      donationMatch.units = { $gte: parseInt(minUnits) };
    }

    const donor = await Donor.aggregate([
      { $match: query },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          bloodType: 1,
          donationHistory: {
            $filter: {
              input: '$donationHistory',
              as: 'donation',
              cond: {
                $and: [
                  startDate ? { $gte: ['$$donation.donationDate', new Date(startDate)] } : true,
                  endDate ? { $lte: ['$$donation.donationDate', new Date(endDate)] } : true,
                  minUnits ? { $gte: ['$$donation.units', parseInt(minUnits)] } : true
                ]
              }
            }
          },
          totalDonations: {
            $size: '$donationHistory'
          },
          totalUnits: {
            $sum: '$donationHistory.units'
          },
          lastDonation: {
            $max: '$donationHistory.donationDate'
          }
        }
      }
    ]);

    if (!donor.length) {
      return NextResponse.json(
        { error: 'Donor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(donor[0]);
  } catch (error) {
    console.error('Error fetching donation history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch donation history' },
      { status: 500 }
    );
  }
}

// Add new donation with validation
export async function POST(request, { params }) {
  try {
    await connectDB();
    
    const donationData = await request.json();
    
    // Enhanced validation
    const errors = [];
    if (!donationData.donationDate) errors.push('Donation date is required');
    if (!donationData.units) errors.push('Units donated is required');
    if (donationData.units <= 0) errors.push('Units must be greater than 0');
    
    // Validate donation date
    const donationDate = new Date(donationData.donationDate);
    if (isNaN(donationDate)) errors.push('Invalid donation date');
    if (donationDate > new Date()) errors.push('Donation date cannot be in the future');
    
    if (errors.length > 0) {
      return NextResponse.json(
        { errors },
        { status: 400 }
      );
    }

    // Check donor eligibility (last donation should be at least 56 days ago)
    const donor = await Donor.findById(params.id);
    if (!donor) {
      return NextResponse.json(
        { error: 'Donor not found' },
        { status: 404 }
      );
    }

    if (donor.lastDonation) {
      const daysSinceLastDonation = Math.floor(
        (donationDate - new Date(donor.lastDonation)) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceLastDonation < 56) {
        return NextResponse.json(
          { error: 'Donor must wait 56 days between donations' },
          { status: 400 }
        );
      }
    }

    // Add donation to history
    const updatedDonor = await Donor.findByIdAndUpdate(
      params.id,
      {
        $push: {
          donationHistory: {
            ...donationData,
            donationDate
          }
        },
        lastDonation: donationDate
      },
      { new: true }
    );

    return NextResponse.json(updatedDonor);
  } catch (error) {
    console.error('Error adding donation:', error);
    return NextResponse.json(
      { error: 'Failed to add donation' },
      { status: 500 }
    );
  }
}

// Update donation record
export async function PUT(request, { params }) {
  try {
    await connectDB();
    
    const { donationId, ...updateData } = await request.json();
    
    if (!donationId) {
      return NextResponse.json(
        { error: 'Donation ID is required' },
        { status: 400 }
      );
    }

    const updatedDonor = await Donor.findOneAndUpdate(
      { 
        _id: params.id,
        'donationHistory._id': donationId
      },
      {
        $set: {
          'donationHistory.$': {
            ...updateData,
            _id: donationId
          }
        }
      },
      { new: true }
    );

    if (!updatedDonor) {
      return NextResponse.json(
        { error: 'Donation record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedDonor);
  } catch (error) {
    console.error('Error updating donation:', error);
    return NextResponse.json(
      { error: 'Failed to update donation' },
      { status: 500 }
    );
  }
}