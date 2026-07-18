import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useTournament } from "@/lib/tournamentContext";

export default function TeamDetail() {
  const { slug } = useParams();
  const { viewedTournamentId: tournamentId } = useTournament();

  const { data: team } = useQuery({
    queryKey: ["team", slug, tournamentId],
    queryFn: async () => {
      const { data } = await supabase
        .from("teams")
        .select("*")
        .eq("slug", slug)
        .eq("tournament_id", tournamentId)
        .single();
      return data;
    },
  });

  const { data: players } = useQuery({
    queryKey: ["team-players", team?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("players")
        .select("*")
        .eq("team_id", team!.id)
        .order("jersey_number");
      return data || [];
    },
    enabled: !!team?.id,
  });

  const { data: matches } = useQuery({
    queryKey: ["team-matches", team?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("matches")
        .select("*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)")
        .eq("tournament_id", tournamentId)
        .or(`home_team_id.eq.${team!.id},away_team_id.eq.${team!.id}`)
        .order("match_number");
      return data || [];
    },
    enabled: !!team?.id,
  });

  const { data: standing } = useQuery({
    queryKey: ["team-standing", team?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("standings_aggregate")
        .select("*")
        .eq("tournament_id", tournamentId)
        .eq("team_id", team!.id)
        .single();
      return data;
    },
    enabled: !!team?.id,
  });

  if (!team) return <div className="container py-8 text-center text-muted-foreground">Cargando...</div>;

  return (
    <div className="container py-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-full" style={{ backgroundColor: team.color || "#A8D8EA" }} />
        <div>
          <h1 className="font-display text-4xl font-bold uppercase">{team.name}</h1>
          {standing && (
            <p className="text-muted-foreground">
              #{standing.rank} • {standing.points} pts • {standing.played} PJ
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Roster */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl uppercase">Plantel</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 text-left">#</th>
                  <th className="py-2 text-left">Jugador</th>
                  <th className="py-2 text-left">Pos</th>
                </tr>
              </thead>
              <tbody>
                {players?.map((p: any) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-2 font-bold">{p.jersey_number}</td>
                    <td className="py-2">{p.name}</td>
                    <td className="py-2 text-muted-foreground">{p.position || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Stats */}
        {standing && (
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-xl uppercase">Estadísticas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "PJ", value: standing.played },
                  { label: "W", value: standing.wins },
                  { label: "E", value: standing.draws },
                  { label: "L", value: standing.losses },
                  { label: "GF", value: standing.gf },
                  { label: "GC", value: standing.gc },
                  { label: "DG", value: standing.gd > 0 ? `+${standing.gd}` : standing.gd },
                  { label: "Pts", value: standing.points },
                ].map((stat) => (
                  <div key={stat.label} className="text-center p-3 bg-muted rounded-md">
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="font-display text-2xl font-bold">{stat.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Schedule */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="font-display text-xl uppercase">Partidos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {matches?.map((m: any) => {
            const isHome = m.home_team_id === team.id;
            const opponent = isHome ? m.away_team : m.home_team;
            const isPlayed = m.status === "final" || m.status === "locked";

            return (
              <Link key={m.id} to={isPlayed ? `/match/${m.id}` : "#"} className="block">
                <div className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {isHome ? "Local" : "Visita"}
                    </Badge>
                    <span className="text-sm font-medium">vs {opponent?.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {isPlayed ? (
                      <span className="font-display font-bold">
                        {m.reg_home_score} - {m.reg_away_score}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {m.start_time ? format(new Date(m.start_time), "d MMM HH:mm", { locale: es }) : "TBD"}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
