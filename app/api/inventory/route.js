import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Inventory from '@/lib/db/models/inventory';

// GET all inventory
export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const bloodType = searchParams.get('bloodType');

    let query = {};
    if (status) query.status = status;
    if (bloodType) query.bloodType = bloodType;

    const inventory = await Inventory.find(query)
      .populate('donorId', 'firstName lastName')
      .sort({ createdAt: -1 });

    return NextResponse.json(inventory, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}

// POST new inventory item
export async function POST(request) {
  try {
    const body = await request.json();
    await connectDB();
    
    // Calculate expiry date (usually 42 days from collection)
    if (!body.expiryDate) {
      const collectionDate = new Date(body.collectionDate);
      body.expiryDate = new Date(collectionDate.setDate(collectionDate.getDate() + 42));
    }
    
    const inventory = await Inventory.create(body);
    return NextResponse.json(inventory, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create inventory item' },
      { status: 500 }
    );
  }
}