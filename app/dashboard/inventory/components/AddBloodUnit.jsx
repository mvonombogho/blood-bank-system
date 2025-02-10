'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage 
} from '@/components/ui/form';
import { useToast } from '@/components/ui/use-toast';
import { useForm } from 'react-hook-form';

export default function AddBloodUnit() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const form = useForm({
    defaultValues: {
      donorId: '',
      bloodType: '',
      volume: 450, // Standard blood donation volume
      collectedBy: '',
      location: {
        facility: '',
        refrigerator: '',
        shelf: '',
        position: ''
      }
    }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await fetch('/api/inventory/blood-units', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          collectionDate: new Date(),
          status: 'quarantine'
        }),
      });

      const result = await response.json();

      if (result.status === 'success') {
        toast({
          title: "Success",
          description: "Blood unit added successfully"
        });
        form.reset();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to add blood unit"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Blood Unit</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Donor Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Donor Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="donorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Donor ID*</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter donor ID" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bloodType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Blood Type*</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select blood type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="volume"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Volume (ml)*</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          min="200" 
                          max="500"
                        />
                      </FormControl>
                      <FormDescription>
                        Standard donation is 450ml
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="collectedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Collected By*</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Staff name/ID" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Storage Location */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Storage Location</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="location.facility"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Facility*</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select facility" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="main">Main Blood Bank</SelectItem>
                          <SelectItem value="branch1">Branch 1</SelectItem>
                          <SelectItem value="branch2">Branch 2</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location.refrigerator"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Refrigerator*</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select refrigerator" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="RF01">RF01</SelectItem>
                          <SelectItem value="RF02">RF02</SelectItem>
                          <SelectItem value="RF03">RF03</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location.shelf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shelf*</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter shelf number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location.position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter position (optional)" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
                disabled={loading}
              >
                Reset
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Adding..." : "Add Blood Unit"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}