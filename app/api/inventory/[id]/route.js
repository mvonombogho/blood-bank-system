import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Inventory from '@/lib/db/models/inventory';

// GET single inventory item
export async function GET(request, { params }) {
  try {
    await connectDB();
    const inventory = await Inventory.findById(params.id)
      .populate('donorId', 'firstName lastName bloodType');
    
    if (!inventory) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(inventory, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch inventory item' },
      { status: 500 }
    );
  }
}

// PUT update inventory item
export async function PUT(request, { params }) {
  try {
    const body = await request.json();
    await connectDB();
    
    const inventory = await Inventory.findByIdAndUpdate(
      params.id,
      body,
      { new: true, runValidators: true }
    ).populate('donorId', 'firstName lastName bloodType');
    
    if (!inventory) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(inventory, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update inventory item' },
      { status: 500 }
    );
  }
}

// DELETE inventory item
export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const inventory = await Inventory.findByIdAndDelete(params.id);
    
    if (!inventory) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { message: 'Inventory item deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete inventory item' },
      { status: 500 }
    );
  }
}