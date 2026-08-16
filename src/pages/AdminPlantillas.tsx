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
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Pencil, Trash2, Upload, Plus, FileUp } from "lucide-react";
import { parseCsv, normalizeName } from "@/lib/csv";
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
  const [csvOpen, setCsvOpen] = useState(false);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [csvBusy, setCsvBusy] = useState(false);
  const [csvPendingNew, setCsvPendingNew] = useState<any[]>([]);
  const [csvPendingDuplicates, setCsvPendingDuplicates] = useState<any[]>([]);
  const [csvDuplicatesOpen, setCsvDuplicatesOpen] = useState(false);
  const [csvLastErrors, setCsvLastErrors] = useState<string[]>([]);
  const [staffFirst, setStaffFirst] = useState("");
  const [staffLast, setStaffLast] = useState("");
  const [staffRole, setStaffRole] = useState("ENTRENADOR");
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleTeamLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !selectedTeamId) return;
    setUploadingLogo(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `teams/${selectedTeamId}.${ext}`;
      const { error: upErr } = await supabase.storage.from("sponsors").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const publicUrl = supabase.storage.from("sponsors").getPublicUrl(path).data.publicUrl;
      const { error } = await supabase
        .from("teams")
        .update({ logo_url: `${publicUrl}?v=${Date.now()}` })
        .eq("id", selectedTeamId);
      if (error) throw error;
      toast({ title: "Logo actualizado" });
      await qc.invalidateQueries({ queryKey: ["plantillas-teams"] });
      qc.invalidateQueries({ queryKey: ["standings-full"] });
      qc.invalidateQueries({ queryKey: ["teams"] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setUploadingLogo(false);
    }
  };

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

  const { data: staff, refetch: refetchStaff } = useQuery({
    queryKey: ["plantillas-staff", selectedTeamId],
    queryFn: async () => {
      const { data } = await supabase.from("team_staff").select("*").eq("team_id", selectedTeamId!);
      return data || [];
    },
    enabled: !!selectedTeamId,
  });

  const addStaff = async () => {
    if (!staffFirst.trim() || !staffLast.trim() || !selectedTeamId) {
      toast({ title: "Faltan datos", description: "Nombre y apellido son obligatorios", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("team_staff").insert({
      team_id: selectedTeamId,
      first_name: staffFirst.trim(),
      last_name: staffLast.trim(),
      role: staffRole,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Miembro agregado" });
    setStaffFirst(""); setStaffLast("");
    refetchStaff();
  };

  const deleteStaff = async (s: any) => {
    if (!confirm(`¿Eliminar a ${s.first_name} ${s.last_name} del cuerpo técnico?`)) return;
    const { error } = await supabase.from("team_staff").delete().eq("id", s.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Miembro eliminado" });
    refetchStaff();
  };

  const STAFF_ROLES = ["ENTRENADOR", "ASISTENTE", "DELEGADO"];

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setCsvErrors([]);
    const reader = new FileReader();
    reader.onload = async () => {
      setCsvBusy(true);
      try {
        const rows = parseCsv(String(reader.result));
        if (rows.length === 0) { toast({ title: "CSV vacío", variant: "destructive" }); return; }
        const errors: string[] = [];
        const playerRows: any[] = [];
        const staffRows: any[] = [];

        // Fetch existing players and staff for all teams in this edition, once, for dedup matching
        const teamIds = (teams || []).map((t: any) => t.id);
        const { data: existingPlayers } = teamIds.length
          ? await supabase.from("players").select("id, team_id, first_name, last_name").in("team_id", teamIds)
          : { data: [] as any[] };
        const { data: existingStaff } = teamIds.length
          ? await supabase.from("team_staff").select("id, team_id, first_name, last_name").in("team_id", teamIds)
          : { data: [] as any[] };

        rows.forEach((r, i) => {
          const line = i + 2;
          const teamName = r["equipo"] || "";
          const team = (teams || []).find((t: any) => normalizeName(t.name) === normalizeName(teamName));
          if (!team) {
            errors.push(`Fila ${line}: equipo "${teamName}" no existe en esta edición`);
            return;
          }
          const nombre = r["nombre"] || "";
          const apellido = r["apellido"] || "";
          if (!nombre) { errors.push(`Fila ${line}: falta "nombre"`); return; }
          const posicion = (r["posicion"] || "").trim();
          const posUpper = normalizeName(posicion).toUpperCase();

          if (STAFF_ROLES.includes(posUpper)) {
            const match = (existingStaff || []).find((s: any) =>
              s.team_id === team.id &&
              normalizeName(s.first_name || "") === normalizeName(nombre) &&
              normalizeName(s.last_name || "") === normalizeName(apellido)
            );
            const row = { kind: "staff", line, team_id: team.id, teamName: team.name, first_name: nombre, last_name: apellido, role: posUpper };
            if (match) {
              staffRows.push({ ...row, existingId: match.id, isDuplicate: true });
            } else {
              staffRows.push({ ...row, isDuplicate: false });
            }
          } else {
            const dorsal = parseInt(r["dorsal"] || "", 10);
            if (!Number.isFinite(dorsal)) { errors.push(`Fila ${line}: dorsal inválido "${r["dorsal"] || ""}"`); return; }
            const match = (existingPlayers || []).find((p: any) =>
              p.team_id === team.id &&
              normalizeName(p.first_name || "") === normalizeName(nombre) &&
              normalizeName(p.last_name || "") === normalizeName(apellido)
            );
            const row = {
              kind: "player", line, team_id: team.id, teamName: team.name,
              first_name: nombre, last_name: apellido, name: `${nombre} ${apellido}`.trim(),
              jersey_number: dorsal, position: posicion || "Jugador",
            };
            if (match) {
              playerRows.push({ ...row, existingId: match.id, isDuplicate: true });
            } else {
              playerRows.push({ ...row, isDuplicate: false });
            }
          }
        });

        const allRows = [...playerRows, ...staffRows];
        const newRows = allRows.filter((r) => !r.isDuplicate);
        const duplicateRows = allRows.filter((r) => r.isDuplicate);

        setCsvLastErrors(errors);

        if (duplicateRows.length === 0) {
          // No duplicates found — keep prior behavior, insert everything immediately
          await insertCsvRows(newRows, []);
          setCsvErrors(errors);
          toast({
            title: `${newRows.filter(r=>r.kind==="player").length} jugadores y ${newRows.filter(r=>r.kind==="staff").length} miembros del cuerpo técnico importados`,
            description: errors.length ? `${errors.length} filas con errores` : undefined,
            variant: errors.length ? "destructive" : undefined,
          });
          refetch();
          refetchStaff();
        } else {
          // Duplicates found — pause and let the user choose what to do
          setCsvPendingNew(newRows);
          setCsvPendingDuplicates(duplicateRows);
          setCsvDuplicatesOpen(true);
        }
      } finally {
        setCsvBusy(false);
      }
    };
    reader.readAsText(file);
  };

  const insertCsvRows = async (newRows: any[], overwriteRows: any[]) => {
    const errors: string[] = [];
    const newPlayers = newRows.filter((r) => r.kind === "player").map((r) => ({
      team_id: r.team_id, first_name: r.first_name, last_name: r.last_name,
      name: r.name, jersey_number: r.jersey_number, position: r.position,
    }));
    const newStaff = newRows.filter((r) => r.kind === "staff").map((r) => ({
      team_id: r.team_id, first_name: r.first_name, last_name: r.last_name, role: r.role,
    }));
    if (newPlayers.length > 0) {
      const { error } = await supabase.from("players").insert(newPlayers);
      if (error) errors.push(`Jugadores nuevos: ${error.message}`);
    }
    if (newStaff.length > 0) {
      const { error } = await supabase.from("team_staff").insert(newStaff);
      if (error) errors.push(`Cuerpo técnico nuevo: ${error.message}`);
    }
    for (const r of overwriteRows) {
      if (r.kind === "player") {
        const { error } = await supabase.from("players").update({
          jersey_number: r.jersey_number, position: r.position, name: r.name,
        }).eq("id", r.existingId);
        if (error) errors.push(`Actualizar ${r.first_name} ${r.last_name}: ${error.message}`);
      } else {
        const { error } = await supabase.from("team_staff").update({
          role: r.role,
        }).eq("id", r.existingId);
        if (error) errors.push(`Actualizar ${r.first_name} ${r.last_name}: ${error.message}`);
      }
    }
    return errors;
  };

  const resolveCsvImport = async (action: "omitir" | "sobrescribir" | "cancelar") => {
    setCsvDuplicatesOpen(false);
    if (action === "cancelar") {
      setCsvPendingNew([]);
      setCsvPendingDuplicates([]);
      toast({ title: "Importación cancelada", description: "No se insertó ni modificó ningún registro" });
      return;
    }
    setCsvBusy(true);
    try {
      const overwriteRows = action === "sobrescribir" ? csvPendingDuplicates : [];
      const insertErrors = await insertCsvRows(csvPendingNew, overwriteRows);
      const allErrors = [...csvLastErrors, ...insertErrors];
      setCsvErrors(allErrors);
      const insertedCount = csvPendingNew.length;
      const updatedCount = action === "sobrescribir" ? csvPendingDuplicates.length : 0;
      const skippedCount = action === "omitir" ? csvPendingDuplicates.length : 0;
      toast({
        title: `${insertedCount} nuevos${updatedCount ? `, ${updatedCount} actualizados` : ""}${skippedCount ? `, ${skippedCount} omitidos` : ""}`,
        description: allErrors.length ? `${allErrors.length} filas con errores` : undefined,
        variant: allErrors.length ? "destructive" : undefined,
      });
      refetch();
      refetchStaff();
    } finally {
      setCsvBusy(false);
      setCsvPendingNew([]);
      setCsvPendingDuplicates([]);
    }
  };

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
                <label className="mr-2 inline-flex">
                  <input type="file" accept="image/*" className="hidden" onChange={handleTeamLogo} disabled={uploadingLogo} />
                  <Button variant="outline" size="sm" asChild>
                    <span className="cursor-pointer">
                      <Upload className="w-4 h-4 mr-1" /> {uploadingLogo ? "Subiendo..." : "Subir logo"}
                    </span>
                  </Button>
                </label>
                <Button variant="outline" size="sm" className="mr-2" onClick={() => setCsvOpen(true)}>
                  <FileUp className="w-4 h-4 mr-1" /> Importar CSV
                </Button>
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

          <div className="space-y-3">
            <h3 className="font-display text-lg font-bold uppercase">Cuerpo Técnico</h3>
            <Card>
              <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                <div><Label>Nombre *</Label><Input value={staffFirst} onChange={(e) => setStaffFirst(e.target.value)} /></div>
                <div><Label>Apellido *</Label><Input value={staffLast} onChange={(e) => setStaffLast(e.target.value)} /></div>
                <div>
                  <Label>Rol</Label>
                  <Select value={staffRole} onValueChange={setStaffRole}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ENTRENADOR">Entrenador</SelectItem>
                      <SelectItem value="ASISTENTE">Asistente</SelectItem>
                      <SelectItem value="DELEGADO">Delegado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={addStaff}><Plus className="w-4 h-4 mr-1" /> Agregar</Button>
              </CardContent>
            </Card>

            <div className="space-y-2">
              {(staff || []).map((s: any) => (
                <Card key={s.id}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0 font-medium truncate">{s.first_name} {s.last_name}</div>
                    <Badge variant="secondary" className="text-xs">{s.role || "—"}</Badge>
                    <Button variant="ghost" size="icon" onClick={() => deleteStaff(s)}><Trash2 className="w-4 h-4" /></Button>
                  </CardContent>
                </Card>
              ))}
              {staff && staff.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Sin cuerpo técnico</p>}
            </div>
          </div>
        </section>
      </div>

      {/* CSV import dialog (roster + staff) */}
      <Dialog open={csvOpen} onOpenChange={(o) => { setCsvOpen(o); if (!o) setCsvErrors([]); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Importar CSV (jugadores y cuerpo técnico)</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Columnas: <code>nombre, apellido, dorsal, equipo, posicion</code>. Si la posición es
            {" "}<code>entrenador</code>, <code>asistente</code> o <code>delegado</code>, la fila se registra en el
            cuerpo técnico. Los equipos se buscan solo dentro de la edición activa.
          </p>
          <input type="file" accept=".csv,text/csv" onChange={handleCsvImport} disabled={csvBusy} className="text-sm" />
          {csvErrors.length > 0 && (
            <div className="max-h-56 overflow-y-auto rounded-md border border-destructive/50 bg-destructive/5 p-3 space-y-1">
              {csvErrors.map((err, i) => (
                <p key={i} className="text-xs text-destructive">{err}</p>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={csvDuplicatesOpen} onOpenChange={(o) => { if (!o) resolveCsvImport("cancelar"); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Se encontraron registros duplicados</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            {csvPendingNew.length} fila(s) nueva(s) se insertarán sin problema.
            {" "}Se encontraron <strong>{csvPendingDuplicates.length}</strong> fila(s) que ya existen
            (mismo nombre, apellido y equipo). Elige qué hacer con ellas:
          </p>
          <div className="max-h-56 overflow-y-auto rounded-md border p-3 space-y-1">
            {csvPendingDuplicates.map((r, i) => (
              <p key={i} className="text-xs">
                Fila {r.line}: <strong>{r.first_name} {r.last_name}</strong> — {r.teamName}
              </p>
            ))}
          </div>
          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Button onClick={() => resolveCsvImport("sobrescribir")} disabled={csvBusy}>
              Sobrescribir duplicados (actualiza dorsal/posición/rol con los datos del CSV)
            </Button>
            <Button variant="secondary" onClick={() => resolveCsvImport("omitir")} disabled={csvBusy}>
              Omitir duplicados (solo inserta los nuevos)
            </Button>
            <Button variant="ghost" onClick={() => resolveCsvImport("cancelar")} disabled={csvBusy}>
              Cancelar (no insertar ni modificar nada)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
