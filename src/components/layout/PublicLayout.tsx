import { Link, Outlet, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import copaLogo from "@/assets/copa-newbies-logo.png";
import { useTournament } from "@/lib/tournamentContext";
import { Button } from "@/components/ui/button";

const navLinks = [
{ to: "/", label: "Inicio" },
{ to: "/schedule", label: "Programación" },
{ to: "/standings", label: "Posiciones" },
{ to: "/players", label: "Jugadores" },
{ to: "/playoffs", label: "Playoffs" },
{ to: "/skills", label: "Skills" },
{ to: "/editions", label: "Ediciones" }];


export default function PublicLayout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isReadOnly, currentTournament, clearEdition } = useTournament();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-secondary text-secondary-foreground">
        {isReadOnly && currentTournament && (
          <div className="bg-amber-500 text-white text-center text-sm py-2 px-4 flex flex-wrap gap-2 items-center justify-center">
            <span>Viendo edición: <strong>{currentTournament.name}</strong> — Solo lectura</span>
            <Button size="sm" variant="secondary" className="h-7" onClick={clearEdition}>
              Volver a edición activa
            </Button>
          </div>
        )}
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img alt="Copa Newbies II" className="h-10 w-10 rounded-full object-cover" src="/lovable-uploads/51c394b7-5ebc-4efb-aa3a-db5798c04ef0.png" />
            <span className="font-display text-xl font-bold tracking-wide uppercase">
              Copa Newbies <span className="text-primary">II</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) =>
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                location.pathname === link.to ?
                "bg-primary text-primary-foreground" :
                "hover:bg-secondary/80 text-secondary-foreground/80 hover:text-secondary-foreground"
              )}>

                {link.label}
              </Link>
            )}
            <Link
              to="/admin"
              className="ml-4 px-4 py-2 rounded-md text-xs font-medium bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground transition-colors">

              Admin
            </Link>
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}>

            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile nav */}
        {mobileOpen &&
        <nav className="md:hidden border-t border-border p-4 flex flex-col gap-2">
            {navLinks.map((link) =>
          <Link
            key={link.to}
            to={link.to}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "px-4 py-3 rounded-md text-sm font-medium transition-colors",
              location.pathname === link.to ?
              "bg-primary text-primary-foreground" :
              "hover:bg-secondary/80"
            )}>

                {link.label}
              </Link>
          )}
            <Link
            to="/admin"
            onClick={() => setMobileOpen(false)}
            className="px-4 py-3 rounded-md text-xs font-medium bg-accent text-accent-foreground">

              Admin
            </Link>
          </nav>
        }
      </header>

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-secondary text-secondary-foreground/60 py-6">
        <div className="container text-center text-sm">
          <p>Copa Newbies II • Hockey 2026 • Dashboard Público</p>
        </div>
      </footer>
    </div>);

}