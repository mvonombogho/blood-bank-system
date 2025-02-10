'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  AlertCircle,
  MoreVertical
} from 'lucide-react';

const PAGE_SIZE = 10;

export default function InventoryList() {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    bloodType: '',
    status: '',
    facility: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchUnits();
  }, [filters, pagination.page]);

  const fetchUnits = async () => {
    try {
      const queryParams = new URLSearchParams({
        page: pagination.page,
        limit: PAGE_SIZE,
        ...filters
      });

      const response = await fetch(`/api/inventory/blood-units?${queryParams}`);
      const data = await response.json();

      if (data.status === 'success') {
        setUnits(data.data.units);
        setPagination({
          ...pagination,
          total: data.data.pagination.total,
          totalPages: data.data.pagination.pages
        });
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch inventory data"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (unitId, newStatus) => {
    try {
      const response = await fetch('/api/inventory/blood-units', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          unitId,
          status: newStatus,
          changedBy: 'Current User', // Replace with actual user
          reason: 'Status update from inventory management'
        }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        toast({
          title: "Success",
          description: "Blood unit status updated successfully"
        });
        fetchUnits();
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update blood unit status"
      });
    }
  };

  const getStatusColor = (status, expiryDate) => {
    const isExpired = new Date(expiryDate) < new Date();
    
    if (isExpired) return 'bg-red-100 text-red-800';
    
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800';
      case 'quarantine':
        return 'bg-orange-100 text-orange-800';
      case 'discarded':
        return 'bg-red-100 text-red-800';
      case 'transfused':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDaysUntilExpiry = (expiryDate) => {
    const days = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <Card>
      <CardContent className="p-6">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <Input
            placeholder="Search by Unit ID or Donor"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="md:w-1/3"
            icon={<Search className="w-4 h-4" />}
          />
          
          <Select
            value={filters.bloodType}
            onValueChange={(value) => setFilters({ ...filters, bloodType: value })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Blood Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.status}
            onValueChange={(value) => setFilters({ ...filters, status: value })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Status</SelectItem>
              {['available', 'reserved', 'quarantine', 'discarded', 'transfused'].map(status => (
                <SelectItem key={status} value={status} className="capitalize">
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => setFilters({
              bloodType: '',
              status: '',
              facility: '',
              search: ''
            })}
            className="md:ml-auto"
          >
            Clear Filters
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unit ID</TableHead>
                <TableHead>Blood Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Collection Date</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Quality Check</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : units.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10">
                    No blood units found
                  </TableCell>
                </TableRow>
              ) : (
                units.map((unit) => (
                  <TableRow key={unit.unitId}>
                    <TableCell className="font-medium">{unit.unitId}</TableCell>
                    <TableCell>{unit.bloodType}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
                          unit.status,
                          unit.expiryDate
                        )}`}
                      >
                        {unit.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(unit.collectionDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {new Date(unit.expiryDate).toLocaleDateString()}
                        {getDaysUntilExpiry(unit.expiryDate) <= 30 && (
                          <AlertCircle className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {`${unit.location.facility} - ${unit.location.refrigerator}`}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          unit.qualityCheck.result === 'passed'
                            ? 'bg-green-100 text-green-800'
                            : unit.qualityCheck.result === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {unit.qualityCheck.result}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleUpdateStatus(unit.unitId, 'available')}
                          >
                            Mark as Available
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleUpdateStatus(unit.unitId, 'reserved')}
                          >
                            Reserve Unit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleUpdateStatus(unit.unitId, 'quarantine')}
                          >
                            Move to Quarantine
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            Mark as Discarded
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            Showing {((pagination.page - 1) * PAGE_SIZE) + 1} to{' '}
            {Math.min(pagination.page * PAGE_SIZE, pagination.total)} of{' '}
            {pagination.total} results
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              disabled={pagination.page === pagination.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}