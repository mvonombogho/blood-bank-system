'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar } from 'lucide-react';

export default function ContactManagementPage() {
  const [contactData, setContactData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('history');

  // Form states
  const [newMessage, setNewMessage] = useState({
    type: 'email',
    subject: '',
    content: ''
  });
  const [preferences, setPreferences] = useState({
    preferredMethod: 'email',
    frequency: 'monthly',
    timePreference: 'morning',
    languages: ['english']
  });
  const [doNotContact, setDoNotContact] = useState({
    startDate: '',
    endDate: '',
    reason: ''
  });

  useEffect(() => {
    const fetchContactData = async () => {
      try {
        const donorId = sessionStorage.getItem('currentDonorId');
        const response = await fetch(`/api/donors/contact?donorId=${donorId}`);
        const data = await response.json();

        if (data.status === 'success') {
          setContactData(data.data);
          if (data.data.preferences) {
            setPreferences(data.data.preferences);
          }
        } else {
          throw new Error(data.message);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchContactData();
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    try {
      const donorId = sessionStorage.getItem('currentDonorId');
      const response = await fetch('/api/donors/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donorId,
          communication: newMessage
        }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        setContactData(data.data);
        setNewMessage({
          type: 'email',
          subject: '',
          content: ''
        });
        setActiveTab('history');
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const updatePreferences = async () => {
    try {
      const donorId = sessionStorage.getItem('currentDonorId');
      const response = await fetch('/api/donors/contact', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donorId,
          preferences
        }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        setContactData(data.data);
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const addDoNotContactPeriod = async () => {
    try {
      const donorId = sessionStorage.getItem('currentDonorId');
      const response = await fetch('/api/donors/contact', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donorId,
          doNotContactPeriod: doNotContact
        }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        setContactData(data.data);
        setDoNotContact({
          startDate: '',
          endDate: '',
          reason: ''
        });
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Contact Management</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="history">Communication History</TabsTrigger>
          <TabsTrigger value="new">New Message</TabsTrigger>
          <TabsTrigger value="preferences">Contact Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Communication History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contactData?.communications?.map((comm, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {new Date(comm.sentAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="capitalize">{comm.type}</TableCell>
                      <TableCell>{comm.subject}</TableCell>
                      <TableCell className="capitalize">{comm.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="new">
          <Card>
            <CardHeader>
              <CardTitle>Send New Message</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendMessage} className="space-y-4">
                <div className="space-y-2">
                  <label>Communication Type</label>
                  <Select
                    value={newMessage.type}
                    onValueChange={(value) => 
                      setNewMessage({ ...newMessage, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="push">Push Notification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label>Subject</label>
                  <Input
                    value={newMessage.subject}
                    onChange={(e) => 
                      setNewMessage({ ...newMessage, subject: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label>Message Content</label>
                  <Textarea
                    value={newMessage.content}
                    onChange={(e) => 
                      setNewMessage({ ...newMessage, content: e.target.value })
                    }
                    required
                    rows={4}
                  />
                </div>

                <Button type="submit">Send Message</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Contact Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Communication Settings</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label>Preferred Method</label>
                      <Select
                        value={preferences.preferredMethod}
                        onValueChange={(value) =>
                          setPreferences({ ...preferences, preferredMethod: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="sms">SMS</SelectItem>
                          <SelectItem value="phone">Phone</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label>Contact Frequency</label>
                      <Select
                        value={preferences.frequency}
                        onValueChange={(value) =>
                          setPreferences({ ...preferences, frequency: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label>Preferred Time</label>
                      <Select
                        value={preferences.timePreference}
                        onValueChange={(value) =>
                          setPreferences({ ...preferences, timePreference: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="morning">Morning</SelectItem>
                          <SelectItem value="afternoon">Afternoon</SelectItem>
                          <SelectItem value="evening">Evening</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label>Preferred Language</label>
                      <Select
                        value={preferences.languages[0]}
                        onValueChange={(value) =>
                          setPreferences({ ...preferences, languages: [value] })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="english">English</SelectItem>
                          <SelectItem value="swahili">Swahili</SelectItem>
                          <SelectItem value="french">French</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button onClick={updatePreferences}>
                    Update Preferences
                  </Button>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Do Not Contact Period</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label>Start Date</label>
                      <Input
                        type="date"
                        value={doNotContact.startDate}
                        onChange={(e) =>
                          setDoNotContact({ ...doNotContact, startDate: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label>End Date</label>
                      <Input
                        type="date"
                        value={doNotContact.endDate}
                        onChange={(e) =>
                          setDoNotContact({ ...doNotContact, endDate: e.target.value })
                        }
                      />
                    </div>

                    <div className="col-span-2 space-y-2">
                      <label>Reason</label>
                      <Input
                        value={doNotContact.reason}
                        onChange={(e) =>
                          setDoNotContact({ ...doNotContact, reason: e.target.value })
                        }
                        placeholder="Reason for do not contact period"
                      />
                    </div>
                  </div>

                  <Button onClick={addDoNotContactPeriod}>
                    Add Do Not Contact Period
                  </Button>
                </div>

                {contactData?.doNotContactPeriods?.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-medium">Active Do Not Contact Periods</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Start Date</TableHead>
                          <TableHead>End Date</TableHead>
                          <TableHead>Reason</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contactData.doNotContactPeriods.map((period, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              {new Date(period.startDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {new Date(period.endDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell>{period.reason}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}