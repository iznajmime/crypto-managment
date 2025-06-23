import { ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LineChart, Users, ReceiptText } from 'lucide-react';
import { UserNav } from './UserNav';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/clients', label: 'Clients' },
  { href: '/trades', label: 'Trades' },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen w-full">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-black/30 backdrop-blur-lg">
        <div className="container flex h-16 items-center">
          <NavLink to="/" className="mr-8 flex items-center gap-2 font-semibold">
            <LineChart className="h-6 w-6" />
            <span className="hidden sm:inline-block">Portfolio Manager</span>
          </NavLink>
          <nav className="flex flex-1 items-center gap-4 text-sm font-medium lg:gap-6">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={cn(
                  'transition-colors hover:text-primary',
                  location.pathname.startsWith(item.href)
                    ? 'text-primary font-semibold'
                    : 'text-muted-foreground'
                )}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <UserNav />
          </div>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {children}
      </main>
    </div>
  );
}
