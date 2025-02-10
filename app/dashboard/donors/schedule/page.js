'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar as CalendarIcon, Clock, User, Download, Edit, X } from 'lucide-react';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

export default function DonorSchedulePage() {
  const [schedules, setSchedules] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSchedules();
  }, [selectedDate]);

  const fetchSchedules = async () => {
    try {
      const start = startOfMonth(selectedDate);
      const end = endOfMonth(selectedDate);
      
      const params = new URLSearchParams({
        startDate: start.toISOString(),
        endDate: end.toISOString()
      });

      const response = await fetch(`/api/donors/schedule?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setSchedules(data.data.schedules);
        setAvailableSlots(data.data.availableSlots);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch schedules');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleConfirm = async () => {
    if (!selectedDonor || !selectedSlot) return;

    try {
      const response = await fetch('/api/donors/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donorId: selectedDonor._id,
          scheduledDate: selectedDate,
          timeSlot: selectedSlot
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchSchedules();
        setShowConfirmDialog(false);
        setSelectedDonor(null);
        setSelectedSlot(null);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to schedule appointment');
    }
  };

  const handleReschedule = async (scheduleId, newSlot) => {
    try {
      const response = await fetch(`/api/donors/schedule/${scheduleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeSlot: newSlot,
          scheduledDate: selectedDate
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchSchedules();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to reschedule appointment');
    }
  };

  const exportCalendar = () => {
    const events = schedules.map(schedule => ({
      title: `Blood Donation - ${schedule.donorId.name}`,
      start: new Date(schedule.scheduledDate),
      description: `Blood Type: ${schedule.donorId.bloodType}`,
    }));

    const icsContent = generateICSFile(events);
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'donation-schedule.ics');
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const generateICSFile = (events) => {
    const formatDate = (date) => format(date, "yyyyMMdd'T'HHmmss");
    
    const icsEvents = events.map(event => `
BEGIN:VEVENT
DTSTART:${formatDate(event.start)}
SUMMARY:${event.title}
DESCRIPTION:${event.description}
END:VEVENT`).join('\n');

    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Blood Bank//Donation Schedule//EN
${icsEvents}
END:VCALENDAR`;
  };

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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Donor Scheduling</h1>
        <button
          onClick={exportCalendar}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
        >
          <Download className="w-4 h-4" />
          Export Calendar
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Calendar Component */}
        <Card>
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <button
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  onClick={() => setSelectedDate(new Date(selectedDate.setMonth(selectedDate.getMonth() - 1)))}
                >
                  Previous
                </button>
                <h3 className="text-lg font-semibold">
                  {format(selectedDate, 'MMMM yyyy')}
                </h3>
                <button
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  onClick={() => setSelectedDate(new Date(selectedDate.setMonth(selectedDate.getMonth() + 1)))}
                >
                  Next
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                    {day}
                  </div>
                ))}
                {eachDayOfInterval({
                  start: startOfMonth(selectedDate),
                  end: endOfMonth(selectedDate)
                }).map((day, index) => {
                  const isToday = isSameDay(day, new Date());
                  const isSelected = isSameDay(day, selectedDate);
                  const hasSchedules = schedules.some(s => isSameDay(new Date(s.scheduledDate), day));
                  
                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedDate(day)}
                      className={`
                        p-2 text-center rounded-lg
                        ${isToday ? 'bg-blue-100' : ''}
                        ${isSelected ? 'bg-blue-500 text-white' : ''}
                        ${hasSchedules ? 'font-bold' : ''}
                      `}
                    >
                      {format(day, 'd')}
                      {hasSchedules && (
                        <div className="w-1 h-1 mx-auto mt-1 rounded-full bg-blue-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Time Slots */}
        <Card>
          <CardHeader>
            <CardTitle>Available Time Slots</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {availableSlots
                .filter(slot => isSameDay(new Date(slot.date), selectedDate))
                .map((slot, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedSlot(slot.timeSlot);
                      setShowConfirmDialog(true);
                    }}
                    className={`
                      w-full p-4 text-left border rounded-lg
                      ${selectedSlot === slot.timeSlot ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-gray-500" />
                        <span className="font-medium">{slot.timeSlot}</span>
                      </div>
                      <span className="text-sm text-gray-500">Available</span>
                    </div>
                  </button>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scheduled Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {schedules
              .filter(schedule => isSameDay(new Date(schedule.scheduledDate), selectedDate))
              .map((schedule) => (
                <div
                  key={schedule._id}
                  className="p-4 border rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="font-medium">{schedule.donorId.name}</p>
                        <p className="text-sm text-gray-500">
                          Blood Type: {schedule.donorId.bloodType}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{schedule.timeSlot}</p>
                      <Dialog>
                        <DialogTrigger>
                          <Edit className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Reschedule Appointment</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            {availableSlots
                              .filter(slot => isSameDay(new Date(slot.date), selectedDate))
                              .map((slot, index) => (
                                <button
                                  key={index}
                                  onClick={() => handleReschedule(schedule._id, slot.timeSlot)}
                                  className="w-full p-4 text-left border rounded-lg hover:bg-gray-50"
                                >
                                  {slot.timeSlot}
                                </button>
                              ))}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Scheduling Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Appointment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p>Selected Date: {format(selectedDate, 'MMMM d, yyyy')}</p>
            <p>Selected Time: {selectedSlot}</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleScheduleConfirm}
                className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600"
              >
                Confirm
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}