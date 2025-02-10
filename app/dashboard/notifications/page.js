'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bell, AlertTriangle, Clock, UserCheck } from 'lucide-react';

export default function NotificationsDashboard() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/notifications');
        const data = await response.json();
        
        if (data.success) {
          setNotifications(data.data);
        } else {
          setError(data.error);
        }
      } catch (err) {
        setError('Failed to fetch notifications');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
    // Set up polling every minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'low_inventory':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'expiring_units':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'donor_eligible':
        return <UserCheck className="h-5 w-5 text-green-500" />;
      default:
        return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 border-red-200';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200';
      case 'low':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <div className="flex items-center space-x-2">
          <Bell className="h-5 w-5" />
          <span className="text-sm font-medium">{notifications.length} Notifications</span>
        </div>
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              No notifications at this time
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification, index) => (
            <Card 
              key={index}
              className={`border ${getSeverityColor(notification.severity)}`}
            >
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {notification.message}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(notification.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filter Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Low Inventory Alerts</h3>
                <p className="text-sm text-gray-500">
                  Get notified when blood inventory is running low
                </p>
              </div>
              <input type="checkbox" defaultChecked className="toggle" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Expiring Units Alerts</h3>
                <p className="text-sm text-gray-500">
                  Get notified about blood units nearing expiration
                </p>
              </div>
              <input type="checkbox" defaultChecked className="toggle" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Donor Eligibility Reminders</h3>
                <p className="text-sm text-gray-500">
                  Get notified when donors become eligible for donation
                </p>
              </div>
              <input type="checkbox" defaultChecked className="toggle" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}