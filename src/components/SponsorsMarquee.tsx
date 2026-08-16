import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTournament } from "@/lib/tournamentContext";

const SPEED_DURATION: Record<string, string> = {
  slow: "50s",
  medium: "30s",
  fast: "15s",
};

export default function SponsorsMarquee() {
  const { viewedTournament, viewedTournamentId: tournamentId } = useTournament();
  const enabled = !!(viewedTournament as any)?.sponsors_enabled;

  const { data: sponsors } = useQuery({
    queryKey: ["sponsors-marquee", tournamentId],
    queryFn: async () => {
      const { data } = await supabase
        .from("sponsors")
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("display_order", { ascending: true, nullsFirst: false });
      return data || [];
    },
    enabled: !!tournamentId && enabled,
  });

  if (!enabled || !sponsors || sponsors.length === 0) return null;

  const duration = SPEED_DURATION[(sponsors[0] as any).speed || "medium"] || SPEED_DURATION.medium;
  const loop = [...sponsors, ...sponsors];

  return (
    <div className="border-t border-border bg-card py-4 overflow-hidden">
      <style>{`@keyframes sponsors-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
      <div
        className="flex items-center gap-12 w-max"
        style={{ animation: `sponsors-scroll ${duration} linear infinite` }}
      >
        {loop.map((s: any, i: number) => {
          const content = s.logo_url ? (
            <img
              src={s.logo_url}
              alt={s.name}
              className="h-12 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity"
              loading="lazy"
            />
          ) : (
            <span className="text-sm font-medium text-muted-foreground">{s.name}</span>
          );
          return s.website_url ? (
            <a key={`${s.id}-${i}`} href={s.website_url} target="_blank" rel="noopener noreferrer" className="shrink-0">
              {content}
            </a>
          ) : (
            <div key={`${s.id}-${i}`} className="shrink-0">
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}