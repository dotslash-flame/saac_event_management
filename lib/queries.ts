"use server";

import { createServiceRoleClient } from "./supabase/service-role";
import { revalidatePath } from "next/cache";
import type { Event, EventReview, CreateEventData } from "./types";

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
      return { success: false, error: eventError.message };
    }

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

    if (datePreferencesToInsert.length > 0) {
      const { error: dateError } = await supabase
        .schema("saac_thingy")
        .from("event_date_preference")
        .insert(datePreferencesToInsert);

      if (dateError) {
        return { success: false, error: dateError.message };
      }
    }

    // Add budget request if provided
    if (data.budgetAmount && data.budgetPurpose) {

      const { error: budgetError } = await supabase
        .schema("saac_thingy")
        .from("budget_request")
        .insert({
          event_id: eventData.id,
          budget_amt: parseFloat(data.budgetAmount),
          purpose: data.budgetPurpose,
        });

      if (budgetError) {
        return { success: false, error: budgetError.message };
      }
    }

    // Revalidate the events page
    revalidatePath("/events");

    return { success: true, event: eventData };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}


// SERVER-SIDE REACT QUERY FUNCTIONS

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
    throw new Error(error.message);
  }

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
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
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
      return { success: false, error: error.message };
    }

    return { success: true, review: reviewData };
  } catch (error) {
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
        return { success: false, error: insertError.message };
      }
    }

    return { success: true };
  } catch (error) {
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
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
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
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}


// Add Admin Event Review
export async function addAdminEventReview(data: {
  eventId: string;
  adminEmail: string;
  comment: string;
}): Promise<{ success: boolean; error?: string; review?: EventReview }> {
  "use server";
  try {
    const supabase = createServiceRoleClient();

    // First, get or create admin record
    const { data: admin, error: adminFetchError } = await supabase
      .schema("saac_thingy")
      .from("admin")
      .select("id")
      .eq("email_id", data.adminEmail)
      .maybeSingle();

    let adminId = admin?.id;

    // If admin doesn't exist, create one
    if (!admin) {
      const adminName = data.adminEmail.split("@")[0];
      const { data: newAdmin, error: createError } = await supabase
        .schema("saac_thingy")
        .from("admin")
        .insert({
          name: adminName,
          email_id: data.adminEmail,
        })
        .select("id")
        .single();

      if (createError) {
        return { success: false, error: createError.message };
      }

      adminId = newAdmin.id;
    }

    // Now create the review
    const { data: reviewData, error } = await supabase
      .schema("saac_thingy")
      .from("event_review")
      .insert({
        event_id: data.eventId,
        admin_id: adminId,
        comment: data.comment,
      })
      .select(
        `
        *,
        admin (*),
        club (*)
      `
      )
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, review: reviewData };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Fetch single event by ID (server-side)
export async function fetchEventById(eventId: string): Promise<Event | null> {
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
    `
    )
    .eq("id", eventId)
    .single();

  if (error) {
    console.error("[fetchEventById] Error:", error);
    return null;
  }

  return data as unknown as Event;
}
