import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTournament } from "@/lib/tournamentContext";
import TeamLogo from "@/components/TeamLogo";
import { Trophy, Medal, Award } from "lucide-react";

const AWARD_LABELS: Record<string, string> = {
  mvp: "MVP del torneo",
  goleador: "Goleadora",
  asistencias: "Máxima asistidora",
  mejor_portera: "Mejor portera",
  fair_play: "Fair Play",
};

export default function Podio() {
  const { viewedTournamentId: tournamentId } = useTournament();

  const { data: standings } = useQuery({
    queryKey: ["podio-standings", tournamentId],
    queryFn: async () => {
      const { data } = await supabase
        .from("standings_aggregate")
        .select("*, team:teams(*)")
        .eq("tournament_id", tournamentId)
        .order("rank", { ascending: true });
      return data || [];
    },
    enabled: !!tournamentId,
  });

  const { data: awards } = useQuery({
    queryKey: ["podio-awards", tournamentId],
    queryFn: async () => {
      const { data } = await supabase
        .from("tournament_awards")
        .select("award_type, player:players(name, team:teams(name, slug, logo_url))")
        .eq("tournament_id", tournamentId);
      return data || [];
    },
    enabled: !!tournamentId,
  });

  const top4 = (standings || []).slice(0, 4);
  const placeStyles = [
    { icon: Trophy, label: "1º Lugar", cls: "border-yellow-500/60 bg-yellow-500/10", iconCls: "text-yellow-500" },
    { icon: Medal, label: "2º Lugar", cls: "border-slate-400/60 bg-slate-400/10", iconCls: "text-slate-400" },
    { icon: Medal, label: "3º Lugar", cls: "border-amber-700/60 bg-amber-700/10", iconCls: "text-amber-700" },
    { icon: Award, label: "4º Lugar", cls: "border-border", iconCls: "text-muted-foreground" },
  ];

  const filledAwards = (awards || []).filter((a: any) => a.player?.name);

  return (
    <div className="container py-8">
      <h1 className="font-display text-4xl font-bold uppercase mb-2">Podio</h1>
      <p className="text-muted-foreground mb-6">Clasificación final y reconocimientos</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {top4.map((s: any, i: number) => {
          const style = placeStyles[i];
          const Icon = style.icon;
          return (
            <Card key={s.team_id} className={`border-2 ${style.cls}`}>
              <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                <Icon className={`w-10 h-10 ${style.iconCls}`} />
                <Badge variant="secondary" className="text-xs uppercase">{style.label}</Badge>
                <TeamLogo team={s.team} size={72} />
                <div className="font-display text-lg font-bold uppercase">{s.team?.name}</div>
                <div className="text-xs text-muted-foreground">{s.points} pts • DG {s.gd}</div>
              </CardContent>
            </Card>
          );
        })}
        {top4.length === 0 && (
          <p className="text-sm text-muted-foreground py-8">Aún no hay posiciones calculadas.</p>
        )}
      </div>

      {filledAwards.length > 0 && (
        <div className="mt-10">
          <h2 className="font-display text-2xl font-bold uppercase mb-4">Reconocimientos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filledAwards.map((a: any) => (
              <Card key={a.award_type}>
                <CardContent className="p-4 flex items-center gap-3">
                  <Award className="w-8 h-8 text-primary shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs uppercase text-muted-foreground font-semibold">
                      {AWARD_LABELS[a.award_type] || a.award_type}
                    </div>
                    <div className="font-medium truncate">{a.player?.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <TeamLogo team={a.player?.team} size={16} />
                      {a.player?.team?.name}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}