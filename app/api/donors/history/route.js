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

    // Add donorId to query if provided
    if (donorId) {
      query.donorId = donorId;
    }

    // Get donation history with donor information
    const donations = await Donation.find(query)
      .populate('donorId', 'name bloodType')
      .sort({ donationDate: 1 });

    // Calculate statistics
    const totalDonations = donations.length;
    const totalVolume = donations.reduce((sum, d) => sum + (d.volume || 0), 0);
    
    // Monthly trends
    const monthlyTrends = {};
    donations.forEach(donation => {
      const monthKey = donation.donationDate.toISOString().slice(0, 7); // YYYY-MM format
      if (!monthlyTrends[monthKey]) {
        monthlyTrends[monthKey] = {
          count: 0,
          volume: 0
        };
      }
      monthlyTrends[monthKey].count++;
      monthlyTrends[monthKey].volume += donation.volume || 0;
    });

    // Blood type distribution
    const bloodTypeStats = await Donation.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'donors',
          localField: 'donorId',
          foreignField: '_id',
          as: 'donor'
        }
      },
      { $unwind: '$donor' },
      {
        $group: {
          _id: '$donor.bloodType',
          count: { $sum: 1 },
          totalVolume: { $sum: '$volume' }
        }
      }
    ]);

    // Frequency analysis
    const frequencyStats = await Donation.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$donorId',
          count: { $sum: 1 },
          averageVolume: { $avg: '$volume' },
          lastDonation: { $max: '$donationDate' },
          firstDonation: { $min: '$donationDate' }
        }
      },
      {
        $project: {
          count: 1,
          averageVolume: 1,
          lastDonation: 1,
          firstDonation: 1,
          daysBetweenDonations: {
            $divide: [
              { $subtract: ['$lastDonation', '$firstDonation'] },
              1000 * 60 * 60 * 24 * ($count - 1)
            ]
          }
        }
      }
    ]);

    // Success rate (completed vs cancelled/deferred donations)
    const successStats = await Donation.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalDonations,
          totalVolume,
          averageVolumePerDonation: totalDonations ? totalVolume / totalDonations : 0
        },
        donations,
        trends: {
          monthly: Object.entries(monthlyTrends).map(([month, data]) => ({
            month,
            ...data
          })),
          bloodTypes: bloodTypeStats,
          frequency: frequencyStats,
          successRate: successStats
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