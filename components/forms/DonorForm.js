'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader2 } from 'lucide-react';

const BLOOD_TYPES = [
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB-' },
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O-' }
];

const initialValues = {
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
  medicalHistory: {
    conditions: '',
    medications: '',
    lastDonation: ''
  }
};

export default function DonorForm({ initialData, onSubmit }) {
  const [values, setValues] = useState(initialData || initialValues);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!values.firstName) newErrors.firstName = 'First name is required';
    if (!values.lastName) newErrors.lastName = 'Last name is required';
    if (!values.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(values.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!values.phone) newErrors.phone = 'Phone number is required';
    if (!values.bloodType) newErrors.bloodType = 'Blood type is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setValues(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setValues(prev => ({
        ...prev,
        [name]: value
      }));
    }
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      await onSubmit(values);
      if (!initialData) {
        setValues(initialValues); // Reset form if it's a new donor
      }
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setValues(initialData || initialValues);
    setErrors({});
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-medium mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="First Name"
              name="firstName"
              value={values.firstName}
              onChange={handleChange}
              error={errors.firstName}
              disabled={isSubmitting}
            />

            <Input
              label="Last Name"
              name="lastName"
              value={values.lastName}
              onChange={handleChange}
              error={errors.lastName}
              disabled={isSubmitting}
            />

            <Input
              label="Email"
              type="email"
              name="email"
              value={values.email}
              onChange={handleChange}
              error={errors.email}
              disabled={isSubmitting}
            />

            <Input
              label="Phone"
              name="phone"
              value={values.phone}
              onChange={handleChange}
              error={errors.phone}
              disabled={isSubmitting}
            />

            <Select
              label="Blood Type"
              name="bloodType"
              value={values.bloodType}
              onChange={handleChange}
              options={BLOOD_TYPES}
              error={errors.bloodType}
              disabled={isSubmitting}
            />
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <h3 className="text-lg font-medium mb-4">Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Street Address"
              name="address.street"
              value={values.address.street}
              onChange={handleChange}
              disabled={isSubmitting}
            />

            <Input
              label="City"
              name="address.city"
              value={values.address.city}
              onChange={handleChange}
              disabled={isSubmitting}
            />

            <Input
              label="State"
              name="address.state"
              value={values.address.state}
              onChange={handleChange}
              disabled={isSubmitting}
            />

            <Input
              label="ZIP Code"
              name="address.zipCode"
              value={values.address.zipCode}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <h3 className="text-lg font-medium mb-4">Medical History</h3>
          <div className="grid grid-cols-1 gap-6">
            <Input
              label="Medical Conditions"
              name="medicalHistory.conditions"
              value={values.medicalHistory.conditions}
              onChange={handleChange}
              placeholder="List any medical conditions"
              disabled={isSubmitting}
            />

            <Input
              label="Current Medications"
              name="medicalHistory.medications"
              value={values.medicalHistory.medications}
              onChange={handleChange}
              placeholder="List any current medications"
              disabled={isSubmitting}
            />

            <Input
              label="Last Donation Date"
              type="date"
              name="medicalHistory.lastDonation"
              value={values.medicalHistory.lastDonation}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>
        </div>
      </Card>

      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="secondary"
          onClick={resetForm}
          disabled={isSubmitting}
        >
          Reset
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin h-4 w-4 mr-2" />
              Saving...
            </>
          ) : (
            'Save Donor'
          )}
        </Button>
      </div>
    </form>
  );
}