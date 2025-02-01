import React, { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

const bloodTypes = [
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB-' },
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O-' },
];

const status = [
  { value: 'available', label: 'Available' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'used', label: 'Used' },
  { value: 'expired', label: 'Expired' },
  { value: 'discarded', label: 'Discarded' },
];

export default function InventoryForm({ onSubmit, initialData = {} }) {
  const [formData, setFormData] = useState({
    bloodBagId: '',
    bloodType: '',
    donorId: '',
    volume: '',
    collectionDate: '',
    expiryDate: '',
    status: 'available',
    location: {
      storageUnit: '',
      shelf: '',
      position: ''
    },
    ...initialData
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.bloodBagId) newErrors.bloodBagId = 'Blood bag ID is required';
    if (!formData.bloodType) newErrors.bloodType = 'Blood type is required';
    if (!formData.volume) newErrors.volume = 'Volume is required';
    if (!formData.collectionDate) newErrors.collectionDate = 'Collection date is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      // Calculate expiry date if not provided (42 days from collection)
      if (!formData.expiryDate) {
        const collectionDate = new Date(formData.collectionDate);
        const expiryDate = new Date(collectionDate);
        expiryDate.setDate(collectionDate.getDate() + 42);
        formData.expiryDate = expiryDate.toISOString().split('T')[0];
      }
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Blood Bag ID"
          name="bloodBagId"
          value={formData.bloodBagId}
          onChange={handleChange}
          error={errors.bloodBagId}
          placeholder="Enter blood bag ID"
        />

        <Select
          label="Blood Type"
          name="bloodType"
          value={formData.bloodType}
          onChange={handleChange}
          options={bloodTypes}
          error={errors.bloodType}
        />

        <Input
          label="Volume (ml)"
          type="number"
          name="volume"
          value={formData.volume}
          onChange={handleChange}
          error={errors.volume}
          placeholder="Enter volume in ml"
        />

        <Select
          label="Status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          options={status}
        />

        <Input
          label="Collection Date"
          type="date"
          name="collectionDate"
          value={formData.collectionDate}
          onChange={handleChange}
          error={errors.collectionDate}
        />

        <Input
          label="Expiry Date"
          type="date"
          name="expiryDate"
          value={formData.expiryDate}
          onChange={handleChange}
          disabled
          placeholder="Auto-calculated (42 days)"
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Storage Location</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Input
            label="Storage Unit"
            name="location.storageUnit"
            value={formData.location.storageUnit}
            onChange={handleChange}
            placeholder="Enter storage unit"
          />

          <Input
            label="Shelf"
            name="location.shelf"
            value={formData.location.shelf}
            onChange={handleChange}
            placeholder="Enter shelf number"
          />

          <Input
            label="Position"
            name="location.position"
            value={formData.location.position}
            onChange={handleChange}
            placeholder="Enter position"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="secondary">
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          Save Inventory
        </Button>
      </div>
    </form>
  );
}