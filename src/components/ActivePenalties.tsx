import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { usePenaltyClock } from "@/lib/matchClock";

function PenaltyBadge({ match, penalty }: { match: any; penalty: any }) {
  const clock = usePenaltyClock(match, penalty);
  if (!clock) return null;
  return (
    <Badge variant="outline" className="text-xs">
      Sanción · {penalty.team?.name ?? ""} · {clock}
    </Badge>
  );
}

export default function ActivePenalties({ match, className }: { match: any; className?: string }) {
  const { data: penalties } = useQuery({
    queryKey: ["active-penalties", match?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("penalty_events")
        .select("id, duration_mmss, time_mmss, period, ended_early, team:teams(name)")
        .eq("match_id", match.id)
        .not("ended_early", "is", true);
      return data || [];
    },
    enabled: !!match?.id && match?.status === "live",
    refetchInterval: 15000,
  });

  if (!penalties || penalties.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-1 ${className ?? ""}`}>
      {penalties.map((p: any) => (
        <PenaltyBadge key={p.id} match={match} penalty={p} />
      ))}
    </div>
  );
}
