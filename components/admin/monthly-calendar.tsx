"use client";

import { useMemo } from "react";
import type { Event } from "@/lib/types";
import type { User } from "@supabase/supabase-js";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  getMonthData,
  formatDate,
  DAY_NAMES,
} from "@/lib/utils/date-utils";
import { CalendarEventCard } from "./calendar-event-card";

interface MonthlyCalendarProps {
  currentDate: Date;
  events: Event[];
  onEventUpdate?: () => void;
  user?: User;
}

export function MonthlyCalendar({ 
  currentDate, 
  events, 
  onEventUpdate, 
  user 
}: MonthlyCalendarProps) {
  const { daysInMonth, startingDayOfWeek } = useMemo(
    () => getMonthData(currentDate.getFullYear(), currentDate.getMonth()),
    [currentDate]
  );

  // Group events by date - Normalize date strings
  const eventsByDate = useMemo(() => {
    const map = new Map<string, Event[]>();

    events.forEach((event) => {
      event.event_date_preference?.forEach((pref) => {
        const dateStr = pref.date.split('T')[0];
        if (!map.has(dateStr)) {
          map.set(dateStr, []);
        }
        map.get(dateStr)?.push(event);
      });
    });

    return map;
  }, [events]);

  const days = [];
  const totalCells = Math.ceil((daysInMonth + startingDayOfWeek) / 7) * 7;

  for (let i = 0; i < totalCells; i++) {
    const dayNumber = i - startingDayOfWeek + 1;
    const isCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth;

    if (isCurrentMonth) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        dayNumber
      );
      const dateStr = formatDate(date);
      const dayEvents = eventsByDate.get(dateStr) || [];
      const isToday =
        date.toDateString() === new Date().toDateString();

      days.push({
        date,
        dayNumber,
        isCurrentMonth: true,
        isToday,
        events: dayEvents,
      });
    } else {
      days.push({
        date: null,
        dayNumber: null,
        isCurrentMonth: false,
        isToday: false,
        events: [],
      });
    }
  }

  return (
    <Card className="p-4">
      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
        {/* Day headers */}
        {DAY_NAMES.map((day) => (
          <div
            key={day}
            className="bg-muted p-3 text-center text-sm font-semibold"
          >
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {days.map((day, index) => (
          <div
            key={index}
            className={cn(
              "bg-background min-h-[120px] p-2",
              !day.isCurrentMonth && "bg-muted/30"
            )}
          >
            {day.isCurrentMonth && (
              <>
                <div
                  className={cn(
                    "text-sm font-medium mb-2",
                    day.isToday &&
                      "inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground"
                  )}
                >
                  {day.dayNumber}
                </div>
                <div className="space-y-1">
                  {day.events.slice(0, 3).map((event, eventIndex) => (
                    <CalendarEventCard
                      key={`${event.id}-${day.date?.toISOString()}-${eventIndex}`}
                      event={event}
                      compact
                      onEventUpdate={onEventUpdate}
                      user={user}
                    />
                  ))}
                  {day.events.length > 3 && (
                    <div className="text-xs text-muted-foreground px-1">
                      +{day.events.length - 3} more
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
