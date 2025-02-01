// lib/hooks/useRecipients.js
import { useState } from 'react';
import { useData } from './useData';
import { recipientService } from '@/lib/services/api';

export function useRecipients() {
  const { data: recipients, isLoading, error, setData: setRecipients } = useData(
    () => recipientService.getAll()
  );

  const [actionLoading, setActionLoading] = useState(false);

  const addRecipient = async (recipientData) => {
    try {
      setActionLoading(true);
      const newRecipient = await recipientService.create(recipientData);
      setRecipients(prevRecipients => [...prevRecipients, newRecipient]);
      return newRecipient;
    } catch (error) {
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  const updateRecipient = async (id, recipientData) => {
    try {
      setActionLoading(true);
      const updatedRecipient = await recipientService.update(id, recipientData);
      setRecipients(prevRecipients => 
        prevRecipients.map(recipient => 
          recipient._id === id ? updatedRecipient : recipient
        )
      );
      return updatedRecipient;
    } catch (error) {
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  const deleteRecipient = async (id) => {
    try {
      setActionLoading(true);
      await recipientService.delete(id);
      setRecipients(prevRecipients => 
        prevRecipients.filter(recipient => recipient._id !== id)
      );
    } catch (error) {
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  // Get recipient transfusion history
  const getTransfusionHistory = async (id) => {
    try {
      setActionLoading(true);
      const history = await recipientService.getTransfusionHistory(id);
      return history;
    } catch (error) {
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  return {
    recipients,
    isLoading,
    error,
    actionLoading,
    addRecipient,
    updateRecipient,
    deleteRecipient,
    getTransfusionHistory
  };
}