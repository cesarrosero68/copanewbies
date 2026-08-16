import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useTournament } from "@/lib/tournamentContext";
import { ChevronLeft, Award } from "lucide-react";
import type { Session } from "@supabase/supabase-js";

const AWARDS: { type: string; label: string }[] = [
  { type: "mvp", label: "MVP del torneo" },
  { type: "goleador", label: "Goleadora" },
  { type: "asistencias", label: "Máxima asistidora" },
  { type: "mejor_portera", label: "Mejor portera" },
  { type: "fair_play", label: "Fair Play" },
];

export default function AdminReconocimientos() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { activeTournamentId } = useTournament();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s); setLoading(false);
      if (!s) navigate("/admin/login");
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session); setLoading(false);
      if (!session) navigate("/admin/login");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const { data: players } = useQuery({
    queryKey: ["awards-players", activeTournamentId],
    queryFn: async () => {
      const { data } = await supabase
        .from("players")
        .select("id, name, jersey_number, team:teams!inner(id, name, tournament_id)")
        .eq("team.tournament_id", activeTournamentId)
        .order("name");
      return data || [];
    },
    enabled: !!activeTournamentId && !!session,
  });

  const { data: awards, refetch } = useQuery({
    queryKey: ["awards", activeTournamentId],
    queryFn: async () => {
      const { data } = await supabase
        .from("tournament_awards")
        .select("id, award_type, player_id, player:players(name, team:teams(name))")
        .eq("tournament_id", activeTournamentId);
      return data || [];
    },
    enabled: !!activeTournamentId && !!session,
  });

  const setAward = async (awardType: string, playerId: string | null) => {
    const { error: delError } = await supabase
      .from("tournament_awards")
      .delete()
      .eq("tournament_id", activeTournamentId)
      .eq("award_type", awardType);
    if (delError) { toast({ title: "Error", description: delError.message, variant: "destructive" }); return; }

    if (playerId) {
      const { error } = await supabase
        .from("tournament_awards")
        .insert({ tournament_id: activeTournamentId, award_type: awardType, player_id: playerId });
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    }
    toast({ title: playerId ? "Reconocimiento asignado" : "Reconocimiento eliminado" });
    refetch();
    qc.invalidateQueries({ queryKey: ["podio-awards"] });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  if (!session) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-secondary text-secondary-foreground border-b border-border">
        <div className="container flex items-center justify-between h-14">
          <Link to="/admin" className="flex items-center gap-1 text-sm text-secondary-foreground/70 hover:text-secondary-foreground">
            <ChevronLeft className="w-4 h-4" /> Admin
          </Link>
          <h1 className="font-display text-lg font-bold uppercase">Reconocimientos</h1>
          <div />
        </div>
      </header>

      <div className="container py-8 space-y-4 max-w-3xl">
        {AWARDS.map((a) => {
          const current = (awards || []).find((x: any) => x.award_type === a.type) as any;
          return (
            <Card key={a.type}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  <span className="font-display font-bold uppercase">{a.label}</span>
                  {current?.player && (
                    <span className="ml-auto text-sm text-muted-foreground">
                      {current.player.name} • {current.player.team?.name}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 items-end">
                  <div className="flex-1 min-w-[220px]">
                    <Label>Jugadora</Label>
                    <Select
                      value={current?.player_id || ""}
                      onValueChange={(v) => setAward(a.type, v)}
                    >
                      <SelectTrigger><SelectValue placeholder="Seleccionar jugadora" /></SelectTrigger>
                      <SelectContent>
                        {(players || []).map((p: any) => (
                          <SelectItem key={p.id} value={p.id}>
                            #{p.jersey_number} {p.name} — {p.team?.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="outline" disabled={!current} onClick={() => setAward(a.type, null)}>
                    Quitar
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}