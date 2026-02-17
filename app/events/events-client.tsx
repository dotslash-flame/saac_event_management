"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { Event, Club } from "@/lib/types";
import { EventList } from "@/components/events/event-list";
import { CreateEventDialog } from "@/components/events/create-event-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface EventsClientProps {
  club: Club;
  initialEvents: Event[];
  user: User;
}

export default function EventsClient({
  club,
  initialEvents,
  user,
}: EventsClientProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [events] = useState<Event[]>(initialEvents);

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-[1600px] mx-auto space-y-6">
          {/* Page Header with Create Button */}
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold">Your Events</h2>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </div>

          {/* Events List */}
          <EventList
            events={events}
            clubId={club.id}
            onRefetch={() => {}}
            user={user}
          />

          {/* Create Event Dialog */}
          <CreateEventDialog
            clubId={club.id}
            open={showCreateDialog}
            onOpenChange={setShowCreateDialog}
          />
        </div>
      </main>
    </div>
  );
}
