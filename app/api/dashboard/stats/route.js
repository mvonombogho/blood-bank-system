import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/db/models/user';
import Inventory from '@/lib/db/models/inventory';
import Donor from '@/lib/db/models/donor';
import Recipient from '@/lib/db/models/recipient';

export async function GET(request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || 'week';

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    switch (timeRange) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Get key statistics
    const stats = await calculateStats(startDate, now);

    // Get blood inventory levels
    const bloodStock = await getBloodStock(now);

    // Get donation trends
    const donationTrends = await getDonationTrends(startDate, timeRange);

    // Get alerts
    const alerts = await generateAlerts(now);

    return NextResponse.json({
      stats,
      bloodStock,
      donationTrends,
      alerts
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}

async function calculateStats(startDate, now) {
  // Total donors and trend
  const totalDonors = await Donor.countDocuments();
  const newDonors = await Donor.countDocuments({
    createdAt: { $gte: startDate }
  });
  const previousDonors = await Donor.countDocuments({
    createdAt: { $lt: startDate }
  });

  // Blood units statistics
  const totalUnits = await Inventory.countDocuments({
    status: 'available',
    expiryDate: { $gt: now }
  });
  const newUnits = await Inventory.countDocuments({
    createdAt: { $gte: startDate },
    status: 'available'
  });

  // Recipients statistics
  const totalRecipients = await Recipient.countDocuments();
  const newRecipients = await Recipient.countDocuments({
    createdAt: { $gte: startDate }
  });

  // Successful donations in period
  const periodDonations = await Inventory.countDocuments({
    createdAt: { $gte: startDate },
    status: { $in: ['available', 'used'] }
  });

  return {
    totalDonors,
    totalUnits,
    totalRecipients,
    periodDonations,
    donorsTrend: calculateTrend(newDonors, previousDonors),
    unitsTrend: calculateTrend(newUnits, totalUnits - newUnits),
    recipientsTrend: calculateTrend(newRecipients, totalRecipients - newRecipients)
  };
}

async function getBloodStock(now) {
  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  
  const bloodStock = await Promise.all(
    bloodTypes.map(async (type) => {
      const available = await Inventory.countDocuments({
        bloodType: type,
        status: 'available',
        expiryDate: { $gt: now }
      });

      const critical = await Inventory.countDocuments({
        bloodType: type,
        status: 'available',
        expiryDate: { 
          $gt: now,
          $lt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
      });

      return {
        type,
        available,
        critical
      };
    })
  );

  return bloodStock;
}

async function getDonationTrends(startDate, timeRange) {
  const dateFormat = timeRange === 'week' ? '%Y-%m-%d' : '%Y-%m';
  
  return await Inventory.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { 
            format: dateFormat,
            date: '$createdAt'
          }
        },
        donations: { $sum: 1 },
        requests: {
          $sum: {
            $cond: [
              { $eq: ['$status', 'used'] },
              1,
              0
            ]
          }
        }
      }
    },
    {
      $sort: { '_id': 1 }
    },
    {
      $project: {
        _id: 0,
        date: '$_id',
        donations: 1,
        requests: 1
      }
    }
  ]);
}

async function generateAlerts(now) {
  const alerts = [];

  // Check low stock levels
  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const CRITICAL_THRESHOLD = 5;

  for (const type of bloodTypes) {
    const count = await Inventory.countDocuments({
      bloodType: type,
      status: 'available',
      expiryDate: { $gt: now }
    });

    if (count < CRITICAL_THRESHOLD) {
      alerts.push({
        type: 'critical',
        title: `Low ${type} Blood Stock`,
        description: `Only ${count} units available`,
        timestamp: now
      });
    }
  }

  // Check expiring blood units
  const expiringCount = await Inventory.countDocuments({
    status: 'available',
    expiryDate: { 
      $gt: now,
      $lt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    }
  });

  if (expiringCount > 0) {
    alerts.push({
      type: 'warning',
      title: 'Expiring Blood Units',
      description: `${expiringCount} units expiring within 7 days`,
      timestamp: now
    });
  }

  // Check donation goals
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyDonations = await Inventory.countDocuments({
    createdAt: { $gte: monthStart }
  });

  const MONTHLY_GOAL = 100; // This could be configurable
  if (monthlyDonations < MONTHLY_GOAL * 0.8) { // Less than 80% of goal
    alerts.push({
      type: 'info',
      title: 'Monthly Donation Goal',
      description: `Currently at ${Math.round(monthlyDonations/MONTHLY_GOAL*100)}% of monthly goal`,
      timestamp: now
    });
  }

  return alerts;
}

function calculateTrend(newCount, previousCount) {
  if (previousCount === 0) return 100;
  return ((newCount - previousCount) / previousCount * 100).toFixed(1);
}