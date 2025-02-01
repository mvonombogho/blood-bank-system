import { Card } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { StatsCard } from '@/components/ui/StatsCard';
import { Users, Droplet, UserPlus, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  // Sample data - this would come from your API
  const stats = [
    {
      title: 'Total Donors',
      value: '2,420',
      icon: Users,
      trend: '+8%',
      trendDirection: 'up'
    },
    {
      title: 'Blood Units',
      value: '1,210',
      icon: Droplet,
      trend: '+12%',
      trendDirection: 'up'
    },
    {
      title: 'Recipients',
      value: '890',
      icon: UserPlus,
      trend: '+5%',
      trendDirection: 'up'
    },
    {
      title: 'Critical Stock',
      value: '3',
      icon: AlertCircle,
      trend: '-2',
      trendDirection: 'down'
    }
  ];

  const recentDonations = [
    { id: 1, donor: 'John Doe', bloodType: 'A+', date: '2024-02-01', units: 1 },
    { id: 2, donor: 'Jane Smith', bloodType: 'O-', date: '2024-02-01', units: 1 },
    // Add more sample data
  ];

  const columns = [
    { key: 'donor', label: 'Donor Name' },
    { key: 'bloodType', label: 'Blood Type' },
    { key: 'date', label: 'Donation Date' },
    { key: 'units', label: 'Units' },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex space-x-2">
          <button className="text-blue-600 hover:text-blue-800">View</button>
          <button className="text-red-600 hover:text-red-800">Delete</button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Recent Donations">
          <DataTable 
            columns={columns} 
            data={recentDonations} 
          />
        </Card>

        <Card title="Stock Levels">
          {/* Add your blood stock chart here */}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Upcoming Donations">
          <DataTable 
            columns={[
              { key: 'donor', label: 'Donor' },
              { key: 'bloodType', label: 'Blood Type' },
              { key: 'scheduledDate', label: 'Scheduled Date' },
            ]} 
            data={[
              // Add sample upcoming donations data
            ]} 
          />
        </Card>

        <Card title="Recent Requests">
          <DataTable 
            columns={[
              { key: 'recipient', label: 'Recipient' },
              { key: 'bloodType', label: 'Blood Type' },
              { key: 'units', label: 'Units Required' },
              { key: 'status', label: 'Status' },
            ]} 
            data={[
              // Add sample blood requests data
            ]} 
          />
        </Card>
      </div>
    </div>
  );
}