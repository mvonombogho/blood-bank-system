import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Donor from '@/models/donor';
import Donation from '@/models/donation';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const skip = (page - 1) * limit;

    // Filtering parameters
    const bloodType = searchParams.get('bloodType');
    const status = searchParams.get('status');
    const searchTerm = searchParams.get('search');

    // Build query
    const query = {};
    if (bloodType) query.bloodType = bloodType;
    if (status) query.status = status;
    if (searchTerm) {
      query.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
        { phone: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    // Get donors with pagination
    const [donors, totalDonors] = await Promise.all([
      Donor.find(query)
        .sort({ lastDonationDate: -1 })
        .skip(skip)
        .limit(limit),
      Donor.countDocuments(query)
    ]);

    // Get donation statistics for each donor
    const donorsWithStats = await Promise.all(
      donors.map(async (donor) => {
        const donorObj = donor.toObject();
        
        // Get donation history
        const donations = await Donation.find({ donorId: donor._id })
          .sort({ donationDate: -1 });

        // Calculate statistics
        const totalDonations = donations.length;
        const totalVolume = donations.reduce((sum, d) => sum + (d.volume || 0), 0);
        const lastDonation = donations[0]?.donationDate;
        
        // Calculate next eligible date
        const nextEligibleDate = lastDonation 
          ? new Date(lastDonation.getTime() + (90 * 24 * 60 * 60 * 1000))
          : null;

        // Check eligibility
        const isEligible = !lastDonation || 
          new Date() >= new Date(lastDonation.getTime() + (90 * 24 * 60 * 60 * 1000));

        return {
          ...donorObj,
          statistics: {
            totalDonations,
            totalVolume,
            lastDonation,
            nextEligibleDate,
            isEligible,
            donationHistory: donations.map(d => ({
              date: d.donationDate,
              volume: d.volume,
              center: d.center,
              notes: d.notes
            }))
          }
        };
      })
    );

    // Get overall statistics
    const overallStats = {
      totalDonors: totalDonors,
      activeDonors: await Donor.countDocuments({ status: 'active' }),
      totalDonations: await Donation.countDocuments(),
      donorsByBloodType: await Donor.aggregate([
        { $group: { _id: '$bloodType', count: { $sum: 1 } } }
      ])
    };

    return NextResponse.json({
      success: true,
      data: {
        donors: donorsWithStats,
        stats: overallStats,
        pagination: {
          total: totalDonors,
          pages: Math.ceil(totalDonors / limit),
          currentPage: page,
          perPage: limit
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
    console.error('Donor update error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}