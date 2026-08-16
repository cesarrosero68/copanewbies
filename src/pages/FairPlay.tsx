import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { useTournament } from "@/lib/tournamentContext";
import TeamLogo from "@/components/TeamLogo";

const parseSeconds = (mmss: string | null) => {
  const parts = (mmss || "0:00").split(":");
  return (parseInt(parts[0] || "0", 10) || 0) * 60 + (parseInt(parts[1] || "0", 10) || 0);
};

const fmt = (secs: number) => `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;

export default function FairPlay() {
  const { viewedTournamentId: tournamentId } = useTournament();

  const { data: rows, isLoading } = useQuery({
    queryKey: ["fairplay-page", tournamentId],
    queryFn: async () => {
      const [{ data: teams }, { data: penalties }] = await Promise.all([
        supabase.from("teams").select("id,name,slug,logo_url").eq("tournament_id", tournamentId),
        supabase
          .from("penalty_events")
          .select("team_id,duration_mmss,match:matches!inner(tournament_id)")
          .eq("match.tournament_id", tournamentId),
      ]);

      const list = (teams || []).map((team: any) => {
        const own = (penalties || []).filter((p: any) => p.team_id === team.id);
        return {
          team,
          count: own.length,
          seconds: own.reduce((sum: number, p: any) => sum + parseSeconds(p.duration_mmss), 0),
        };
      });
      list.sort((a, b) => a.seconds - b.seconds || a.count - b.count);
      return list;
    },
    enabled: !!tournamentId,
  });

  return (
    <div className="container py-8">
      <h1 className="font-display text-4xl font-bold uppercase mb-2">Fair Play</h1>
      <p className="text-muted-foreground mb-6">Menor tiempo de penalidad = mejor juego limpio</p>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-secondary text-secondary-foreground">
                <th className="p-3 text-left w-10">#</th>
                <th className="p-3 text-left">Equipo</th>
                <th className="p-3 text-center">Total Sanciones</th>
                <th className="p-3 text-center">Tiempo Total de Penalidad</th>
              </tr>
            </thead>
            <tbody>
              {(rows || []).map((row, i) => (
                <tr key={row.team.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-3 font-bold">{i + 1}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2 font-medium">
                      <TeamLogo team={row.team} size={36} />
                      <span>{row.team.name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-center">{row.count}</td>
                  <td className="p-3 text-center font-display font-bold">{fmt(row.seconds)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && (rows || []).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Sin equipos en esta edición.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}