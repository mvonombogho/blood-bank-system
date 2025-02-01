import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Donor from '@/lib/db/models/donor';

// GET single donor
export async function GET(request, { params }) {
  try {
    await connectDB();
    const donor = await Donor.findById(params.id);
    
    if (!donor) {
      return NextResponse.json(
        { error: 'Donor not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(donor, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch donor' },
      { status: 500 }
    );
  }
}

// PUT update donor
export async function PUT(request, { params }) {
  try {
    const body = await request.json();
    await connectDB();
    
    const donor = await Donor.findByIdAndUpdate(
      params.id,
      body,
      { new: true, runValidators: true }
    );
    
    if (!donor) {
      return NextResponse.json(
        { error: 'Donor not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(donor, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update donor' },
      { status: 500 }
    );
  }
}

// DELETE donor
export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const donor = await Donor.findByIdAndDelete(params.id);
    
    if (!donor) {
      return NextResponse.json(
        { error: 'Donor not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Donor deleted successfully' }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete donor' },
      { status: 500 }
    );
  }
}