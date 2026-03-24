"use client";

import { useState, useTransition } from "react";
import type { User } from "@supabase/supabase-js";
import type { Event } from "@/lib/types";
import { MonthlyCalendar } from "@/components/admin/monthly-calendar";
import { WeeklyCalendar } from "@/components/admin/weekly-calendar";
import { CalendarToolbar } from "@/components/admin/calendar-toolbar";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarEventCard } from "@/components/admin/calendar-event-card";
import { AlertCircle, Loader2 } from "lucide-react";
import { fetchAllEvents } from "@/lib/queries-admin";

type CalendarView = "month" | "week";

interface AdminCalendarClientProps {
  user: User;
  initialEvents: Event[];
}

export default function AdminCalendarClient({
  user,
  initialEvents,
}: AdminCalendarClientProps) {
  const [view, setView] = useState<CalendarView>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [isPending, startTransition] = useTransition();

  // Refresh events function
  const refreshEvents = async () => {
    startTransition(async () => {
      try {
        const freshEvents = await fetchAllEvents();
        setEvents(freshEvents);
      } catch (error) {
        console.error("Failed to refresh events:", error);
      }
    });
  };

  // Separate events with and without dates
  const scheduledEvents = events.filter(
    (e) => e.event_date_preference && e.event_date_preference.length > 0
  );
  const unscheduledEvents = events.filter(
    (e) => !e.event_date_preference || e.event_date_preference.length === 0
  );

  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    if (view === "month") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (view === "month") {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <SidebarProvider>
      <AppSidebar
        clubName="Admin"
        clubEmail={user.email || ""}
        isAdmin={true}
      />
      <SidebarInset>
        <AppHeader isAdmin={true} />
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-[1600px] mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Admin Calendar</h1>
              <div className="flex items-center gap-3">
                {isPending && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                <div className="text-sm text-muted-foreground">
                  {scheduledEvents.length} scheduled • {unscheduledEvents.length} unscheduled
                </div>
              </div>
            </div>

            {/* Unscheduled Events Alert */}
            {unscheduledEvents.length > 0 && (
              <Card className="border-yellow-500/50 bg-yellow-500/5">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    Unscheduled Events ({unscheduledEvents.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {unscheduledEvents.map((event) => (
                      <CalendarEventCard
                        key={event.id}
                        event={event}
                        compact={false}
                        onEventUpdate={refreshEvents}
                        user={user}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <CalendarToolbar
              view={view}
              onViewChange={setView}
              currentDate={currentDate}
              onPrevious={handlePrevious}
              onNext={handleNext}
              onToday={handleToday}
            />

            {view === "month" ? (
              <MonthlyCalendar 
                currentDate={currentDate} 
                events={scheduledEvents}
                onEventUpdate={refreshEvents}
                user={user}
              />
            ) : (
              <WeeklyCalendar 
                currentDate={currentDate} 
                events={scheduledEvents}
                onEventUpdate={refreshEvents}
                user={user}
              />
            )}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
