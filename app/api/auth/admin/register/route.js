import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/db/models/user';
import { sendVerificationEmail } from '@/lib/utils/emailService';

const ADMIN_REGISTRATION_CODE = process.env.ADMIN_REGISTRATION_CODE;

export async function POST(request) {
  try {
    const {
      name,
      email,
      password,
      adminCode,
      phoneNumber,
      position,
      department
    } = await request.json();

    // Validate input
    if (!name || !email || !password || !adminCode || !phoneNumber || !position || !department) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate admin code
    if (adminCode !== ADMIN_REGISTRATION_CODE) {
      return NextResponse.json(
        { error: 'Invalid admin registration code' },
        { status: 403 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if admin already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Create new admin user
    const user = new User({
      name,
      email,
      password,
      role: 'admin',
      phoneNumber,
      position,
      department,
      isActive: false // Requires super admin approval
    });

    // Generate verification token
    const verificationToken = user.generateEmailVerificationToken();

    // Save user
    await user.save();

    // Send verification email
    try {
      await sendVerificationEmail(
        email, 
        name, 
        verificationToken
      );
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Delete user if email fails
      await User.deleteOne({ _id: user._id });
      return NextResponse.json(
        { error: 'Failed to send verification email' },
        { status: 500 }
      );
    }

    // Notify super admin about new admin registration
    try {
      await notifySuperAdmin({
        adminName: name,
        adminEmail: email,
        position,
        department
      });
    } catch (notifyError) {
      console.error('Failed to notify super admin:', notifyError);
      // Continue with registration even if notification fails
    }

    // Remove sensitive data from response
    const { password: _, emailVerificationToken: __, ...userWithoutSensitiveData } = user.toObject();

    return NextResponse.json(
      {
        message: 'Admin registration successful! Please check your email to verify your account and wait for super admin approval.',
        user: userWithoutSensitiveData
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Admin registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}

// Helper function to notify super admin
async function notifySuperAdmin({ adminName, adminEmail, position, department }) {
  const superAdmins = await User.find({ role: 'super_admin' }).select('email');
  
  for (const admin of superAdmins) {
    try {
      await sendNewAdminNotificationEmail(
        admin.email,
        {
          adminName,
          adminEmail,
          position,
          department
        }
      );
    } catch (error) {
      console.error(`Failed to notify super admin ${admin.email}:`, error);
    }
  }
}

// Function to send admin approval email
async function sendNewAdminNotificationEmail(superAdminEmail, { adminName, adminEmail, position, department }) {
  const mailOptions = {
    from: `"Blood Bank System" <${process.env.EMAIL_FROM}>`,
    to: superAdminEmail,
    subject: 'New Admin Registration Requires Approval',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Admin Registration</h2>
        <p>A new administrator account requires your approval:</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Name:</strong> ${adminName}</p>
          <p><strong>Email:</strong> ${adminEmail}</p>
          <p><strong>Position:</strong> ${position}</p>
          <p><strong>Department:</strong> ${department}</p>
        </div>
        <p>Please login to the admin dashboard to review and approve this request.</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
}