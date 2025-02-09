'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DonorForm from '@/components/forms/DonorForm';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Loader2 } from 'lucide-react';

export default function EditDonorPage({ params }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [donor, setDonor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const handleSubmit = async (donorData) => {
    try {
      const response = await fetch(`/api/donors/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(donorData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update donor');
      }

      showToast('Donor updated successfully!', 'success');
      router.push(`/dashboard/donors/${params.id}`);
    } catch (error) {
      showToast(error.message, 'error');
      throw error;
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
          <h1 className="text-2xl font-bold">Edit Donor</h1>
          <p className="text-gray-600">Update donor information</p>
        </div>
        <Link href={`/dashboard/donors/${params.id}`}>
          <Button variant="outline">Cancel</Button>
        </Link>
      </div>

      <DonorForm 
        initialData={donor} 
        onSubmit={handleSubmit}
      />
    </div>
  );
}