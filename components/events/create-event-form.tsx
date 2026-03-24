"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createEvent } from "@/lib/queries";

interface CreateEventFormProps {
  clubId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreateEventForm({
  clubId,
  onSuccess,
  onCancel,
}: CreateEventFormProps) {
  const router = useRouter();

  const [formData, setFormData] = useState({
    eventName: "",
    eventDescription: "",
    budgetAmount: "",
    budgetPurpose: "",
    datePreferences: [
      { date: "", startTime: "", endTime: "" },
      { date: "", startTime: "", endTime: "" },
      { date: "", startTime: "", endTime: "" },
    ],
  });

  const createEventMutation = useMutation({
    mutationFn: createEvent,
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Event created successfully!", {
          description: "Your event has been submitted for approval.",
        });
        // Reset form
        setFormData({
          eventName: "",
          eventDescription: "",
          budgetAmount: "",
          budgetPurpose: "",
          datePreferences: [
            { date: "", startTime: "", endTime: "" },
            { date: "", startTime: "", endTime: "" },
            { date: "", startTime: "", endTime: "" },
          ],
        });
        // Refresh the page to show new event
        router.refresh();
        onSuccess?.();
      } else {
        toast.error("Failed to create event", {
          description: result.error,
        });
      }
    },
    onError: (error: Error) => {
      console.error("[CreateEventForm] Error creating event:", error);
      toast.error("Failed to create event", {
        description: error.message,
      });
    },
  });
  

	const validateTimeRange = (startTime: string, endTime: string): boolean => {
	  if (!startTime || !endTime) return true; // Skip if either is empty
	  return endTime > startTime;
	};


  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // Validate that at least one date preference is filled
  const hasValidDatePref = formData.datePreferences.some(
    (pref) => pref.date && pref.startTime && pref.endTime
  );

  if (!hasValidDatePref) {
    toast.error("Please provide at least one date preference");
    return;
  }

  // Validate time ranges
  const invalidTimes = formData.datePreferences.some(
    (pref) => 
      pref.startTime && 
      pref.endTime && 
      !validateTimeRange(pref.startTime, pref.endTime)
  );

  if (invalidTimes) {
    toast.error("End time must be after start time");
    return;
  }

  // Validate budget fields (both or neither)
  if (
    (formData.budgetAmount && !formData.budgetPurpose) ||
    (!formData.budgetAmount && formData.budgetPurpose)
  ) {
    toast.error("Please provide both budget amount and purpose, or leave both empty");
    return;
  }

  createEventMutation.mutate({
    club_id: clubId,
    event_name: formData.eventName,
    event_descriptions: formData.eventDescription,
    datePreferences: formData.datePreferences,
    budgetAmount: formData.budgetAmount,
    budgetPurpose: formData.budgetPurpose,
  });
};

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* Event Name */}
      <div className="space-y-2">
        <Label htmlFor="eventName">Event Name *</Label>
        <Input
          id="eventName"
          value={formData.eventName}
          onChange={(e) =>
            setFormData({ ...formData, eventName: e.target.value })
          }
          required
          placeholder="e.g., Annual Cultural Fest"
        />
      </div>

      {/* Event Description */}
      <div className="space-y-2">
        <Label htmlFor="eventDescription">Event Description *</Label>
        <Textarea
          id="eventDescription"
          value={formData.eventDescription}
          onChange={(e) =>
            setFormData({
              ...formData,
              eventDescription: e.target.value,
            })
          }
          required
          rows={4}
          placeholder="Describe your event, including objectives, expected attendees, and activities..."
        />
      </div>

      {/* Date Preferences */}
      <div className="space-y-4">
         <div>
           <Label>Date Preferences (provide at least one)</Label>
           <p className="text-sm text-muted-foreground mt-1">
           Add at least one date preference. The SAAC admin will select one for approval.
           </p>
         </div>
         {formData.datePreferences.map((pref, index) => (
          <Card
            key={index}
            className="p-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`date-${index}`}>Date</Label>
                <Input
                  id={`date-${index}`}
                  type="date"
                  value={pref.date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => {
                    const newPrefs = [...formData.datePreferences];
                    newPrefs[index].date = e.target.value;
                    setFormData({
                      ...formData,
                      datePreferences: newPrefs,
                    });
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`start-${index}`}>Start Time</Label>
                <Input
                  id={`start-${index}`}
                  type="time"
                  value={pref.startTime}
                  onChange={(e) => {
                    const newPrefs = [...formData.datePreferences];
                    newPrefs[index].startTime = e.target.value;
                    setFormData({
                      ...formData,
                      datePreferences: newPrefs,
                    });
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`end-${index}`}>End Time</Label>
                <Input
                  id={`end-${index}`}
                  type="time"
                  value={pref.endTime}
                  onChange={(e) => {
                    const newPrefs = [...formData.datePreferences];
                    newPrefs[index].endTime = e.target.value;
                    setFormData({
                      ...formData,
                      datePreferences: newPrefs,
                    });
                  }}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Budget Request */}
      <div className="space-y-4">
        <Label>Budget Request (Optional)</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="budgetAmount">Budget Amount (₹)</Label>
            <Input
              id="budgetAmount"
              type="number"
              step="0.01"
              value={formData.budgetAmount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  budgetAmount: e.target.value,
                })
              }
              placeholder="e.g., 50000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="budgetPurpose">Purpose</Label>
            <Input
              id="budgetPurpose"
              value={formData.budgetPurpose}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  budgetPurpose: e.target.value,
                })
              }
              placeholder="e.g., Venue rental, equipment, refreshments"
            />
          </div>
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-4 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            onCancel?.();
          }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={createEventMutation.isPending}
        >
          {createEventMutation.isPending ? "Creating..." : "Create Event"}
        </Button>
      </div>
    </form>
  );
}
