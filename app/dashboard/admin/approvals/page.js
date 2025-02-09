'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function AdminApprovalsPage() {
  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState('pending');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchAdmins();
  }, [status, page]);

  const fetchAdmins = async () => {
    try {
      const response = await fetch(
        `/api/auth/admin/approve?status=${status}&page=${page}`
      );
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setAdmins(data.admins);
      setPagination(data.pagination);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproval = async (adminId, approved, reason = '') => {
    try {
      const response = await fetch('/api/auth/admin/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminId,
          approved,
          reason
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      showToast(
        `Admin ${approved ? 'approved' : 'rejected'} successfully`,
        'success'
      );
      fetchAdmins();
    } catch (error) {
      showToast(error.message, 'error');
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Admin Approvals</h1>
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          options={[
            { value: 'pending', label: 'Pending Approvals' },
            { value: 'approved', label: 'Approved Admins' },
            { value: 'rejected', label: 'Rejected Admins' }
          ]}
        />
      </div>

      <div className="grid gap-6">
        {admins.map((admin) => (
          <Card key={admin._id}>
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium">{admin.name}</h3>
                  <p className="text-sm text-gray-500">{admin.email}</p>
                  <div className="mt-2">
                    <p className="text-sm">
                      <span className="font-medium">Position:</span> {admin.position}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Department:</span> {admin.department}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {status === 'pending' && (
                    <>
                      <Button
                        onClick={() => handleApproval(admin._id, true)}
                        className="text-green-700 bg-green-50 hover:bg-green-100"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => {
                          const reason = window.prompt('Please provide a reason for rejection:');
                          if (reason) {
                            handleApproval(admin._id, false, reason);
                          }
                        }}
                        className="text-red-700 bg-red-50 hover:bg-red-100"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </>
                  )}
                  {status === 'approved' && (
                    <span className="text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm font-medium">
                      Approved
                    </span>
                  )}
                  {status === 'rejected' && (
                    <div className="text-right">
                      <span className="text-red-600 bg-red-50 px-3 py-1 rounded-full text-sm font-medium">
                        Rejected
                      </span>
                      {admin.rejectionReason && (
                        <p className="text-sm text-gray-500 mt-1">
                          Reason: {admin.rejectionReason}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {admin.approvalDate && (
                <p className="text-sm text-gray-500 mt-4">
                  {status === 'approved' ? 'Approved' : 'Rejected'} on{' '}
                  {new Date(admin.approvalDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </Card>
        ))}
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center space-x-2 mt-6">
          <Button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            variant="outline"
          >
            Previous
          </Button>
          <span className="px-4 py-2 border rounded-md">
            Page {page} of {pagination.pages}
          </span>
          <Button
            onClick={() => setPage(page + 1)}
            disabled={page === pagination.pages}
            variant="outline"
          >
            Next
          </Button>
        </div>
      )}

      {admins.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            No {status} admin accounts found.
          </p>
        </div>
      )}
    </div>
  );
}