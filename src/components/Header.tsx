import { Link, useLocation } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, PieChart } from "lucide-react";
import { cn } from "@/lib/utils";

// The Dashboard link is now handled separately, combined with the icon.
const navLinks = [
  { to: "/trades", label: "Trades" },
  { to: "/clients", label: "Clients" },
];

export function Header() {
  const { pathname } = useLocation();

  return (
    <header
      className={cn(
        "sticky top-0 z-50 flex h-16 items-center justify-between px-4 md:px-6",
        "glass-card",
        "rounded-none"
      )}
    >
      <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
        {/* Combined Dashboard link with icon and text */}
        <Link
          to="/"
          className={cn(
            "flex items-center gap-2 transition-colors hover:text-white",
            pathname === "/" ? "text-white font-bold" : "text-muted-foreground"
          )}
        >
          <PieChart className="h-5 w-5" />
          <span>Dashboard</span>
        </Link>

        {/* Other links */}
        {navLinks.map(({ to, label }) => {
          const isActive = pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "transition-colors hover:text-white",
                isActive ? "text-white font-bold" : "text-muted-foreground"
              )}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Mobile Menu */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <nav className="grid gap-6 text-lg font-medium">
            <Link
              to="/"
              className="mb-4 flex items-center gap-2 text-lg font-semibold"
            >
              <PieChart className="h-6 w-6" />
              <span>Crypto Manager</span>
            </Link>

            {/* Add Dashboard link for mobile nav */}
            <Link
              to="/"
              className={cn(
                "transition-colors hover:text-white",
                pathname === "/"
                  ? "text-white font-bold"
                  : "text-muted-foreground"
              )}
            >
              Dashboard
            </Link>

            {navLinks.map(({ to, label }) => {
              const isActive = pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    "transition-colors hover:text-white",
                    isActive
                      ? "text-white font-bold"
                      : "text-muted-foreground"
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}
