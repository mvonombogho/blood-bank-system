'use client';

import { useState } from 'react';
import { useInventory } from '@/lib/hooks/useInventory';
import { useSearchAndFilter } from '@/lib/hooks/useSearchAndFilter';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { 
  SearchBar, 
  FilterSelect, 
  DateRangeFilter, 
  FilterPanel 
} from '@/components/ui/SearchAndFilter';
import Link from 'next/link';
import { Loader2, AlertTriangle } from 'lucide-react';

const bloodTypeOptions = [
  { value: 'all', label: 'All Blood Types' },
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB-' },
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O-' },
];

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'available', label: 'Available' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'used', label: 'Used' },
  { value: 'expired', label: 'Expired' },
];

export default function InventoryPage() {
  const { inventory, isLoading, error, deleteInventoryItem } = useInventory();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const searchConfig = {
    searchFields: ['bloodBagId', 'bloodType', 'status'],
    defaultSort: 'collectionDate'
  };

  const {
    searchQuery,
    setSearchQuery,
    filters,
    updateFilter,
    resetFilters,
    sortBy,
    sortDirection,
    toggleSort,
    filteredItems
  } = useSearchAndFilter(inventory, searchConfig);

  const columns = [
    { 
      key: 'bloodBagId',
      label: 'Blood Bag ID',
      sortable: true
    },
    { 
      key: 'bloodType',
      label: 'Blood Type',
      sortable: true
    },
    { 
      key: 'status',
      label: 'Status',
      render: (status) => (
        <span className={getStatusBadgeClass(status)}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      )
    },
    { 
      key: 'collectionDate',
      label: 'Collection Date',
      sortable: true,
      render: (date) => new Date(date).toLocaleDateString()
    },
    { 
      key: 'expiryDate',
      label: 'Expiry Date',
      sortable: true,
      render: (date) => {
        const expiryDate = new Date(date);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        
        return (
          <div className="flex items-center gap-2">
            <span>{expiryDate.toLocaleDateString()}</span>
            {daysUntilExpiry <= 7 && daysUntilExpiry > 0 && (
              <AlertTriangle className="h-4 w-4 text-yellow-500" 
                title={`Expires in ${daysUntilExpiry} days`}
              />
            )}
            {daysUntilExpiry <= 0 && (
              <AlertTriangle className="h-4 w-4 text-red-500" 
                title="Expired"
              />
            )}
          </div>
        );
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, item) => (
        <div className="flex space-x-2">
          <Link href={`/dashboard/inventory/${item._id}`}>
            <Button variant="secondary" size="sm">View</Button>
          </Link>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleDelete(item._id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const handleSort = (key) => {
    if (columns.find(col => col.key === key)?.sortable) {
      toggleSort(key);
    }
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      available: 'bg-green-100 text-green-800',
      reserved: 'bg-yellow-100 text-yellow-800',
      used: 'bg-gray-100 text-gray-800',
      expired: 'bg-red-100 text-red-800'
    };
    return `px-2 py-1 rounded-full text-xs font-medium ${classes[status] || 'bg-gray-100 text-gray-800'}`;
  };

  if (error) {
    return (
      <Card>
        <div className="text-center text-red-600 p-4">
          Error loading inventory: {error}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Blood Inventory</h1>
        <Link href="/dashboard/inventory/add">
          <Button>Add Blood Unit</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <FilterPanel onReset={resetFilters}>
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search blood bags..."
            />
            <FilterSelect
              label="Blood Type"
              options={bloodTypeOptions}
              value={filters.bloodType || 'all'}
              onChange={(value) => updateFilter('bloodType', value)}
            />
            <FilterSelect
              label="Status"
              options={statusOptions}
              value={filters.status || 'all'}
              onChange={(value) => updateFilter('status', value)}
            />
            <DateRangeFilter
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
            />
          </FilterPanel>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : (
            <DataTable 
              columns={columns}
              data={filteredItems}
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSort={handleSort}
              emptyMessage="No blood units found"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}