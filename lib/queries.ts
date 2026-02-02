"use server";

import { createServiceRoleClient } from "./supabase/service-role";
import { revalidatePath } from "next/cache";
import type { Event, EventReview, CreateEventData } from "./types";

// Re-export types for convenience
export type {
  Event,
  EventReview,
  EventDatePreference,
  BudgetRequest,
  CreateEventData,
  Club,
} from "./types";

export async function createEvent(data: CreateEventData) {
  try {
    console.log("[queries/createEvent] Starting event creation");

    const supabase = createServiceRoleClient();

    // Create the event
    const { data: eventData, error: eventError } = await supabase
      .schema("saac_thingy")
      .from("event")
      .insert({
        club_id: data.club_id,
        event_name: data.event_name,
        event_descriptions: data.event_descriptions,
        approval_status: "pending",
      })
      .select()
      .single();

    if (eventError) {
      console.log("[queries/createEvent] Error creating event:", eventError);
      return { success: false, error: eventError.message };
    }

    console.log("[queries/createEvent] Event created:", eventData.id);

    // Add date preferences
    const datePreferencesToInsert = data.datePreferences
      .filter((pref) => pref.date && pref.startTime && pref.endTime)
      .map((pref) => ({
        event_id: eventData.id,
        date: pref.date,
        start_time: pref.startTime,
        end_time: pref.endTime,
        proposer_role: "club",
      }));

    console.log(
      "[queries/createEvent] Adding",
      datePreferencesToInsert.length,
      "date preferences",
    );

    if (datePreferencesToInsert.length > 0) {
      const { error: dateError } = await supabase
        .schema("saac_thingy")
        .from("event_date_preference")
        .insert(datePreferencesToInsert);

      if (dateError) {
        console.log(
          "[queries/createEvent] Error adding date preferences:",
          dateError,
        );
        return { success: false, error: dateError.message };
      }

      console.log("[queries/createEvent] Date preferences added successfully");
    }

    // Add budget request if provided
    if (data.budgetAmount && data.budgetPurpose) {
      console.log(
        "[queries/createEvent] Adding budget request:",
        data.budgetAmount,
      );

      const { error: budgetError } = await supabase
        .schema("saac_thingy")
        .from("budget_request")
        .insert({
          event_id: eventData.id,
          budget_amt: parseFloat(data.budgetAmount),
          purpose: data.budgetPurpose,
        });

      if (budgetError) {
        console.log(
          "[queries/createEvent] Error adding budget request:",
          budgetError,
        );
        return { success: false, error: budgetError.message };
      }

      console.log("[queries/createEvent] Budget request added successfully");
    }

    console.log("[queries/createEvent] Event creation complete");

    // Revalidate the events page
    revalidatePath("/events");

    return { success: true, event: eventData };
  } catch (error) {
    console.error("[queries/createEvent] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

// ============================================
// SERVER-SIDE REACT QUERY FUNCTIONS
// ============================================

// Fetch events for a club (server-side with service role)
export async function fetchEventsForClub(clubId: string): Promise<Event[]> {
  "use server";
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .schema("saac_thingy")
    .from("event")
    .select(
      `
      *,
      event_date_preference!event_date_preference_event_id_fkey (*),
      budget_request (*),
      event_review!event_review_event_id_fkey (
        *,
        admin (*),
        club (*)
      )
    `,
    )
    .eq("club_id", clubId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[fetchEventsForClub] Error:", error);
    throw new Error(error.message);
  }

  console.log(
    "[fetchEventsForClub] Fetched data:",
    JSON.stringify(data, null, 2),
  );

  return data as unknown as Event[];
}

// Add budget request to an event (server-side)
export async function addBudgetRequest(data: {
  eventId: string;
  budgetAmount: number;
  purpose: string;
}): Promise<{ success: boolean; error?: string }> {
  "use server";
  try {
    const supabase = createServiceRoleClient();

    const { error } = await supabase
      .schema("saac_thingy")
      .from("budget_request")
      .insert({
        event_id: data.eventId,
        budget_amt: data.budgetAmount,
        purpose: data.purpose,
      });

    if (error) {
      console.error("[addBudgetRequest] Error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[addBudgetRequest] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Add event review/comment (server-side)
export async function addEventReview(data: {
  eventId: string;
  clubId: string;
  comment: string;
}): Promise<{ success: boolean; error?: string; review?: EventReview }> {
  "use server";
  try {
    const supabase = createServiceRoleClient();

    const { data: reviewData, error } = await supabase
      .schema("saac_thingy")
      .from("event_review")
      .insert({
        event_id: data.eventId,
        club_id: data.clubId,
        comment: data.comment,
      })
      .select(
        `
        *,
        admin (*),
        club (*)
      `,
      )
      .single();

    if (error) {
      console.error("[addEventReview] Error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, review: reviewData };
  } catch (error) {
    console.error("[addEventReview] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Update date preferences for an event (server-side)
export async function updateDatePreferences(data: {
  eventId: string;
  datePreferences: Array<{
    date: string;
    startTime: string;
    endTime: string;
  }>;
}): Promise<{ success: boolean; error?: string }> {
  "use server";
  try {
    const supabase = createServiceRoleClient();

    // First, delete existing date preferences
    const { error: deleteError } = await supabase
      .schema("saac_thingy")
      .from("event_date_preference")
      .delete()
      .eq("event_id", data.eventId);

    if (deleteError) {
      console.error("[updateDatePreferences] Delete error:", deleteError);
      return { success: false, error: deleteError.message };
    }

    // Then, insert new date preferences
    const datePreferencesToInsert = data.datePreferences
      .filter((pref) => pref.date && pref.startTime && pref.endTime)
      .map((pref) => ({
        event_id: data.eventId,
        date: pref.date,
        start_time: pref.startTime,
        end_time: pref.endTime,
        proposer_role: "club",
      }));

    if (datePreferencesToInsert.length > 0) {
      const { error: insertError } = await supabase
        .schema("saac_thingy")
        .from("event_date_preference")
        .insert(datePreferencesToInsert);

      if (insertError) {
        console.error("[updateDatePreferences] Insert error:", insertError);
        return { success: false, error: insertError.message };
      }
    }

    return { success: true };
  } catch (error) {
    console.error("[updateDatePreferences] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Delete a date preference (server-side)
export async function deleteDatePreference(
  preferenceId: string,
): Promise<{ success: boolean; error?: string }> {
  "use server";
  try {
    const supabase = createServiceRoleClient();

    const { error } = await supabase
      .schema("saac_thingy")
      .from("event_date_preference")
      .delete()
      .eq("id", preferenceId);

    if (error) {
      console.error("[deleteDatePreference] Error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[deleteDatePreference] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Add a new date preference (server-side)
export async function addDatePreference(data: {
  eventId: string;
  date: string;
  startTime: string;
  endTime: string;
}): Promise<{ success: boolean; error?: string }> {
  "use server";
  try {
    const supabase = createServiceRoleClient();

    const { error } = await supabase
      .schema("saac_thingy")
      .from("event_date_preference")
      .insert({
        event_id: data.eventId,
        date: data.date,
        start_time: data.startTime,
        end_time: data.endTime,
        proposer_role: "club",
      });

    if (error) {
      console.error("[addDatePreference] Error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[addDatePreference] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
// ======================================================
// NEW: Create reimbursement record for an event
// ======================================================

export async function addReimbursementForEvent(data: {
  eventId: string;
  treasurerId: string;
}): Promise<{ success: boolean; error?: string }> {
  "use server";
  try {
    const supabase = createServiceRoleClient();

    const { error } = await supabase
      .schema("saac_thingy")
      .from("reimbursement")
      .insert({
        id: data.eventId, // reimbursement.id MUST equal event_id
        treasurer_id: data.treasurerId,
      });

    if (error) {
      console.error("[addReimbursementForEvent] Error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[addReimbursementForEvent] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
// Add students to a reimbursement (server-side)
export async function addReimbursees(data: {
  reimbursementId: string;
  students: Array<{
    studentId: string;
    studentName: string;
  }>;
}): Promise<{ success: boolean; error?: string }> {
  "use server";
  try {
    const supabase = createServiceRoleClient();

    // Convert students into rows for insertion
    const rowsToInsert = data.students.map((student) => ({
      reimbursement_id: data.reimbursementId,
      student_id: student.studentId,
      student_name: student.studentName,
    }));

    const { error } = await supabase
      .schema("saac_thingy")
      .from("reimbursees")
      .insert(rowsToInsert);

    if (error) {
      console.error("[addReimbursees] Error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[addReimbursees] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
