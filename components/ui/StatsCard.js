import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

const StatsCard = ({ title, value, change, icon: Icon, color = 'red' }) => {
  const isPositive = change >= 0;
  const colorClasses = {
    red: 'text-red-600 bg-red-50',
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    yellow: 'text-yellow-600 bg-yellow-50'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {Icon && (
            <div className={`p-3 rounded-full ${colorClasses[color]}`}>
              <Icon className="h-6 w-6" />
            </div>
          )}
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <h3 className="text-2xl font-semibold text-gray-900">{value}</h3>
          </div>
        </div>
        {typeof change !== 'undefined' && (
          <div className={`flex items-center ${
            isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {isPositive ? (
              <ArrowUp className="h-4 w-4" />
            ) : (
              <ArrowDown className="h-4 w-4" />
            )}
            <span className="ml-1 text-sm font-medium">
              {Math.abs(change)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;