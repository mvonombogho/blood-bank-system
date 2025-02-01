import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Users,
  Droplet,
  UserPlus,
  BarChart2,
  Settings,
  HeartPulse
} from 'lucide-react';

const Sidebar = () => {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Dashboard', icon: Home, path: '/dashboard' },
    { name: 'Donors', icon: Users, path: '/dashboard/donors' },
    { name: 'Blood Inventory', icon: Droplet, path: '/dashboard/inventory' },
    { name: 'Recipients', icon: UserPlus, path: '/dashboard/recipients' },
    { name: 'Reports', icon: BarChart2, path: '/dashboard/reports' },
    { name: 'Blood Requests', icon: HeartPulse, path: '/dashboard/requests' },
    { name: 'Settings', icon: Settings, path: '/dashboard/settings' },
  ];

  return (
    <aside className="bg-white border-r border-gray-200 w-64 min-h-screen">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-center h-16 border-b border-gray-200">
          <HeartPulse className="h-8 w-8 text-red-500" />
          <span className="ml-2 text-xl font-bold">BloodBank</span>
        </div>
        
        <nav className="flex-1 overflow-y-auto">
          <ul className="p-4 space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.path;
              const Icon = item.icon;
              
              return (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-red-50 text-red-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;