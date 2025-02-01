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

export default function RecipientForm({ onSubmit, initialData = {} }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bloodType: '',
    hospital: {
      name: '',
      address: '',
      doctorName: '',
      doctorPhone: ''
    },
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    },
    medicalHistory: {
      diagnosis: '',
      allergies: ''
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
    if (!formData.phone) newErrors.phone = 'Phone number is required';
    if (!formData.bloodType) newErrors.bloodType = 'Blood type is required';
    if (!formData.hospital.name) newErrors['hospital.name'] = 'Hospital name is required';
    if (!formData.hospital.doctorName) newErrors['hospital.doctorName'] = 'Doctor name is required';

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
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Personal Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Personal Information</h3>
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
      </div>

      {/* Hospital Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Hospital Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Hospital Name"
            name="hospital.name"
            value={formData.hospital.name}
            onChange={handleChange}
            error={errors['hospital.name']}
            placeholder="Enter hospital name"
          />

          <Input
            label="Hospital Address"
            name="hospital.address"
            value={formData.hospital.address}
            onChange={handleChange}
            placeholder="Enter hospital address"
          />

          <Input
            label="Doctor Name"
            name="hospital.doctorName"
            value={formData.hospital.doctorName}
            onChange={handleChange}
            error={errors['hospital.doctorName']}
            placeholder="Enter doctor's name"
          />

          <Input
            label="Doctor Phone"
            name="hospital.doctorPhone"
            value={formData.hospital.doctorPhone}
            onChange={handleChange}
            placeholder="Enter doctor's phone"
          />
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Emergency Contact</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Contact Name"
            name="emergencyContact.name"
            value={formData.emergencyContact.name}
            onChange={handleChange}
            placeholder="Enter emergency contact name"
          />

          <Input
            label="Relationship"
            name="emergencyContact.relationship"
            value={formData.emergencyContact.relationship}
            onChange={handleChange}
            placeholder="Enter relationship"
          />

          <Input
            label="Contact Phone"
            name="emergencyContact.phone"
            value={formData.emergencyContact.phone}
            onChange={handleChange}
            placeholder="Enter emergency contact phone"
          />
        </div>
      </div>

      {/* Medical History */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Medical History</h3>
        <div className="grid grid-cols-1 gap-6">
          <Input
            label="Diagnosis"
            name="medicalHistory.diagnosis"
            value={formData.medicalHistory.diagnosis}
            onChange={handleChange}
            placeholder="Enter diagnosis"
          />

          <Input
            label="Allergies"
            name="medicalHistory.allergies"
            value={formData.medicalHistory.allergies}
            onChange={handleChange}
            placeholder="Enter allergies (comma separated)"
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="secondary">
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          Save Recipient
        </Button>
      </div>
    </form>
  );
}