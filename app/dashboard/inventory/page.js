'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DroploadMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { BarChart, Activity, AlertTriangle, Package } from 'lucide-react';

export default function InventoryDashboard() {
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await fetch('/api/inventory/blood-units');
      const data = await response.json();

      if (data.status === 'success') {
        setInventory(data.data);
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch inventory data"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateExpiringUnits = () => {
    if (!inventory?.units) return 0;
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    return inventory.units.filter(unit => 
      new Date(unit.expiryDate) <= thirtyDaysFromNow && 
      unit.status === 'available'
    ).length;
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
        <h1 className="text-2xl font-bold">Blood Inventory Management</h1>
        <Button
          onClick={() => setActiveTab('add')}
          className="flex items-center gap-2"
        >
          <Package className="w-4 h-4" />
          Add Blood Unit
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Units</CardTitle>
            <Package className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {inventory?.units?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Available blood units
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {calculateExpiringUnits()}
            </div>
            <p className="text-xs text-muted-foreground">
              Units expiring within 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Critical Types</CardTitle>
            <Activity className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {inventory?.summary?.filter(s => s.count < 10).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Blood types below threshold
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monthly Trend</CardTitle>
            <BarChart className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12%</div>
            <p className="text-xs text-muted-foreground">
              Compared to last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inventory">Inventory List</TabsTrigger>
          <TabsTrigger value="add">Add Unit</TabsTrigger>
          <TabsTrigger value="storage">Storage Management</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Blood Type Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Blood Type</TableHead>
                    <TableHead>Available Units</TableHead>
                    <TableHead>Total Volume (ml)</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory?.summary?.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell className="font-medium">{item._id}</TableCell>
                      <TableCell>{item.count}</TableCell>
                      <TableCell>{item.totalVolume}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            item.count < 10
                              ? 'bg-red-100 text-red-800'
                              : item.count < 20
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {item.count < 10
                            ? 'Critical'
                            : item.count < 20
                            ? 'Low'
                            : 'Normal'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* We'll add other tab contents in separate components */}
        <TabsContent value="inventory">
          {/* Will add InventoryList component */}
        </TabsContent>

        <TabsContent value="add">
          {/* Will add AddBloodUnit component */}
        </TabsContent>

        <TabsContent value="storage">
          {/* Will add StorageManagement component */}
        </TabsContent>
      </Tabs>
    </div>
  );
}