"use client";

import { IndianRupee, DollarSign, MessageSquare, Edit } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Event } from "@/lib/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";
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
      return "bg-chart-2/20 text-chart-2 border border-chart-2/30";
    case "rejected":
      return "bg-destructive/20 text-destructive border border-destructive/30";
    default:
      return "bg-chart-4/20 text-chart-4 border border-chart-4/30";
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
            {/* View Comments */}
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

            {/* Edit Date Preferences */}
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

            {/* 🔹 Add Reimbursement Button */}
            <Link href={`/events/${event.id}/reimbursement`}>
              <Button
                variant="outline"
                size="sm"
              >
                Add Reimbursement
              </Button>
            </Link>
          </div>

          {/* Date Preferences */}
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
