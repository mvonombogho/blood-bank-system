import React from 'react';
import { Bell, Settings, User } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex justify-between items-center px-6 py-4">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-gray-800">Blood Bank System</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <Bell className="h-5 w-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <Settings className="h-5 w-5 text-gray-600" />
          </button>
          <button className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-full">
            <User className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;