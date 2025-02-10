'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Thermometer, Package, AlertTriangle, RefreshCcw } from 'lucide-react';

export default function StorageManagement() {
  const [facilities, setFacilities] = useState([
    {
      id: 'main',
      name: 'Main Blood Bank',
      refrigerators: [
        {
          id: 'RF01',
          name: 'Refrigerator 1',
          temperature: 4.2,
          capacity: 100,
          occupied: 65,
          shelves: 5,
          status: 'operational',
          lastChecked: new Date().toISOString()
        },
        {
          id: 'RF02',
          name: 'Refrigerator 2',
          temperature: 4.1,
          capacity: 100,
          occupied: 42,
          shelves: 5,
          status: 'operational',
          lastChecked: new Date().toISOString()
        }
      ]
    },
    {
      id: 'branch1',
      name: 'Branch 1',
      refrigerators: [
        {
          id: 'RF03',
          name: 'Refrigerator 1',
          temperature: 4.3,
          capacity: 80,
          occupied: 35,
          shelves: 4,
          status: 'maintenance',
          lastChecked: new Date().toISOString()
        }
      ]
    }
  ]);

  const [selectedRefrigerator, setSelectedRefrigerator] = useState(null);
  const [temperatureInput, setTemperatureInput] = useState('');
  const [showTempDialog, setShowTempDialog] = useState(false);
  const { toast } = useToast();

  const getTemperatureStatus = (temp) => {
    if (temp < 2 || temp > 6) {
      return 'text-red-500';
    } else if (temp < 3 || temp > 5) {
      return 'text-yellow-500';
    }
    return 'text-green-500';
  };

  const getCapacityColor = (occupied, capacity) => {
    const percentage = (occupied / capacity) * 100;
    if (percentage > 90) return 'text-red-500';
    if (percentage > 75) return 'text-yellow-500';
    return 'text-green-500';
  };

  const handleTemperatureUpdate = async (refrigerator) => {
    try {
      const newTemp = parseFloat(temperatureInput);
      if (isNaN(newTemp) || newTemp < 0 || newTemp > 10) {
        throw new Error('Invalid temperature value');
      }

      // Here you would make an API call to update the temperature
      setFacilities(facilities.map(facility => ({
        ...facility,
        refrigerators: facility.refrigerators.map(ref =>
          ref.id === refrigerator.id
            ? { ...ref, temperature: newTemp, lastChecked: new Date().toISOString() }
            : ref
        )
      })));

      setShowTempDialog(false);
      setTemperatureInput('');
      
      toast({
        title: "Success",
        description: "Temperature updated successfully"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update temperature"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Storage Units</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {facilities.reduce((acc, f) => acc + f.refrigerators.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all facilities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {facilities.reduce((acc, f) => 
                acc + f.refrigerators.reduce((sum, r) => sum + r.capacity, 0), 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Blood units
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Units in Storage</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {facilities.reduce((acc, f) => 
                acc + f.refrigerators.reduce((sum, r) => sum + r.occupied, 0), 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently stored
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Storage Units Table */}
      <Card>
        <CardHeader>
          <CardTitle>Storage Units Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unit ID</TableHead>
                <TableHead>Facility</TableHead>
                <TableHead>Temperature</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Checked</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {facilities.flatMap(facility =>
                facility.refrigerators.map(refrigerator => (
                  <TableRow key={refrigerator.id}>
                    <TableCell className="font-medium">{refrigerator.id}</TableCell>
                    <TableCell>{facility.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Thermometer className={getTemperatureStatus(refrigerator.temperature)} />
                        {refrigerator.temperature}°C
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={getCapacityColor(refrigerator.occupied, refrigerator.capacity)}>
                            {refrigerator.occupied}/{refrigerator.capacity}
                          </span>
                        </div>
                        <Progress 
                          value={(refrigerator.occupied / refrigerator.capacity) * 100}
                          className="h-2"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        refrigerator.status === 'operational' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {refrigerator.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(refrigerator.lastChecked).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRefrigerator(refrigerator);
                            setShowTempDialog(true);
                          }}
                        >
                          <RefreshCcw className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Temperature Update Dialog */}
      <Dialog open={showTempDialog} onOpenChange={setShowTempDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Temperature</DialogTitle>
            <DialogDescription>
              Enter the new temperature reading for {selectedRefrigerator?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
              <Input
                type="number"
                step="0.1"
                value={temperatureInput}
                onChange={(e) => setTemperatureInput(e.target.value)}
                placeholder="Enter temperature (°C)"
              />
              <span>°C</span>
            </div>
            {temperatureInput && (parseFloat(temperatureInput) < 2 || parseFloat(temperatureInput) > 6) && (
              <div className="flex items-center gap-2 text-red-500">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">Temperature out of safe range (2-6°C)</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowTempDialog(false);
                setTemperatureInput('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleTemperatureUpdate(selectedRefrigerator)}
              disabled={!temperatureInput}
            >
              Update Temperature
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}