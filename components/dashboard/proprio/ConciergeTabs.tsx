"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DashboardCopilotChat } from "@/components/dashboard/DashboardCopilotChat";
import { OwnerTeamThread } from "@/components/dashboard/proprio/OwnerTeamThread";

interface Props {
  ownerId: string;
  firstName: string;
  hasUnread: boolean;
}

export function ConciergeTabs({ ownerId, firstName, hasUnread }: Props) {
  return (
    <Tabs defaultValue="ia" className="w-full">
      <TabsList>
        <TabsTrigger value="ia">Concierge IA</TabsTrigger>
        <TabsTrigger value="equipe">
          Notre équipe
          {hasUnread && <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-gold" />}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="ia">
        <DashboardCopilotChat fullHeight />
      </TabsContent>
      <TabsContent value="equipe">
        <OwnerTeamThread ownerId={ownerId} firstName={firstName} />
      </TabsContent>
    </Tabs>
  );
}
