import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useTournament } from "@/lib/tournamentContext";
import TeamLogo from "@/components/TeamLogo";
import { ChevronLeft, Pencil, Trash2, Upload, Plus } from "lucide-react";
import * as XLSX from "xlsx";
import type { Session } from "@supabase/supabase-js";

export default function AdminPlantillas() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { activeTournamentId } = useTournament();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [jersey, setJersey] = useState("");
  const [position, setPosition] = useState<string>("Jugador");
  const [birth, setBirth] = useState("");
  const [phone, setPhone] = useState("");

  const [editing, setEditing] = useState<any | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<any | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s); setLoading(false);
      if (!s) navigate("/admin/login");
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session); setLoading(false);
      if (!session) navigate("/admin/login");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const { data: isAdmin, isLoading: checkingAdmin } = useQuery({
    queryKey: ["is-admin", session?.user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", session!.user.id).eq("role", "admin").maybeSingle();
      return !!data;
    },
    enabled: !!session,
  });

  const { data: teams } = useQuery({
    queryKey: ["plantillas-teams", activeTournamentId],
    queryFn: async () => {
      const { data } = await supabase.from("teams").select("*").eq("tournament_id", activeTournamentId).order("name");
      return data || [];
    },
    enabled: !!activeTournamentId && !!session && isAdmin === true,
  });

  useEffect(() => {
    if (!selectedTeamId && teams && teams.length > 0) setSelectedTeamId(teams[0].id);
  }, [teams, selectedTeamId]);

  const { data: players, refetch } = useQuery({
    queryKey: ["plantillas-players", selectedTeamId],
    queryFn: async () => {
      const { data } = await supabase.from("players").select("*").eq("team_id", selectedTeamId!).order("jersey_number");
      return data || [];
    },
    enabled: !!selectedTeamId,
  });

  const handleAdd = async () => {
    if (!name.trim() || !jersey.trim() || !selectedTeamId) {
      toast({ title: "Faltan datos", description: "Nombre y dorsal son obligatorios", variant: "destructive" });
      return;
    }
    const payload: any = { name: name.trim(), jersey_number: parseInt(jersey), position, team_id: selectedTeamId };
    if (birth) payload.birth_date = birth;
    if (phone) payload.phone = phone;
    const { error } = await supabase.from("players").insert(payload);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Jugador agregado" });
    setName(""); setJersey(""); setBirth(""); setPhone("");
    refetch();
  };

  const handleUpdate = async () => {
    if (!editing) return;
    const { error } = await supabase.from("players").update({
      name: editing.name,
      jersey_number: parseInt(editing.jersey_number),
      position: editing.position,
    }).eq("id", editing.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Jugador actualizado" });
    setEditing(null);
    refetch();
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const { error } = await supabase.from("players").delete().eq("id", confirmDelete.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Jugador eliminado" });
    setConfirmDelete(null);
    refetch();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTeamId) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const wb = XLSX.read(ev.target?.result, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(ws);
      const toInsert = rows.map((r) => ({
        name: r.name || r.Nombre || r.nombre || "",
        jersey_number: parseInt(r.jersey_number || r.dorsal || r["#"] || "0"),
        position: r.position || r.posicion || "Jugador",
        team_id: selectedTeamId,
      })).filter((r) => r.name && r.jersey_number);
      if (toInsert.length === 0) { toast({ title: "Sin datos válidos", variant: "destructive" }); return; }
      const { error } = await supabase.from("players").insert(toInsert);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: `${toInsert.length} jugadores importados` });
      setImportOpen(false);
      refetch();
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  if (loading || checkingAdmin) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  if (!session) return null;
  if (isAdmin === false) return <div className="min-h-screen flex items-center justify-center">Acceso denegado</div>;

  const selectedTeam = teams?.find((t: any) => t.id === selectedTeamId);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-secondary text-secondary-foreground border-b border-border">
        <div className="container flex items-center justify-between h-14">
          <Link to="/admin" className="flex items-center gap-1 text-sm text-secondary-foreground/70 hover:text-secondary-foreground">
            <ChevronLeft className="w-4 h-4" /> Admin
          </Link>
          <h1 className="font-display text-lg font-bold uppercase">Plantillas</h1>
          <div />
        </div>
      </header>

      <div className="container py-8 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
        <aside className="space-y-1">
          <div className="text-xs uppercase text-muted-foreground font-semibold mb-2">Equipos</div>
          {(teams || []).map((t: any) => (
            <button key={t.id} onClick={() => setSelectedTeamId(t.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-left transition-colors border ${selectedTeamId === t.id ? "border-primary bg-primary/10" : "border-transparent hover:bg-muted/50"}`}>
              <TeamLogo team={t} size={24} />
              <span className="truncate">{t.name}</span>
            </button>
          ))}
        </aside>

        <section className="space-y-6">
          {selectedTeam && (
            <div className="flex items-center gap-3">
              <TeamLogo team={selectedTeam} size={40} />
              <h2 className="font-display text-2xl font-bold">{selectedTeam.name}</h2>
              <div className="ml-auto">
                <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
                  <Upload className="w-4 h-4 mr-1" /> Importar Excel
                </Button>
              </div>
            </div>
          )}

          <Card>
            <CardContent className="p-4 grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
              <div className="md:col-span-2"><Label>Nombre *</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div><Label>Dorsal *</Label><Input type="number" min={1} max={99} value={jersey} onChange={(e) => setJersey(e.target.value)} /></div>
              <div>
                <Label>Posición</Label>
                <Select value={position} onValueChange={setPosition}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Jugador">Jugador</SelectItem>
                    <SelectItem value="Arquera">Arquera</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Nacimiento</Label><Input type="date" value={birth} onChange={(e) => setBirth(e.target.value)} /></div>
              <div><Label>Teléfono</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
              <div className="md:col-span-6">
                <Button onClick={handleAdd}><Plus className="w-4 h-4 mr-1" /> Agregar jugador</Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            {(players || []).map((p: any) => (
              <Card key={p.id}>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-muted flex items-center justify-center font-mono font-bold">{p.jersey_number}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.position || "—"}</div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setEditing({ ...p })}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(p)}><Trash2 className="w-4 h-4" /></Button>
                </CardContent>
              </Card>
            ))}
            {players && players.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Sin jugadores</p>}
          </div>
        </section>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar jugador</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>Nombre</Label><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Dorsal</Label><Input type="number" value={editing.jersey_number} onChange={(e) => setEditing({ ...editing, jersey_number: e.target.value })} /></div>
                <div>
                  <Label>Posición</Label>
                  <Select value={editing.position || "Jugador"} onValueChange={(v) => setEditing({ ...editing, position: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Jugador">Jugador</SelectItem>
                      <SelectItem value="Arquera">Arquera</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={handleUpdate}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>¿Eliminar a {confirmDelete?.name} del equipo?</DialogTitle></DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Importar jugadores desde Excel/CSV</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Columnas esperadas: <code>name</code>, <code>jersey_number</code>, <code>position</code>.</p>
          <input type="file" accept=".xlsx,.xls,.csv" onChange={handleImport} className="text-sm" />
        </DialogContent>
      </Dialog>
    </div>
  );
}