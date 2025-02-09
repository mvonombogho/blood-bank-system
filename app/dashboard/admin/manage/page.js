'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { DataTable } from '@/components/ui/DataTable';
import { 
  Loader2, 
  Search, 
  UserPlus, 
  Shield, 
  ShieldOff,
  Edit,
  Trash2,
  Filter
} from 'lucide-react';

export default function AdminManagementPage() {
  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    department: 'all'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalAdmins: 0
  });
  const [departments, setDepartments] = useState([]);
  const { showToast } = useToast();

  useEffect(() => {
    fetchAdmins();
    fetchDepartments();
  }, [filters, pagination.page]);

  const fetchAdmins = async () => {
    try {
      const queryParams = new URLSearchParams({
        page: pagination.page,
        limit: 10,
        search: filters.search,
        status: filters.status,
        department: filters.department
      });

      const response = await fetch(`/api/admin/manage?${queryParams}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setAdmins(data.admins);
      setPagination(prev => ({
        ...prev,
        totalPages: data.pagination.pages,
        totalAdmins: data.pagination.total
      }));
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/admin/departments');
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setDepartments(data.departments);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleStatusChange = async (adminId, isActive) => {
    try {
      const response = await fetch(`/api/admin/manage/${adminId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      showToast(
        `Admin ${isActive ? 'activated' : 'deactivated'} successfully`,
        'success'
      );
      fetchAdmins();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleDelete = async (adminId) => {
    if (!window.confirm('Are you sure you want to delete this admin?')) return;

    try {
      const response = await fetch(`/api/admin/manage/${adminId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      showToast('Admin deleted successfully', 'success');
      fetchAdmins();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Admin Name',
      render: (_, admin) => (
        <div>
          <div className="font-medium">{admin.name}</div>
          <div className="text-sm text-gray-500">{admin.email}</div>
        </div>
      ),
    },
    {
      key: 'department',
      label: 'Department',
      render: (_, admin) => admin.department,
    },
    {
      key: 'position',
      label: 'Position',
      render: (_, admin) => admin.position,
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, admin) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium
          ${admin.isActive 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'}`}
        >
          {admin.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, admin) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleStatusChange(admin._id, !admin.isActive)}
          >
            {admin.isActive ? (
              <ShieldOff className="h-4 w-4" />
            ) : (
              <Shield className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {/* Handle edit */}}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700"
            onClick={() => handleDelete(admin._id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Admin Management</h1>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Add New Admin
        </Button>
      </div>

      <Card>
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search admins..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <Select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' }
                ]}
              />
              <Select
                value={filters.department}
                onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                options={[
                  { value: 'all', label: 'All Departments' },
                  ...departments.map(dept => ({
                    value: dept.id,
                    label: dept.name
                  }))
                ]}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : (
            <>
              <DataTable
                columns={columns}
                data={admins}
                emptyMessage="No admins found"
              />

              {pagination.totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-gray-500">
                    Total: {pagination.totalAdmins} admins
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === 1}
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    >
                      Previous
                    </Button>
                    <span className="px-4 py-2 border rounded-md">
                      {pagination.page} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === pagination.totalPages}
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
}