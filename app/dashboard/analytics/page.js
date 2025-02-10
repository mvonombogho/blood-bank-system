'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, Droplet, Users, AlertTriangle } from 'lucide-react';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/analytics');
        const data = await response.json();
        
        if (data.success) {
          setAnalytics(data.data);
        } else {
          setError(data.error);
        }
      } catch (err) {
        setError('Failed to fetch analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const { totalDonors, totalRecipients, totalDonations, bloodInventory, donationTrends } = analytics;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Dashboard Analytics</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Donors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDonors}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Recipients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRecipients}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
            <Droplet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDonations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Low Inventory Alert</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bloodInventory.filter(b => b.total < 10).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Blood Inventory Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Blood Inventory Levels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bloodInventory.map(item => ({
                bloodType: item._id,
                total: item.total,
                expiring: item.expiring
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bloodType" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#2563eb" name="Total Units" />
                <Bar dataKey="expiring" fill="#dc2626" name="Expiring Soon" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Donation Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Donation Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={donationTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date"
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString('default', { month: 'short' });
                  }}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="donations" 
                  stroke="#2563eb" 
                  name="Donations"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Low Inventory Alerts */}
      {bloodInventory.filter(b => b.total < 10).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-500">Low Inventory Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {bloodInventory
                .filter(b => b.total < 10)
                .map(item => (
                  <Alert key={item._id} variant="destructive">
                    <AlertDescription>
                      Blood type {item._id} is running low: {item.total} units remaining
                    </AlertDescription>
                  </Alert>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}