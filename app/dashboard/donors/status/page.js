'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';

export default function DonorStatusPage() {
  const [donorHealth, setDonorHealth] = useState(null);
  const [deferralStatus, setDeferralStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDonorStatus = async () => {
      try {
        const donorId = sessionStorage.getItem('currentDonorId');
        const response = await fetch(`/api/donors/status?donorId=${donorId}`);
        const data = await response.json();

        if (data.status === 'success') {
          setDonorHealth(data.data.health);
          setDeferralStatus(data.data.deferral);
        } else {
          throw new Error(data.message);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDonorStatus();
  }, []);

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
      <h1 className="text-2xl font-bold">Donor Status Dashboard</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Health Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            {donorHealth ? (
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Hemoglobin</TableCell>
                    <TableCell>{donorHealth.hemoglobin} g/dL</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Blood Pressure</TableCell>
                    <TableCell>{donorHealth.bloodPressure}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Pulse</TableCell>
                    <TableCell>{donorHealth.pulse} bpm</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Temperature</TableCell>
                    <TableCell>{donorHealth.temperature}°C</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Last Updated</TableCell>
                    <TableCell>
                      {new Date(donorHealth.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            ) : (
              <p>No health records found</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Deferral Status</CardTitle>
          </CardHeader>
          <CardContent>
            {deferralStatus ? (
              <div className="space-y-4">
                <Alert variant="warning">
                  <AlertDescription>
                    Currently deferred until {new Date(deferralStatus.endDate).toLocaleDateString()}
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <p className="font-medium">Reason:</p>
                  <p>{deferralStatus.reason}</p>
                </div>
              </div>
            ) : (
              <Alert>
                <AlertDescription>Eligible to donate</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end space-x-4">
        <Button variant="outline">Update Health Metrics</Button>
        <Button variant="outline">Manage Deferral Status</Button>
      </div>
    </div>
  );
}