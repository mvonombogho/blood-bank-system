import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Donor from '@/lib/db/models/donor';
import Inventory from '@/lib/db/models/inventory';
import Recipient from '@/lib/db/models/recipient';

// Advanced search endpoint
export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'donor', 'inventory', or 'recipient'
    const query = searchParams.get('query');
    const bloodType = searchParams.get('bloodType');
    
    let results = [];
    
    switch (type) {
      case 'donor':
        results = await Donor.find({
          $or: [
            { firstName: { $regex: query, $options: 'i' } },
            { lastName: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
          ],
          ...(bloodType && { bloodType })
        }).select('-medicalHistory');
        break;
        
      case 'inventory':
        results = await Inventory.find({
          $or: [
            { bloodBagId: { $regex: query, $options: 'i' } },
            { status: { $regex: query, $options: 'i' } }
          ],
          ...(bloodType && { bloodType })
        }).populate('donorId', 'firstName lastName');
        break;
        
      case 'recipient':
        results = await Recipient.find({
          $or: [
            { firstName: { $regex: query, $options: 'i' } },
            { lastName: { $regex: query, $options: 'i' } },
            { 'hospital.name': { $regex: query, $options: 'i' } }
          ],
          ...(bloodType && { bloodType })
        });
        break;
        
      default:
        return NextResponse.json(
          { error: 'Invalid search type' },
          { status: 400 }
        );
    }
    
    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}