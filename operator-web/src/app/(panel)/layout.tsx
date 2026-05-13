// Layout всех админ-разделов: sidebar 240px + main column.
// Header (PageHeader) рендерит сама страница — это эталонный паттерн (operator.jsx OpShell+OpHeader).
import * as React from "react";
import Sidebar from "@/components/Sidebar";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar />
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
