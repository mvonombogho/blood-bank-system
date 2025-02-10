import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Donor from '@/models/donor';
import Recipient from '@/models/recipient';
import BloodInventory from '@/models/bloodInventory';
import Donation from '@/models/donation';

export async function GET() {
  try {
    await connectDB();

    // Get total counts
    const totalDonors = await Donor.countDocuments();
    const totalRecipients = await Recipient.countDocuments();
    const totalDonations = await Donation.countDocuments();

    // Get blood inventory statistics
    const bloodInventory = await BloodInventory.aggregate([
      {
        $group: {
          _id: '$bloodType',
          total: { $sum: '$units' },
          expiring: {
            $sum: {
              $cond: [
                { 
                  $lt: [
                    '$expiryDate',
                    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                  ]
                },
                '$units',
                0
              ]
            }
          }
        }
      }
    ]);

    // Get monthly donation trends
    const donationTrends = await Donation.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$donationDate' },
            month: { $month: '$donationDate' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1
        }
      },
      {
        $limit: 12
      }
    ]);

    // Format donation trends
    const formattedTrends = donationTrends.map(item => ({
      date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
      donations: item.count
    }));

    return NextResponse.json({
      success: true,
      data: {
        totalDonors,
        totalRecipients,
        totalDonations,
        bloodInventory,
        donationTrends: formattedTrends
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}