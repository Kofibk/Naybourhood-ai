import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  userType: 'admin' | 'developer' | 'agent' | 'broker';
}

export function DashboardLayout({ children, title, userType }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar userType={userType} />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-card border-b border-border px-4 py-3 lg:px-6 flex items-center gap-4 flex-shrink-0">
          <div className="lg:hidden w-10" /> {/* Spacer for mobile menu button */}
          <h1 className="text-xl font-semibold flex-1 truncate">{title}</h1>
        </header>
        <div className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
