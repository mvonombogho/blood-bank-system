# Blood Bank Management System

A comprehensive blood bank management system built with Next.js and MongoDB.

## Features

### Completed Components
- Database Models
- API Routes
- Frontend UI Components
- Client-side Integration
- Form Handling
- Authentication & Authorization
  - Login/Register
  - Password Reset
  - Admin Management
- Donor Scheduling Calendar
  - Interactive calendar interface
  - Available time slots management
  - Appointment scheduling and confirmation
  - Rescheduling functionality
  - Calendar export to ICS format
- Donation History Graphs
  - Timeline visualization
  - Volume trends analysis
  - Frequency patterns
  - Comparative analytics

### In Progress
- Donor Status Tracking (partially completed)
  - Health metrics tracking
  - Eligibility status monitoring
  - Deferral management
  - Medical history records

### Planned Features
- Contact Management
  - Contact information management
  - Communication history
  - Preferred contact methods
  - Automated reminders

## Tech Stack
- Next.js
- MongoDB
- Tailwind CSS
- Recharts for visualizations
- ShadCN UI components

## Project Structure
```
/app
  /api
    /donors
      /status/route.js
      /schedule/route.js
      /history/route.js
  /dashboard
    /donors
      /status/page.js
      /history/page.js
      /schedule/page.js
  /models
    Donor.js
    DonorHealth.js
    DonorDeferral.js
```

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/mvonombogho/blood-bank-system.git
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Run the development server:
```bash
npm run dev
```

## Contributing
Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.