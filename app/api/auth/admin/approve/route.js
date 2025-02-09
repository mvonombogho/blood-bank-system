import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/db/models/user';
import { sendAdminApprovalEmail, sendAdminRejectionEmail } from '@/lib/utils/emailService';

export async function POST(request) {
  try {
    // Check if the requester is a super admin
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const superAdmin = await User.findOne({ 
      email: session.user.email,
      role: 'super_admin'
    });

    if (!superAdmin) {
      return NextResponse.json(
        { error: 'Not authorized. Only super admins can approve admin accounts.' },
        { status: 403 }
      );
    }

    const { adminId, approved, reason } = await request.json();

    if (!adminId) {
      return NextResponse.json(
        { error: 'Admin ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const admin = await User.findById(adminId);
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      );
    }

    if (admin.role !== 'admin') {
      return NextResponse.json(
        { error: 'User is not an admin' },
        { status: 400 }
      );
    }

    // Update admin status
    admin.isActive = approved;
    if (!approved && reason) {
      admin.rejectionReason = reason;
    }
    
    // Add approval metadata
    admin.approvedBy = superAdmin._id;
    admin.approvalDate = new Date();
    
    await admin.save();

    // Send notification email to the admin
    try {
      if (approved) {
        await sendAdminApprovalEmail(
          admin.email,
          admin.name
        );
      } else {
        await sendAdminRejectionEmail(
          admin.email,
          admin.name,
          reason
        );
      }
    } catch (emailError) {
      console.error('Failed to send admin notification email:', emailError);
      // Continue with the approval process even if email fails
    }

    return NextResponse.json({
      message: `Admin account ${approved ? 'approved' : 'rejected'} successfully`,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        isActive: admin.isActive,
        approvalDate: admin.approvalDate
      }
    });

  } catch (error) {
    console.error('Admin approval error:', error);
    return NextResponse.json(
      { error: 'Failed to process admin approval' },
      { status: 500 }
    );
  }
}

// Get pending admin approvals
export async function GET(request) {
  try {
    // Check if the requester is a super admin
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    await connectDB();

    const superAdmin = await User.findOne({ 
      email: session.user.email,
      role: 'super_admin'
    });

    if (!superAdmin) {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'pending', 'approved', 'rejected'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build query
    const query = { role: 'admin' };
    if (status === 'pending') {
      query.isActive = false;
      query.rejectionReason = { $exists: false };
    } else if (status === 'approved') {
      query.isActive = true;
    } else if (status === 'rejected') {
      query.isActive = false;
      query.rejectionReason = { $exists: true };
    }

    // Get total count for pagination
    const total = await User.countDocuments(query);

    // Get paginated results
    const admins = await User.find(query)
      .select('name email position department isActive approvalDate rejectionReason')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      admins,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching admin approvals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin approvals' },
      { status: 500 }
    );
  }
}

// Get approval history for a specific admin
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

    // Check if requester is super admin or the admin themselves
    const user = await User.findOne({ email: session.user.email });
    if (!user || (user.role !== 'super_admin' && user._id.toString() !== params.adminId)) {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      );
    }

    const admin = await User.findById(params.adminId)
      .select('name email position department isActive approvalDate rejectionReason')
      .populate('approvedBy', 'name email');

    if (!admin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(admin);

  } catch (error) {
    console.error('Error fetching admin approval history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin approval history' },
      { status: 500 }
    );
  }
}