import mongoose from 'mongoose';
import { createMocks } from 'node-mocks-http';
import { POST as registerAdmin } from '@/app/api/auth/admin/register/route';
import { POST as approveAdmin, GET as getAdminApprovals } from '@/app/api/auth/admin/approve/route';
import User from '@/lib/db/models/user';

describe('Admin API', () => {
  let superAdmin;
  const adminCode = process.env.ADMIN_REGISTRATION_CODE || 'test-admin-code';

  const mockAdminData = {
    name: 'Test Admin',
    email: 'testadmin@example.com',
    password: 'password123',
    adminCode,
    phoneNumber: '1234567890',
    position: 'Manager',
    department: 'Blood Bank'
  };

  beforeAll(async () => {
    // Create a super admin user for testing
    superAdmin = await User.create({
      name: 'Super Admin',
      email: 'superadmin@example.com',
      password: 'password123',
      role: 'super_admin',
      isActive: true
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
  });

  describe('Admin Registration', () => {
    it('should register a new admin successfully', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: mockAdminData
      });

      await registerAdmin(req);

      expect(res._getStatusCode()).toBe(201);
      const data = JSON.parse(res._getData());
      expect(data.user.role).toBe('admin');
      expect(data.user.isActive).toBe(false);
    });

    it('should validate admin code', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          ...mockAdminData,
          adminCode: 'wrong-code'
        }
      });

      await registerAdmin(req);

      expect(res._getStatusCode()).toBe(403);
      const data = JSON.parse(res._getData());
      expect(data.error).toContain('Invalid admin registration code');
    });

    it('should require all mandatory fields', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          name: 'Test Admin',
          email: 'test@example.com'
          // Missing other required fields
        }
      });

      await registerAdmin(req);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.error).toContain('required');
    });
  });

  describe('Admin Approval', () => {
    let adminUser;

    beforeEach(async () => {
      // Create a pending admin user
      adminUser = await User.create({
        ...mockAdminData,
        password: 'hashedpassword',
        role: 'admin',
        isActive: false
      });
    });

    it('should allow super admin to approve admin', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          adminId: adminUser._id.toString(),
          approved: true
        }
      });

      // Mock session
      req.session = {
        user: {
          email: superAdmin.email
        }
      };

      await approveAdmin(req);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.admin.isActive).toBe(true);

      // Verify in database
      const updatedAdmin = await User.findById(adminUser._id);
      expect(updatedAdmin.isActive).toBe(true);
    });

    it('should allow super admin to reject admin with reason', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          adminId: adminUser._id.toString(),
          approved: false,
          reason: 'Invalid credentials'
        }
      });

      req.session = {
        user: {
          email: superAdmin.email
        }
      };

      await approveAdmin(req);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.admin.isActive).toBe(false);

      // Verify rejection reason in database
      const updatedAdmin = await User.findById(adminUser._id);
      expect(updatedAdmin.rejectionReason).toBe('Invalid credentials');
    });

    it('should prevent non-super admin from approving', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          adminId: adminUser._id.toString(),
          approved: true
        }
      });

      req.session = {
        user: {
          email: 'regular@user.com'
        }
      };

      await approveAdmin(req);

      expect(res._getStatusCode()).toBe(403);
    });
  });

  describe('Admin Approvals List', () => {
    beforeAll(async () => {
      // Create multiple admin users with different statuses
      await User.create([
        {
          ...mockAdminData,
          email: 'pending1@example.com',
          role: 'admin',
          isActive: false
        },
        {
          ...mockAdminData,
          email: 'pending2@example.com',
          role: 'admin',
          isActive: false
        },
        {
          ...mockAdminData,
          email: 'approved@example.com',
          role: 'admin',
          isActive: true,
          approvalDate: new Date()
        }
      ]);
    });

    it('should list pending admin approvals', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          status: 'pending'
        }
      });

      req.session = {
        user: {
          email: superAdmin.email
        }
      };

      await getAdminApprovals(req);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.admins.length).toBe(2);
      expect(data.admins[0].isActive).toBe(false);
    });

    it('should paginate results', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          page: '1',
          limit: '2'
        }
      });

      req.session = {
        user: {
          email: superAdmin.email
        }
      };

      await getAdminApprovals(req);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.pagination).toBeDefined();
      expect(data.pagination.page).toBe(1);
      expect(data.admins.length).toBeLessThanOrEqual(2);
    });
  });
});