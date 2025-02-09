import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/db/models/user';

// Get single admin details
export async function GET(request, { params }) {
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

    const admin = await User.findById(params.id)
      .select('-password')
      .lean();

    if (!admin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(admin);
  } catch (error) {
    console.error('Error fetching admin:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin details' },
      { status: 500 }
    );
  }
}

// Update admin
export async function PUT(request, { params }) {
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

    // Find admin to update
    const admin = await User.findById(params.id);
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      );
    }

    // Validate required fields
    if (!body.name || !body.position || !body.department) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Update allowed fields
    const allowedUpdates = [
      'name',
      'phoneNumber',
      'position',
      'department',
      'permissions'
    ];

    allowedUpdates.forEach(field => {
      if (body[field] !== undefined) {
        admin[field] = body[field];
      }
    });

    // Add audit trail
    admin.lastModifiedBy = requester._id;
    admin.lastModifiedAt = new Date();

    await admin.save();

    // Remove sensitive data
    const adminResponse = admin.toObject();
    delete adminResponse.password;

    return NextResponse.json({
      message: 'Admin updated successfully',
      admin: adminResponse
    });

  } catch (error) {
    console.error('Error updating admin:', error);
    return NextResponse.json(
      { error: 'Failed to update admin' },
      { status: 500 }
    );
  }
}

// Delete admin
export async function DELETE(request, { params }) {
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

    const admin = await User.findById(params.id);
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      );
    }

    // Instead of hard delete, mark as inactive and archive
    admin.isActive = false;
    admin.archivedAt = new Date();
    admin.archivedBy = requester._id;
    await admin.save();

    return NextResponse.json({
      message: 'Admin archived successfully'
    });

  } catch (error) {
    console.error('Error deleting admin:', error);
    return NextResponse.json(
      { error: 'Failed to delete admin' },
      { status: 500 }
    );
  }
}