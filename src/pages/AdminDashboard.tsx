import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Users, Palette, Trash2 } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { useTournament } from "@/lib/tournamentContext";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { applyEditionTheme, FONT_OPTIONS } from "@/lib/theme";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MANAGEABLE_STAGES = ["REGULAR", "P1A", "P1B", "SEMI", "P2", "THIRD", "FINAL"] as const;

const COLOR_PALETTE = [
  "#0f1117",
  "#1a1a2e",
  "#16213e",
  "#0a0a0a",
  "#2a2a3e",
  "#ff1493",
  "#e91e63",
  "#cc2200",
  "#8b1a1a",
  "#d81b60",
  "#00b4d8",
  "#0077b6",
  "#0284c7",
  "#38bdf8",
  "#3b82f6",
  "#a8d400",
  "#65a30d",
  "#22c55e",
  "#16a34a",
  "#84cc16",
  "#e8722a",
  "#f97316",
  "#f59e0b",
  "#facc15",
  "#fb923c",
  "#7c3aed",
  "#a855f7",
  "#6d28d9",
  "#ffffff",
  "#f5f5f0",
  "#c0c0c0",
  "#94a3b8",
  "#475569",
  "#1e293b",
];

function ColorSwatchPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-10 rounded border border-border cursor-pointer shrink-0"
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="font-mono" placeholder="#000000" />
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {COLOR_PALETTE.map((hex) => (
          <button
            key={hex}
            type="button"
            title={hex}
            onClick={() => onChange(hex)}
            className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
              value.toLowerCase() === hex.toLowerCase()
                ? "border-foreground ring-2 ring-offset-1 ring-foreground/50"
                : "border-border/50"
            }`}
            style={{ background: hex }}
          />
        ))}
      </div>
    </div>
  );
}

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
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [appearanceColor, setAppearanceColor] = useState<string>("#ff1493");
  const [appearanceLogo, setAppearanceLogo] = useState<string>("");
  const [headerColor, setHeaderColor] = useState<string>("#1a1a2e");
  const [footerColor, setFooterColor] = useState<string>("#1a1a2e");
  const [bgColor, setBgColor] = useState<string>("#ffffff");
  const [heroColor, setHeroColor] = useState<string>("#1a1a2e");
  const [titleColor, setTitleColor] = useState<string>("#ff1493");
  const [textColor, setTextColor] = useState<string>("#1a1a2e");
  const [fontFamily, setFontFamily] = useState<string>("inter");
  const [fontSize, setFontSize] = useState<string>("16");
  const [savingAppearance, setSavingAppearance] = useState(false);
  const qc = useQueryClient();

  useEffect(() => {
    if (activeTournament) {
      const t = activeTournament as any;
      setAppearanceColor(t.primary_color || "#ff1493");
      setAppearanceLogo(t.hero_logo_url || "");
      setHeaderColor(t.header_color || "#1a1a2e");
      setFooterColor(t.footer_color || "#1a1a2e");
      setBgColor(t.bg_color || "#ffffff");
      setHeroColor(t.hero_color || t.header_color || "#1a1a2e");
      setTitleColor(t.title_color || "#ff1493");
      setTextColor(t.text_color || "#1a1a2e");
      setFontFamily(t.font_family || "inter");
      setFontSize(t.font_size || "16");
    }
  }, [activeTournament]);

  const saveAppearance = async () => {
    if (!activeTournamentId) return;
    setSavingAppearance(true);
    try {
      const patch = {
        primary_color: appearanceColor,
        hero_logo_url: appearanceLogo || null,
        header_color: headerColor,
        footer_color: footerColor,
        bg_color: bgColor,
        hero_color: heroColor,
        title_color: titleColor,
        text_color: textColor,
        font_family: fontFamily,
        font_size: fontSize,
      };
      const { error } = await supabase
        .from("tournaments")
        .update(patch as any)
        .eq("id", activeTournamentId);
      if (error) throw error;
      applyEditionTheme(patch);
      toast({ title: "Apariencia guardada y aplicada" });
      setAppearanceOpen(false);
      await refreshTournaments();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSavingAppearance(false);
    }
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
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

  const resetResults = async () => {
    setResetting(true);
    try {
      const { data: matchRows, error: mErr } = await supabase
        .from("matches")
        .select("id")
        .eq("tournament_id", activeTournamentId);
      if (mErr) throw mErr;
      const matchIds = (matchRows || []).map((m: any) => m.id);
      if (matchIds.length > 0) {
        const { error: gErr } = await supabase.from("goal_events").delete().in("match_id", matchIds);
        if (gErr) throw gErr;
        const { error: pErr } = await supabase.from("penalty_events").delete().in("match_id", matchIds);
        if (pErr) throw pErr;
      }
      const { error: uErr } = await supabase
        .from("matches")
        .update({
          reg_home_score: 0,
          reg_away_score: 0,
          status: "scheduled",
          winner_team_id: null,
        })
        .eq("tournament_id", activeTournamentId)
        .eq("stage", "REGULAR");
      if (uErr) throw uErr;
      toast({ title: "Resultados eliminados correctamente" });
      setResetOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-matches"] });
      qc.invalidateQueries({ queryKey: ["standings"] });
      qc.invalidateQueries({ queryKey: ["goal_events"] });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setResetting(false);
    }
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
  if (isAdmin === false)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Acceso denegado</h1>
          <p className="text-muted-foreground">No tienes permisos de administrador.</p>
          <Button variant="outline" onClick={handleLogout}>
            Cerrar sesión
          </Button>
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
            <Link
              to="/"
              className="flex items-center gap-1 text-sm text-secondary-foreground/70 hover:text-secondary-foreground transition-colors"
            >
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
                <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={creating}>
                  Cancelar
                </Button>
                <Button onClick={createEdition} disabled={creating}>
                  {creating ? "Creando..." : "Crear edición"}
                </Button>
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
                      <Badge className="text-xs bg-amber-500 text-white border-amber-500 hover:bg-amber-600">
                        Aplazado
                      </Badge>
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

                  <Button
                    size="sm"
                    variant={match.status === "live" ? "default" : "outline"}
                    onClick={() => navigate(`/admin/match/${match.id}`)}
                  >
                    {match.status === "scheduled"
                      ? "Gestionar"
                      : match.status === "live"
                        ? "🔴 En Juego"
                        : "Ver Detalle"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/admin/plantillas">
            <Button variant="outline">
              <Users className="w-4 h-4 mr-1" /> Plantillas
            </Button>
          </Link>
          <Link to="/admin/apariencia">
            <Button variant="outline">
              <Palette className="w-4 h-4 mr-1" /> Apariencia
            </Button>
          </Link>
          <Button variant="outline" onClick={() => setAppearanceOpen(true)}>
            <Palette className="w-4 h-4 mr-1" /> Apariencia de la edición
          </Button>
        </div>

        <Dialog open={appearanceOpen} onOpenChange={setAppearanceOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Apariencia de la edición activa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "Color primario / acento", value: appearanceColor, set: setAppearanceColor },
                  { label: "Fondo del header", value: headerColor, set: setHeaderColor },
                  { label: "Fondo del footer", value: footerColor, set: setFooterColor },
                  { label: "Fondo de página", value: bgColor, set: setBgColor },
                  { label: "Color del hero", value: heroColor, set: setHeroColor },
                  { label: "Color de títulos", value: titleColor, set: setTitleColor },
                  { label: "Color de texto", value: textColor, set: setTextColor },
                ].map((f) => (
                  <ColorSwatchPicker key={f.label} label={f.label} value={f.value} onChange={f.set} />
                ))}

                <div>
                  <Label>Fuente</Label>
                  <Select value={fontFamily} onValueChange={setFontFamily}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Tamaño base de texto: {fontSize}px</Label>
                  <input
                    type="range"
                    min={12}
                    max={20}
                    step={1}
                    value={Number(fontSize)}
                    onChange={(e) => setFontSize(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <Label>URL del logo (hero)</Label>
                <Input
                  value={appearanceLogo}
                  onChange={(e) => setAppearanceLogo(e.target.value)}
                  placeholder="https://..."
                />
                <div className="mt-2 flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 1024 * 1024) {
                        toast({
                          title: "Imagen muy grande",
                          description: "Máx. 1 MB. Comprime la imagen e inténtalo de nuevo.",
                          variant: "destructive",
                        });
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () => setAppearanceLogo(String(reader.result));
                      reader.readAsDataURL(file);
                    }}
                    className="cursor-pointer"
                  />
                  {appearanceLogo && (
                    <Button type="button" variant="outline" size="sm" onClick={() => setAppearanceLogo("")}>
                      Quitar
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Sube una imagen desde tu dispositivo o pega una URL. Este logo se muestra en el hero de la página de inicio y en el encabezado.
                </p>
                {appearanceLogo && (
                  <img src={appearanceLogo} alt="preview" className="mt-2 h-16 rounded object-contain" />
                )}
              </div>

              <div
                className="border rounded-md overflow-hidden"
                style={{
                  background: bgColor,
                  color: textColor,
                  fontFamily: `'${fontFamily}', sans-serif`,
                  fontSize: `${fontSize}px`,
                }}
              >
                <div className="text-xs text-muted-foreground p-2 bg-muted/30">Vista previa</div>
                <div className="px-4 py-3" style={{ background: headerColor, color: "#fff" }}>
                  Header simulado
                </div>
                <div className="p-4 space-y-2">
                  <div className="font-bold text-xl" style={{ color: titleColor }}>
                    Título de sección
                  </div>
                  <p>Texto de ejemplo con la tipografía y tamaño seleccionados.</p>
                  <button
                    type="button"
                    style={{ background: appearanceColor, color: "#ffffff" }}
                    className="px-4 py-2 rounded-md font-medium text-sm"
                  >
                    Botón primario
                  </button>
                </div>
                <div className="px-4 py-3 text-white text-xs" style={{ background: footerColor }}>
                  Footer simulado
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setAppearanceOpen(false)} disabled={savingAppearance}>
                Cancelar
              </Button>
              <Button onClick={saveAppearance} disabled={savingAppearance}>
                {savingAppearance ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="mt-8 border-2 border-destructive/60 rounded-lg p-5 bg-destructive/5">
          <h3 className="font-display text-lg font-bold uppercase text-destructive mb-2">Zona de Peligro</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Borra todos los goles, sanciones y marcadores del torneo activo. No afecta equipos, jugadores ni el
            calendario.
          </p>
          <Button variant="destructive" onClick={() => setResetOpen(true)}>
            <Trash2 className="w-4 h-4 mr-1" /> Borrar Resultados
          </Button>
        </div>

        <Dialog open={resetOpen} onOpenChange={setResetOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Estás seguro?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Esta acción borrará TODOS los goles, sanciones y marcadores del torneo activo. No afecta equipos,
              jugadores ni el calendario. Esta acción es IRREVERSIBLE.
            </p>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setResetOpen(false)} disabled={resetting}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={resetResults} disabled={resetting}>
                {resetting ? "Borrando..." : "Confirmar y borrar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
