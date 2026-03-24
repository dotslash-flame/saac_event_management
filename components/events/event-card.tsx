"use client";

import { IndianRupee, DollarSign, MessageSquare, Edit } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Event } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { DatePreferencesSection } from "./date-preferences-section";
import { BudgetSection } from "./budget-section";

interface EventCardProps {
  event: Event;
  onAddBudget: () => void;
  onEditDatePreferences: () => void;
  onViewComments: () => void;
}

function getStatusColor(status: string) {
  switch (status) {
    case "approved":
    case "accepted":
      return "bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/30";
    case "rejected":
      return "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/30";
    case "pending":
    default:
      return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-500/30";
  }
}

export function EventCard({
  event,
  onAddBudget,
  onEditDatePreferences,
  onViewComments,
}: EventCardProps) {
  return (
    <Card className="hover:bg-accent/50 transition-colors">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Event Name and Status */}
          <div className="flex items-start justify-between gap-4">
            <h3 className="font-semibold text-base leading-tight flex-1">
              {event.event_name}
            </h3>
            <span
              className={`px-2 py-1 rounded-md text-xs font-semibold whitespace-nowrap ${getStatusColor(
                event.approval_status,
              )}`}
            >
              {event.approval_status.toUpperCase()}
            </span>
          </div>

          {/* Event Description */}
          <p className="text-sm text-muted-foreground">
            {event.event_descriptions}
          </p>

          {/* Quick Info */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {/* Budget */}
            {event.budget_request ?
              <div className="flex items-center gap-1">
                <IndianRupee className="w-4 h-4" />
                <span>
                  ₹{event.budget_request.budget_amt.toLocaleString("en-IN")}
                  {event.budget_request.approved_budget && (
                    <span className="text-chart-2 font-semibold ml-1">
                      (✓ ₹
                      {event.budget_request.approved_budget.toLocaleString(
                        "en-IN",
                      )}
                      )
                    </span>
                  )}
                </span>
              </div>
            : <Button
                variant="outline"
                size="sm"
                onClick={onAddBudget}
              >
                <DollarSign className="w-4 h-4 mr-1" />
                Add Budget Request
              </Button>
            }

            {/* Created Date */}
            <div className="flex items-center gap-1 text-xs">
              <span>
                Created{" "}
                {new Date(event.created_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Budget Details Section */}
          {event.budget_request && (
            <BudgetSection budgetRequest={event.budget_request} />
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            {/* View Comments Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onViewComments}
            >
              <MessageSquare className="w-4 h-4 mr-1" />
              Comments
              {event.event_review && event.event_review.length > 0 ?
                ` (${event.event_review.length})`
              : ""}
            </Button>

            {/* Only show edit date preferences if event is not approved */}
            {event.approval_status !== "approved" && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEditDatePreferences}
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit Date Preferences
              </Button>
            )}
          </div>

          {/* Collapsible Date Preferences */}
          {event.event_date_preference &&
            event.event_date_preference.length > 0 && (
              <DatePreferencesSection
                datePreferences={event.event_date_preference}
                acceptedDatePreferenceId={event.accepted_date_preference_id}
              />
            )}
        </div>
      </CardContent>
    </Card>
  );
}
