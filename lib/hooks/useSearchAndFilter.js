// lib/hooks/useSearchAndFilter.js
import { useState, useCallback, useMemo } from 'react';

export function useSearchAndFilter(items, config) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState(config.defaultSort || '');
  const [sortDirection, setSortDirection] = useState('asc');

  // Reset all filters
  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setFilters({});
    setSortBy(config.defaultSort || '');
    setSortDirection('asc');
  }, [config.defaultSort]);

  // Update a single filter
  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // Toggle sort direction
  const toggleSort = useCallback((key) => {
    if (sortBy === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortDirection('asc');
    }
  }, [sortBy]);

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    if (!items) return [];

    let result = [...items];

    // Apply search
    if (searchQuery) {
      result = result.filter(item => 
        config.searchFields.some(field => {
          const value = field.split('.').reduce((obj, key) => obj?.[key], item);
          return value?.toString().toLowerCase().includes(searchQuery.toLowerCase());
        })
      );
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        result = result.filter(item => {
          const itemValue = key.split('.').reduce((obj, k) => obj?.[k], item);
          return itemValue === value;
        });
      }
    });

    // Apply sort
    if (sortBy) {
      result.sort((a, b) => {
        const aValue = sortBy.split('.').reduce((obj, key) => obj?.[key], a);
        const bValue = sortBy.split('.').reduce((obj, key) => obj?.[key], b);

        if (typeof aValue === 'string') {
          return sortDirection === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        return sortDirection === 'asc' 
          ? aValue - bValue
          : bValue - aValue;
      });
    }

    return result;
  }, [items, searchQuery, filters, sortBy, sortDirection, config.searchFields]);

  return {
    searchQuery,
    setSearchQuery,
    filters,
    updateFilter,
    resetFilters,
    sortBy,
    sortDirection,
    toggleSort,
    filteredItems: filteredAndSortedItems
  };
}