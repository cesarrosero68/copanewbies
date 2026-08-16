import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useTournament } from "@/lib/tournamentContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import TeamLogo from "@/components/TeamLogo";
import { BarChart3, Target, HandHeart, Shield, Scale, Trophy, Medal, Award } from "lucide-react";
import { mmssFromSeconds, secondsFromMmss } from "@/lib/statsUtils";

const AWARD_LABELS: Record<string, string> = {
  mvp: "MVP del torneo",
  goleador: "Goleadora",
  asistencias: "Máxima asistidora",
  mejor_portera: "Mejor portera",
  fair_play: "Fair Play",
};

type Team = { id: string; name: string; logo_url: string | null; slug: string };
type Player = { id: string; name: string; team_id: string; position: string | null };

export default function Statistics() {
  const { viewedTournamentId: tournamentId } = useTournament();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const [scorerModal, setScorerModal] = useState<Player | null>(null);
  const [assistModal, setAssistModal] = useState<Player | null>(null);
  const [teamGKModal, setTeamGKModal] = useState<Team | null>(null);
  const [teamFPModal, setTeamFPModal] = useState<Team | null>(null);

  const { data: standings } = useQuery({
    queryKey: ["stats-podio-standings", tournamentId],
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
    queryKey: ["stats-podio-awards", tournamentId],
    queryFn: async () => {
      const { data } = await supabase
        .from("tournament_awards")
        .select("award_type, player:players(name, team:teams(name, slug, logo_url))")
        .eq("tournament_id", tournamentId);
      return data || [];
    },
    enabled: !!tournamentId,
  });

  const { data } = useQuery({
    queryKey: ["statistics", tournamentId, tick],
    enabled: !!tournamentId,
    queryFn: async () => {
      const [{ data: teams }, { data: players }, { data: matches }] = await Promise.all([
        supabase.from("teams").select("id,name,logo_url,slug").eq("tournament_id", tournamentId),
        supabase.from("players").select("id,name,team_id,position,jersey_number,team:teams!inner(tournament_id)").eq("team.tournament_id", tournamentId),
        supabase.from("matches").select("id,stage,status,match_number,home_team_id,away_team_id").eq("tournament_id", tournamentId).eq("stage", "REGULAR"),
      ]);
      const teamsById = new Map<string, Team>((teams || []).map((t: any) => [t.id, t]));
      const playersById = new Map<string, any>((players || []).map((p: any) => [p.id, p]));
      const matchIds = (matches || []).map((m: any) => m.id);
      const matchesById = new Map<string, any>((matches || []).map((m: any) => [m.id, m]));
      const completedIds = (matches || []).filter((m: any) => ["final", "locked", "completed"].includes(m.status)).map((m: any) => m.id);

      const [{ data: goals }, { data: penalties }] = await Promise.all([
        matchIds.length ? supabase.from("goal_events").select("*").in("match_id", matchIds) : Promise.resolve({ data: [] as any[] }),
        completedIds.length ? supabase.from("penalty_events").select("*").in("match_id", completedIds) : Promise.resolve({ data: [] as any[] }),
      ]);

      const goalsArr = (goals || []) as any[];
      const scorerAgg = new Map<string, number>();
      const assistAgg = new Map<string, number>();
      const goalsByScorer = new Map<string, any[]>();
      const goalsByAssister = new Map<string, any[]>();
      for (const g of goalsArr) {
        if (g.scorer_player_id && !g.is_own_goal) {
          scorerAgg.set(g.scorer_player_id, (scorerAgg.get(g.scorer_player_id) || 0) + 1);
          const arr = goalsByScorer.get(g.scorer_player_id) || [];
          arr.push(g); goalsByScorer.set(g.scorer_player_id, arr);
        }
        if (g.assist_player_id) {
          assistAgg.set(g.assist_player_id, (assistAgg.get(g.assist_player_id) || 0) + 1);
          const arr = goalsByAssister.get(g.assist_player_id) || [];
          arr.push(g); goalsByAssister.set(g.assist_player_id, arr);
        }
      }

      // Goalkeeper stats: goals conceded per team (goals against them in completed matches)
      const gcByTeam = new Map<string, number>();
      const gcGoalsByTeam = new Map<string, any[]>();
      for (const t of teams || []) gcByTeam.set(t.id, 0);
      for (const g of goalsArr) {
        const m = matchesById.get(g.match_id);
        if (!m || !completedIds.includes(m.id)) continue;
        const concedingTeamId = g.team_id === m.home_team_id ? m.away_team_id : m.home_team_id;
        gcByTeam.set(concedingTeamId, (gcByTeam.get(concedingTeamId) || 0) + 1);
        const arr = gcGoalsByTeam.get(concedingTeamId) || [];
        arr.push(g); gcGoalsByTeam.set(concedingTeamId, arr);
      }
      const goalkeepersByTeam = new Map<string, any[]>();
      for (const p of players || []) {
        const pos = (p.position || "").toLowerCase();
        if (pos.includes("arqu") || pos.includes("porter")) {
          const arr = goalkeepersByTeam.get(p.team_id) || [];
          arr.push(p); goalkeepersByTeam.set(p.team_id, arr);
        }
      }

      // Fair play: sum penalty duration seconds by team
      const fpByTeam = new Map<string, number>();
      const fpByTeamList = new Map<string, any[]>();
      for (const p of penalties || []) {
        const secs = secondsFromMmss(p.duration_mmss);
        fpByTeam.set(p.team_id, (fpByTeam.get(p.team_id) || 0) + secs);
        const arr = fpByTeamList.get(p.team_id) || [];
        arr.push(p); fpByTeamList.set(p.team_id, arr);
      }

      const scorers = Array.from(scorerAgg.entries())
        .map(([pid, count]) => ({ player: playersById.get(pid), count }))
        .filter((r) => r.player)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      const assisters = Array.from(assistAgg.entries())
        .map(([pid, count]) => ({ player: playersById.get(pid), count }))
        .filter((r) => r.player)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      const goalkeepers = Array.from(gcByTeam.entries())
        .map(([tid, count]) => ({ team: teamsById.get(tid), count, keepers: goalkeepersByTeam.get(tid) || [] }))
        .filter((r) => r.team)
        .sort((a, b) => a.count - b.count);
      const fairplay = Array.from(fpByTeam.entries())
        .map(([tid, secs]) => ({ team: teamsById.get(tid), secs }))
        .filter((r) => r.team)
        .sort((a, b) => a.secs - b.secs);

      return {
        teamsById, playersById, matchesById,
        scorers, assisters, goalkeepers, fairplay,
        goalsByScorer, goalsByAssister, gcGoalsByTeam, fpByTeamList,
      };
    },
  });

  if (!data) {
    return <div className="container py-8"><p className="text-muted-foreground">Cargando estadísticas...</p></div>;
  }

  const { scorers, assisters, goalkeepers, fairplay, teamsById, playersById, matchesById, goalsByScorer, goalsByAssister, gcGoalsByTeam, fpByTeamList } = data;
  const maxScorers = scorers[0]?.count || 1;
  const maxAssists = assisters[0]?.count || 1;
  const maxGC = goalkeepers[goalkeepers.length - 1]?.count || 1;
  const maxFP = fairplay[fairplay.length - 1]?.secs || 1;

  const empty = scorers.length === 0 && assisters.length === 0;

  const Row = ({ rank, logo, name, subtitle, value, pct, onClick }: any) => (
    <button onClick={onClick} className="w-full text-left flex items-center gap-3 py-2 px-2 rounded-md hover:bg-muted/50 transition-colors">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${rank === 1 ? "bg-yellow-400 text-black" : "bg-muted text-muted-foreground"}`}>{rank}</div>
      {logo}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{name}</div>
        {subtitle && <div className="text-xs text-muted-foreground truncate">{subtitle}</div>}
        <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="font-display font-bold text-lg tabular-nums">{value}</div>
    </button>
  );

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="w-8 h-8 text-primary" />
        <h1 className="font-display text-3xl font-bold uppercase">Estadísticas</h1>
      </div>

      {empty ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
            <BarChart3 className="w-12 h-12" />
            <p>Sin datos aún</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Target className="w-5 h-5 text-primary" /> Goleadores</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              {scorers.map((r, i) => (
                <Row key={r.player.id} rank={i + 1}
                  logo={<TeamLogo team={teamsById.get(r.player.team_id)} size={32} />}
                  name={r.player.name}
                  subtitle={teamsById.get(r.player.team_id)?.name}
                  value={r.count} pct={(r.count / maxScorers) * 100}
                  onClick={() => setScorerModal(r.player)} />
              ))}
              {scorers.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">Sin datos</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><HandHeart className="w-5 h-5 text-primary" /> Asistentes</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              {assisters.map((r, i) => (
                <Row key={r.player.id} rank={i + 1}
                  logo={<TeamLogo team={teamsById.get(r.player.team_id)} size={32} />}
                  name={r.player.name}
                  subtitle={teamsById.get(r.player.team_id)?.name}
                  value={r.count} pct={(r.count / maxAssists) * 100}
                  onClick={() => setAssistModal(r.player)} />
              ))}
              {assisters.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">Sin datos</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-primary" /> Valla Menos Vencida</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              {goalkeepers.map((r, i) => (
                <Row key={r.team!.id} rank={i + 1}
                  logo={<TeamLogo team={r.team!} size={32} />}
                  name={r.team!.name}
                  subtitle={r.keepers.map((k: any) => k.name).join(", ") || "Sin portero registrado"}
                  value={r.count} pct={(r.count / maxGC) * 100}
                  onClick={() => setTeamGKModal(r.team!)} />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Scale className="w-5 h-5 text-primary" /> Fair Play</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              {fairplay.map((r, i) => (
                <Row key={r.team!.id} rank={i + 1}
                  logo={<TeamLogo team={r.team!} size={32} />}
                  name={r.team!.name}
                  value={mmssFromSeconds(r.secs)} pct={(r.secs / maxFP) * 100}
                  onClick={() => setTeamFPModal(r.team!)} />
              ))}
              {fairplay.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">Sin sanciones registradas</p>}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Podio */}
      <div className="pt-4">
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="w-7 h-7 text-primary" />
          <h2 className="font-display text-2xl font-bold uppercase">Podio</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(() => {
            const top4 = (standings || []).slice(0, 4);
            const placeStyles = [
              { icon: Trophy, label: "1º Lugar", cls: "border-yellow-500/60 bg-yellow-500/10", iconCls: "text-yellow-500" },
              { icon: Medal, label: "2º Lugar", cls: "border-slate-400/60 bg-slate-400/10", iconCls: "text-slate-400" },
              { icon: Medal, label: "3º Lugar", cls: "border-amber-700/60 bg-amber-700/10", iconCls: "text-amber-700" },
              { icon: Award, label: "4º Lugar", cls: "border-border", iconCls: "text-muted-foreground" },
            ];
            if (top4.length === 0) {
              return <p className="text-sm text-muted-foreground py-8">Aún no hay posiciones calculadas.</p>;
            }
            return top4.map((s: any, i: number) => {
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
            });
          })()}
        </div>

        {(() => {
          const filledAwards = (awards || []).filter((a: any) => a.player?.name);
          if (filledAwards.length === 0) return null;
          return (
            <div className="mt-8">
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
          );
        })()}
      </div>

      {/* Scorer modal */}
      <Dialog open={!!scorerModal} onOpenChange={(o) => !o && setScorerModal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Goles · {scorerModal?.name}</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {(goalsByScorer.get(scorerModal?.id || "") || []).map((g: any) => {
              const m = matchesById.get(g.match_id);
              const opp = m ? (g.team_id === m.home_team_id ? teamsById.get(m.away_team_id) : teamsById.get(m.home_team_id)) : null;
              const assist = g.assist_player_id ? playersById.get(g.assist_player_id) : null;
              return (
                <div key={g.id} className="flex items-center justify-between text-sm border-b border-border py-2">
                  <div className="flex items-center gap-2"><TeamLogo team={opp} size={20} /><span>vs {opp?.name || "—"}</span></div>
                  <div className="text-xs text-muted-foreground">M#{m?.match_number} · P{g.period} · {g.time_mmss}{assist ? ` · asist. ${assist.name}` : ""}</div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Assister modal */}
      <Dialog open={!!assistModal} onOpenChange={(o) => !o && setAssistModal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Asistencias · {assistModal?.name}</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {(goalsByAssister.get(assistModal?.id || "") || []).map((g: any) => {
              const m = matchesById.get(g.match_id);
              const opp = m ? (g.team_id === m.home_team_id ? teamsById.get(m.away_team_id) : teamsById.get(m.home_team_id)) : null;
              const scorer = g.scorer_player_id ? playersById.get(g.scorer_player_id) : null;
              return (
                <div key={g.id} className="flex items-center justify-between text-sm border-b border-border py-2">
                  <div className="flex items-center gap-2"><TeamLogo team={opp} size={20} /><span>vs {opp?.name || "—"}</span></div>
                  <div className="text-xs text-muted-foreground">M#{m?.match_number} · P{g.period} · {g.time_mmss}{scorer ? ` · gol ${scorer.name}` : ""}</div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Goalkeeper modal (goals conceded by team) */}
      <Dialog open={!!teamGKModal} onOpenChange={(o) => !o && setTeamGKModal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Goles recibidos · {teamGKModal?.name}</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {(gcGoalsByTeam.get(teamGKModal?.id || "") || []).map((g: any) => {
              const m = matchesById.get(g.match_id);
              const scoringTeam = teamsById.get(g.team_id);
              const scorer = g.scorer_player_id ? playersById.get(g.scorer_player_id) : null;
              return (
                <div key={g.id} className="flex items-center justify-between text-sm border-b border-border py-2">
                  <div className="flex items-center gap-2"><TeamLogo team={scoringTeam} size={20} /><span>{scorer?.name || "—"} ({scoringTeam?.name})</span></div>
                  <div className="text-xs text-muted-foreground">M#{m?.match_number} · P{g.period} · {g.time_mmss}</div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Fair play modal */}
      <Dialog open={!!teamFPModal} onOpenChange={(o) => !o && setTeamFPModal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Sanciones · {teamFPModal?.name}</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {(fpByTeamList.get(teamFPModal?.id || "") || []).map((p: any) => {
              const m = matchesById.get(p.match_id);
              const opp = m ? (p.team_id === m.home_team_id ? teamsById.get(m.away_team_id) : teamsById.get(m.home_team_id)) : null;
              const player = p.player_id ? playersById.get(p.player_id) : null;
              return (
                <div key={p.id} className="flex items-center justify-between text-sm border-b border-border py-2 gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{player?.name || "—"}</div>
                    <div className="text-xs text-muted-foreground">vs {opp?.name || "—"} · M#{m?.match_number} · P{p.period} · {p.time_mmss}</div>
                  </div>
                  <Badge variant="outline" className="text-xs">{p.penalty_type}</Badge>
                  <span className="font-mono text-sm">{p.duration_mmss}</span>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
