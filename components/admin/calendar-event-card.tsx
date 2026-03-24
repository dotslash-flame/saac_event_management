"use client";

import { useState } from "react";
import type { Event } from "@/lib/types";
import type { User } from "@supabase/supabase-js";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";
import { AdminEventDialog } from "./admin-event-dialog";

interface CalendarEventCardProps {
  event: Event;
  date?: Date;
  compact?: boolean;
  onEventUpdate?: () => void;
  user?: User;
}

export function CalendarEventCard({
  event,
  date,
  compact = false,
  onEventUpdate,
  user,
}: CalendarEventCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
      case "approve":
      case "accepted":
        return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
      case "rejected":
      case "reject":
        return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
      default:
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20";
    }
  };

  // Get time range for this date if available
  const getTimeForDate = () => {
    if (!date) return null;
    const dateStr = date.toISOString().split("T")[0];
    const pref = event.event_date_preference?.find((p) => p.date.split('T')[0] === dateStr);
    if (pref) {
      return `${pref.start_time} - ${pref.end_time}`;
    }
    return null;
  };

  const timeRange = getTimeForDate();

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open && onEventUpdate) {
      onEventUpdate();
    }
  };

  if (compact) {
    return (
      <>
        <Card
          className={cn(
            "p-2 cursor-pointer hover:shadow-md transition-shadow",
            getStatusColor(event.approval_status)
          )}
          onClick={() => setDialogOpen(true)}
        >
          <div className="text-xs font-medium truncate">
            {event.event_name}
          </div>
        </Card>
        <AdminEventDialog
          event={event}
          open={dialogOpen}
          onOpenChange={handleDialogClose}
          user={user}
        />
      </>
    );
  }

  return (
    <>
      <Card
        className="p-3 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setDialogOpen(true)}
      >
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-sm line-clamp-2">
              {event.event_name}
            </h4>
            <Badge
              variant="outline"
              className={cn("text-xs shrink-0", getStatusColor(event.approval_status))}
            >
              {event.approval_status}
            </Badge>
          </div>
          {timeRange && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {timeRange}
            </div>
          )}
          {event.budget_request && (
            <div className="text-xs text-muted-foreground">
              Budget: ₹{event.budget_request.budget_amt}
            </div>
          )}
        </div>
      </Card>
      <AdminEventDialog
        event={event}
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        user={user}
      />
    </>
  );
}
