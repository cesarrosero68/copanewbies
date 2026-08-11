import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import TeamLogo from "@/components/TeamLogo";
import {
  DEFAULT_PERIOD_MINUTES,
  PERIOD_PRESETS,
  elapsedMs,
  formatClock,
  isClockRunning,
  isValidMmSs,
  periodLabel,
  periodMs,
  remainingMs,
} from "@/lib/matchClock";

const PENALTY_TYPES = [
  { code: "BC", desc: "BODY CHECKING" },
  { code: "BDG", desc: "BOARDING" },
  { code: "BE", desc: "BUTT ENDING" },
  { code: "BP", desc: "BENCH PENALTY" },
  { code: "BS", desc: "BROKEN STICK" },
  { code: "CC", desc: "CROSS CHECKING" },
  { code: "CFB", desc: "CC FROM BEHIND" },
  { code: "CH", desc: "CHARGING" },
  { code: "DG", desc: "DELAY OF GAME" },
  { code: "ELB", desc: "ELBOWING" },
  { code: "FI", desc: "FIGHTING" },
  { code: "FOP", desc: "FALLING ON PUCK" },
  { code: "FOV", desc: "FACE OFF VIOL." },
  { code: "GE", desc: "GAME EJECTION" },
  { code: "GM", desc: "GAME MISSCONDUCT" },
  { code: "HKG", desc: "HOOKING" },
  { code: "HO", desc: "HOLDING" },
  { code: "HP", desc: "HAND PASS" },
  { code: "HS", desc: "HIGH STICK" },
  { code: "IE", desc: "ILLEGAL EQUIPMENT" },
  { code: "INT", desc: "INTERFERENCE" },
  { code: "INTG", desc: "INT. OF GOALTENDER" },
  { code: "KNE", desc: "KNEEING" },
  { code: "MP", desc: "MATCH PENALTY" },
  { code: "MSC", desc: "MISSCONDUCT" },
  { code: "OA", desc: "OFFICIAL ABUSE" },
  { code: "PS", desc: "PENALTY SHOOT" },
  { code: "RO", desc: "ROUGHING" },
  { code: "SL", desc: "SLASHING" },
  { code: "SP", desc: "SPEARING" },
  { code: "TMM", desc: "TOO MANY MEN" },
  { code: "TR", desc: "TRIPPING" },
  { code: "USC", desc: "UNSPORTSMANLIKE" },
];

const PREDEFINED_TIMES = [
  { label: "1:30", value: "01:30" },
  { label: "4:00", value: "04:00" },
  { label: "10:00", value: "10:00" },
  { label: "Manual", value: "manual" },
];

export default function AdminMatchManage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: match, isLoading } = useQuery({
    queryKey: ["admin-match", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("matches")
        .select("*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)")
        .eq("id", id)
        .single();
      return data;
    },
    enabled: !!id,
  });

  const updateMatch = useMutation({
    mutationFn: async (updates: any) => {
      const { error } = await supabase.from("matches").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-match", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-matches"] });
      toast({ title: "Partido actualizado" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (isLoading || !match) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;

  const isPlayed = match.status === "final" || match.status === "locked";
  const isLive = match.status === "live";
  const isPlayoff = match.stage !== "REGULAR";

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-secondary text-secondary-foreground border-b border-border">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="flex items-center gap-1 text-sm text-secondary-foreground/70 hover:text-secondary-foreground transition-colors">
              <ChevronLeft className="w-4 h-4" />
              Partidos
            </Link>
            <span className="text-secondary-foreground/30">|</span>
            <h1 className="font-display text-lg font-bold uppercase">Partido #{match.match_number}</h1>
          </div>
          <Badge variant={match.status === "live" ? "destructive" : "secondary"} className="text-xs">
            {match.status === "scheduled" ? "Programado" : match.status === "live" ? "🔴 En Juego" : match.status === "final" ? "Final" : "Cerrado"}
          </Badge>
        </div>
      </header>

      <div className="container py-6 max-w-4xl space-y-6">
        {/* Scoreboard */}
        <ScoreBoard match={match} updateMatch={updateMatch} isLive={isLive} isPlayed={isPlayed} isPlayoff={isPlayoff} />

        {/* Live clock */}
        {(isLive || match.status === "scheduled") && <MatchClockPanel match={match} updateMatch={updateMatch} />}

        {/* Goals & Penalties tabs */}
        {(isLive || isPlayed) && (
          <Tabs defaultValue="goals">
            <TabsList className="w-full">
              <TabsTrigger value="goals" className="flex-1">⚽ Goles</TabsTrigger>
              <TabsTrigger value="penalties" className="flex-1">🏒 Sanciones</TabsTrigger>
            </TabsList>
            <TabsContent value="goals">
              <GoalEventsSection match={match} matchId={match.id} homeTeamId={match.home_team_id} awayTeamId={match.away_team_id} disabled={match.status === "locked"} />
            </TabsContent>
            <TabsContent value="penalties">
              <PenaltyEventsSection match={match} matchId={match.id} homeTeamId={match.home_team_id} awayTeamId={match.away_team_id} disabled={match.status === "locked"} />
            </TabsContent>
          </Tabs>
        )}

        {/* Actions */}
        <MatchActions match={match} updateMatch={updateMatch} queryClient={queryClient} navigate={navigate} />
      </div>
    </div>
  );
}

function ScoreBoard({ match, updateMatch, isLive, isPlayed, isPlayoff }: any) {
  const [homeScore, setHomeScore] = useState(match.reg_home_score?.toString() || "0");
  const [awayScore, setAwayScore] = useState(match.reg_away_score?.toString() || "0");
  const [otPlayed, setOtPlayed] = useState(match.ot_played || false);
  const [soPlayed, setSoPlayed] = useState(match.so_played || false);
  const [winnerId, setWinnerId] = useState(match.winner_team_id || "");

  useEffect(() => {
    setHomeScore(match.reg_home_score?.toString() || "0");
    setAwayScore(match.reg_away_score?.toString() || "0");
    setOtPlayed(match.ot_played || false);
    setSoPlayed(match.so_played || false);
    setWinnerId(match.winner_team_id || "");
  }, [match]);

  const saveScore = () => {
    const parsedHomeScore = parseInt(homeScore);
    const parsedAwayScore = parseInt(awayScore);
    const updates: any = {
      reg_home_score: parsedHomeScore,
      reg_away_score: parsedAwayScore,
    };
    if (isPlayoff) {
      updates.ot_played = otPlayed;
      updates.so_played = soPlayed;
      const resolvedWinnerId = parsedHomeScore > parsedAwayScore
        ? match.home_team_id
        : parsedAwayScore > parsedHomeScore
          ? match.away_team_id
          : winnerId;

      if (resolvedWinnerId) {
        updates.winner_team_id = resolvedWinnerId;
        updates.ot_winner_team_id = otPlayed && !soPlayed ? resolvedWinnerId : null;
        updates.so_winner_team_id = soPlayed ? resolvedWinnerId : null;
      } else {
        updates.winner_team_id = null;
        updates.ot_winner_team_id = null;
        updates.so_winner_team_id = null;
      }
    }
    updateMatch.mutate(updates);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-center gap-6">
          <div className="text-center flex-1">
            <TeamLogo team={match.home_team} size={48} className="mx-auto mb-2" />
            <h2 className="font-display text-lg font-bold">{match.home_team?.name}</h2>
            {isLive && (
              <Input
                type="number" min={0} value={homeScore}
                onChange={(e) => setHomeScore(e.target.value)}
                className="w-20 mx-auto mt-2 text-center font-display text-2xl font-bold h-12"
              />
            )}
          </div>

          <div className="text-center">
            {isPlayed ? (
              <div className="font-display text-4xl font-bold">
                {match.reg_home_score} - {match.reg_away_score}
              </div>
            ) : isLive ? (
              <div className="font-display text-3xl text-muted-foreground">VS</div>
            ) : (
              <div className="font-display text-3xl text-muted-foreground">VS</div>
            )}
          </div>

          <div className="text-center flex-1">
            <TeamLogo team={match.away_team} size={48} className="mx-auto mb-2" />
            <h2 className="font-display text-lg font-bold">{match.away_team?.name}</h2>
            {isLive && (
              <Input
                type="number" min={0} value={awayScore}
                onChange={(e) => setAwayScore(e.target.value)}
                className="w-20 mx-auto mt-2 text-center font-display text-2xl font-bold h-12"
              />
            )}
          </div>
        </div>

        {isLive && isPlayoff && (
          <div className="mt-4 space-y-2 border-t pt-4">
            <div className="flex items-center gap-4 justify-center">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={otPlayed} onChange={(e) => setOtPlayed(e.target.checked)} />
                OT jugado
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={soPlayed} onChange={(e) => setSoPlayed(e.target.checked)} />
                Penales (SO)
              </label>
            </div>
            {(otPlayed || soPlayed || homeScore === awayScore) && (
              <div className="max-w-xs mx-auto">
                <Label>Ganador</Label>
                <Select value={winnerId} onValueChange={setWinnerId}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar ganador" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={match.home_team_id}>{match.home_team?.name}</SelectItem>
                    <SelectItem value={match.away_team_id}>{match.away_team?.name}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        {isLive && (
          <div className="flex justify-center mt-4">
            <Button onClick={saveScore} size="sm">Guardar Marcador</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MatchActions({ match, updateMatch, queryClient, navigate }: any) {
  const isPlayoff = match.stage !== "REGULAR";

  const startMatch = () => {
    updateMatch.mutate({ status: "live" });
  };

  const closeMatch = async () => {
    const { data: goals } = await supabase
      .from("goal_events")
      .select("team_id")
      .eq("match_id", match.id);

    const homeGoals = (goals || []).filter((g: any) => g.team_id === match.home_team_id).length;
    const awayGoals = (goals || []).filter((g: any) => g.team_id === match.away_team_id).length;
    const expectedHome = match.reg_home_score || 0;
    const expectedAway = match.reg_away_score || 0;

    if (homeGoals !== expectedHome || awayGoals !== expectedAway) {
      toast({
        title: "Error de validación",
        description: `Los eventos de gol (${homeGoals}-${awayGoals}) no coinciden con el marcador (${expectedHome}-${expectedAway}). Registra todos los goles antes de cerrar.`,
        variant: "destructive",
      });
      return;
    }

    const updates: any = { status: "final" };
    if (isPlayoff) {
      if (expectedHome > expectedAway) updates.winner_team_id = match.home_team_id;
      else if (expectedAway > expectedHome) updates.winner_team_id = match.away_team_id;
      else if (match.winner_team_id) updates.winner_team_id = match.winner_team_id;
      else {
        toast({
          title: "Selecciona ganador",
          description: "Los partidos de playoffs empatados necesitan ganador por OT o penales antes de cerrar.",
          variant: "destructive",
        });
        return;
      }
    } else {
      if (expectedHome > expectedAway) updates.winner_team_id = match.home_team_id;
      else if (expectedAway > expectedHome) updates.winner_team_id = match.away_team_id;
      else updates.winner_team_id = null;
    }

    const { error } = await supabase.from("matches").update(updates).eq("id", match.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    await supabase.rpc("recalculate_standings", { p_tournament_id: match.tournament_id });
    await supabase.rpc("recalculate_player_stats", { p_tournament_id: match.tournament_id });

    queryClient.invalidateQueries({ queryKey: ["admin-match", match.id] });
    queryClient.invalidateQueries({ queryKey: ["admin-matches"] });
    toast({ title: "Partido cerrado y estadísticas recalculadas" });
  };

  const lockMatch = () => {
    updateMatch.mutate({ status: "locked" });
  };

  const resetToScheduled = async () => {
    const { error } = await supabase.from("matches").update({
      status: "scheduled",
      reg_home_score: 0,
      reg_away_score: 0,
      winner_team_id: null,
      ot_winner_team_id: null,
      so_winner_team_id: null,
      ot_played: false,
      so_played: false,
    }).eq("id", match.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    await supabase.rpc("recalculate_standings", { p_tournament_id: match.tournament_id });
    await supabase.rpc("recalculate_player_stats", { p_tournament_id: match.tournament_id });
    queryClient.invalidateQueries({ queryKey: ["admin-match", match.id] });
    queryClient.invalidateQueries({ queryKey: ["admin-matches"] });
    toast({ title: "Partido restablecido a Programado" });
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex flex-wrap gap-3 justify-center">
          {match.status === "scheduled" && (
            <Button onClick={startMatch} variant="default" className="bg-destructive hover:bg-destructive/90">
              🔴 Iniciar Partido (En Juego)
            </Button>
          )}
          {match.status === "live" && (
            <Button onClick={closeMatch} variant="default">
              Cerrar Partido (Final)
            </Button>
          )}
          {match.status === "final" && (
            <Button onClick={lockMatch} variant="outline">
              🔒 Bloquear Partido
            </Button>
          )}
          {match.status === "locked" && (
            <p className="text-sm text-muted-foreground">Este partido está bloqueado.</p>
          )}
        </div>

        {/* Dev/testing: reset to any status */}
        <div className="border-t pt-4 flex flex-wrap items-center gap-3 justify-center">
          <span className="text-xs text-muted-foreground">Cambiar estado (pruebas):</span>
          {match.status !== "scheduled" && (
            <Button size="sm" variant="outline" onClick={resetToScheduled}>
              ↩ Programado
            </Button>
          )}
          {match.status !== "live" && (
            <Button size="sm" variant="outline" onClick={startMatch}>
              🔴 En Juego
            </Button>
          )}
          {match.status !== "final" && (
            <Button size="sm" variant="outline" onClick={closeMatch}>
              Final
            </Button>
          )}
          {match.status !== "locked" && (
            <Button size="sm" variant="outline" onClick={lockMatch}>
              🔒 Cerrado
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function GoalEventsSection({ matchId, homeTeamId, awayTeamId, disabled }: { matchId: string; homeTeamId: string; awayTeamId: string; disabled?: boolean }) {
  const queryClient = useQueryClient();
  const [teamId, setTeamId] = useState(homeTeamId);
  const [period, setPeriod] = useState("1");
  const [time, setTime] = useState("");
  const [scorerId, setScorerId] = useState("");
  const [assistId, setAssistId] = useState("");
  const [isOwnGoal, setIsOwnGoal] = useState(false);
  const [ownGoalPlayerId, setOwnGoalPlayerId] = useState("");

  const { data: goals } = useQuery({
    queryKey: ["admin-goals", matchId],
    queryFn: async () => {
      const { data } = await supabase
        .from("goal_events")
        .select("*, scorer:players!goal_events_scorer_player_id_fkey(*), assist:players!goal_events_assist_player_id_fkey(*), team:teams(*), own_goal_player:players!goal_events_own_goal_by_player_id_fkey(*)")
        .eq("match_id", matchId)
        .order("period")
        .order("time_mmss");
      return data || [];
    },
  });

  const { data: homePlayers } = useQuery({
    queryKey: ["players", homeTeamId],
    queryFn: async () => {
      const { data } = await supabase.from("players").select("*").eq("team_id", homeTeamId).order("jersey_number");
      return data || [];
    },
  });

  const { data: awayPlayers } = useQuery({
    queryKey: ["players", awayTeamId],
    queryFn: async () => {
      const { data } = await supabase.from("players").select("*").eq("team_id", awayTeamId).order("jersey_number");
      return data || [];
    },
  });

  const { data: teams } = useQuery({
    queryKey: ["match-teams", homeTeamId, awayTeamId],
    queryFn: async () => {
      const { data } = await supabase.from("teams").select("*").in("id", [homeTeamId, awayTeamId]);
      return data || [];
    },
  });

  const scoringTeamPlayers = teamId === homeTeamId ? homePlayers : awayPlayers;
  const defendingTeamPlayers = teamId === homeTeamId ? awayPlayers : homePlayers;

  const addGoal = useMutation({
    mutationFn: async () => {
      const insert: any = {
        match_id: matchId,
        team_id: teamId,
        period: period as any,
        time_mmss: time,
        is_own_goal: isOwnGoal,
      };
      if (isOwnGoal) {
        insert.scorer_player_id = null;
        insert.assist_player_id = null;
        insert.own_goal_by_player_id = ownGoalPlayerId && ownGoalPlayerId !== "none" ? ownGoalPlayerId : null;
      } else {
        insert.scorer_player_id = scorerId;
        insert.assist_player_id = assistId && assistId !== "none" ? assistId : null;
        insert.own_goal_by_player_id = null;
      }
      const { error } = await supabase.from("goal_events").insert(insert);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-goals", matchId] });
      setTime("");
      setScorerId("");
      setAssistId("");
      setIsOwnGoal(false);
      setOwnGoalPlayerId("");
      toast({ title: "Gol registrado" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteGoal = useMutation({
    mutationFn: async (goalId: string) => {
      const { error } = await supabase.from("goal_events").delete().eq("id", goalId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-goals", matchId] });
      toast({ title: "Gol eliminado" });
    },
  });

  const canAdd = isOwnGoal ? !!time : (!!scorerId && !!time);

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {/* Existing goals */}
        <div className="space-y-2">
          {goals?.map((g: any) => (
            <div key={g.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
              <div>
                <span className="font-mono text-xs mr-2">P{g.period} {g.time_mmss}</span>
                {g.is_own_goal ? (
                  <span className="font-medium text-destructive">Autogol{g.own_goal_player ? ` (${g.own_goal_player.name})` : ''}</span>
                ) : (
                  <span className="font-medium">{g.scorer?.name}</span>
                )}
                {g.assist && <span className="text-muted-foreground"> (A: {g.assist.name})</span>}
                <span className="text-xs text-muted-foreground ml-2">- {g.team?.name}</span>
              </div>
              {!disabled && (
                <Button size="sm" variant="ghost" className="text-destructive h-7" onClick={() => deleteGoal.mutate(g.id)}>✕</Button>
              )}
            </div>
          ))}
          {(!goals || goals.length === 0) && <p className="text-sm text-muted-foreground">Sin goles registrados</p>}
        </div>

        {/* Add goal form */}
        {!disabled && (
          <div className="border-t pt-4 space-y-3">
            <h4 className="font-medium text-sm">Agregar Gol</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Equipo que anota</Label>
                <Select value={teamId} onValueChange={(v) => { setTeamId(v); setScorerId(""); setAssistId(""); setOwnGoalPlayerId(""); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {teams?.map((t: any) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Periodo</Label>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1er</SelectItem>
                    <SelectItem value="2">2do</SelectItem>
                    <SelectItem value="3">3er</SelectItem>
                    <SelectItem value="OT">OT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs">Tiempo (mm:ss)</Label>
              <Input value={time} onChange={(e) => setTime(e.target.value)} placeholder="05:30" />
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={isOwnGoal} onChange={(e) => { setIsOwnGoal(e.target.checked); setScorerId(""); setAssistId(""); setOwnGoalPlayerId(""); }} />
              Gol en contra (autogol)
            </label>

            {!isOwnGoal ? (
              <>
                <div>
                  <Label className="text-xs">Goleador</Label>
                  <Select value={scorerId} onValueChange={setScorerId}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {scoringTeamPlayers?.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>#{p.jersey_number} {p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Asistente (opcional)</Label>
                  <Select value={assistId} onValueChange={setAssistId}>
                    <SelectTrigger><SelectValue placeholder="Ninguno" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Ninguno</SelectItem>
                      {scoringTeamPlayers?.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>#{p.jersey_number} {p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <div>
                <Label className="text-xs">Autogol por (jugador del equipo que defiende)</Label>
                <Select value={ownGoalPlayerId} onValueChange={setOwnGoalPlayerId}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar (opcional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Desconocido</SelectItem>
                    {defendingTeamPlayers?.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>#{p.jersey_number} {p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button onClick={() => addGoal.mutate()} disabled={!canAdd} className="w-full">
              Agregar Gol
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PenaltyEventsSection({ matchId, homeTeamId, awayTeamId, disabled }: { matchId: string; homeTeamId: string; awayTeamId: string; disabled?: boolean }) {
  const queryClient = useQueryClient();
  const [teamId, setTeamId] = useState(homeTeamId);
  const [period, setPeriod] = useState("1");
  const [gameMinutes, setGameMinutes] = useState("");
  const [gameSeconds, setGameSeconds] = useState("00");
  const [timePreset, setTimePreset] = useState("01:30");
  const [penaltyMins, setPenaltyMins] = useState("1");
  const [penaltySecs, setPenaltySecs] = useState("30");
  const [playerId, setPlayerId] = useState("");
  const [penaltyType, setPenaltyType] = useState("");

  const { data: penalties } = useQuery({
    queryKey: ["admin-penalties", matchId],
    queryFn: async () => {
      const { data } = await supabase
        .from("penalty_events")
        .select("*, player:players(*), team:teams(*)")
        .eq("match_id", matchId)
        .order("period")
        .order("time_mmss");
      return data || [];
    },
  });

  const { data: homePlayers } = useQuery({
    queryKey: ["players", homeTeamId],
    queryFn: async () => {
      const { data } = await supabase.from("players").select("*").eq("team_id", homeTeamId).order("jersey_number");
      return data || [];
    },
  });

  const { data: awayPlayers } = useQuery({
    queryKey: ["players", awayTeamId],
    queryFn: async () => {
      const { data } = await supabase.from("players").select("*").eq("team_id", awayTeamId).order("jersey_number");
      return data || [];
    },
  });

  const { data: teams } = useQuery({
    queryKey: ["match-teams", homeTeamId, awayTeamId],
    queryFn: async () => {
      const { data } = await supabase.from("teams").select("*").in("id", [homeTeamId, awayTeamId]);
      return data || [];
    },
  });

  const currentPlayers = teamId === homeTeamId ? homePlayers : awayPlayers;

  const addPenalty = useMutation({
    mutationFn: async () => {
      const gMins = parseInt(gameMinutes) || 0;
      const gSecs = parseInt(gameSeconds) || 0;
      const timeMmss = `${String(gMins).padStart(2, "0")}:${String(gSecs).padStart(2, "0")}`;
      const pMins = parseInt(penaltyMins) || 0;
      const pSecs = parseInt(penaltySecs) || 0;
      const durationMmss = `${String(pMins).padStart(2, "0")}:${String(pSecs).padStart(2, "0")}`;
      const { error } = await supabase.from("penalty_events").insert({
        match_id: matchId,
        team_id: teamId,
        player_id: playerId,
        period,
        time_mmss: timeMmss,
        penalty_type: penaltyType,
        duration_mmss: durationMmss,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-penalties", matchId] });
      setGameMinutes("");
      setGameSeconds("00");
      setTimePreset("01:30");
      setPenaltyMins("1");
      setPenaltySecs("30");
      setPlayerId("");
      setPenaltyType("");
      toast({ title: "Sanción registrada" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deletePenalty = useMutation({
    mutationFn: async (penaltyId: string) => {
      const { error } = await supabase.from("penalty_events").delete().eq("id", penaltyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-penalties", matchId] });
      toast({ title: "Sanción eliminada" });
    },
  });

  const canAdd = !!playerId && !!penaltyType && gameMinutes !== "";

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="space-y-2">
          {penalties?.map((p: any) => (
            <div key={p.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
              <div>
                <span className="font-mono text-xs mr-2">P{p.period} {p.time_mmss}</span>
                <span className="font-medium">#{p.player?.jersey_number} {p.player?.name}</span>
                <Badge variant="outline" className="ml-2 text-xs">{p.penalty_type}</Badge>
                <span className="text-xs text-muted-foreground ml-2">- {p.team?.name}</span>
              </div>
              {!disabled && (
                <Button size="sm" variant="ghost" className="text-destructive h-7" onClick={() => deletePenalty.mutate(p.id)}>✕</Button>
              )}
            </div>
          ))}
          {(!penalties || penalties.length === 0) && <p className="text-sm text-muted-foreground">Sin sanciones registradas</p>}
        </div>

        {!disabled && (
          <div className="border-t pt-4 space-y-3">
            <h4 className="font-medium text-sm">Agregar Sanción</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Equipo</Label>
                <Select value={teamId} onValueChange={(v) => { setTeamId(v); setPlayerId(""); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {teams?.map((t: any) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Periodo</Label>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1er</SelectItem>
                    <SelectItem value="2">2do</SelectItem>
                    <SelectItem value="3">3er</SelectItem>
                    <SelectItem value="OT">OT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Minuto del partido</Label>
                <Input type="number" min={0} max={60} value={gameMinutes} onChange={(e) => setGameMinutes(e.target.value)} placeholder="00" />
              </div>
              <div>
                <Label className="text-xs">Segundos</Label>
                <Input type="number" min={0} max={59} value={gameSeconds} onChange={(e) => setGameSeconds(e.target.value)} placeholder="00" />
              </div>
            </div>

            <div>
              <Label className="text-xs">Duración de sanción</Label>
              <Select value={timePreset} onValueChange={(v) => {
                setTimePreset(v);
                if (v !== "manual") {
                  const [m, s] = v.split(":");
                  setPenaltyMins(String(parseInt(m)));
                  setPenaltySecs(String(parseInt(s)));
                }
              }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PREDEFINED_TIMES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {timePreset === "manual" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Min. sanción</Label>
                  <Input type="number" min={0} max={60} value={penaltyMins} onChange={(e) => setPenaltyMins(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Seg. sanción</Label>
                  <Input type="number" min={0} max={59} value={penaltySecs} onChange={(e) => setPenaltySecs(e.target.value)} />
                </div>
              </div>
            )}

            <div>
              <Label className="text-xs">Jugador</Label>
              <Select value={playerId} onValueChange={setPlayerId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar jugador" /></SelectTrigger>
                <SelectContent>
                  {currentPlayers?.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>#{p.jersey_number} {p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Tipo de sanción</Label>
              <Select value={penaltyType} onValueChange={setPenaltyType}>
                <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                <SelectContent>
                  {PENALTY_TYPES.map((pt) => (
                    <SelectItem key={pt.code} value={pt.code}>{pt.code} - {pt.desc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={() => addPenalty.mutate()} disabled={!canAdd} className="w-full">
              Agregar Sanción
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
