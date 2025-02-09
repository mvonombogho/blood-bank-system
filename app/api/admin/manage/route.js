import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/db/models/user';

// Get admin list with filters and pagination
export async function GET(request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    await connectDB();

    // Check if requester is super admin
    const requester = await User.findOne({ 
      email: session.user.email,
      role: 'super_admin'
    });

    if (!requester) {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const department = searchParams.get('department');

    // Build query
    const query = { role: 'admin' };

    // Add search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Add status filter
    if (status && status !== 'all') {
      query.isActive = status === 'active';
    }

    // Add department filter
    if (department && department !== 'all') {
      query.department = department;
    }

    // Get total count
    const total = await User.countDocuments(query);

    // Get paginated results
    const admins = await User.find(query)
      .select('-password -refreshToken')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      admins,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching admins:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admins' },
      { status: 500 }
    );
  }
}

// Create new admin user
export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();

    await connectDB();

    // Check if requester is super admin
    const requester = await User.findOne({ 
      email: session.user.email,
      role: 'super_admin'
    });

    if (!requester) {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      );
    }

    // Validate required fields
    if (!body.name || !body.email || !body.password || !body.department || !body.position) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: body.email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Create new admin
    const admin = new User({
      ...body,
      role: 'admin',
      isActive: true,
      createdBy: requester._id
    });

    await admin.save();

    // Remove sensitive data
    const adminResponse = admin.toObject();
    delete adminResponse.password;

    return NextResponse.json({
      message: 'Admin created successfully',
      admin: adminResponse
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating admin:', error);
    return NextResponse.json(
      { error: 'Failed to create admin' },
      { status: 500 }
    );
  }
}

// Bulk actions (activation/deactivation)
export async function PATCH(request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { adminIds, action } = await request.json();

    if (!adminIds || !Array.isArray(adminIds) || !action) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if requester is super admin
    const requester = await User.findOne({ 
      email: session.user.email,
      role: 'super_admin'
    });

    if (!requester) {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      );
    }

    let update = {};
    switch (action) {
      case 'activate':
        update = { isActive: true };
        break;
      case 'deactivate':
        update = { isActive: false };
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Update multiple admins
    const result = await User.updateMany(
      { 
        _id: { $in: adminIds },
        role: 'admin'
      },
      {
        ...update,
        lastModifiedBy: requester._id,
        lastModifiedAt: new Date()
      }
    );

    return NextResponse.json({
      message: `${result.modifiedCount} admins updated successfully`,
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Error performing bulk action:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk action' },
      { status: 500 }
    );
  }
}