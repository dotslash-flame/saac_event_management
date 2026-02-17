"use client";

import { useMemo } from "react";
import type { Event } from "@/lib/types";
import type { User } from "@supabase/supabase-js";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getWeekDates, formatDate, DAY_NAMES } from "@/lib/utils/date-utils";
import { CalendarEventCard } from "./calendar-event-card";

interface WeeklyCalendarProps {
  currentDate: Date;
  events: Event[];
  onEventUpdate?: () => void;
  user?: User;
}

export function WeeklyCalendar({ 
  currentDate, 
  events, 
  onEventUpdate, 
  user 
}: WeeklyCalendarProps) {
  const weekDates = useMemo(() => getWeekDates(new Date(currentDate)), [currentDate]);

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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <Card className="p-4">
      <div className="grid grid-cols-7 gap-4">
        {weekDates.map((date, index) => {
          const dateStr = formatDate(date);
          const dayEvents = eventsByDate.get(dateStr) || [];
          const isToday = date.toDateString() === new Date().toDateString();

          return (
            <div key={index} className="space-y-2">
              <div className="text-center">
                <div className="text-sm font-semibold text-muted-foreground">
                  {DAY_NAMES[date.getDay()]}
                </div>
                <div
                  className={cn(
                    "text-2xl font-bold mt-1",
                    isToday && "text-primary"
                  )}
                >
                  {date.getDate()}
                </div>
              </div>
              <div className="space-y-2 min-h-[400px]">
                {dayEvents.length === 0 ? (
                  <div className="text-xs text-muted-foreground text-center mt-8">
                    No events
                  </div>
                ) : (
                  dayEvents.map((event, eventIndex) => (
                    <CalendarEventCard
                      key={`${event.id}-${dateStr}-${eventIndex}`}
                      event={event}
                      date={date}
                      onEventUpdate={onEventUpdate}
                      user={user}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
