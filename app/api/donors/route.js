import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Donor from '@/lib/db/models/donor';

// GET all donors
export async function GET(request) {
  try {
    await connectDB();
    const donors = await Donor.find({}).sort({ createdAt: -1 });
    return NextResponse.json(donors, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch donors' },
      { status: 500 }
    );
  }
}

// POST new donor
export async function POST(request) {
  try {
    const body = await request.json();
    await connectDB();
    
    const donor = await Donor.create(body);
    return NextResponse.json(donor, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create donor' },
      { status: 500 }
    );
  }
}

// Create app/api/donors/[id]/route.js for individual donor operations