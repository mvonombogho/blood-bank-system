'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function EditAdminPage({ params }) {
  const [admin, setAdmin] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [departments, setDepartments] = useState([]);
  const router = useRouter();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    position: '',
    department: '',
    role: 'admin',
    permissions: []
  });

  useEffect(() => {
    fetchAdminDetails();
    fetchDepartments();
  }, [params.id]);

  const fetchAdminDetails = async () => {
    try {
      const response = await fetch(`/api/admin/manage/${params.id}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setAdmin(data);
      setFormData({
        name: data.name,
        email: data.email,
        phoneNumber: data.phoneNumber || '',
        position: data.position || '',
        department: data.department || '',
        role: data.role,
        permissions: data.permissions || []
      });
    } catch (error) {
      showToast(error.message, 'error');
      router.push('/dashboard/admin/manage');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/admin/departments');
      const data = await response.json();
      if (response.ok) {
        setDepartments(data.departments);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePermissionChange = (permission) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const validateForm = () => {
    const errors = [];
    if (!formData.name) errors.push('Name is required');
    if (!formData.email) errors.push('Email is required');
    if (!formData.position) errors.push('Position is required');
    if (!formData.department) errors.push('Department is required');
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (errors.length > 0) {
      errors.forEach(error => showToast(error, 'error'));
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/admin/manage/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      showToast('Admin updated successfully', 'success');
      router.push('/dashboard/admin/manage');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Edit Admin</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={isSaving}
            />

            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={true} // Email cannot be changed
            />

            <Input
              label="Phone Number"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              disabled={isSaving}
            />

            <Input
              label="Position"
              name="position"
              value={formData.position}
              onChange={handleChange}
              required
              disabled={isSaving}
            />

            <Select
              label="Department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              options={departments.map(dept => ({
                value: dept.id,
                label: dept.name
              }))}
              required
              disabled={isSaving}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Permissions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                'manage_donors',
                'manage_inventory',
                'manage_recipients',
                'view_reports',
                'manage_staff',
                'system_settings'
              ].map((permission) => (
                <label key={permission} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.permissions.includes(permission)}
                    onChange={() => handlePermissionChange(permission)}
                    disabled={isSaving}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <span className="text-sm">
                    {permission.split('_').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}