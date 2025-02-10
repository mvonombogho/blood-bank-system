import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import BloodInventory from '@/models/bloodInventory';
import Donor from '@/models/donor';

export async function GET() {
  try {
    await connectDB();

    const notifications = [];

    // Check for low inventory levels
    const lowInventory = await BloodInventory.find({
      units: { $lt: 10 }
    });

    lowInventory.forEach(item => {
      notifications.push({
        type: 'low_inventory',
        severity: 'high',
        message: `Low inventory alert: ${item.bloodType} (${item.units} units remaining)`,
        timestamp: new Date()
      });
    });

    // Check for expiring blood units
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const expiringUnits = await BloodInventory.find({
      expiryDate: {
        $lt: sevenDaysFromNow,
        $gt: new Date()
      }
    });

    expiringUnits.forEach(item => {
      notifications.push({
        type: 'expiring_units',
        severity: 'medium',
        message: `Blood units expiring soon: ${item.bloodType} (expires ${item.expiryDate.toLocaleDateString()})`,
        timestamp: new Date()
      });
    });

    // Get eligible donors for reminder
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const eligibleDonors = await Donor.find({
      lastDonationDate: {
        $lt: threeMonthsAgo
      }
    }).select('name email lastDonationDate');

    eligibleDonors.forEach(donor => {
      notifications.push({
        type: 'donor_eligible',
        severity: 'low',
        message: `${donor.name} is eligible for donation (last donation: ${donor.lastDonationDate.toLocaleDateString()})`,
        timestamp: new Date(),
        donorId: donor._id
      });
    });

    // Sort notifications by severity and timestamp
    const sortedNotifications = notifications.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return b.timestamp - a.timestamp;
    });

    return NextResponse.json({
      success: true,
      data: sortedNotifications
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { notificationType, recipientEmail, message } = await request.json();

    // Here you would integrate with your email service provider
    // For example: SendGrid, AWS SES, etc.
    // For now, we'll just log the notification
    console.log(`Sending ${notificationType} notification to ${recipientEmail}: ${message}`);

    return NextResponse.json({
      success: true,
      message: 'Notification sent successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}