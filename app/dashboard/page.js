'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { 
  Users, 
  Droplet, 
  UserPlus, 
  Calendar,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

export default function DashboardPage() {
  const [statsData, setStatsData] = useState(null);
  const [bloodStock, setBloodStock] = useState(null);
  const [donationTrends, setDonationTrends] = useState(null);
  const [timeRange, setTimeRange] = useState('week');
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`/api/dashboard/stats?timeRange=${timeRange}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setStatsData(data.stats);
      setBloodStock(data.bloodStock);
      setDonationTrends(data.donationTrends);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const StatsCard = ({ title, value, trend, icon: Icon, color }) => (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="mt-2 text-3xl font-semibold">{value}</p>
            {trend && (
              <p className={`mt-2 text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend > 0 ? '+' : ''}{trend}% from last {timeRange}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-lg bg-${color}-100`}>
            <Icon className={`h-6 w-6 text-${color}-600`} />
          </div>
        </div>
      </div>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          options={[
            { value: 'week', label: 'Last 7 Days' },
            { value: 'month', label: 'Last 30 Days' },
            { value: 'quarter', label: 'Last 3 Months' },
            { value: 'year', label: 'Last Year' }
          ]}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Donors"
          value={statsData?.totalDonors}
          trend={statsData?.donorsTrend}
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Blood Units Available"
          value={statsData?.totalUnits}
          trend={statsData?.unitsTrend}
          icon={Droplet}
          color="red"
        />
        <StatsCard
          title="Recipients Served"
          value={statsData?.totalRecipients}
          trend={statsData?.recipientsTrend}
          icon={UserPlus}
          color="green"
        />
        <StatsCard
          title="Donations This Period"
          value={statsData?.periodDonations}
          trend={statsData?.donationsTrend}
          icon={Calendar}
          color="purple"
        />
      </div>

      {/* Blood Stock Chart */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-medium mb-4">Blood Stock Levels</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bloodStock}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar 
                  dataKey="available" 
                  name="Available Units" 
                  fill="#4F46E5"
                />
                <Bar 
                  dataKey="critical" 
                  name="Critical Level" 
                  fill="#EF4444" 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      {/* Donation Trends */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-medium mb-4">Donation Trends</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={donationTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="donations" 
                  name="Donations" 
                  stroke="#4F46E5" 
                  activeDot={{ r: 8 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="requests" 
                  name="Requests" 
                  stroke="#EF4444" 
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      {/* Critical Alerts */}
      {statsData?.criticalAlerts?.length > 0 && (
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <h2 className="text-lg font-medium">Critical Alerts</h2>
            </div>
            <div className="space-y-4">
              {statsData.criticalAlerts.map((alert, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    <div>
                      <p className="font-medium">{alert.title}</p>
                      <p className="text-sm text-gray-600">{alert.description}</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {alert.timeAgo}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}