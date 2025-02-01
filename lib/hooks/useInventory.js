// lib/hooks/useInventory.js
import { useState } from 'react';
import { useData } from './useData';
import { inventoryService } from '@/lib/services/api';

export function useInventory() {
  const { data: inventory, isLoading, error, setData: setInventory } = useData(
    () => inventoryService.getAll()
  );

  const [actionLoading, setActionLoading] = useState(false);

  const addInventoryItem = async (itemData) => {
    try {
      setActionLoading(true);
      const newItem = await inventoryService.create(itemData);
      setInventory(prevItems => [...prevItems, newItem]);
      return newItem;
    } catch (error) {
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  const updateInventoryItem = async (id, itemData) => {
    try {
      setActionLoading(true);
      const updatedItem = await inventoryService.update(id, itemData);
      setInventory(prevItems => 
        prevItems.map(item => 
          item._id === id ? updatedItem : item
        )
      );
      return updatedItem;
    } catch (error) {
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  const deleteInventoryItem = async (id) => {
    try {
      setActionLoading(true);
      await inventoryService.delete(id);
      setInventory(prevItems => 
        prevItems.filter(item => item._id !== id)
      );
    } catch (error) {
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  const checkAvailability = async (bloodType) => {
    try {
      setActionLoading(true);
      const availability = await inventoryService.checkAvailability(bloodType);
      return availability;
    } catch (error) {
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  return {
    inventory,
    isLoading,
    error,
    actionLoading,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    checkAvailability
  };
}