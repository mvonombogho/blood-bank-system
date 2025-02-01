'use client';

import { useState } from 'react';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { useDonors } from '@/lib/hooks/useData';
import { Loader2 } from 'lucide-react';

export default function DonorsPage() {
  const { donors, isLoading, error, deleteDonor } = useDonors();
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this donor?')) {
      try {
        setDeleteLoading(true);
        await deleteDonor(id);
      } catch (error) {
        console.error('Failed to delete donor:', error);
      } finally {
        setDeleteLoading(false);
      }
    }
  };

  const columns = [
    { 
      key: 'name',
      label: 'Name',
      render: (_, donor) => `${donor.firstName} ${donor.lastName}`
    },
    { key: 'bloodType', label: 'Blood Type' },
    { 
      key: 'lastDonation',
      label: 'Last Donation',
      render: (date) => date ? new Date(date).toLocaleDateString() : 'Never'
    },
    { key: 'phone', label: 'Phone' },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, donor) => (
        <div className="flex space-x-2">
          <Link href={`/dashboard/donors/${donor._id}`}>
            <Button variant="secondary" size="sm">View</Button>
          </Link>
          <Link href={`/dashboard/donors/${donor._id}/edit`}>
            <Button variant="outline" size="sm">Edit</Button>
          </Link>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleDelete(donor._id)}
            disabled={deleteLoading}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  if (error) {
    return (
      <Card>
        <div className="text-center text-red-600 p-4">
          Error loading donors: {error}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Donors</h1>
        <Link href="/dashboard/donors/add">
          <Button>Add Donor</Button>
        </Link>
      </div>

      <Card>
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        ) : (
          <DataTable 
            columns={columns}
            data={donors || []}
            emptyMessage="No donors found"
          />
        )}
      </Card>
    </div>
  );
}