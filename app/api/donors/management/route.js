import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Donor from '@/models/donor';
import Donation from '@/models/donation';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const bloodType = searchParams.get('bloodType');
    const status = searchParams.get('status');

    const skip = (page - 1) * limit;
    const query = {};

    // Add search filters
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    if (bloodType) {
      query.bloodType = bloodType;
    }

    if (status) {
      query.status = status;
    }

    // Get donors with their donation history
    const donors = await Donor.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'donations',
          localField: '_id',
          foreignField: 'donorId',
          as: 'donationHistory'
        }
      },
      {
        $addFields: {
          totalDonations: { $size: '$donationHistory' },
          lastDonation: { $max: '$donationHistory.donationDate' },
          nextEligibleDate: {
            $dateAdd: {
              startDate: { $max: '$donationHistory.donationDate' },
              unit: 'month',
              amount: 3
            }
          }
        }
      },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          name: 1,
          email: 1,
          phone: 1,
          bloodType: 1,
          status: 1,
          address: 1,
          totalDonations: 1,
          lastDonation: 1,
          nextEligibleDate: 1,
          donationHistory: {
            $slice: ['$donationHistory', -5] // Get last 5 donations
          }
        }
      }
    ]);

    // Get total count for pagination
    const total = await Donor.countDocuments(query);

    // Get donation statistics
    const donationStats = await Donation.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$donationDate' },
            month: { $month: '$donationDate' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    // Get blood type distribution
    const bloodTypeStats = await Donor.aggregate([
      {
        $group: {
          _id: '$bloodType',
          count: { $sum: 1 }
        }
      }
    ]);

    return NextResponse.json({
      success: true,
      data: {
        donors,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page,
          limit
        },
        stats: {
          donations: donationStats,
          bloodTypes: bloodTypeStats
        }
      }
    });
  } catch (error) {
    console.error('Donor management error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    const { donorId, updates } = await request.json();

    const updatedDonor = await Donor.findByIdAndUpdate(
      donorId,
      { $set: updates },
      { new: true }
    );

    if (!updatedDonor) {
      return NextResponse.json(
        { success: false, error: 'Donor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedDonor
    });
  } catch (error) {
    console.error('Update donor error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}