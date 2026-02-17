import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role"; // Add this
import { redirect } from "next/navigation";
import EventsClient from "./events-client";
import { fetchEventsForClub } from "@/lib/queries";

export default async function EventsPage() {
  // Use regular client for auth
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  console.log("[EventsPage] User email:", user.email);

  const supabaseAdmin = createServiceRoleClient();

  // Get club info from database
  const { data: club, error: clubError } = await supabaseAdmin
    .schema("saac_thingy")
    .from("club")
    .select("*")
    .eq("club_email", user.email)
    .single();

  console.log("[EventsPage] Club query result:", { club, error: clubError });

  if (clubError || !club) {
    console.error("[EventsPage] Club fetch error:", clubError);
    
    // what clubs exist
    const { data: allClubs } = await supabaseAdmin
      .schema("saac_thingy")
      .from("club")
      .select("club_email");
    
    console.log("[EventsPage] Available club emails:", allClubs?.map(c => c.club_email));
    
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive mb-2">
            Club Not Found
          </h1>
          <p className="text-muted-foreground">
            No club found for email: <strong>{user.email}</strong>
          </p>
          <p className="text-sm text-muted-foreground">
            Please make sure your club is registered in the system.
          </p>
          <details className="mt-4 text-left max-w-md mx-auto">
            <summary className="cursor-pointer text-sm font-medium">
              Debug Info
            </summary>
            <pre className="mt-2 p-4 bg-muted rounded text-xs overflow-auto">
              {JSON.stringify({ 
                userEmail: user.email,
                error: clubError?.message || "No club found",
                availableEmails: allClubs?.map(c => c.club_email) || []
              }, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    );
  }

  // Fetch events using server action
  const events = await fetchEventsForClub(club.id);

  return (
    <EventsClient 
      club={club} 
      initialEvents={events} 
      user={user}
    />
  );
}
