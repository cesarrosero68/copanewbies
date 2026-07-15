import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toBogotaDate } from "@/lib/dateUtils";
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import TeamLogo from "@/components/TeamLogo";
import { useQueryClient } from "@tanstack/react-query";
import { useTournament } from "@/lib/tournamentContext";

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
  P1A: "Playoff 1A",
  P1B: "Playoff 1B",
  SEMI: "Semifinal",
  P2: "Playoff 2",
  THIRD: "3ro / 4to",
  FINAL: "Final",
};

function MatchCard({
  match,
  showStage = false,
  homePlaceholder,
  awayPlaceholder,
}: {
  match: any;
  showStage?: boolean;
  homePlaceholder?: string;
  awayPlaceholder?: string;
}) {
  const isPlayed = match.status === "final" || match.status === "locked";
  const isLive = match.status === "live";
  const isClickable = isPlayed || isLive;
  const showHomePlaceholder = !!homePlaceholder;
  const showAwayPlaceholder = !!awayPlaceholder;
  const homeName = showHomePlaceholder ? homePlaceholder : match.home_team?.name;
  const awayName = showAwayPlaceholder ? awayPlaceholder : match.away_team?.name;
  return (
    <Link to={isClickable ? `/match/${match.id}` : "#"}>
      <Card className={`hover:shadow-md transition-shadow ${isClickable ? "cursor-pointer" : ""} ${isLive ? "border-destructive" : ""}`}>
        <CardContent className="p-4">
          {showStage && (
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="outline" className="text-xs font-display uppercase">
                {stageLabels[match.stage] || match.stage}
              </Badge>
              {match.match_number != null && (
                <span className="text-xs text-muted-foreground">Partido #{match.match_number}</span>
              )}
            </div>
          )}
          {/* Desktop layout */}
          <div className="hidden sm:flex items-center justify-between gap-4">
            <Badge variant={statusColors[match.status] as any} className="text-xs shrink-0">
              {statusLabels[match.status]}
            </Badge>
            {match.notes?.toUpperCase().includes("APLAZADO") && (
              <Badge className="text-xs shrink-0 bg-amber-500 text-white border-amber-500 hover:bg-amber-600">Aplazado</Badge>
            )}

            <div className="flex items-center gap-2 flex-1 min-w-0">
              {!showHomePlaceholder && <TeamLogo team={match.home_team} size={40} />}
              <span className={`font-medium text-sm truncate ${showHomePlaceholder ? "text-muted-foreground italic" : ""}`}>{homeName}</span>
            </div>

            {(isPlayed || isLive) ? (
              <div className="font-display text-xl font-bold px-3 shrink-0">
                {match.reg_home_score} - {match.reg_away_score}
              </div>
            ) : (
              <span className="text-muted-foreground font-display px-3 shrink-0">VS</span>
            )}

            <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
              <span className={`font-medium text-sm truncate ${showAwayPlaceholder ? "text-muted-foreground italic" : ""}`}>{awayName}</span>
              {!showAwayPlaceholder && <TeamLogo team={match.away_team} size={40} />}
            </div>

            <div className="text-xs text-muted-foreground shrink-0 w-28 text-right">
              {match.start_time
                ? format(toBogotaDate(match.start_time), "d MMM HH:mm", { locale: es })
                : "TBD"}
            </div>
          </div>

          {/* Mobile layout */}
          <div className="sm:hidden space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant={statusColors[match.status] as any} className="text-xs">
                {statusLabels[match.status]}
              </Badge>
              {match.notes?.toUpperCase().includes("APLAZADO") && (
                <Badge className="text-xs bg-amber-500 text-white border-amber-500 hover:bg-amber-600">Aplazado</Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {match.start_time
                  ? format(toBogotaDate(match.start_time), "d MMM HH:mm", { locale: es })
                  : "TBD"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {!showHomePlaceholder && <TeamLogo team={match.home_team} size={36} />}
                <span className={`font-medium text-sm truncate ${showHomePlaceholder ? "text-muted-foreground italic" : ""}`}>{homeName}</span>
              </div>
              {(isPlayed || isLive) ? (
                <span className="font-display text-lg font-bold shrink-0">
                  {match.reg_home_score}
                </span>
              ) : null}
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {!showAwayPlaceholder && <TeamLogo team={match.away_team} size={36} />}
                <span className={`font-medium text-sm truncate ${showAwayPlaceholder ? "text-muted-foreground italic" : ""}`}>{awayName}</span>
              </div>
              {(isPlayed || isLive) ? (
                <span className="font-display text-lg font-bold shrink-0">
                  {match.reg_away_score}
                </span>
              ) : (
                <span className="text-muted-foreground font-display text-sm shrink-0">VS</span>
              )}
            </div>
          </div>

          {match.ot_played && isPlayed && (
            <p className="text-xs text-center text-muted-foreground mt-1">
              {match.so_played ? "Gana en Penales (SO)" : "Gana en OT"}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export default function Schedule() {
  const [teamFilter, setTeamFilter] = useState("all");
  const queryClient = useQueryClient();
  const { tournamentId } = useTournament();

  const { data: teams } = useQuery({
    queryKey: ["teams", tournamentId],
    queryFn: async () => {
      const { data } = await supabase
        .from("teams")
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("name");
      return data || [];
    },
  });

  const { data: matches } = useQuery({
    queryKey: ["all-matches", tournamentId, teamFilter],
    queryFn: async () => {
      let query = supabase
        .from("matches")
        .select("*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)")
        .eq("tournament_id", tournamentId)
        .eq("stage", "REGULAR")
        .order("match_number", { ascending: true });

      const { data } = await query;
      let result = data || [];

      if (teamFilter !== "all") {
        result = result.filter(
          (m: any) => m.home_team_id === teamFilter || m.away_team_id === teamFilter
        );
      }

      return result;
    },
  });

  const { data: playoffMatches } = useQuery({
    queryKey: ["playoff-matches-schedule", tournamentId],
    queryFn: async () => {
      const { data } = await supabase
        .from("matches")
        .select("*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)")
        .eq("tournament_id", tournamentId)
        .neq("stage", "REGULAR")
        .order("match_number", { ascending: true });
      return data || [];
    },
  });

  // Realtime subscription for live match updates
  useEffect(() => {
    const channel = supabase
      .channel('schedule-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => {
        queryClient.invalidateQueries({ queryKey: ["all-matches"] });
        queryClient.invalidateQueries({ queryKey: ["playoff-matches-schedule"] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'goal_events' }, () => {
        queryClient.invalidateQueries({ queryKey: ["all-matches"] });
        queryClient.invalidateQueries({ queryKey: ["playoff-matches-schedule"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return (
    <div className="container py-8 max-w-3xl mx-auto">
      <h1 className="font-display text-4xl font-bold uppercase mb-2">Programación y Resultados</h1>
      <p className="text-muted-foreground mb-6">Todos los partidos del torneo</p>

      <Tabs defaultValue="regular" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="regular">Fase Regular</TabsTrigger>
          <TabsTrigger value="playoffs">Playoffs</TabsTrigger>
        </TabsList>

        <TabsContent value="regular">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <Select value={teamFilter} onValueChange={setTeamFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por equipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los equipos</SelectItem>
                {teams?.map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {matches?.map((match: any) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="playoffs">
          <div className="space-y-3">
            {playoffMatches && playoffMatches.length > 0 ? (
              (() => {
                const byStage: Record<string, any> = {};
                playoffMatches.forEach((m: any) => { byStage[m.stage] = m; });
                const hasWinner = (m: any) => !!m?.winner_team_id;
                const p1aDone = hasWinner(byStage.P1A);
                const p1bDone = hasWinner(byStage.P1B);
                const semiDone = hasWinner(byStage.SEMI);
                const p2Done = hasWinner(byStage.P2);

                const placeholdersFor = (stage: string): { home?: string; away?: string } => {
                  switch (stage) {
                    case "SEMI":
                      return {
                        home: p1aDone ? undefined : "Ganador P1A",
                        away: p1bDone ? undefined : "Ganador P1B",
                      };
                    case "P2":
                      return {
                        home: p1aDone ? undefined : "Perdedor P1A",
                        away: p1bDone ? undefined : "Perdedor P1B",
                      };
                    case "THIRD":
                      return {
                        home: semiDone ? undefined : "Perdedor Semi",
                        away: p2Done ? undefined : "Ganador P2",
                      };
                    case "FINAL":
                      return {
                        home: undefined,
                        away: semiDone ? undefined : "Ganador Semi",
                      };
                    default:
                      return {};
                  }
                };

                return playoffMatches.map((match: any) => {
                  const ph = placeholdersFor(match.stage);
                  return (
                    <MatchCard
                      key={match.id}
                      match={match}
                      showStage
                      homePlaceholder={ph.home}
                      awayPlaceholder={ph.away}
                    />
                  );
                });
              })()
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No hay partidos de playoffs programados aún.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
