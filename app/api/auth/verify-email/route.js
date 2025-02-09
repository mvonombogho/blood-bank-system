import { NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/db/models/user';

export async function POST(request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Hash token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with the token and check if token is not expired
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    // Update user verification status
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return NextResponse.json({
      message: 'Email verified successfully'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Email verification failed' },
      { status: 500 }
    );
  }
}

// Resend verification email
export async function PUT(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json(
        { error: 'No user found with this email' },
        { status: 404 }
      );
    }

    if (user.isEmailVerified) {
      return NextResponse.json(
        { error: 'Email is already verified' },
        { status: 400 }
      );
    }

    // Generate new verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    // Send new verification email
    await sendVerificationEmail(email, user.name, verificationToken);

    return NextResponse.json({
      message: 'Verification email sent successfully'
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { error: 'Failed to resend verification email' },
      { status: 500 }
    );
  }
}

// Check verification status
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email }).select('isEmailVerified');

    if (!user) {
      return NextResponse.json(
        { error: 'No user found with this email' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      isVerified: user.isEmailVerified
    });

  } catch (error) {
    console.error('Check verification status error:', error);
    return NextResponse.json(
      { error: 'Failed to check verification status' },
      { status: 500 }
    );
  }
}