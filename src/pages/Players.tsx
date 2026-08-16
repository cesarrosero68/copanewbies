import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { useTournament } from "@/lib/tournamentContext";
import TeamLogo from "@/components/TeamLogo";
import { Users } from "lucide-react";

function darkenColor(hex: string, amount = 0.5) {
  const h = (hex || "#A8D8EA").replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(full.slice(0, 2), 16) || 0;
  const g = parseInt(full.slice(2, 4), 16) || 0;
  const b = parseInt(full.slice(4, 6), 16) || 0;
  const dr = Math.round(r * (1 - amount));
  const dg = Math.round(g * (1 - amount));
  const db = Math.round(b * (1 - amount));
  return `rgb(${dr}, ${dg}, ${db})`;
}

export default function Players() {
  const { viewedTournamentId: tournamentId, isReadOnly, viewedTournament } = useTournament();

  const withEdition = (path: string) =>
    isReadOnly && viewedTournament ? `${path}?edition=${viewedTournament.id}` : path;

  const { data: teams } = useQuery({
    queryKey: ["teams", tournamentId],
    queryFn: async () => {
      const { data } = await supabase.from("teams").select("*").eq("tournament_id", tournamentId).order("name");
      return data || [];
    },
  });

  return (
    <div className="container py-8">
      <div className="flex items-center gap-3 mb-2">
        <Users className="w-8 h-8 text-primary" />
        <h1 className="font-display text-4xl font-bold uppercase">Equipos</h1>
      </div>
      <p className="text-muted-foreground mb-6">{teams?.length ?? 0} equipos participantes</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {teams?.map((t: any) => {
          const color = t.color || "#A8D8EA";
          return (
            <Link
              key={t.id}
              to={withEdition(`/equipos/${t.id}`)}
              className="group relative overflow-hidden rounded-xl border bg-card transition-all hover:border-primary/60 hover:-translate-y-1 hover:shadow-lg"
            >
              <div
                className="h-24 relative"
                style={{ background: `linear-gradient(135deg, ${color} 0%, ${darkenColor(color, 0.55)} 100%)` }}
              >
                <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-card to-transparent" />
                <div className="absolute -bottom-8 left-3">
                  <TeamLogo team={t} size={96} />
                </div>
              </div>
              <div className="pt-10 px-3 pb-3">
                <h3 className="font-display text-base sm:text-lg font-bold uppercase truncate">{t.name}</h3>
                <div className="mt-2 text-xs uppercase tracking-widest text-primary font-semibold">
                  Ver plantilla →
                </div>
              </div>
            </Link>
          );
        })}
        {teams && teams.length === 0 && (
          <p className="col-span-full text-center text-muted-foreground py-10">No hay equipos registrados</p>
        )}
      </div>
    </div>
  );
}
