import mongoose from 'mongoose';
import { createMocks } from 'node-mocks-http';
import { GET, POST, PUT } from '@/app/api/donors/[id]/donations/route';
import Donor from '@/lib/db/models/donor';

describe('Donations API', () => {
  let testDonor;
  
  // Test data
  const mockDonor = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '1234567890',
    bloodType: 'A+',
    donationHistory: []
  };

  const mockDonation = {
    donationDate: new Date('2024-01-01'),
    units: 1,
    bloodBank: 'Test Blood Bank',
    notes: 'Test donation'
  };

  beforeEach(async () => {
    testDonor = await Donor.create(mockDonor);
  });

  describe('GET /api/donors/[id]/donations', () => {
    it('should get donation history', async () => {
      // Add some donations
      await Donor.findByIdAndUpdate(testDonor._id, {
        $push: { donationHistory: mockDonation }
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          id: testDonor._id.toString()
        }
      });

      await GET(req, { params: { id: testDonor._id.toString() } });

      expect(res._getStatusCode()).toBe(200);
      const jsonData = JSON.parse(res._getData());
      expect(jsonData.donationHistory).toHaveLength(1);
    });

    it('should filter donations by date range', async () => {
      // Add donations with different dates
      const donations = [
        { ...mockDonation, donationDate: new Date('2024-01-01') },
        { ...mockDonation, donationDate: new Date('2024-02-01') },
        { ...mockDonation, donationDate: new Date('2024-03-01') }
      ];

      await Donor.findByIdAndUpdate(testDonor._id, {
        $push: { donationHistory: { $each: donations } }
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          id: testDonor._id.toString(),
          startDate: '2024-01-15',
          endDate: '2024-02-15'
        }
      });

      await GET(req, { params: { id: testDonor._id.toString() } });

      expect(res._getStatusCode()).toBe(200);
      const jsonData = JSON.parse(res._getData());
      expect(jsonData.donationHistory).toHaveLength(1);
      expect(new Date(jsonData.donationHistory[0].donationDate).getMonth()).toBe(1); // February
    });

    it('should filter donations by minimum units', async () => {
      const donations = [
        { ...mockDonation, units: 1 },
        { ...mockDonation, units: 2 },
        { ...mockDonation, units: 3 }
      ];

      await Donor.findByIdAndUpdate(testDonor._id, {
        $push: { donationHistory: { $each: donations } }
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          id: testDonor._id.toString(),
          minUnits: '2'
        }
      });

      await GET(req, { params: { id: testDonor._id.toString() } });

      expect(res._getStatusCode()).toBe(200);
      const jsonData = JSON.parse(res._getData());
      expect(jsonData.donationHistory).toHaveLength(2);
      expect(Math.min(...jsonData.donationHistory.map(d => d.units))).toBeGreaterThanOrEqual(2);
    });
  });

  describe('POST /api/donors/[id]/donations', () => {
    it('should add new donation', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        query: {
          id: testDonor._id.toString()
        },
        body: mockDonation
      });

      await POST(req, { params: { id: testDonor._id.toString() } });

      expect(res._getStatusCode()).toBe(200);
      const updatedDonor = await Donor.findById(testDonor._id);
      expect(updatedDonor.donationHistory).toHaveLength(1);
      expect(updatedDonor.lastDonation).toEqual(mockDonation.donationDate);
    });

    it('should validate donation date', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        query: {
          id: testDonor._id.toString()
        },
        body: {
          ...mockDonation,
          donationDate: new Date(Date.now() + 86400000) // Future date
        }
      });

      await POST(req, { params: { id: testDonor._id.toString() } });

      expect(res._getStatusCode()).toBe(400);
      const jsonData = JSON.parse(res._getData());
      expect(jsonData.errors).toContain('Donation date cannot be in the future');
    });

    it('should enforce minimum donation interval', async () => {
      // Add recent donation
      await Donor.findByIdAndUpdate(testDonor._id, {
        $push: { donationHistory: mockDonation },
        lastDonation: mockDonation.donationDate
      });

      const { req, res } = createMocks({
        method: 'POST',
        query: {
          id: testDonor._id.toString()
        },
        body: {
          ...mockDonation,
          donationDate: new Date('2024-01-15') // Only 14 days after last donation
        }
      });

      await POST(req, { params: { id: testDonor._id.toString() } });

      expect(res._getStatusCode()).toBe(400);
      const jsonData = JSON.parse(res._getData());
      expect(jsonData.error).toContain('Donor must wait 56 days between donations');
    });
  });

  describe('PUT /api/donors/[id]/donations', () => {
    it('should update existing donation', async () => {
      // Add a donation first
      const donor = await Donor.findByIdAndUpdate(
        testDonor._id,
        { $push: { donationHistory: mockDonation } },
        { new: true }
      );

      const donationId = donor.donationHistory[0]._id;
      const updateData = {
        donationId,
        units: 2,
        notes: 'Updated notes'
      };

      const { req, res } = createMocks({
        method: 'PUT',
        query: {
          id: testDonor._id.toString()
        },
        body: updateData
      });

      await PUT(req, { params: { id: testDonor._id.toString() } });

      expect(res._getStatusCode()).toBe(200);
      const updatedDonor = await Donor.findById(testDonor._id);
      expect(updatedDonor.donationHistory[0].units).toBe(2);
      expect(updatedDonor.donationHistory[0].notes).toBe('Updated notes');
    });

    it('should return 404 for non-existent donation', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
        query: {
          id: testDonor._id.toString()
        },
        body: {
          donationId: new mongoose.Types.ObjectId(),
          units: 2
        }
      });

      await PUT(req, { params: { id: testDonor._id.toString() } });

      expect(res._getStatusCode()).toBe(404);
    });
  });
});