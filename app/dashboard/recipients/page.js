'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { UserPlus, Users, Droplet, AlertTriangle, Activity } from 'lucide-react';
import RecipientList from './components/RecipientList';
import AddRecipientForm from './components/AddRecipientForm';
import BloodRequestsView from './components/BloodRequestsView';

export default function RecipientDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalRecipients: 0,
    activeRequests: 0,
    recentTransfusions: 0,
    criticalCases: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [recipientsResponse, requestsResponse] = await Promise.all([
        fetch('/api/recipients'),
        fetch('/api/recipients/blood-requests')
      ]);

      const recipientsData = await recipientsResponse.json();
      const requestsData = await requestsResponse.json();

      if (recipientsData.status === 'success' && requestsData.status === 'success') {
        setStats({
          totalRecipients: recipientsData.data.pagination.total,
          activeRequests: requestsData.data.requests.filter(r => 
            r.requests.some(req => ['pending', 'approved'].includes(req.status))
          ).length,
          recentTransfusions: recipientsData.data.recipients.filter(r => 
            r.transfusionHistory && r.transfusionHistory.length > 0 &&
            new Date(r.transfusionHistory[0].date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          ).length,
          criticalCases: requestsData.data.requests.filter(r =>
            r.requests.some(req => req.urgency === 'emergency' && req.status === 'pending')
          ).length
        });
      }
    } catch (err) {
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load dashboard data"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Recipient Management</h1>
        <Button
          onClick={() => setActiveTab('add')}
          className="flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Add Recipient
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Recipients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRecipients}</div>
            <p className="text-xs text-muted-foreground">
              Registered recipients
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Requests</CardTitle>
            <Droplet className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeRequests}</div>
            <p className="text-xs text-muted-foreground">
              Pending blood requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recent Transfusions</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentTransfusions}</div>
            <p className="text-xs text-muted-foreground">
              In the last 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Critical Cases</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.criticalCases}</div>
            <p className="text-xs text-muted-foreground">
              Emergency requests
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="requests">Blood Requests</TabsTrigger>
          <TabsTrigger value="add">Add Recipient</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <RecipientList onRefresh={fetchDashboardData} />
        </TabsContent>

        <TabsContent value="requests">
          <BloodRequestsView onUpdate={fetchDashboardData} />
        </TabsContent>

        <TabsContent value="add">
          <AddRecipientForm 
            onSuccess={() => {
              fetchDashboardData();
              setActiveTab('overview');
            }} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}