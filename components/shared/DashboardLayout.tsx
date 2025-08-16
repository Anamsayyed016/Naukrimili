import React from "react";
import clsx from "clsx";

interface DashboardLayoutProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export default function DashboardLayout({
  sidebar,
  children,
  className
}: DashboardLayoutProps) {
  return (
    <div className={clsx("min-h-screen flex bg-background text-foreground", className)}>
      {/* Sidebar */}
      <aside className="hidden md:block w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border dark:bg-sidebar dark:text-sidebar-foreground">
        {sidebar}
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="h-16 flex items-center px-6 border-b border-border bg-background/80 backdrop-blur sticky top-0 z-10">
          <span className="font-bold text-lg">Dashboard</span>
        </header>
        
        <section className="flex-1 p-6 bg-background">
          {children}
        </section>
      </main>
    </div>
  );
}