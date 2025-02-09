'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Loader2, Calendar, Phone, Mail, MapPin, Activity, Clock } from 'lucide-react';

export default function DonorDetailsPage({ params }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [donor, setDonor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchDonorDetails();
  }, [params.id]);

  const fetchDonorDetails = async () => {
    try {
      const response = await fetch(`/api/donors/${params.id}`);
      if (!response.ok) throw new Error('Failed to fetch donor details');
      const data = await response.json();
      setDonor(data);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this donor?')) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/donors/${params.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete donor');

      showToast('Donor deleted successfully', 'success');
      router.push('/dashboard/donors');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!donor) {
    return <div>Donor not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Donor Details</h1>
          <p className="text-gray-600">View and manage donor information</p>
        </div>
        <div className="flex space-x-3">
          <Link href={`/dashboard/donors/${params.id}/edit`}>
            <Button variant="outline">Edit Donor</Button>
          </Link>
          <Button 
            variant="outline" 
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-red-600 hover:bg-red-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Donor'
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">
                  {donor.firstName} {donor.lastName}
                </h3>
                <div className="flex items-center text-gray-600 mt-1">
                  <Activity className="h-4 w-4 mr-2" />
                  Blood Type: <span className="font-medium ml-1">{donor.bloodType}</span>
                </div>
              </div>
              
              <div className="flex items-center text-gray-600">
                <Mail className="h-4 w-4 mr-2" />
                {donor.email}
              </div>
              
              <div className="flex items-center text-gray-600">
                <Phone className="h-4 w-4 mr-2" />
                {donor.phone}
              </div>

              <div className="flex items-start text-gray-600">
                <MapPin className="h-4 w-4 mr-2 mt-1" />
                <div>
                  {donor.address.street}<br />
                  {donor.address.city}, {donor.address.state} {donor.address.zipCode}
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Donation History</h2>
            {donor.donationHistory && donor.donationHistory.length > 0 ? (
              <div className="space-y-4">
                {donor.donationHistory.map((donation, index) => (
                  <div key={index} className="border-b pb-4 last:border-0">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(donation.donationDate).toLocaleDateString()}
                    </div>
                    <div className="mt-1 text-gray-600">
                      <span className="font-medium">{donation.units}</span> units at{' '}
                      <span className="font-medium">{donation.bloodBank}</span>
                    </div>
                    {donation.notes && (
                      <p className="text-sm text-gray-500 mt-1">{donation.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No donation history available</p>
            )}
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Medical History</h2>
            <div className="space-y-4">
              {donor.medicalHistory.conditions && (
                <div>
                  <h3 className="text-sm font-medium text-gray-600">Medical Conditions</h3>
                  <p>{donor.medicalHistory.conditions}</p>
                </div>
              )}
              
              {donor.medicalHistory.medications && (
                <div>
                  <h3 className="text-sm font-medium text-gray-600">Current Medications</h3>
                  <p>{donor.medicalHistory.medications}</p>
                </div>
              )}

              {donor.medicalHistory.lastDonation && (
                <div className="flex items-center text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  Last Donation: {new Date(donor.medicalHistory.lastDonation).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}