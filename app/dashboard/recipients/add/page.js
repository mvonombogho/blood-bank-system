'use client';

import { useState } from 'react';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';
import { useRecipients } from '@/lib/hooks/useRecipients';
import { Loader2, Search } from 'lucide-react';

export default function RecipientsPage() {
  const { 
    recipients, 
    isLoading, 
    error, 
    deleteRecipient,
    actionLoading 
  } = useRecipients();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBloodType, setSelectedBloodType] = useState('all');

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this recipient?')) {
      try {
        await deleteRecipient(id);
      } catch (error) {
        console.error('Failed to delete recipient:', error);
      }
    }
  };

  const columns = [
    { 
      key: 'name',
      label: 'Name',
      render: (_, recipient) => (
        <div>
          <span className="font-medium">
            {recipient.firstName} {recipient.lastName}
          </span>
          <p className="text-sm text-gray-500">{recipient.bloodType}</p>
        </div>
      )
    },
    { 
      key: 'hospital',
      label: 'Hospital',
      render: (_, recipient) => (
        <div>
          <span className="font-medium">{recipient.hospital.name}</span>
          <p className="text-sm text-gray-500">Dr. {recipient.hospital.doctorName}</p>
        </div>
      )
    },
    { 
      key: 'contact',
      label: 'Contact',
      render: (_, recipient) => (
        <div>
          <p>{recipient.phone}</p>
          <p className="text-sm text-gray-500">{recipient.email}</p>
        </div>
      )
    },
    {
      key: 'lastTransfusion',
      label: 'Last Transfusion',
      render: (_, recipient) => {
        const lastTransfusion = recipient.transfusionHistory?.[0];
        return lastTransfusion ? (
          <div>
            <p>{new Date(lastTransfusion.date).toLocaleDateString()}</p>
            <p className="text-sm text-gray-500">{lastTransfusion.units} units</p>
          </div>
        ) : (
          <span className="text-gray-500">No transfusions</span>
        );
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, recipient) => (
        <div className="flex space-x-2">
          <Link href={`/dashboard/recipients/${recipient._id}`}>
            <Button variant="secondary" size="sm">View</Button>
          </Link>
          <Link href={`/dashboard/recipients/${recipient._id}/edit`}>
            <Button variant="outline" size="sm">Edit</Button>
          </Link>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleDelete(recipient._id)}
            disabled={actionLoading}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  // Filter recipients based on search query and blood type
  const filteredRecipients = recipients?.filter(recipient => {
    const matchesSearch = 
      searchQuery === '' ||
      recipient.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipient.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipient.hospital.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesBloodType = 
      selectedBloodType === 'all' || 
      recipient.bloodType === selectedBloodType;

    return matchesSearch && matchesBloodType;
  });

  if (error) {
    return (
      <Card>
        <div className="text-center text-red-600 p-4">
          Error loading recipients: {error}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Recipients</h1>
        <Link href="/dashboard/recipients/add">
          <Button>Add Recipient</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search recipients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              className="border rounded-md px-3 py-1.5"
              value={selectedBloodType}
              onChange={(e) => setSelectedBloodType(e.target.value)}
            >
              <option value="all">All Blood Types</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : (
            <DataTable 
              columns={columns}
              data={filteredRecipients || []}
              emptyMessage="No recipients found"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}