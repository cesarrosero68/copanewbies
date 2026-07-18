import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { IS_PRESEASON } from "@/lib/tournament";
import { useTournament } from "@/lib/tournamentContext";
import TeamLogo from "@/components/TeamLogo";

export default function Players() {
  const [teamFilter, setTeamFilter] = useState("all");
  const { viewedTournamentId: tournamentId } = useTournament();

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

  const { data: players } = useQuery({
    queryKey: ["all-players", tournamentId, teamFilter],
    queryFn: async () => {
      let query = supabase
        .from("players")
        .select("*, team:teams(*)")
        .order("jersey_number");

      if (teamFilter !== "all") {
        query = query.eq("team_id", teamFilter);
      } else {
        const teamIds = teams?.map((t: any) => t.id) || [];
        if (teamIds.length > 0) query = query.in("team_id", teamIds);
      }

      const { data } = await query;
      return data || [];
    },
    enabled: !!teams && teams.length > 0,
  });

  const { data: playerStats } = useQuery({
    queryKey: ["all-player-stats", tournamentId],
    queryFn: async () => {
      const { data } = await supabase
        .from("player_stats_aggregate")
        .select("*")
        .eq("tournament_id", tournamentId);
      return data || [];
    },
    enabled: !IS_PRESEASON,
  });

  const { data: standings } = useQuery({
    queryKey: ["standings-for-pj", tournamentId],
    queryFn: async () => {
      const { data } = await supabase
        .from("standings_aggregate")
        .select("team_id, played")
        .eq("tournament_id", tournamentId);
      return data || [];
    },
    enabled: !IS_PRESEASON,
  });

  const getStats = (playerId: string) => {
    if (IS_PRESEASON) return { goals: 0, assists: 0, points: 0 };
    const s = playerStats?.find((ps: any) => ps.player_id === playerId);
    return { goals: s?.goals || 0, assists: s?.assists || 0, points: s?.points || 0 };
  };

  const getTeamPJ = (teamId: string) => {
    if (IS_PRESEASON) return 0;
    const s = standings?.find((st: any) => st.team_id === teamId);
    return s?.played || 0;
  };

  const selectedTeam = teams?.find((t: any) => t.id === teamFilter);

  return (
    <div className="container py-8">
      <h1 className="font-display text-4xl font-bold uppercase mb-2">Jugadores</h1>
      <p className="text-muted-foreground mb-6">Roster y estadísticas por equipo</p>

      <div className="flex items-center gap-3 mb-6">
        {selectedTeam && <TeamLogo team={selectedTeam} size={40} />}
        <Select value={teamFilter} onValueChange={setTeamFilter}>
          <SelectTrigger className="w-64">
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

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-secondary text-secondary-foreground">
                <th className="p-3 text-left">Nombre</th>
                <th className="p-3 text-center">#</th>
                <th className="p-3 text-left">Posición</th>
                {teamFilter === "all" && <th className="p-3 text-left">Equipo</th>}
                <th className="p-3 text-center">PJ (proxy)</th>
                <th className="p-3 text-center">Goles</th>
                <th className="p-3 text-center">Asist.</th>
                <th className="p-3 text-center font-bold">Total</th>
              </tr>
            </thead>
            <tbody>
              {players?.map((p: any) => {
                const stats = getStats(p.id);
                const pj = getTeamPJ(p.team_id);
                return (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-medium">{p.name}</td>
                    <td className="p-3 text-center font-bold">{p.jersey_number}</td>
                    <td className="p-3 text-muted-foreground">{p.position || "-"}</td>
                    {teamFilter === "all" && (
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <TeamLogo team={p.team} size={32} />
                          <span className="text-xs">{p.team?.name}</span>
                        </div>
                      </td>
                    )}
                    <td className="p-3 text-center">{pj}</td>
                    <td className="p-3 text-center">{stats.goals}</td>
                    <td className="p-3 text-center">{stats.assists}</td>
                    <td className="p-3 text-center font-display font-bold">{stats.points}</td>
                  </tr>
                );
              })}
              {(!players || players.length === 0) && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-muted-foreground">
                    No hay jugadores registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {IS_PRESEASON && (
        <p className="mt-4 text-xs text-muted-foreground italic">
          * Estadísticas en cero — el torneo aún no ha comenzado. PJ (proxy) = partidos jugados del equipo.
        </p>
      )}
    </div>
  );
}
