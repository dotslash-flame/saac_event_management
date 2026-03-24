"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useClub } from "@/components/providers/club-context";

interface EventsLayoutContentProps {
  children: React.ReactNode;
  isAdmin: boolean;
}

export default function EventsLayoutContent({
  children,
  isAdmin,
}: EventsLayoutContentProps) {
  const { club, openCreateEventDialog } = useClub();

  return (
    <SidebarProvider>
      <AppSidebar
        onCreateEvent={openCreateEventDialog}
        clubName={club?.club_name}
        clubEmail={club?.club_email}
        isAdmin={isAdmin}
      />
      <SidebarInset>
        <AppHeader />
        <div className="flex-1 overflow-auto">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
