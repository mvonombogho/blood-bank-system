// lib/hooks/useData.js
import { useState, useEffect } from 'react';

export function useData(fetchFunction, dependencies = []) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const result = await fetchFunction();
        setData(result);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, dependencies);

  return { data, isLoading, error, setData };
}

// Example specific hooks
export function useDonors() {
  const { data: donors, isLoading, error, setData: setDonors } = useData(
    () => donorService.getAll()
  );

  const addDonor = async (donorData) => {
    try {
      const newDonor = await donorService.create(donorData);
      setDonors(prevDonors => [...prevDonors, newDonor]);
      return newDonor;
    } catch (error) {
      throw error;
    }
  };

  const updateDonor = async (id, donorData) => {
    try {
      const updatedDonor = await donorService.update(id, donorData);
      setDonors(prevDonors => 
        prevDonors.map(donor => 
          donor._id === id ? updatedDonor : donor
        )
      );
      return updatedDonor;
    } catch (error) {
      throw error;
    }
  };

  const deleteDonor = async (id) => {
    try {
      await donorService.delete(id);
      setDonors(prevDonors => 
        prevDonors.filter(donor => donor._id !== id)
      );
    } catch (error) {
      throw error;
    }
  };

  return {
    donors,
    isLoading,
    error,
    addDonor,
    updateDonor,
    deleteDonor
  };
}