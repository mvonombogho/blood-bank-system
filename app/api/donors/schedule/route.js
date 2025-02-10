import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import DonorSchedule from '@/models/donorSchedule';
import Donor from '@/models/donor';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    
    // Get date range parameters
    const startDate = searchParams.get('startDate') 
      ? new Date(searchParams.get('startDate')) 
      : new Date();
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate'))
      : new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000); // Default to 30 days

    // Fetch schedules with donor information
    const schedules = await DonorSchedule.find({
      scheduledDate: {
        $gte: startDate,
        $lte: endDate
      }
    }).populate('donorId', 'name email phone bloodType');

    // Get available time slots
    const timeSlots = await getAvailableTimeSlots(startDate, endDate);

    return NextResponse.json({
      success: true,
      data: {
        schedules,
        availableSlots: timeSlots
      }
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
    await connectDB();
    const { donorId, scheduledDate, timeSlot, notes } = await request.json();

    // Validate the donor exists and is eligible
    const donor = await Donor.findById(donorId);
    if (!donor) {
      return NextResponse.json(
        { success: false, error: 'Donor not found' },
        { status: 404 }
      );
    }

    // Check donor eligibility
    const lastDonation = donor.lastDonationDate;
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    if (lastDonation && lastDonation > threeMonthsAgo) {
      return NextResponse.json(
        { success: false, error: 'Donor is not yet eligible for donation' },
        { status: 400 }
      );
    }

    // Check if slot is available
    const existingSchedule = await DonorSchedule.findOne({
      scheduledDate: new Date(scheduledDate),
      timeSlot
    });

    if (existingSchedule) {
      return NextResponse.json(
        { success: false, error: 'Time slot is already booked' },
        { status: 400 }
      );
    }

    // Create new schedule
    const schedule = await DonorSchedule.create({
      donorId,
      scheduledDate: new Date(scheduledDate),
      timeSlot,
      notes,
      status: 'scheduled'
    });

    return NextResponse.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    const { scheduleId, status, notes } = await request.json();

    const schedule = await DonorSchedule.findByIdAndUpdate(
      scheduleId,
      { 
        $set: { 
          status,
          notes: notes || undefined,
          updatedAt: new Date()
        } 
      },
      { new: true }
    ).populate('donorId', 'name email phone bloodType');

    if (!schedule) {
      return NextResponse.json(
        { success: false, error: 'Schedule not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

async function getAvailableTimeSlots(startDate, endDate) {
  // Define working hours (9 AM to 5 PM)
  const workingHours = Array.from({ length: 8 }, (_, i) => i + 9);
  const availableSlots = [];

  // For each day in the date range
  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    // For each working hour
    for (const hour of workingHours) {
      const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
      
      // Check if slot is already booked
      const existingSchedule = await DonorSchedule.findOne({
        scheduledDate: {
          $gte: new Date(date.setHours(hour, 0, 0, 0)),
          $lt: new Date(date.setHours(hour + 1, 0, 0, 0))
        }
      });

      if (!existingSchedule) {
        availableSlots.push({
          date: new Date(date),
          timeSlot
        });
      }
    }
  }

  return availableSlots;
}