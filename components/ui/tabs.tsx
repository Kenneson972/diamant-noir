"use client";

import * as React from "react";
import { Tabs as HeroTabs } from "@heroui/react";
import { cn } from "@/lib/utils";

type TabsContextValue = {
  value: string;
  onValueChange?: (value: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

type TabsProps = {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
};

const Tabs = ({ defaultValue, value, onValueChange, children, className }: TabsProps) => {
  const [internal, setInternal] = React.useState(defaultValue ?? "");
  const current = value ?? internal;
  const setValue = (next: string) => {
    if (value === undefined) setInternal(next);
    onValueChange?.(next);
  };

  return (
    <TabsContext.Provider value={{ value: current, onValueChange: setValue }}>
      <HeroTabs
        className={className}
        selectedKey={current}
        onSelectionChange={(key) => setValue(String(key))}
      >
        {children}
      </HeroTabs>
    </TabsContext.Provider>
  );
};

const TabsList = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => (
  <HeroTabs.List
    className={cn(
      "inline-flex h-10 w-full items-center justify-center border border-navy/8 bg-navy/5 p-1 text-navy/55",
      className
    )}
  >
    {children}
  </HeroTabs.List>
);

const TabsTrigger = ({
  className,
  value,
  children,
}: {
  className?: string;
  value: string;
  children: React.ReactNode;
}) => (
  <HeroTabs.Tab
    id={value}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[selected=true]:bg-white data-[selected=true]:text-navy data-[selected=true]:shadow-sm",
      className
    )}
  >
    {children}
  </HeroTabs.Tab>
);

const TabsContent = ({
  className,
  value,
  children,
}: {
  className?: string;
  value: string;
  children: React.ReactNode;
}) => {
  const ctx = React.useContext(TabsContext);
  if (!ctx || ctx.value !== value) return null;
  return (
    <div
      className={cn(
        "mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2",
        className
      )}
    >
      {children}
    </div>
  );
};

export { Tabs, TabsList, TabsTrigger, TabsContent };
