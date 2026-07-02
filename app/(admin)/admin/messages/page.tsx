"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AdminPageIntro } from "@/components/dashboard/admin/AdminPageIntro";
import { AdminOwnerMessagesPanel } from "@/components/dashboard/admin/AdminOwnerMessagesPanel";
import { AdminTravelerChatPanel } from "@/components/dashboard/admin/AdminTravelerChatPanel";
import { AdminRequestsPanel } from "@/components/dashboard/admin/AdminRequestsPanel";

export default function AdminMessagesPage() {
  return (
    <div className="space-y-6">
      <AdminPageIntro
        title="Messages"
        description="Toute la relation client Kayvila : propriétaires, locataires, demandes."
      />
      <Tabs defaultValue="proprietaires" className="w-full">
        <TabsList>
          <TabsTrigger value="proprietaires">Propriétaires</TabsTrigger>
          <TabsTrigger value="locataires">Locataires</TabsTrigger>
          <TabsTrigger value="demandes">Demandes</TabsTrigger>
        </TabsList>
        <TabsContent value="proprietaires">
          <AdminOwnerMessagesPanel />
        </TabsContent>
        <TabsContent value="locataires">
          <AdminTravelerChatPanel />
        </TabsContent>
        <TabsContent value="demandes">
          <AdminRequestsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
