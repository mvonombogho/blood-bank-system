// components/ui/SearchAndFilter.js
import React from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from './Input';
import { Button } from './Button';

export function SearchBar({ 
  value, 
  onChange, 
  placeholder = 'Search...',
  className = '' 
}) {
  return (
    <div className={`relative flex-1 ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 w-full"
      />
    </div>
  );
}

export function FilterSelect({ 
  options, 
  value, 
  onChange, 
  label = 'Filter by', 
  className = '' 
}) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {label && <span className="text-sm text-gray-500">{label}:</span>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function DateRangeFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  className = ''
}) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Input
        type="date"
        value={startDate}
        onChange={(e) => onStartDateChange(e.target.value)}
        className="w-auto"
      />
      <span className="text-gray-500">to</span>
      <Input
        type="date"
        value={endDate}
        onChange={(e) => onEndDateChange(e.target.value)}
        className="w-auto"
      />
    </div>
  );
}

export function FilterPanel({ 
  children, 
  onReset,
  className = '' 
}) {
  return (
    <div className={`bg-gray-50 p-4 rounded-lg space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 flex items-center">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </h3>
        <Button variant="outline" size="sm" onClick={onReset}>
          Reset
        </Button>
      </div>
      <div className="flex flex-wrap gap-4">
        {children}
      </div>
    </div>
  );
}