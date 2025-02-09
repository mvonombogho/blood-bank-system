import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/db/mongodb';
import Department from '@/lib/db/models/department';

// Get departments list
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

    // Fetch all active departments
    const departments = await Department.find({ isActive: true })
      .sort({ name: 1 })
      .select('name description')
      .lean();

    return NextResponse.json({ departments });

  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch departments' },
      { status: 500 }
    );
  }
}

// Create new department
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
    if (!body.name) {
      return NextResponse.json(
        { error: 'Department name is required' },
        { status: 400 }
      );
    }

    // Check if department already exists
    const existingDepartment = await Department.findOne({ 
      name: { $regex: new RegExp(`^${body.name}$`, 'i') }
    });

    if (existingDepartment) {
      return NextResponse.json(
        { error: 'Department already exists' },
        { status: 400 }
      );
    }

    // Create new department
    const department = new Department({
      name: body.name,
      description: body.description,
      createdBy: requester._id
    });

    await department.save();

    return NextResponse.json({
      message: 'Department created successfully',
      department
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating department:', error);
    return NextResponse.json(
      { error: 'Failed to create department' },
      { status: 500 }
    );
  }
}

// Update multiple departments
export async function PATCH(request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { departmentIds, action } = await request.json();

    if (!departmentIds || !Array.isArray(departmentIds) || !action) {
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

    // Update departments
    const result = await Department.updateMany(
      { _id: { $in: departmentIds } },
      {
        ...update,
        lastModifiedBy: requester._id,
        lastModifiedAt: new Date()
      }
    );

    return NextResponse.json({
      message: `${result.modifiedCount} departments updated successfully`,
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Error updating departments:', error);
    return NextResponse.json(
      { error: 'Failed to update departments' },
      { status: 500 }
    );
  }
}