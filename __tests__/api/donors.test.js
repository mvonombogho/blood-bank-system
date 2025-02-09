import mongoose from 'mongoose';
import { createMocks } from 'node-mocks-http';
import { GET, POST, PUT, DELETE } from '@/app/api/donors/[id]/route';
import Donor from '@/lib/db/models/donor';

describe('Donor API', () => {
  // Test data
  const mockDonor = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '1234567890',
    bloodType: 'A+',
    address: {
      street: '123 Main St',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345'
    }
  };

  describe('GET /api/donors/[id]', () => {
    it('should get a donor by ID', async () => {
      // Create a test donor
      const donor = await Donor.create(mockDonor);
      
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          id: donor._id.toString()
        }
      });

      await GET(req, { params: { id: donor._id.toString() } });

      expect(res._getStatusCode()).toBe(200);
      const jsonData = JSON.parse(res._getData());
      expect(jsonData.email).toBe(mockDonor.email);
    });

    it('should return 404 for non-existent donor', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          id: new mongoose.Types.ObjectId().toString()
        }
      });

      await GET(req, { params: { id: new mongoose.Types.ObjectId().toString() } });

      expect(res._getStatusCode()).toBe(404);
    });
  });

  describe('POST /api/donors', () => {
    it('should create a new donor', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: mockDonor
      });

      await POST(req);

      expect(res._getStatusCode()).toBe(201);
      const jsonData = JSON.parse(res._getData());
      expect(jsonData.email).toBe(mockDonor.email);
    });

    it('should validate required fields', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          firstName: 'John'
          // Missing required fields
        }
      });

      await POST(req);

      expect(res._getStatusCode()).toBe(400);
    });

    it('should prevent duplicate emails', async () => {
      // Create first donor
      await Donor.create(mockDonor);

      // Try to create another donor with same email
      const { req, res } = createMocks({
        method: 'POST',
        body: mockDonor
      });

      await POST(req);

      expect(res._getStatusCode()).toBe(400);
    });
  });

  describe('PUT /api/donors/[id]', () => {
    it('should update a donor', async () => {
      const donor = await Donor.create(mockDonor);
      const updateData = {
        ...mockDonor,
        firstName: 'Jane'
      };

      const { req, res } = createMocks({
        method: 'PUT',
        query: {
          id: donor._id.toString()
        },
        body: updateData
      });

      await PUT(req, { params: { id: donor._id.toString() } });

      expect(res._getStatusCode()).toBe(200);
      const jsonData = JSON.parse(res._getData());
      expect(jsonData.firstName).toBe('Jane');
    });
  });

  describe('DELETE /api/donors/[id]', () => {
    it('should delete a donor', async () => {
      const donor = await Donor.create(mockDonor);

      const { req, res } = createMocks({
        method: 'DELETE',
        query: {
          id: donor._id.toString()
        }
      });

      await DELETE(req, { params: { id: donor._id.toString() } });

      expect(res._getStatusCode()).toBe(200);
      
      // Verify donor is deleted
      const deletedDonor = await Donor.findById(donor._id);
      expect(deletedDonor).toBeNull();
    });
  });
});