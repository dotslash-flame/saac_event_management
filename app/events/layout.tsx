import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin-config";
import { ClubProvider } from "@/components/providers/club-context";
import EventsLayoutContent from "./events-layout-content";

export default async function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userIsAdmin = isAdmin(user?.email);

  return (
    <ClubProvider>
      <EventsLayoutContent isAdmin={userIsAdmin}>
        {children}
      </EventsLayoutContent>
    </ClubProvider>
  );
}
