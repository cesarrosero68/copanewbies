import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useTournament } from "@/lib/tournamentContext";
import TeamLogo from "@/components/TeamLogo";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Star } from "lucide-react";
import { mmssFromSeconds, secondsFromMmss } from "@/lib/statsUtils";

const ROLE_ORDER = ["ENTRENADOR", "ASISTENTE", "DELEGADO"];
const ROLE_LABELS: Record<string, string> = {
  ENTRENADOR: "Entrenador",
  ASISTENTE: "Asistente",
  DELEGADO: "Delegado",
};

const fullName = (p: any) =>
  p.first_name && p.last_name ? `${p.first_name} ${p.last_name}` : p.name || p.first_name || p.last_name || "—";

export default function TeamRoster() {
  const { teamId } = useParams();
  const { isReadOnly, viewedTournament } = useTournament();
  const [tab, setTab] = useState<"plantilla" | "estadisticas">("plantilla");

  const withEdition = (path: string) =>
    isReadOnly && viewedTournament ? `${path}?edition=${viewedTournament.id}` : path;

  const { data: team } = useQuery({
    queryKey: ["team-detail", teamId],
    queryFn: async () => {
      const { data } = await supabase.from("teams").select("*").eq("id", teamId).maybeSingle();
      return data;
    },
    enabled: !!teamId,
  });

  const { data: standing } = useQuery({
    queryKey: ["team-standing", teamId],
    queryFn: async () => {
      const { data } = await supabase
        .from("standings_aggregate")
        .select("rank")
        .eq("team_id", teamId)
        .maybeSingle();
      return data;
    },
    enabled: !!teamId,
  });

  const { data: players } = useQuery({
    queryKey: ["team-roster", teamId],
    queryFn: async () => {
      const { data } = await supabase
        .from("players")
        .select("id, first_name, last_name, name, jersey_number, position, is_captain")
        .eq("team_id", teamId)
        .order("jersey_number");
      return data || [];
    },
    enabled: !!teamId,
  });

  const { data: staff } = useQuery({
    queryKey: ["team-staff-detail", teamId],
    queryFn: async () => {
      const { data } = await supabase
        .from("team_staff")
        .select("id, first_name, last_name, role")
        .eq("team_id", teamId);
      return data || [];
    },
    enabled: !!teamId,
  });

  const { data: statsData } = useQuery({
    queryKey: ["team-player-stats", teamId, team?.tournament_id],
    queryFn: async () => {
      const tournamentId = team?.tournament_id;
      const [{ data: matches }, { data: goals }, { data: penalties }] = await Promise.all([
        supabase
          .from("matches")
          .select("id,status,home_team_id,away_team_id")
          .eq("tournament_id", tournamentId)
          .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`),
        supabase.from("goal_events").select("*").eq("team_id", teamId),
        supabase.from("penalty_events").select("*").eq("team_id", teamId),
      ]);
      const completedIds = new Set(
        (matches || []).filter((m: any) => ["final", "locked"].includes(m.status)).map((m: any) => m.id),
      );
      return { pj: completedIds.size, goals: goals || [], penalties: penalties || [] };
    },
    enabled: !!teamId && !!team?.tournament_id,
  });

  const sortedStaff = [...(staff || [])].sort(
    (a: any, b: any) =>
      ROLE_ORDER.indexOf((a.role || "").toUpperCase()) - ROLE_ORDER.indexOf((b.role || "").toUpperCase()),
  );

  const empty = (players?.length ?? 0) === 0 && (staff?.length ?? 0) === 0;

  const playerStats = (players || [])
    .map((p: any) => {
      const g = (statsData?.goals || []).filter((ev: any) => ev.scorer_player_id === p.id && !ev.is_own_goal).length;
      const a = (statsData?.goals || []).filter((ev: any) => ev.assist_player_id === p.id).length;
      const pimSecs = (statsData?.penalties || [])
        .filter((pe: any) => pe.player_id === p.id)
        .reduce((sum: number, pe: any) => sum + secondsFromMmss(pe.duration_mmss), 0);
      return { player: p, pj: statsData?.pj ?? 0, g, a, pts: g + a, pim: mmssFromSeconds(pimSecs) };
    })
    .sort((a: any, b: any) => b.pts - a.pts);

  const shortCode = (team?.name || "").slice(0, 3).toUpperCase();

  return (
    <div className="container py-8">
      <Link
        to={withEdition("/equipos")}
        className="inline-flex items-center gap-2 text-sm text-primary hover:underline mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Volver a Equipos
      </Link>

      <div className="rounded-xl border bg-card p-6 flex items-center gap-6 mb-8">
        <TeamLogo team={team} size={110} />
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-1">
            {standing?.rank ? `#${standing.rank} · ` : ""}{shortCode}
          </div>
          <h1 className="font-display text-4xl font-bold uppercase">{team?.name}</h1>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-2xl font-bold uppercase">
            {tab === "plantilla" ? "Plantilla" : "Estadísticas"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {tab === "plantilla" ? `${players?.length ?? 0} jugadores registrados` : "Estadísticas individuales del torneo"}
          </p>
        </div>
        <div className="inline-flex rounded-md border p-1 gap-1">
          <Button
            size="sm"
            variant={tab === "plantilla" ? "default" : "ghost"}
            onClick={() => setTab("plantilla")}
          >
            Plantilla
          </Button>
          <Button
            size="sm"
            variant={tab === "estadisticas" ? "default" : "ghost"}
            onClick={() => setTab("estadisticas")}
          >
            Estadísticas
          </Button>
        </div>
      </div>

      {tab === "plantilla" ? (
        empty ? (
          <p className="text-sm text-muted-foreground italic">Sin plantilla registrada aún</p>
        ) : (
          <div className="space-y-8">
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left w-16">#</th>
                    <th className="p-3 text-left">Jugador</th>
                    <th className="p-3 text-right">Posición</th>
                  </tr>
                </thead>
                <tbody>
                  {(players || []).map((p: any) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="p-3">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded border font-mono font-bold text-xs">
                          {p.jersey_number}
                        </span>
                      </td>
                      <td className="p-3 font-bold uppercase">
                        <span className="inline-flex items-center gap-2">
                          {fullName(p)}
                          {p.is_captain && (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                              C
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="p-3 text-right text-primary text-xs uppercase font-semibold">
                        {p.position || "—"}
                      </td>
                    </tr>
                  ))}
                  {(players || []).length === 0 && (
                    <tr><td colSpan={3} className="p-4 text-center text-muted-foreground">Sin jugadores registrados</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div>
              <h3 className="font-display text-lg font-bold uppercase mb-3">Cuerpo Técnico</h3>
              {sortedStaff.length > 0 ? (
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <tbody>
                      {sortedStaff.map((s: any) => (
                        <tr key={s.id} className="border-b last:border-0">
                          <td className="p-3 font-medium">{s.first_name} {s.last_name}</td>
                          <td className="p-3 text-right text-xs uppercase text-muted-foreground font-semibold">
                            {ROLE_LABELS[(s.role || "").toUpperCase()] || s.role || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sin cuerpo técnico registrado</p>
              )}
            </div>
          </div>
        )
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left w-16">#</th>
                <th className="p-3 text-left">Jugador</th>
                <th className="p-3 text-right">Posición</th>
                <th className="p-3 text-right">PJ</th>
                <th className="p-3 text-right">G</th>
                <th className="p-3 text-right">A</th>
                <th className="p-3 text-right">PTS</th>
                <th className="p-3 text-right">PIM</th>
              </tr>
            </thead>
            <tbody>
              {playerStats.map((row: any) => (
                <tr key={row.player.id} className="border-b last:border-0">
                  <td className="p-3">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded border font-mono font-bold text-xs">
                      {row.player.jersey_number}
                    </span>
                  </td>
                  <td className="p-3 font-bold uppercase">{fullName(row.player)}</td>
                  <td className="p-3 text-right text-primary text-xs uppercase font-semibold">
                    {row.player.position || "—"}
                  </td>
                  <td className="p-3 text-right tabular-nums">{row.pj}</td>
                  <td className="p-3 text-right tabular-nums">{row.g}</td>
                  <td className="p-3 text-right tabular-nums">{row.a}</td>
                  <td className="p-3 text-right tabular-nums font-bold">{row.pts}</td>
                  <td className="p-3 text-right tabular-nums">{row.pim}</td>
                </tr>
              ))}
              {playerStats.length === 0 && (
                <tr><td colSpan={8} className="p-4 text-center text-muted-foreground">Sin jugadores registrados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
