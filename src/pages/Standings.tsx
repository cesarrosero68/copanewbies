import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useTournament } from "@/lib/tournamentContext";
import TeamLogo from "@/components/TeamLogo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Standings() {
  const { viewedTournamentId: tournamentId, viewedTournament, isReadOnly } = useTournament();
  const withEdition = (path: string) => (isReadOnly ? `${path}?edition=${tournamentId}` : path);
  const { data: standings } = useQuery({
    queryKey: ["standings-full", tournamentId],
    queryFn: async () => {
      // Partimos siempre de la lista real de equipos (teams), y le pegamos
      // los datos agregados de standings_aggregate cuando existan. Así la
      // tabla muestra los 7 equipos en cero incluso si nadie ha jugado
      // todavía, en vez de depender de que standings_aggregate ya tenga fila.
      const [{ data: teams }, { data: agg }] = await Promise.all([
        supabase.from("teams").select("*").eq("tournament_id", tournamentId).order("name"),
        supabase.from("standings_aggregate").select("*").eq("tournament_id", tournamentId),
      ]);
      const aggByTeam = new Map<string, any>((agg || []).map((a: any) => [a.team_id, a]));
      const rows = (teams || []).map((t: any) => {
        const a = aggByTeam.get(t.id);
        return {
          team_id: t.id,
          team: t,
          played: a?.played ?? 0,
          wins: a?.wins ?? 0,
          draws: a?.draws ?? 0,
          losses: a?.losses ?? 0,
          gf: a?.gf ?? 0,
          gc: a?.gc ?? 0,
          gd: a?.gd ?? 0,
          points: a?.points ?? 0,
        };
      });
      // Orden: primero por puntos desc, luego DG desc, luego nombre — igual
      // criterio que usa la vista, para que el orden no cambie cuando
      // empiecen a jugarse partidos.
      rows.sort((a, b) => b.points - a.points || b.gd - a.gd || a.team.name.localeCompare(b.team.name));
      return rows;
    },
  });

  return (
    <div className="container py-8">
      <h1 className="font-display text-4xl font-bold uppercase mb-2">Tabla de Posiciones</h1>
      <p className="text-muted-foreground mb-6">
        Fase Regular{viewedTournament?.name ? ` • ${viewedTournament.name}` : ""}
      </p>

      <Tabs defaultValue="standings">
        <TabsList className="mb-4">
          <TabsTrigger value="standings">Tabla</TabsTrigger>
          <TabsTrigger value="fairplay">Fair Play</TabsTrigger>
        </TabsList>

        <TabsContent value="standings">
          <Card className="overflow-hidden">
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr
                    style={{
                      background: "linear-gradient(120deg, var(--hero-bg, #1D5A8C) 0%, var(--hero-gradient-to, var(--hero-bg, #0B1F3A)) 100%)",
                    }}
                  >
                    <th className="p-4 text-left w-10 text-xs font-medium" style={{ color: "hsl(var(--hero-foreground, 0 0% 100%))" }}>#</th>
                    <th className="p-4 text-left text-xs font-medium" style={{ color: "hsl(var(--hero-foreground, 0 0% 100%))" }}>Equipo</th>
                    <th className="p-4 text-center text-xs font-medium" style={{ color: "hsl(var(--hero-foreground, 0 0% 100%))" }}>PJ</th>
                    <th className="p-4 text-center text-xs font-medium" style={{ color: "hsl(var(--hero-foreground, 0 0% 100%))" }}>W</th>
                    <th className="p-4 text-center text-xs font-medium" style={{ color: "hsl(var(--hero-foreground, 0 0% 100%))" }}>E</th>
                    <th className="p-4 text-center text-xs font-medium" style={{ color: "hsl(var(--hero-foreground, 0 0% 100%))" }}>L</th>
                    <th className="p-4 text-center text-xs font-medium" style={{ color: "hsl(var(--hero-foreground, 0 0% 100%))" }}>GF</th>
                    <th className="p-4 text-center text-xs font-medium" style={{ color: "hsl(var(--hero-foreground, 0 0% 100%))" }}>GC</th>
                    <th className="p-4 text-center text-xs font-medium" style={{ color: "hsl(var(--hero-foreground, 0 0% 100%))" }}>DG</th>
                    <th
                      className="p-4 text-center text-sm font-semibold"
                      style={{ color: "hsl(var(--hero-foreground, 0 0% 100%))", background: "hsl(var(--hero-foreground, 0 0% 100%) / 0.12)" }}
                    >
                      Pts
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {standings?.map((s: any, i: number) => (
                    <tr
                      key={s.team_id}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                      style={i === 0 ? { background: "hsl(45 90% 95%)" } : undefined}
                    >
                      <td className="p-4 font-semibold text-base">{i + 1}</td>
                      <td className="p-4">
                        <Link
                          to={withEdition(`/team/${s.team?.slug}`)}
                          className="flex items-center gap-3 hover:underline font-semibold text-base"
                        >
                          <TeamLogo team={s.team} size={40} />
                          {s.team?.name}
                        </Link>
                      </td>
                      <td className="p-4 text-center">{s.played}</td>
                      <td className="p-4 text-center">{s.wins}</td>
                      <td className="p-4 text-center">{s.draws}</td>
                      <td className="p-4 text-center">{s.losses}</td>
                      <td className="p-4 text-center">{s.gf}</td>
                      <td className="p-4 text-center">{s.gc}</td>
                      <td className={`p-4 text-center font-medium ${s.gd > 0 ? "text-green-700" : s.gd < 0 ? "text-red-600" : ""}`}>
                        {s.gd > 0 ? `+${s.gd}` : s.gd}
                      </td>
                      <td
                        className="p-4 text-center font-display font-bold text-xl"
                        style={{ background: "hsl(var(--hero-bg, 210 60% 45%) / 0.08)" }}
                      >
                        {s.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <div className="mt-6 text-sm text-muted-foreground space-y-1">
            <p>
              <strong>Desempates:</strong> 1) Pts → 2) Mayor W → 3) H2H DG → 4) H2H GC menor
            </p>
            <p>Victoria = 3 pts • Empate = 1 pt • Derrota = 0 pts</p>
            {standings && standings.length > 0 && standings.every((s: any) => s.played === 0) && (
              <p className="italic mt-2">* Estadísticas en cero — el torneo aún no ha comenzado.</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="fairplay">
          <FairPlayTable teams={standings?.map((s: any) => s.team) || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FairPlayTable({ teams }: { teams: any[] }) {
  const { viewedTournamentId: tournamentId } = useTournament();
  const { data: penaltyData } = useQuery({
    queryKey: ["fair-play", tournamentId],
    queryFn: async () => {
      const { data: matches } = await supabase
        .from("matches")
        .select("id, start_time, match_number")
        .eq("tournament_id", tournamentId)
        .eq("stage", "REGULAR")
        .in("status", ["final", "locked"])
        .order("start_time");

      if (!matches || matches.length === 0) return { matchdays: [], penalties: [] };

      // Group matches by date to get matchdays
      const dateMap = new Map<string, number[]>();
      for (const m of matches) {
        const date = m.start_time ? m.start_time.split("T")[0] : "unknown";
        if (!dateMap.has(date)) dateMap.set(date, []);
        dateMap.get(date)!.push(m.match_number);
      }
      const matchdays = Array.from(dateMap.keys()).sort();

      // Map match_id to matchday index
      const matchIdToDay = new Map<string, number>();
      for (const m of matches) {
        const date = m.start_time ? m.start_time.split("T")[0] : "unknown";
        matchIdToDay.set(m.id, matchdays.indexOf(date));
      }

      const matchIds = matches.map((m: any) => m.id);
      const { data: penalties } = await supabase
        .from("penalty_events")
        .select("match_id, team_id, duration_mmss")
        .in("match_id", matchIds);

      return { matchdays, penalties: penalties || [], matchIdToDay: Object.fromEntries(matchIdToDay) };
    },
  });

  if (!penaltyData || !teams || teams.length === 0) {
    return <p className="text-muted-foreground text-sm">Sin datos de sanciones aún.</p>;
  }

  const { matchdays, penalties, matchIdToDay } = penaltyData as any;

  // Parse duration_mmss to total seconds, then display as minutes
  const parseDurationSeconds = (duration: string): number => {
    const parts = duration.split(":");
    return parseInt(parts[0] || "0") * 60 + parseInt(parts[1] || "0");
  };

  // Build data: team -> matchday -> total minutes
  const teamData = teams.map((team: any) => {
    const byDay: number[] = matchdays.map((_: any, dayIdx: number) => {
      const dayPenalties = penalties.filter((p: any) => p.team_id === team.id && matchIdToDay[p.match_id] === dayIdx);
      return dayPenalties.reduce((sum: number, p: any) => sum + parseDurationSeconds(p.duration_mmss || "01:30"), 0);
    });
    const total = byDay.reduce((a: number, b: number) => a + b, 0);
    return { team, byDay, total };
  });

  // Sort by total ascending (less penalties = better fair play)
  teamData.sort((a: any, b: any) => a.total - b.total);

  return (
    <Card>
      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-secondary text-secondary-foreground">
              <th className="p-3 text-left">Equipo</th>
              {matchdays.map((_: string, i: number) => (
                <th key={i} className="p-3 text-center">
                  Fecha {i + 1}
                </th>
              ))}
              <th className="p-3 text-center font-bold">Total</th>
            </tr>
          </thead>
          <tbody>
            {teamData.map((row: any) => (
              <tr key={row.team.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                <td className="p-3">
                  <div className="flex items-center gap-2 font-medium">
                    <TeamLogo team={row.team} size={28} />
                    <span className="hidden sm:inline">{row.team.name}</span>
                  </div>
                </td>
                {row.byDay.map((secs: number, i: number) => {
                  const m = Math.floor(secs / 60);
                  const s = secs % 60;
                  return (
                    <td key={i} className="p-3 text-center">
                      {secs > 0 ? `${m}:${String(s).padStart(2, "0")}` : "-"}
                    </td>
                  );
                })}
                {(() => {
                  const m = Math.floor(row.total / 60);
                  const s = row.total % 60;
                  return (
                    <td className="p-3 text-center font-display font-bold">
                      {row.total > 0 ? `${m}:${String(s).padStart(2, "0")}` : "-"}
                    </td>
                  );
                })()}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
