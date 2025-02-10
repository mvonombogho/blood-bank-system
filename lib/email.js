import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const EMAIL_TEMPLATES = {
  low_inventory: {
    subject: 'Blood Bank Alert: Low Inventory',
    html: (data) => `
      <h2>Low Blood Inventory Alert</h2>
      <p>The inventory level for blood type ${data.bloodType} is critically low:</p>
      <ul>
        <li>Current units: ${data.units}</li>
        <li>Minimum required: 10 units</li>
      </ul>
      <p>Please take immediate action to replenish the inventory.</p>
    `
  },
  expiring_units: {
    subject: 'Blood Bank Alert: Expiring Units',
    html: (data) => `
      <h2>Blood Units Expiring Soon</h2>
      <p>The following blood units are approaching their expiry date:</p>
      <ul>
        <li>Blood Type: ${data.bloodType}</li>
        <li>Units: ${data.units}</li>
        <li>Expiry Date: ${new Date(data.expiryDate).toLocaleDateString()}</li>
      </ul>
      <p>Please prioritize these units for immediate use.</p>
    `
  },
  donor_eligible: {
    subject: 'Blood Donation Reminder',
    html: (data) => `
      <h2>You're Eligible to Donate Blood Again!</h2>
      <p>Dear ${data.name},</p>
      <p>It's been three months since your last donation on ${new Date(data.lastDonationDate).toLocaleDateString()}.</p>
      <p>You're now eligible to donate blood again. Your previous donations have helped save lives!</p>
      <p>Would you like to schedule your next donation?</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/donate" style="background-color: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Schedule Donation</a>
    `
  }
};

export async function sendEmail({ type, recipient, data }) {
  try {
    const template = EMAIL_TEMPLATES[type];
    if (!template) {
      throw new Error('Invalid email template type');
    }

    const msg = {
      to: recipient,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: template.subject,
      html: template.html(data),
    };

    await sgMail.send(msg);
    return { success: true };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error: error.message };
  }
}