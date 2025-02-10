import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import BloodInventory from '@/models/bloodInventory';
import Donor from '@/models/donor';
import { sendEmail } from '@/lib/email';

export async function GET() {
  try {
    await connectDB();

    const notifications = [];

    // Check for low inventory levels
    const lowInventory = await BloodInventory.find({
      units: { $lt: 10 }
    });

    for (const item of lowInventory) {
      notifications.push({
        type: 'low_inventory',
        severity: 'high',
        message: `Low inventory alert: ${item.bloodType} (${item.units} units remaining)`,
        timestamp: new Date()
      });

      // Send email to admin
      await sendEmail({
        type: 'low_inventory',
        recipient: process.env.ADMIN_EMAIL,
        data: {
          bloodType: item.bloodType,
          units: item.units
        }
      });
    }

    // Check for expiring blood units
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const expiringUnits = await BloodInventory.find({
      expiryDate: {
        $lt: sevenDaysFromNow,
        $gt: new Date()
      }
    });

    for (const item of expiringUnits) {
      notifications.push({
        type: 'expiring_units',
        severity: 'medium',
        message: `Blood units expiring soon: ${item.bloodType} (expires ${item.expiryDate.toLocaleDateString()})`,
        timestamp: new Date()
      });

      // Send email to admin
      await sendEmail({
        type: 'expiring_units',
        recipient: process.env.ADMIN_EMAIL,
        data: {
          bloodType: item.bloodType,
          units: item.units,
          expiryDate: item.expiryDate
        }
      });
    }

    // Get eligible donors for reminder
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const eligibleDonors = await Donor.find({
      lastDonationDate: {
        $lt: threeMonthsAgo
      }
    }).select('name email lastDonationDate');

    for (const donor of eligibleDonors) {
      notifications.push({
        type: 'donor_eligible',
        severity: 'low',
        message: `${donor.name} is eligible for donation (last donation: ${donor.lastDonationDate.toLocaleDateString()})`,
        timestamp: new Date(),
        donorId: donor._id
      });

      // Send email to donor
      await sendEmail({
        type: 'donor_eligible',
        recipient: donor.email,
        data: {
          name: donor.name,
          lastDonationDate: donor.lastDonationDate
        }
      });
    }

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
    console.error('Notification error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { notificationType, recipientEmail, message, data } = await request.json();

    // Send email notification
    const result = await sendEmail({
      type: notificationType,
      recipient: recipientEmail,
      data: data || {}
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    return NextResponse.json({
      success: true,
      message: 'Notification sent successfully'
    });
  } catch (error) {
    console.error('Failed to send notification:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}