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

export default function DonorForm({ onSubmit, initialData = {} }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bloodType: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
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
    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.phone) newErrors.phone = 'Phone number is required';
    if (!formData.bloodType) newErrors.bloodType = 'Blood type is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="First Name"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          error={errors.firstName}
          placeholder="Enter first name"
        />

        <Input
          label="Last Name"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          error={errors.lastName}
          placeholder="Enter last name"
        />

        <Input
          label="Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          placeholder="Enter email address"
        />

        <Input
          label="Phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          error={errors.phone}
          placeholder="Enter phone number"
        />

        <Select
          label="Blood Type"
          name="bloodType"
          value={formData.bloodType}
          onChange={handleChange}
          options={bloodTypes}
          error={errors.bloodType}
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Street Address"
            name="address.street"
            value={formData.address.street}
            onChange={handleChange}
            placeholder="Enter street address"
          />

          <Input
            label="City"
            name="address.city"
            value={formData.address.city}
            onChange={handleChange}
            placeholder="Enter city"
          />

          <Input
            label="State"
            name="address.state"
            value={formData.address.state}
            onChange={handleChange}
            placeholder="Enter state"
          />

          <Input
            label="ZIP Code"
            name="address.zipCode"
            value={formData.address.zipCode}
            onChange={handleChange}
            placeholder="Enter ZIP code"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="secondary">
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          Save Donor
        </Button>
      </div>
    </form>
  );
}