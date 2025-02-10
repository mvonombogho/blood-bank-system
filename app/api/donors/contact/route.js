import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Contact from '@/models/Contact';
import { sendEmail } from '@/lib/email'; // We'll create this utility later

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const donorId = searchParams.get('donorId');

    const contact = await Contact.findOne({ donorId });
    
    if (!contact) {
      return NextResponse.json(
        { status: 'error', message: 'Contact not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: 'success',
      data: contact
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const data = await request.json();
    const { donorId, preferences, communication } = data;

    let contact = await Contact.findOne({ donorId });

    if (!contact) {
      // Create new contact record if it doesn't exist
      contact = await Contact.create({
        donorId,
        preferences,
        communications: communication ? [communication] : []
      });
    } else {
      // Update existing contact record
      if (preferences) {
        contact.preferences = {
          ...contact.preferences,
          ...preferences
        };
      }
      
      if (communication) {
        await contact.addCommunication(communication);
      }
    }

    // If this is a communication, attempt to send it
    if (communication) {
      try {
        await sendCommunication(contact, communication);
      } catch (error) {
        console.error('Failed to send communication:', error);
        // Update communication status to failed
        const comm = contact.communications[contact.communications.length - 1];
        comm.status = 'failed';
        await contact.save();
      }
    }

    return NextResponse.json({
      status: 'success',
      data: contact
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    const data = await request.json();
    const { donorId, preferences, doNotContactPeriod } = data;

    const contact = await Contact.findOne({ donorId });
    
    if (!contact) {
      return NextResponse.json(
        { status: 'error', message: 'Contact not found' },
        { status: 404 }
      );
    }

    if (preferences) {
      contact.preferences = {
        ...contact.preferences,
        ...preferences
      };
    }

    if (doNotContactPeriod) {
      contact.doNotContactPeriods.push(doNotContactPeriod);
    }

    await contact.save();

    return NextResponse.json({
      status: 'success',
      data: contact
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}

// Helper function to send communications
async function sendCommunication(contact, communication) {
  switch (communication.type) {
    case 'email':
      await sendEmail({
        to: contact.email,
        subject: communication.subject,
        text: communication.content
      });
      break;
    case 'sms':
      // Implement SMS sending
      break;
    case 'push':
      // Implement push notification
      break;
    default:
      throw new Error(`Unsupported communication type: ${communication.type}`);
  }
}