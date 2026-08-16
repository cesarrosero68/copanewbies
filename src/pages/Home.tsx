import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toBogotaDate } from "@/lib/dateUtils";
import { IS_PRESEASON } from "@/lib/tournament";
import { useTournament } from "@/lib/tournamentContext";
import TeamLogo from "@/components/TeamLogo";
import { useMatchClock, periodShort } from "@/lib/matchClock";
import ActivePenalties from "@/components/ActivePenalties";

const teamColorMap: Record<string, string> = {
  vikings: "bg-team-vikings",
  reapers: "bg-team-reapers",
  "grey-panthers": "bg-team-panthers",
  "rabbits-chiks": "bg-team-rabbits",
  aguilas: "bg-team-aguilas",
};

function LiveMatchCard({ match, to }: { match: any; to: string }) {
  const clock = useMatchClock(match);
  return (
    <Link to={to}>
      <Card className="border-destructive hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <TeamLogo team={match.home_team} size={40} />
              <span className="font-medium text-sm">{match.home_team?.name}</span>
            </div>
            <div className="flex items-center gap-2 font-display text-2xl font-bold px-4">
              <span>{match.reg_home_score ?? 0}</span>
              <span className="text-muted-foreground text-lg">-</span>
              <span>{match.reg_away_score ?? 0}</span>
            </div>
            <div className="flex items-center gap-2 flex-1 justify-end">
              <span className="font-medium text-sm">{match.away_team?.name}</span>
              <TeamLogo team={match.away_team} size={40} />
            </div>
          </div>
          <Badge variant="destructive" className="mx-auto mt-2 block w-fit text-xs animate-pulse">
            {clock ? `En vivo · ${periodShort(match.current_period)} · ${clock}` : "🔴 En Juego"}
          </Badge>
          <ActivePenalties match={match} className="mt-2 justify-center" />
        </CardContent>
      </Card>
    </Link>
  );
}

export default function Home() {
  const { tournamentId, viewedTournament, isReadOnly } = useTournament();
  const withEdition = (path: string) =>
    isReadOnly && viewedTournament ? `${path}?edition=${viewedTournament.id}` : path;
  const fullName = viewedTournament?.name ?? "Copa Newbies III";
  const nameParts = fullName.trim().split(/\s+/);
  const nameSuffix = nameParts.length > 1 ? nameParts.pop()! : "";
  const namePrefix = nameParts.join(" ");
  const heroLogo = viewedTournament?.hero_logo_url || "/lovable-uploads/192672d5-a8d2-4226-8ce6-29a76b5d1b2e.png";
  const subtitleYear = viewedTournament?.year ?? "";
  const subtitleSemester = viewedTournament?.semester ?? "";
  const { data: standings } = useQuery({
    queryKey: ["standings", tournamentId],
    queryFn: async () => {
      const { data } = await supabase
        .from("standings_aggregate")
        .select("*, team:teams(*)")
        .eq("tournament_id", tournamentId)
        .order("rank", { ascending: true });
      return data || [];
    },
  });

  const { data: homeTeams } = useQuery({
    queryKey: ["home-teams", viewedTournament?.id],
    queryFn: async () => {
      if (!viewedTournament?.id) return [];
      const { data } = await supabase
        .from("teams")
        .select("*")
        .eq("tournament_id", viewedTournament.id)
        .order("name");
      return data || [];
    },
    enabled: !!viewedTournament?.id,
  });

  const { data: upcomingMatches } = useQuery({
    queryKey: ["upcoming-matches", tournamentId],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from("matches")
        .select("*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)")
        .eq("tournament_id", tournamentId)
        .eq("status", "scheduled")
        .gte("start_time", now)
        .order("start_time", { ascending: true })
        .limit(4);
      return data || [];
    },
  });

  const { data: playoffProgress } = useQuery({
    queryKey: ["playoff-progress", tournamentId],
    queryFn: async () => {
      const { data } = await supabase
        .from("matches")
        .select("stage, winner_team_id")
        .eq("tournament_id", tournamentId)
        .in("stage", ["P1A", "P1B", "SEMI", "P2"]);
      const map: Record<string, boolean> = {};
      (data || []).forEach((m: any) => {
        map[m.stage] = !!m.winner_team_id;
      });
      return map;
    },
  });

  const { data: liveMatches } = useQuery({
    queryKey: ["live-matches", tournamentId],
    queryFn: async () => {
      const { data } = await supabase
        .from("matches")
        .select("*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)")
        .eq("tournament_id", tournamentId)
        .eq("status", "live")
        .order("start_time", { ascending: true });
      return data || [];
    },
    refetchInterval: 15000,
  });

  const getPlayoffPlaceholders = (stage: string) => {
    const p1aDone = playoffProgress?.["P1A"];
    const p1bDone = playoffProgress?.["P1B"];
    const semiDone = playoffProgress?.["SEMI"];
    const p2Done = playoffProgress?.["P2"];
    if (stage === "SEMI")
      return { home: p1aDone ? undefined : "Ganador P1A", away: p1bDone ? undefined : "Ganador P1B" };
    if (stage === "P2")
      return { home: p1aDone ? undefined : "Perdedor P1A", away: p1bDone ? undefined : "Perdedor P1B" };
    if (stage === "THIRD")
      return { home: semiDone ? undefined : "Perdedor Semi", away: p2Done ? undefined : "Ganador P2" };
    if (stage === "FINAL") return { home: "Reapers", away: semiDone ? undefined : "Ganador Semi" };
    return { home: undefined, away: undefined };
  };

  const { data: recentMatches } = useQuery({
    queryKey: ["recent-matches", tournamentId],
    queryFn: async () => {
      const { data } = await supabase
        .from("matches")
        .select("*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)")
        .eq("tournament_id", tournamentId)
        .in("status", ["final", "locked"])
        .order("start_time", { ascending: false })
        .limit(4);
      return data || [];
    },
    enabled: !IS_PRESEASON,
  });

  const { data: topScorers } = useQuery({
    queryKey: ["top-scorers", tournamentId],
    queryFn: async () => {
      const { data } = await supabase
        .from("player_stats_aggregate")
        .select("*, player:players(*), team:teams(*)")
        .eq("tournament_id", tournamentId)
        .order("goals", { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !IS_PRESEASON,
  });

  const { data: topAssists } = useQuery({
    queryKey: ["top-assists", tournamentId],
    queryFn: async () => {
      const { data } = await supabase
        .from("player_stats_aggregate")
        .select("*, player:players(*), team:teams(*)")
        .eq("tournament_id", tournamentId)
        .order("assists", { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !IS_PRESEASON,
  });

  const { data: topPoints } = useQuery({
    queryKey: ["top-points", tournamentId],
    queryFn: async () => {
      const { data } = await supabase
        .from("player_stats_aggregate")
        .select("*, player:players(*), team:teams(*)")
        .eq("tournament_id", tournamentId)
        .order("points", { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !IS_PRESEASON,
  });

  return (
    <div className="container py-8 space-y-8">
      {/* Hero */}
      <section
        className="text-center py-12 rounded-xl bg-secondary relative overflow-hidden"
        style={{ background: "var(--hero-bg, hsl(var(--secondary)))" }}
      >
        <img alt={fullName} className="mx-auto h-48 md:h-64 object-contain mb-4 drop-shadow-lg" src={heroLogo} />
        <h1 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-wider text-secondary-foreground">
          {namePrefix} {nameSuffix && <span className="text-primary">{nameSuffix}</span>}
        </h1>
        <p className="mt-3 text-secondary-foreground/70 text-lg">
          Temporada {subtitleYear}
          {subtitleSemester ? ` • ${subtitleSemester}` : ""}
        </p>
      </section>

      {/* Team Logos Strip */}
      {homeTeams && homeTeams.length > 0 && (
        <section className="flex flex-wrap justify-center gap-x-10 gap-y-6">
          {homeTeams.map((team: any) => (
            <div key={team.id} className="flex flex-col items-center gap-2 w-20">
              <TeamLogo team={team} size={64} />
              <span className="text-xs font-medium text-center leading-tight">{team.name}</span>
            </div>
          ))}
        </section>
      )}

      {/* Recent Results — hidden in PRESEASON */}
      {!IS_PRESEASON && recentMatches && recentMatches.length > 0 && (
        <section>
          <h2 className="font-display text-2xl font-bold uppercase mb-4">Últimos Resultados</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentMatches.map((match: any) => (
              <Link key={match.id} to={`/match/${match.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        <TeamLogo team={match.home_team} size={40} />
                        <span className="font-medium text-sm">{match.home_team?.name}</span>
                      </div>
                      <div className="flex items-center gap-2 font-display text-2xl font-bold px-4">
                        <span>{match.reg_home_score}</span>
                        <span className="text-muted-foreground text-lg">-</span>
                        <span>{match.reg_away_score}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-1 justify-end">
                        <span className="font-medium text-sm">{match.away_team?.name}</span>
                        <TeamLogo team={match.away_team} size={40} />
                      </div>
                    </div>
                    {match.start_time && (
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        {format(toBogotaDate(match.start_time), "d MMM yyyy", { locale: es })}
                      </p>
                    )}
                    {match.ot_played && (
                      <Badge variant="outline" className="mx-auto mt-1 block w-fit text-xs">
                        {match.so_played ? "Penales (SO)" : "Overtime (OT)"}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Matches */}
      <section>
        {liveMatches && liveMatches.length > 0 && (
          <div className="mb-8">
            <h2 className="font-display text-2xl font-bold uppercase mb-4">En Vivo</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {liveMatches.map((match: any) => (
                <LiveMatchCard key={match.id} match={match} to={withEdition(`/match/${match.id}`)} />
              ))}
            </div>
          </div>
        )}
        <h2 className="font-display text-2xl font-bold uppercase mb-4">Próximos Partidos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {upcomingMatches?.map((match: any) => {
            const ph = getPlayoffPlaceholders(match.stage);
            const homeName = ph.home ?? match.home_team?.name;
            const awayName = ph.away ?? match.away_team?.name;
            const showHomeLogo = !ph.home;
            const showAwayLogo = !ph.away;
            return (
              <Card key={match.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      {showHomeLogo && <TeamLogo team={match.home_team} size={40} />}
                      <span className="font-medium text-sm">{homeName}</span>
                    </div>
                    <span className="text-muted-foreground font-display text-lg px-4">VS</span>
                    <div className="flex items-center gap-2 flex-1 justify-end">
                      <span className="font-medium text-sm">{awayName}</span>
                      {showAwayLogo && <TeamLogo team={match.away_team} size={40} />}
                    </div>
                  </div>
                  {match.start_time && (
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      {format(toBogotaDate(match.start_time), "EEEE d MMM • HH:mm", { locale: es })}
                    </p>
                  )}
                  <Badge className="mx-auto mt-1 block w-fit text-xs" variant="secondary">
                    {match.stage === "REGULAR" ? `Partido #${match.match_number}` : match.stage}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
          {(!upcomingMatches || upcomingMatches.length === 0) && (
            <p className="text-muted-foreground text-sm col-span-2">No hay partidos programados</p>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Standings Snapshot */}
        <section>
          <h2 className="font-display text-2xl font-bold uppercase mb-4">Tabla de Posiciones</h2>
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left">#</th>
                    <th className="p-3 text-left">Equipo</th>
                    <th className="p-3 text-center">PJ</th>
                    <th className="p-3 text-center">Pts</th>
                    <th className="p-3 text-center">DG</th>
                  </tr>
                </thead>
                <tbody>
                  {standings?.map((s: any, i: number) => (
                    <tr key={s.team_id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-3 font-bold">{i + 1}</td>
                      <td className="p-3">
                        <Link
                          to={withEdition(`/team/${s.team?.slug}`)}
                          className="flex items-center gap-2 hover:underline"
                        >
                          <TeamLogo team={s.team} size={36} />
                          {s.team?.name}
                        </Link>
                      </td>
                      <td className="p-3 text-center">{IS_PRESEASON ? 0 : s.played}</td>
                      <td className="p-3 text-center font-bold">{IS_PRESEASON ? 0 : s.points}</td>
                      <td className="p-3 text-center">{IS_PRESEASON ? 0 : s.gd > 0 ? `+${s.gd}` : s.gd}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
          <Link to={withEdition("/standings")} className="text-sm text-primary hover:underline mt-2 inline-block">
            Ver tabla completa →
          </Link>
        </section>

        {/* Leaders */}
        <section className="space-y-6">
          <div>
            <h2 className="font-display text-2xl font-bold uppercase mb-4">Mejor Jugador (Puntos)</h2>
            <Card>
              <CardContent className="p-4">
                <p className="text-muted-foreground text-sm">
                  {IS_PRESEASON
                    ? "El torneo aún no ha comenzado"
                    : !topPoints || topPoints.length === 0
                      ? "Sin datos aún"
                      : ""}
                </p>
                {!IS_PRESEASON &&
                  topPoints?.map((ps: any, i: number) => (
                    <div key={ps.player_id} className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-sm w-5">{i + 1}.</span>
                        <TeamLogo team={ps.team} size={20} />
                        <span className="text-sm font-medium">
                          #{ps.player?.jersey_number} {ps.player?.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-display font-bold">{ps.points}</span>
                        <span className="text-muted-foreground text-xs ml-1">
                          ({ps.goals}G {ps.assists}A)
                        </span>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold uppercase mb-4">Goleadores</h2>
            <Card>
              <CardContent className="p-4">
                <p className="text-muted-foreground text-sm">
                  {IS_PRESEASON
                    ? "El torneo aún no ha comenzado"
                    : !topScorers || topScorers.length === 0
                      ? "Sin datos aún"
                      : ""}
                </p>
                {!IS_PRESEASON &&
                  topScorers?.map((ps: any, i: number) => (
                    <div key={ps.player_id} className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-sm w-5">{i + 1}.</span>
                        <TeamLogo team={ps.team} size={20} />
                        <span className="text-sm font-medium">
                          #{ps.player?.jersey_number} {ps.player?.name}
                        </span>
                      </div>
                      <span className="font-display font-bold">{ps.goals}</span>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold uppercase mb-4">Asistentes</h2>
            <Card>
              <CardContent className="p-4">
                <p className="text-muted-foreground text-sm">
                  {IS_PRESEASON
                    ? "El torneo aún no ha comenzado"
                    : !topAssists || topAssists.length === 0
                      ? "Sin datos aún"
                      : ""}
                </p>
                {!IS_PRESEASON &&
                  topAssists?.map((ps: any, i: number) => (
                    <div key={ps.player_id} className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-sm w-5">{i + 1}.</span>
                        <TeamLogo team={ps.team} size={20} />
                        <span className="text-sm font-medium">
                          #{ps.player?.jersey_number} {ps.player?.name}
                        </span>
                      </div>
                      <span className="font-display font-bold">{ps.assists}</span>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold uppercase mb-4">Mejor Arquero (GAA)</h2>
            <Card>
              <CardContent className="p-4">
                <p className="text-muted-foreground text-sm">
                  {IS_PRESEASON
                    ? "El torneo aún no ha comenzado"
                    : !standings || standings.filter((s: any) => s.played > 0).length === 0
                      ? "Sin datos aún"
                      : ""}
                </p>
                {!IS_PRESEASON &&
                  standings
                    ?.filter((s: any) => s.played > 0)
                    .sort((a: any, b: any) => {
                      const gaaA = a.played > 0 ? a.gc / a.played : 999;
                      const gaaB = b.played > 0 ? b.gc / b.played : 999;
                      return gaaA - gaaB;
                    })
                    .map((s: any, i: number) => (
                      <div key={s.team_id} className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground text-sm w-5">{i + 1}.</span>
                          <TeamLogo team={s.team} size={20} />
                          <span className="text-sm font-medium">{s.team?.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-display font-bold">{(s.gc / s.played).toFixed(2)}</span>
                          <span className="text-muted-foreground text-xs ml-1">
                            ({s.gc}GC / {s.played}PJ)
                          </span>
                        </div>
                      </div>
                    ))}
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
