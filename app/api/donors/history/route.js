import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Donation from '@/models/donation';
import Donor from '@/models/donor';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const donorId = searchParams.get('donorId');
    const period = searchParams.get('period') || '1year'; // Options: '6months', '1year', 'all'

    // Calculate date range
    const endDate = new Date();
    let startDate = new Date();
    switch (period) {
      case '6months':
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case '1year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case 'all':
        startDate = new Date(0); // Beginning of time
        break;
    }

    // Base query
    const query = {
      donationDate: {
        $gte: startDate,
        $lte: endDate
      }
    };

    // Add donorId to query if specified
    if (donorId) {
      query.donorId = donorId;
    }

    // Fetch donation history
    const donationHistory = await Donation.find(query)
      .populate('donorId', 'name bloodType')
      .sort({ donationDate: 1 });

    // Calculate trends and statistics
    const monthlyTrends = await Donation.aggregate([
      {
        $match: query
      },
      {
        $group: {
          _id: {
            year: { $year: '$donationDate' },
            month: { $month: '$donationDate' }
          },
          totalDonations: { $sum: 1 },
          totalVolume: { $sum: '$volume' }
        }
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1
        }
      }
    ]);

    // Calculate donation frequency by blood type
    const bloodTypeStats = await Donation.aggregate([
      {
        $match: query
      },
      {
        $lookup: {
          from: 'donors',
          localField: 'donorId',
          foreignField: '_id',
          as: 'donor'
        }
      },
      {
        $unwind: '$donor'
      },
      {
        $group: {
          _id: '$donor.bloodType',
          totalDonations: { $sum: 1 },
          averageVolume: { $avg: '$volume' }
        }
      }
    ]);

    // Calculate donor return rate
    const donorStats = await Donor.aggregate([
      {
        $lookup: {
          from: 'donations',
          localField: '_id',
          foreignField: 'donorId',
          as: 'donations'
        }
      },
      {
        $project: {
          name: 1,
          bloodType: 1,
          donationCount: { $size: '$donations' }
        }
      },
      {
        $group: {
          _id: null,
          singleTimeDonors: {
            $sum: { $cond: [{ $eq: ['$donationCount', 1] }, 1, 0] }
          },
          repeatDonors: {
            $sum: { $cond: [{ $gt: ['$donationCount', 1] }, 1, 0] }
          },
          totalDonors: { $sum: 1 }
        }
      }
    ]);

    // Format monthly trends for chart display
    const formattedTrends = monthlyTrends.map(trend => ({
      date: `${trend._id.year}-${String(trend._id.month).padStart(2, '0')}`,
      donations: trend.totalDonations,
      volume: trend.totalVolume
    }));

    return NextResponse.json({
      success: true,
      data: {
        donationHistory,
        trends: {
          monthly: formattedTrends,
          bloodType: bloodTypeStats
        },
        donorStats: donorStats[0],
        summary: {
          totalDonations: donationHistory.length,
          totalVolume: donationHistory.reduce((sum, d) => sum + (d.volume || 0), 0),
          averageVolume: donationHistory.length > 0 
            ? donationHistory.reduce((sum, d) => sum + (d.volume || 0), 0) / donationHistory.length
            : 0
        }
      }
    });
  } catch (error) {
    console.error('Donation history error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}