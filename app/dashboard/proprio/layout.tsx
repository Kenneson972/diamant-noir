import { ProprioChrome } from "@/components/dashboard/proprio/ui";
import { ReactNode } from "react";

export default function ProprioLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-offwhite">
      <ProprioChrome />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
