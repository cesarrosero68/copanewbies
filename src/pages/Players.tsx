import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useTournament } from "@/lib/tournamentContext";
import TeamLogo from "@/components/TeamLogo";
import { ChevronDown, ChevronRight, Star } from "lucide-react";

const ROLE_ORDER = ["ENTRENADOR", "ASISTENTE", "DELEGADO"];
const ROLE_LABELS: Record<string, string> = {
  ENTRENADOR: "Entrenador",
  ASISTENTE: "Asistente",
  DELEGADO: "Delegado",
};

const fullName = (p: any) =>
  p.first_name && p.last_name ? `${p.first_name} ${p.last_name}` : p.name || p.first_name || p.last_name || "—";

function TeamCard({ team }: { team: any }) {
  const [open, setOpen] = useState(false);

  const { data: players } = useQuery({
    queryKey: ["team-roster", team.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("players")
        .select("id, first_name, last_name, name, jersey_number, position, is_captain")
        .eq("team_id", team.id)
        .order("jersey_number");
      return data || [];
    },
  });

  const { data: staff } = useQuery({
    queryKey: ["team-staff", team.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("team_staff")
        .select("id, first_name, last_name, role")
        .eq("team_id", team.id);
      return data || [];
    },
  });

  const sortedStaff = [...(staff || [])].sort(
    (a: any, b: any) =>
      ROLE_ORDER.indexOf((a.role || "").toUpperCase()) - ROLE_ORDER.indexOf((b.role || "").toUpperCase()),
  );

  const empty = (players?.length ?? 0) === 0 && (staff?.length ?? 0) === 0;

  return (
    <Card>
      <CardContent className="p-0">
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center gap-4 p-4 text-left hover:bg-muted/30 transition-colors"
        >
          {open ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
          <TeamLogo team={team} size={64} />
          <span className="font-display font-bold text-xl flex-1 truncate">{team.name}</span>
          <Badge variant="outline">{players?.length ?? 0} jugadores</Badge>
        </button>

        {open && (
          <div className="border-t p-4 space-y-6">
            {empty ? (
              <p className="text-sm text-muted-foreground italic">Sin plantilla registrada aún</p>
            ) : (
              <>
                <div>
                  <h3 className="text-xs uppercase font-semibold text-muted-foreground mb-2">Jugadores</h3>
                  {players && players.length > 0 ? (
                    <div className="space-y-1">
                      {players.map((p: any) => (
                        <div key={p.id} className="flex items-center gap-3 py-1.5 border-b last:border-0">
                          <span className="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs font-mono font-bold shrink-0">
                            {p.jersey_number}
                          </span>
                          <span className="font-medium flex-1 truncate">{fullName(p)}</span>
                          {p.is_captain && <Star className="w-4 h-4 text-primary shrink-0" fill="currentColor" />}
                          <span className="text-xs text-muted-foreground">{p.position || "—"}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Sin jugadores registrados</p>
                  )}
                </div>

                <div>
                  <h3 className="text-xs uppercase font-semibold text-muted-foreground mb-2">Cuerpo Técnico</h3>
                  {sortedStaff.length > 0 ? (
                    <div className="space-y-1">
                      {sortedStaff.map((s: any) => (
                        <div key={s.id} className="flex items-center gap-3 py-1.5 border-b last:border-0">
                          <span className="font-medium flex-1 truncate">
                            {s.first_name} {s.last_name}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {ROLE_LABELS[(s.role || "").toUpperCase()] || s.role || "—"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Sin cuerpo técnico registrado</p>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Players() {
  const { viewedTournamentId: tournamentId } = useTournament();

  const { data: teams } = useQuery({
    queryKey: ["teams", tournamentId],
    queryFn: async () => {
      const { data } = await supabase.from("teams").select("*").eq("tournament_id", tournamentId).order("name");
      return data || [];
    },
  });

  return (
    <div className="container py-8">
      <h1 className="font-display text-4xl font-bold uppercase mb-2">Equipos</h1>
      <p className="text-muted-foreground mb-6">Plantillas y cuerpo técnico por equipo</p>

      <div className="space-y-3">
        {teams?.map((t: any) => <TeamCard key={t.id} team={t} />)}
        {teams && teams.length === 0 && (
          <p className="text-center text-muted-foreground py-10">No hay equipos registrados</p>
        )}
      </div>
    </div>
  );
}
