'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DonorForm from '@/components/forms/DonorForm';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function AddDonorPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (donorData) => {
    try {
      setIsSubmitting(true);
      
      const response = await fetch('/api/donors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(donorData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create donor');
      }

      showToast('Donor added successfully!', 'success');
      router.push('/dashboard/donors');
      router.refresh(); // Refresh the donors list
    } catch (error) {
      showToast(error.message, 'error');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Add New Donor</h1>
          <p className="text-gray-600 mt-1">Enter the donor&apos;s information below</p>
        </div>
        <Link href="/dashboard/donors">
          <Button variant="outline">Cancel</Button>
        </Link>
      </div>

      <DonorForm onSubmit={handleSubmit} />
    </div>
  );
}