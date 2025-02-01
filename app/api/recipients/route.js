import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Recipient from '@/lib/db/models/recipient';

// GET all recipients
export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const bloodType = searchParams.get('bloodType');
    const hospital = searchParams.get('hospital');

    let query = {};
    if (bloodType) query.bloodType = bloodType;
    if (hospital) query['hospital.name'] = { $regex: hospital, $options: 'i' };

    const recipients = await Recipient.find(query).sort({ createdAt: -1 });
    return NextResponse.json(recipients, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch recipients' },
      { status: 500 }
    );
  }
}

// POST new recipient
export async function POST(request) {
  try {
    const body = await request.json();
    await connectDB();
    
    const recipient = await Recipient.create(body);
    return NextResponse.json(recipient, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create recipient' },
      { status: 500 }
    );
  }
}