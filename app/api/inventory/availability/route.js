import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Inventory from '@/lib/db/models/inventory';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const bloodType = searchParams.get('bloodType');
    const requiredUnits = parseInt(searchParams.get('units') || '1');

    // Get current date
    const currentDate = new Date();

    // Query for available blood units
    const query = {
      status: 'available',
      expiryDate: { $gt: currentDate },
      ...(bloodType && { bloodType })
    };

    // Get available units and group by blood type
    const availableBlood = await Inventory.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$bloodType',
          totalUnits: { $sum: '$volume' },
          expiringUnits: {
            $sum: {
              $cond: [
                { 
                  $lte: [
                    { $subtract: ['$expiryDate', currentDate] },
                    7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
                  ]
                },
                '$volume',
                0
              ]
            }
          },
          units: {
            $push: {
              id: '$_id',
              expiryDate: '$expiryDate',
              volume: '$volume'
            }
          }
        }
      }
    ]);

    // Check if specific blood type request can be fulfilled
    if (bloodType && requiredUnits) {
      const typeAvailability = availableBlood.find(b => b._id === bloodType);
      const isAvailable = typeAvailability && typeAvailability.totalUnits >= requiredUnits;

      return NextResponse.json({
        available: isAvailable,
        requestedType: bloodType,
        requestedUnits: requiredUnits,
        availableUnits: typeAvailability?.totalUnits || 0,
        expiringUnits: typeAvailability?.expiringUnits || 0
      });
    }

    // Return overall availability
    return NextResponse.json({
      inventory: availableBlood,
      totalAvailable: availableBlood.reduce((acc, curr) => acc + curr.totalUnits, 0),
      totalExpiring: availableBlood.reduce((acc, curr) => acc + curr.expiringUnits, 0)
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check blood availability' },
      { status: 500 }
    );
  }
}