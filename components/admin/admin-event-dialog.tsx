"use client";

import { useState } from "react";
import type { Event } from "@/lib/types";
import type { User } from "@supabase/supabase-js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Clock, DollarSign, CheckCircle, XCircle, Send, Shield, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { approveEvent, rejectEvent } from "@/lib/queries-admin";
import { addAdminEventReview } from "@/lib/queries";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AdminEventDialogProps {
  event: Event;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User;
}

export function AdminEventDialog({
  event,
  open,
  onOpenChange,
  user,
}: AdminEventDialogProps) {
  const router = useRouter();
  const [selectedDatePref, setSelectedDatePref] = useState<string>("");
  const [approvedBudget, setApprovedBudget] = useState<string>(
    event.budget_request?.budget_amt?.toString() || ""
  );
  const [budgetComments, setBudgetComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Chat state
  const [adminReplyMessage, setAdminReplyMessage] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);

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

  const handleApprove = async () => {
    if (!selectedDatePref) {
      toast.error("Please select a date preference");
      return;
    }

    setIsSubmitting(true);
    const result = await approveEvent({
      eventId: event.id,
      acceptedDatePreferenceId: selectedDatePref,
      approvedBudget: approvedBudget ? parseFloat(approvedBudget) : undefined,
      budgetComments: budgetComments || undefined,
    });

    setIsSubmitting(false);

    if (result.success) {
      toast.success("Event approved successfully");
      onOpenChange(false);
    } else {
      toast.error(result.error || "Failed to approve event");
    }
  };

  const handleReject = async () => {
    setIsSubmitting(true);
    const result = await rejectEvent(event.id);
    setIsSubmitting(false);

    if (result.success) {
      toast.success("Event rejected");
      onOpenChange(false);
    } else {
      toast.error(result.error || "Failed to reject event");
    }
  };

  const handleSendAdminMessage = async () => {
    if (!adminReplyMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }

    if (!user?.email) {
      toast.error("User email not found");
      return;
    }

    setIsSendingMessage(true);

    const result = await addAdminEventReview({
      eventId: event.id,
      adminEmail: user.email,
      comment: adminReplyMessage.trim(),
    });

    setIsSendingMessage(false);

    if (result.success) {
      toast.success("Message sent successfully");
      setAdminReplyMessage("");
      router.refresh();
      onOpenChange(false);
      setTimeout(() => onOpenChange(true), 100);
    } else {
      toast.error(result.error || "Failed to send message");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{event.event_name}</DialogTitle>
          <DialogDescription>
            <Badge
              variant="outline"
              className={cn("mt-2", getStatusColor(event.approval_status))}
            >
              {event.approval_status}
            </Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Description */}
          <div>
            <Label className="text-base font-semibold">Description</Label>
            <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
              {event.event_descriptions}
            </p>
          </div>

          {/* Date Preferences */}
          <div>
            <Label className="text-base font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date Preferences
            </Label>
            <div className="mt-2 space-y-2">
              {event.event_date_preference?.map((pref) => (
                <div
                  key={pref.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border",
                    event.accepted_date_preference_id === pref.id &&
                      "bg-green-500/10 border-green-500/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        {new Date(pref.date).toLocaleDateString("en-IN", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {pref.start_time} - {pref.end_time}
                      </div>
                    </div>
                  </div>
                  {event.accepted_date_preference_id === pref.id && (
                    <Badge variant="outline" className="bg-green-500/10">
                      Accepted
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Budget Request */}
          {event.budget_request && (
            <div>
              <Label className="text-base font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Budget Request
              </Label>
              <div className="mt-2 p-4 rounded-lg border bg-muted/50">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Requested Amount
                    </Label>
                    <div className="text-lg font-semibold">
                      ₹{event.budget_request.budget_amt}
                    </div>
                  </div>
                  {event.budget_request.approved_budget !== null && (
                    <div>
                      <Label className="text-sm text-muted-foreground">
                        Approved Amount
                      </Label>
                      <div className="text-lg font-semibold text-green-600">
                        ₹{event.budget_request.approved_budget}
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-3">
                  <Label className="text-sm text-muted-foreground">
                    Purpose
                  </Label>
                  <p className="text-sm mt-1">
                    {event.budget_request.purpose}
                  </p>
                </div>
              </div>
            </div>
          )}

         {/* Chat Section */}
		<div className="space-y-3">
		  <Label className="text-base font-semibold">Chat Messages</Label>
		  {event.event_review && event.event_review.length > 0 ? (
		    <ScrollArea className="h-[250px] rounded-lg border p-3">
		      <div className="space-y-3 pr-3">
			{event.event_review.map((review) => {
			  const isAdmin = !!review.admin_id;
			  const isSelf = isAdmin;
			  const authorName = review.admin?.name || review.club?.club_name || "Unknown";
			  
			  return (
			    <div
			      key={review.id}
			      className={cn(
				"p-3 rounded-lg border",
				isSelf 
				  ? "bg-blue-500/10 border-blue-500/30 ml-0 mr-8" // Self (Admin) - Blue
				  : "bg-muted/50 border-muted ml-8 mr-0" // Others (Club) - Gray
			      )}
			    >
			      <div className="flex items-center gap-2 mb-2">
				<div className={cn(
				  "p-1 rounded-full",
				  isSelf ? "bg-blue-500/20" : "bg-muted"
				)}>
				  {isAdmin ? (
				    <Shield className="w-3 h-3 text-blue-600 dark:text-blue-400" />
				  ) : (
				    <UserIcon className="w-3 h-3 text-muted-foreground" />
				  )}
				</div>
				<span className="text-sm font-medium">{authorName}</span>
				<Badge 
				  variant={isAdmin ? "default" : "outline"}
				  className="text-xs px-1.5 py-0"
				>
				  {isAdmin ? "Admin" : "Club"}
				</Badge>
				<span className="text-xs text-muted-foreground ml-auto">
				  {new Date(review.created_at).toLocaleDateString("en-IN", {
				    month: "short",
				    day: "numeric",
				    hour: "2-digit",
				    minute: "2-digit",
				  })}
				</span>
			      </div>
			      <p className="text-sm leading-relaxed">{review.comment}</p>
			    </div>
			  );
			})}
		      </div>
		    </ScrollArea>
		  ) : (
		    <p className="text-sm text-muted-foreground italic border rounded-lg p-4 text-center">
		      No messages yet
		    </p>
		  )}

		  {/* Admin Reply Section */}
		  <div className="space-y-2">
		    <Label htmlFor="admin-message">Send Message to Club</Label>
		    <div className="flex gap-2">
		      <Textarea
			id="admin-message"
			placeholder="Type your message..."
			value={adminReplyMessage}
			onChange={(e) => setAdminReplyMessage(e.target.value)}
			rows={3}
			className="flex-1"
			disabled={isSendingMessage}
		      />
		      <Button 
			size="icon"
			onClick={handleSendAdminMessage}
			disabled={!adminReplyMessage.trim() || isSendingMessage}
			className="h-10 w-10 shrink-0"
		      >
			<Send className="h-4 w-4" />
		      </Button>
		    </div>
		  </div>
		</div>

          {/* Approval Section - Only show if pending */}
          {event.approval_status === "pending" && (
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-semibold">Review Event</h3>

              {/* Select Date Preference */}
              <div className="space-y-2">
                <Label>Select Date to Approve</Label>
                <Select
                  value={selectedDatePref}
                  onValueChange={setSelectedDatePref}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a date preference" />
                  </SelectTrigger>
                  <SelectContent>
                    {event.event_date_preference?.map((pref) => (
                      <SelectItem key={pref.id} value={pref.id}>
                        {new Date(pref.date).toLocaleDateString("en-IN", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        ({pref.start_time} - {pref.end_time})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Budget Approval */}
              {event.budget_request && (
                <>
                  <div className="space-y-2">
                    <Label>Approved Budget Amount (₹)</Label>
                    <Input
                      type="number"
                      value={approvedBudget}
                      onChange={(e) => setApprovedBudget(e.target.value)}
                      placeholder="Enter approved budget"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Budget Comments (Optional)</Label>
                    <Textarea
                      value={budgetComments}
                      onChange={(e) => setBudgetComments(e.target.value)}
                      placeholder="Add any comments about the budget..."
                      rows={3}
                    />
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleApprove}
                  disabled={isSubmitting || !selectedDatePref}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Event
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={isSubmitting}
                  variant="destructive"
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Event
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
