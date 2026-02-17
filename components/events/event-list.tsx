"use client";

import { useState } from "react";
import type { Event } from "@/lib/types";
import type { User } from "@supabase/supabase-js";
import { EventCard } from "./event-card";
import { Card, CardContent } from "@/components/ui/card";
import { CommentsDialog } from "./comments-dialog";
import { AddBudgetDialog } from "./add-budget-dialog";
import { EditDatePreferencesDialog } from "./edit-date-preferences-dialog";

interface EventListProps {
  events: Event[];
  clubId: string;
  onRefetch: () => void;
  user?: User;
}

export function EventList({ 
  events, 
  clubId, 
  onRefetch, 
  user 
}: EventListProps) {
  const [budgetDialogState, setBudgetDialogState] = useState({
    open: false,
    eventId: "",
    eventName: "",
  });

  const [dateDialogState, setDateDialogState] = useState<{
    open: boolean;
    eventId: string;
    eventName: string;
    currentPreferences: any[];
  }>({
    open: false,
    eventId: "",
    eventName: "",
    currentPreferences: [],
  });

  const [commentsDialogState, setCommentsDialogState] = useState<{
    open: boolean;
    eventId: string;
    eventName: string;
    comments: any[];
  }>({
    open: false,
    eventId: "",
    eventName: "",
    comments: [],
  });

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            No events yet. Create your first event to get started!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onAddBudget={() =>
              setBudgetDialogState({
                open: true,
                eventId: event.id,
                eventName: event.event_name,
              })
            }
            onEditDatePreferences={() =>
              setDateDialogState({
                open: true,
                eventId: event.id,
                eventName: event.event_name,
                currentPreferences: event.event_date_preference || [],
              })
            }
            onViewComments={() =>
              setCommentsDialogState({
                open: true,
                eventId: event.id,
                eventName: event.event_name,
                comments: event.event_review || [],
              })
            }
          />
        ))}
      </div>

      {/* Comments Dialog */}
      <CommentsDialog
        eventId={commentsDialogState.eventId}
        eventName={commentsDialogState.eventName}
        clubId={clubId}
        comments={commentsDialogState.comments}
        open={commentsDialogState.open}
        onOpenChange={(open) =>
          setCommentsDialogState((prev) => ({ ...prev, open }))
        }
        userEmail={user?.email}
        isAdmin={false}
      />

      {/* Add Budget Dialog */}
      <AddBudgetDialog
        eventId={budgetDialogState.eventId}
        eventName={budgetDialogState.eventName}
        open={budgetDialogState.open}
        onOpenChange={(open) =>
          setBudgetDialogState((prev) => ({ ...prev, open }))
        }
      />

      {/* Edit Date Preferences Dialog */}
      <EditDatePreferencesDialog
        eventId={dateDialogState.eventId}
        eventName={dateDialogState.eventName}
        currentPreferences={dateDialogState.currentPreferences}
        open={dateDialogState.open}
        onOpenChange={(open) =>
          setDateDialogState((prev) => ({ ...prev, open }))
        }
      />
    </>
  );
}
