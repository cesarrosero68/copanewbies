import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { parseCsv, normalizeName } from "@/lib/csv";
import { useQueryClient } from "@tanstack/react-query";

const STAGES = ["REGULAR", "P1A", "P1B", "SEMI", "P2", "FINAL", "THIRD"];

type Row = {
  match_number: number | null;
  matchday: string;
  homeName: string;
  awayName: string;
  home_team_id: string | null;
  away_team_id: string | null;
  homeIsPlaceholder: boolean;
  awayIsPlaceholder: boolean;
  start_time: string | null;
  rawDate: string;
  stage: string;
  venue: string;
  errors: string[];
};

export default function ImportCalendarDialog({
  open,
  onOpenChange,
  tournamentId,
  teams,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  tournamentId: string | null;
  teams: any[];
}) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [importing, setImporting] = useState(false);
  const qc = useQueryClient();

  const findTeam = (name: string) =>
    teams.find((t: any) => normalizeName(t.name) === normalizeName(name)) || null;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseCsv(String(reader.result));
      if (parsed.length === 0) {
        toast({ title: "CSV vacío", variant: "destructive" });
        return;
      }
      const mapped: Row[] = parsed.map((r) => {
        const errors: string[] = [];
        const homeName = r["local"] || "";
        const awayName = r["visitante"] || "";
        const home = findTeam(homeName);
        const away = findTeam(awayName);
        // Si el equipo no coincide con ninguno registrado, se guarda como texto
        // "por definir" (placeholder) en vez de marcar error — útil para partidos
        // de playoff cuyo rival real todavía no se conoce (ej. "1º de la tabla").
        const homeIsPlaceholder = !home && homeName.trim().length > 0;
        const awayIsPlaceholder = !away && awayName.trim().length > 0;
        if (!home && !homeIsPlaceholder) errors.push(`Falta el equipo local`);
        if (!away && !awayIsPlaceholder) errors.push(`Falta el equipo visitante`);

        const stage = (r["fase"] || "").toUpperCase().trim();
        if (!STAGES.includes(stage)) errors.push(`Fase inválida: "${r["fase"] || ""}"`);

        const fecha = (r["fecha"] || "").trim();
        const hora = (r["hora"] || "").trim();
        let start_time: string | null = null;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
          errors.push(`Fecha inválida (YYYY-MM-DD): "${fecha}"`);
        } else if (!/^\d{1,2}:\d{2}$/.test(hora)) {
          errors.push(`Hora inválida (HH:MM): "${hora}"`);
        } else {
          const [h, m] = hora.split(":");
          // Colombia = UTC-5 (sin horario de verano)
          start_time = new Date(`${fecha}T${h.padStart(2, "0")}:${m}:00-05:00`).toISOString();
        }

        const num = parseInt(r["partido_num"] || "", 10);
        const venue = (r["sede"] || "").trim();

        return {
          match_number: Number.isFinite(num) ? num : null,
          matchday: r["fecha_num"] || "",
          homeName,
          awayName,
          home_team_id: home?.id ?? null,
          away_team_id: away?.id ?? null,
          homeIsPlaceholder,
          awayIsPlaceholder,
          start_time,
          rawDate: `${fecha} ${hora}`,
          stage,
          venue,
          errors,
        };
      });
      setRows(mapped);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const validRows = (rows || []).filter((r) => r.errors.length === 0);
  const errorCount = (rows || []).length - validRows.length;

  const confirmImport = async () => {
    if (!tournamentId || validRows.length === 0) return;
    setImporting(true);
    try {
      const payload = validRows.map((r) => ({
        tournament_id: tournamentId,
        stage: r.stage as any,
        home_team_id: r.home_team_id,
        away_team_id: r.away_team_id,
        home_team_label: r.homeIsPlaceholder ? r.homeName : null,
        away_team_label: r.awayIsPlaceholder ? r.awayName : null,
        start_time: r.start_time,
        match_number: r.match_number,
        status: "scheduled" as any,
        venue: r.venue || null,
        notes: r.matchday ? `Jornada ${r.matchday}` : null,
      }));
      const { error } = await supabase.from("matches").insert(payload as any);
      if (error) throw error;
      toast({ title: `${payload.length} partidos importados` });
      qc.invalidateQueries({ queryKey: ["admin-matches"] });
      qc.invalidateQueries({ queryKey: ["matches"] });
      setRows(null);
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Error al importar", description: e.message, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setRows(null);
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar calendario desde CSV</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Columnas esperadas: <code>fecha_num, partido_num, local, visitante, fecha, hora, fase, sede</code>. Fecha
          en formato <code>YYYY-MM-DD</code>, hora <code>HH:MM</code> (hora de Colombia). Fases válidas:{" "}
          {STAGES.join(", ")}. La columna <code>sede</code> es opcional (nombre del lugar, ej. "Golden Sport Center").
        </p>

        <input type="file" accept=".csv,text/csv" onChange={handleFile} className="text-sm" />

        {rows && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline">{rows.length} filas</Badge>
              <Badge>{validRows.length} válidas</Badge>
              {errorCount > 0 && <Badge variant="destructive">{errorCount} con errores</Badge>}
            </div>
            <div className="border rounded-md overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-2 text-left">#</th>
                    <th className="p-2 text-left">Jornada</th>
                    <th className="p-2 text-left">Local</th>
                    <th className="p-2 text-left">Visitante</th>
                    <th className="p-2 text-left">Fecha / Hora</th>
                    <th className="p-2 text-left">Sede</th>
                    <th className="p-2 text-left">Fase</th>
                    <th className="p-2 text-left">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className={`border-t ${r.errors.length ? "bg-destructive/5" : ""}`}>
                      <td className="p-2">{r.match_number ?? "—"}</td>
                      <td className="p-2">{r.matchday || "—"}</td>
                      <td className="p-2">
                        {r.homeName}
                        {r.homeIsPlaceholder && (
                          <Badge variant="outline" className="ml-1 text-[10px]">Por definir</Badge>
                        )}
                      </td>
                      <td className="p-2">
                        {r.awayName}
                        {r.awayIsPlaceholder && (
                          <Badge variant="outline" className="ml-1 text-[10px]">Por definir</Badge>
                        )}
                      </td>
                      <td className="p-2 whitespace-nowrap">{r.rawDate}</td>
                      <td className="p-2">{r.venue || "—"}</td>
                      <td className="p-2">{r.stage || "—"}</td>
                      <td className="p-2">
                        {r.errors.length === 0 ? (
                          <span className="text-primary">OK</span>
                        ) : (
                          <span className="text-destructive">{r.errors.join(" · ")}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={importing}>
            Cancelar
          </Button>
          <Button onClick={confirmImport} disabled={importing || validRows.length === 0}>
            {importing ? "Importando..." : `Importar ${validRows.length} partidos`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
