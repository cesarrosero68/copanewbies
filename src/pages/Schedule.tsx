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
import { MapPin, CalendarDays, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { useMatchClock, periodShort } from "@/lib/matchClock";
import ActivePenalties from "@/components/ActivePenalties";
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
  SEMI: "Semifinal 1",
  P2: "Semifinal 2",
  THIRD: "3ro / 4to",
  FINAL: "Final",
};

function MatchCard({
  match,
  showStage = false,
}: {
  match: any;
  showStage?: boolean;
}) {
  const isPlayed = match.status === "final" || match.status === "locked";
  const isLive = match.status === "live";
  const isClickable = isPlayed || isLive;
  const showHomePlaceholder = !match.home_team && !!match.home_team_label;
  const showAwayPlaceholder = !match.away_team && !!match.away_team_label;
  const homeName = showHomePlaceholder ? match.home_team_label : match.home_team?.name;
  const awayName = showAwayPlaceholder ? match.away_team_label : match.away_team?.name;
  const { isReadOnly, viewedTournamentId } = useTournament();
  const clock = useMatchClock(match);
  const withEdition = (path: string) => (isReadOnly ? `${path}?edition=${viewedTournamentId}` : path);
  return (
    <Link to={isClickable ? withEdition(`/match/${match.id}`) : "#"}>
      <Card
        className={`hover:shadow-md transition-shadow ${isClickable ? "cursor-pointer" : ""} ${isLive ? "border-destructive" : ""}`}
      >
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
              {isLive && clock
                ? `En vivo · ${periodShort(match.current_period)} · ${clock}`
                : statusLabels[match.status]}
            </Badge>
            {match.notes?.toUpperCase().includes("APLAZADO") && (
              <Badge className="text-xs shrink-0 bg-amber-500 text-white border-amber-500 hover:bg-amber-600">
                Aplazado
              </Badge>
            )}

            <div className="flex items-center gap-2 flex-1 min-w-0">
              {!showHomePlaceholder && <TeamLogo team={match.home_team} size={40} />}
              <span
                className={`font-medium text-sm truncate ${showHomePlaceholder ? "text-muted-foreground italic" : ""}`}
              >
                {homeName}
              </span>
            </div>

            {isPlayed || isLive ? (
              <div className="font-display text-xl font-bold px-3 shrink-0">
                {match.reg_home_score} - {match.reg_away_score}
              </div>
            ) : (
              <span className="text-muted-foreground font-display px-3 shrink-0">VS</span>
            )}

            <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
              <span
                className={`font-medium text-sm truncate ${showAwayPlaceholder ? "text-muted-foreground italic" : ""}`}
              >
                {awayName}
              </span>
              {!showAwayPlaceholder && <TeamLogo team={match.away_team} size={40} />}
            </div>

            <div className="text-xs text-muted-foreground shrink-0 w-28 text-right">
              {match.start_time ? format(toBogotaDate(match.start_time), "d MMM HH:mm", { locale: es }) : "TBD"}
            </div>
          </div>
          {isLive && <ActivePenalties match={match} className="hidden sm:flex mt-2" />}

          {/* Mobile layout */}
          <div className="sm:hidden space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant={statusColors[match.status] as any} className="text-xs">
                {isLive && clock
                  ? `En vivo · ${periodShort(match.current_period)} · ${clock}`
                  : statusLabels[match.status]}
              </Badge>
              {match.notes?.toUpperCase().includes("APLAZADO") && (
                <Badge className="text-xs bg-amber-500 text-white border-amber-500 hover:bg-amber-600">Aplazado</Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {match.start_time ? format(toBogotaDate(match.start_time), "d MMM HH:mm", { locale: es }) : "TBD"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {!showHomePlaceholder && <TeamLogo team={match.home_team} size={36} />}
                <span
                  className={`font-medium text-sm truncate ${showHomePlaceholder ? "text-muted-foreground italic" : ""}`}
                >
                  {homeName}
                </span>
              </div>
              {isPlayed || isLive ? (
                <span className="font-display text-lg font-bold shrink-0">{match.reg_home_score}</span>
              ) : null}
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {!showAwayPlaceholder && <TeamLogo team={match.away_team} size={36} />}
                <span
                  className={`font-medium text-sm truncate ${showAwayPlaceholder ? "text-muted-foreground italic" : ""}`}
                >
                  {awayName}
                </span>
              </div>
              {isPlayed || isLive ? (
                <span className="font-display text-lg font-bold shrink-0">{match.reg_away_score}</span>
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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const queryClient = useQueryClient();
  const { viewedTournamentId: tournamentId } = useTournament();

  const { data: teams } = useQuery({
    queryKey: ["teams", tournamentId],
    queryFn: async () => {
      const { data } = await supabase.from("teams").select("*").eq("tournament_id", tournamentId).order("name");
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
        result = result.filter((m: any) => m.home_team_id === teamFilter || m.away_team_id === teamFilter);
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
      .channel("schedule-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, () => {
        queryClient.invalidateQueries({ queryKey: ["all-matches"] });
        queryClient.invalidateQueries({ queryKey: ["playoff-matches-schedule"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "goal_events" }, () => {
        queryClient.invalidateQueries({ queryKey: ["all-matches"] });
        queryClient.invalidateQueries({ queryKey: ["playoff-matches-schedule"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return (
    <div className="container py-8 max-w-5xl mx-auto">
      <h1 className="font-display text-4xl font-bold uppercase mb-2">Calendario y Resultados</h1>
      <p className="text-muted-foreground mb-6">Todos los partidos del torneo</p>

      <Tabs defaultValue="regular" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="regular">Fase Regular</TabsTrigger>
          <TabsTrigger value="playoffs">Playoffs</TabsTrigger>
        </TabsList>

        <TabsContent value="regular">
          {(() => {
            const dayKey = (d: Date) => format(d, "yyyy-MM-dd");
            const matchDayKeys = new Set(
              (matches || []).filter((m: any) => m.start_time).map((m: any) => dayKey(toBogotaDate(m.start_time))),
            );
            const matchDays = Array.from(matchDayKeys).map((k) => {
              const [y, mo, d] = k.split("-").map(Number);
              return new Date(y, mo - 1, d);
            });
            const visibleMatches = selectedDate
              ? (matches || []).filter(
                  (m: any) => m.start_time && dayKey(toBogotaDate(m.start_time)) === dayKey(selectedDate),
                )
              : matches || [];
            return (
              <div className="grid gap-6 md:grid-cols-[300px_1fr] items-start">
                <div className="space-y-4 md:sticky md:top-24">
                  <Card>
                    <CardContent className="p-3">
                      <Calendar
                        mode="single"
                        locale={es}
                        selected={selectedDate}
                        month={calendarMonth}
                        onMonthChange={setCalendarMonth}
                        onSelect={(d) => setSelectedDate(d ?? undefined)}
                        modifiers={{ hasMatch: matchDays }}
                        modifiersClassNames={{
                          hasMatch:
                            "relative font-semibold text-primary after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-1 after:w-1 after:rounded-full after:bg-primary",
                        }}
                        className="p-0 pointer-events-auto"
                      />
                      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CalendarDays className="w-3.5 h-3.5" />
                          {selectedDate
                            ? format(selectedDate, "d 'de' MMMM yyyy", { locale: es })
                            : "Todas las fechas"}
                        </span>
                        {selectedDate && (
                          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setSelectedDate(undefined)}>
                            <X className="w-3.5 h-3.5 mr-1" /> Quitar
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Select value={teamFilter} onValueChange={setTeamFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Filtrar por equipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los equipos</SelectItem>
                      {teams?.map((t: any) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-6">
            {(() => {
              // Agrupar partidos por jornada (campo notes: "Jornada N"), preservando
              // el orden de aparición. Cada grupo muestra un encabezado con la sede
              // y fecha una sola vez, en vez de repetirla en cada tarjeta.
              const groups: { key: string; label: string; venue: string | null; venueUrl: string | null; date: string | null; items: any[] }[] = [];
              const groupIndex: Record<string, number> = {};
              visibleMatches.forEach((m: any) => {
                const key = m.notes || "Sin jornada";
                if (!(key in groupIndex)) {
                  groupIndex[key] = groups.length;
                  groups.push({
                    key,
                    label: key,
                    venue: m.venue || null,
                    venueUrl: m.venue_maps_url || null,
                    date: m.start_time ? format(toBogotaDate(m.start_time), "EEEE d 'de' MMMM yyyy", { locale: es }) : null,
                    items: [],
                  });
                }
                groups[groupIndex[key]].items.push(m);
              });
              return groups.map((g) => (
                <div key={g.key}>
                  <div className="flex items-center gap-2 mb-2 px-1 flex-wrap">
                    <h3 className="font-display text-base font-bold uppercase">{g.label}</h3>
                    {g.date && <span className="text-xs text-muted-foreground capitalize">· {g.date}</span>}
                    {g.venue && (
                      <a
                        href={g.venueUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(g.venue)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
                      >
                        <MapPin className="w-4 h-4" /> {g.venue}
                      </a>
                    )}
                  </div>
                  <div className="space-y-3">
                    {g.items.map((match: any) => (
                      <MatchCard key={match.id} match={match} />
                    ))}
                  </div>
                </div>
              ));
            })()}
                  {visibleMatches.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">No hay partidos en esta fecha.</p>
                  )}
                </div>
              </div>
            );
          })()}
        </TabsContent>

        <TabsContent value="playoffs">
          <div className="space-y-3">
            {playoffMatches && playoffMatches.length > 0 ? (
              (() => {
                const first = playoffMatches[0];
                const venue = first?.venue || null;
                const venueUrl = first?.venue_maps_url || null;
                const date = first?.start_time
                  ? format(toBogotaDate(first.start_time), "EEEE d 'de' MMMM yyyy", { locale: es })
                  : null;
                return (
                  <div>
                    {(venue || date) && (
                      <div className="flex items-center gap-2 mb-2 px-1 flex-wrap">
                        <h3 className="font-display text-base font-bold uppercase">Playoffs</h3>
                        {date && <span className="text-xs text-muted-foreground capitalize">· {date}</span>}
                        {venue && (
                          <a
                            href={venueUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
                          >
                            <MapPin className="w-4 h-4" /> {venue}
                          </a>
                        )}
                      </div>
                    )}
                    <div className="space-y-3">
                      {playoffMatches.map((match: any) => (
                        <MatchCard key={match.id} match={match} showStage />
                      ))}
                    </div>
                  </div>
                );
              })()
            ) : (
              <p className="text-muted-foreground text-center py-8">No hay partidos de playoffs programados aún.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
