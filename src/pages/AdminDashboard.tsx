import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { useTournament } from "@/lib/tournamentContext";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

const MANAGEABLE_STAGES = ["REGULAR", "P1A", "P1B", "SEMI", "P2", "THIRD", "FINAL"] as const;

export default function AdminDashboard() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { activeTournamentId, activeTournament, refresh: refreshTournaments } = useTournament();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newYear, setNewYear] = useState<string>(String(new Date().getFullYear()));
  const [newSemester, setNewSemester] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
      if (!session) navigate("/admin/login");
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (!session) navigate("/admin/login");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const { data: isAdmin, isLoading: checkingAdmin } = useQuery({
    queryKey: ["is-admin", session?.user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session!.user.id)
        .eq("role", "admin")
        .maybeSingle();
      return !!data;
    },
    enabled: !!session,
  });

  const { data: matches } = useQuery({
    queryKey: ["admin-matches", activeTournamentId],
    queryFn: async () => {
      const { data } = await supabase
        .from("matches")
        .select("*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)")
        .eq("tournament_id", activeTournamentId)
        .in("stage", MANAGEABLE_STAGES)
        .order("match_number");
      return data || [];
    },
    enabled: !!session && isAdmin === true && !!activeTournamentId,
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  const createEdition = async () => {
    if (!newName.trim() || !newYear.trim() || !newSemester.trim()) {
      toast({ title: "Faltan datos", description: "Nombre, año y semestre son obligatorios", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      // Archive previous active edition(s)
      const { error: archErr } = await supabase
        .from("tournaments")
        .update({ status: "finished" })
        .eq("status", "active");
      if (archErr) throw archErr;

      // Create the new active edition
      const { error: insErr } = await supabase.from("tournaments").insert({
        name: newName.trim(),
        year: Number(newYear),
        semester: newSemester.trim(),
        season: newSemester.trim(),
        status: "active",
      } as any);
      if (insErr) throw insErr;

      toast({ title: "Edición creada", description: `${newName} está ahora activa.` });
      setDialogOpen(false);
      setNewName("");
      setNewSemester("");
      await refreshTournaments();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  if (loading || checkingAdmin) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  if (!session) return null;
  if (isAdmin === false) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Acceso denegado</h1>
        <p className="text-muted-foreground">No tienes permisos de administrador.</p>
        <Button variant="outline" onClick={handleLogout}>Cerrar sesión</Button>
      </div>
    </div>
  );

  // Sort: live first, then scheduled, then final, then locked (locked sorted by start_time)
  const sortedMatches = [...(matches || [])].sort((a: any, b: any) => {
    const order: Record<string, number> = { live: 0, scheduled: 1, final: 2, locked: 3 };
    const oa = order[a.status] ?? 1;
    const ob = order[b.status] ?? 1;
    if (oa !== ob) return oa - ob;
    if (a.status === "locked" && b.status === "locked") {
      return (a.start_time || "").localeCompare(b.start_time || "");
    }
    return (a.match_number || 0) - (b.match_number || 0);
  });

  const statusLabels: Record<string, string> = {
    scheduled: "Programado",
    live: "🔴 En Juego",
    final: "Final",
    locked: "Cerrado",
  };
  const statusColors: Record<string, string> = {
    scheduled: "secondary",
    live: "destructive",
    final: "default",
    locked: "outline",
  };
  const stageLabels: Record<string, string> = {
    REGULAR: "Regular",
    P1A: "Playoff 1A",
    P1B: "Playoff 1B",
    SEMI: "Semifinal",
    P2: "Playoff 2",
    THIRD: "3ro / 4to",
    FINAL: "Final",
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-secondary text-secondary-foreground border-b border-border">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-1 text-sm text-secondary-foreground/70 hover:text-secondary-foreground transition-colors">
              <ChevronLeft className="w-4 h-4" />
              Sitio
            </Link>
            <span className="text-secondary-foreground/30">|</span>
            <h1 className="font-display text-lg font-bold uppercase">🏒 Admin Panel</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-secondary-foreground/60">{session.user.email}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Cerrar sesión
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="font-display text-2xl font-bold uppercase">Gestión de Partidos</h2>
            {activeTournament && (
              <p className="text-sm text-muted-foreground">
                Edición activa: <span className="font-medium text-foreground">{activeTournament.name}</span>
                {activeTournament.semester && ` • ${activeTournament.semester}`}
              </p>
            )}
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Crear nueva edición</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva edición</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Nombre</Label>
                  <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Copa Newbies III" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Año</Label>
                    <Input value={newYear} onChange={(e) => setNewYear(e.target.value)} type="number" />
                  </div>
                  <div>
                    <Label>Semestre</Label>
                    <Input value={newSemester} onChange={(e) => setNewSemester(e.target.value)} placeholder="2026-2" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  La edición actual pasará a estado "finalizada" y la nueva quedará activa con datos en blanco.
                </p>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={creating}>Cancelar</Button>
                <Button onClick={createEdition} disabled={creating}>{creating ? "Creando..." : "Crear edición"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-3">
          {sortedMatches.map((match: any) => (
            <Card key={match.id} className={match.status === "live" ? "border-destructive" : ""}>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-4 justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant={statusColors[match.status] as any} className="text-xs">
                      {statusLabels[match.status]}
                    </Badge>
                    {match.notes?.toUpperCase().includes("APLAZADO") && (
                      <Badge className="text-xs bg-amber-500 text-white border-amber-500 hover:bg-amber-600">Aplazado</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">#{match.match_number}</span>
                    <Badge variant="outline" className="text-xs">
                      {stageLabels[match.stage] || match.stage}
                    </Badge>
                    <span className="font-medium text-sm">
                      {match.home_team?.name} vs {match.away_team?.name}
                    </span>
                    {(match.status === "final" || match.status === "locked") && (
                      <span className="font-display font-bold">
                        {match.reg_home_score} - {match.reg_away_score}
                      </span>
                    )}
                  </div>

                  <Button size="sm" variant={match.status === "live" ? "default" : "outline"} onClick={() => navigate(`/admin/match/${match.id}`)}>
                    {match.status === "scheduled" ? "Gestionar" : match.status === "live" ? "🔴 En Juego" : "Ver Detalle"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
