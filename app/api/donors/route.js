import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Donor from '@/lib/db/models/donor';

export async function POST(request) {
  try {
    await connectDB();
    
    const donorData = await request.json();
    
    // Validate required fields
    if (!donorData.firstName || !donorData.lastName || !donorData.bloodType) {
      return NextResponse.json(
        { error: 'Required fields are missing' },
        { status: 400 }
      );
    }

    // Create new donor
    const donor = await Donor.create(donorData);
    
    return NextResponse.json(donor, { status: 201 });
  } catch (error) {
    console.error('Error creating donor:', error);
    
    // Handle duplicate email error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'A donor with this email already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create donor' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    await connectDB();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const bloodType = searchParams.get('bloodType');
    const search = searchParams.get('search');

    // Build query
    let query = {};
    if (bloodType) {
      query.bloodType = bloodType;
    }
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const donors = await Donor.find(query)
      .sort({ createdAt: -1 })
      .select('-medicalHistory'); // Exclude sensitive medical history by default

    return NextResponse.json(donors);
  } catch (error) {
    console.error('Error fetching donors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch donors' },
      { status: 500 }
    );
  }
}