import { Link, Outlet, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Menu, Home as HomeIcon, Calendar, BarChart, Users } from "lucide-react";
import { useState } from "react";
import copaLogo from "@/assets/copa-newbies-logo.png";
import { useTournament } from "@/lib/tournamentContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const navLinks = [
  { to: "/", label: "Inicio" },
  { to: "/schedule", label: "Programación" },
  { to: "/standings", label: "Posiciones" },
  { to: "/players", label: "Jugadores" },
  { to: "/estadisticas", label: "Estadísticas" },
  { to: "/playoffs", label: "Playoffs" },
  { to: "/skills", label: "Skills" },
  { to: "/editions", label: "Ediciones" },
];

const bottomBarLinks = [
  { to: "/", label: "Inicio", icon: HomeIcon },
  { to: "/schedule", label: "Programación", icon: Calendar },
  { to: "/standings", label: "Posiciones", icon: BarChart },
  { to: "/players", label: "Jugadores", icon: Users },
];

const moreLinks = [
  { to: "/estadisticas", label: "Estadísticas" },
  { to: "/playoffs", label: "Playoffs" },
  { to: "/skills", label: "Skills" },
  { to: "/editions", label: "Ediciones" },
  { to: "/admin", label: "Admin" },
];

export default function PublicLayout() {
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const { isReadOnly, currentTournament, viewedTournament, clearEdition } = useTournament();
  const fullName = viewedTournament?.name ?? "Copa Newbies III";
  const nameParts = fullName.trim().split(/\s+/);
  const nameSuffix = nameParts.length > 1 ? nameParts.pop()! : "";
  const namePrefix = nameParts.join(" ");
  const headerLogo = viewedTournament?.hero_logo_url || "/lovable-uploads/51c394b7-5ebc-4efb-aa3a-db5798c04ef0.png";
  const withEdition = (path: string) =>
    isReadOnly && currentTournament ? `${path}?edition=${currentTournament.id}` : path;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header
        className="sticky top-0 z-50 border-b border-border bg-secondary text-secondary-foreground"
        style={{ background: "var(--header-bg, hsl(var(--secondary)))" }}
      >
        {isReadOnly && currentTournament && (
          <div className="bg-amber-500 text-white text-center text-sm py-2 px-4 flex flex-wrap gap-2 items-center justify-center">
            <span>
              Viendo edición: <strong>{currentTournament.name}</strong> — Solo lectura
            </span>
            <Button size="sm" variant="secondary" className="h-7" onClick={clearEdition}>
              Volver a edición activa
            </Button>
          </div>
        )}
        <div className="container flex h-16 items-center justify-between">
          <Link to={withEdition("/")} className="flex items-center gap-3">
            <img alt={fullName} className="h-10 w-10 rounded-full object-cover" src={headerLogo} />
            <span className="font-display text-xl font-bold tracking-wide uppercase">
              {namePrefix} {nameSuffix && <span className="text-primary">{nameSuffix}</span>}
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={withEdition(link.to)}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                  location.pathname === link.to
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-secondary/80 text-secondary-foreground/80 hover:text-secondary-foreground",
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/admin"
              className="ml-4 px-4 py-2 rounded-md text-xs font-medium bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              Admin
            </Link>
          </nav>

        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* Footer */}
      <footer
        className="border-t border-border bg-secondary text-secondary-foreground/80 py-6"
        style={{ background: "var(--footer-bg, hsl(var(--secondary)))" }}
      >
        <div className="container text-center text-sm">
          <p>
            Copa Newbies Colombia · By {" "}
            <a
              href="https://www.instagram.com/hlc_hockeycolombia"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Fundación HLC
            </a>{" "}
            - César Rosero
          </p>
        </div>
      </footer>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
        <div className="grid grid-cols-5">
          {bottomBarLinks.map((link) => {
            const Icon = link.icon;
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={withEdition(link.to)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2 text-xs transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{link.label}</span>
              </Link>
            );
          })}
          <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
            <SheetTrigger asChild>
              <button
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2 text-xs transition-colors",
                  moreLinks.some((l) => l.to === location.pathname)
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Menu className="h-5 w-5" />
                <span className="text-[10px] font-medium">Más</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-xl">
              <SheetHeader>
                <SheetTitle>Más opciones</SheetTitle>
              </SheetHeader>
              <div className="grid gap-2 mt-4 pb-6">
                {moreLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={withEdition(link.to)}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "px-4 py-3 rounded-md text-sm font-medium transition-colors",
                      location.pathname === link.to
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/70",
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </div>
  );
}
