import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { IS_PRESEASON } from "@/lib/tournament";
import { useTournament } from "@/lib/tournamentContext";
import TeamLogo from "@/components/TeamLogo";

function BracketMatch({
  match,
  label,
  homePlaceholder,
  awayPlaceholder,
  homeTeamResolved,
  awayTeamResolved,
}: {
  match: any;
  label: string;
  homePlaceholder: string;
  awayPlaceholder: string;
  // Explicitly resolved teams to display (overrides match.home_team / match.away_team).
  // If undefined, show the placeholder text instead.
  homeTeamResolved?: any;
  awayTeamResolved?: any;
}) {
  const isPlayed = match?.status === "final" || match?.status === "locked";
  const homeTeam = homeTeamResolved;
  const awayTeam = awayTeamResolved;
  const showHomePlaceholder = IS_PRESEASON || !homeTeam;
  const showAwayPlaceholder = IS_PRESEASON || !awayTeam;

  const content = (
    <Card className="w-64 hover:shadow-md transition-shadow">
      <CardContent className="p-3">
        <p className="text-xs text-muted-foreground font-display uppercase mb-2">{label}</p>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            {!showHomePlaceholder && homeTeam && <TeamLogo team={homeTeam} size={20} />}
            <span className="text-sm font-medium">
              {showHomePlaceholder ? homePlaceholder : (homeTeam?.name || "TBD")}
            </span>
          </div>
          {isPlayed && <span className="font-display font-bold">{match.reg_home_score}</span>}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!showAwayPlaceholder && awayTeam && <TeamLogo team={awayTeam} size={20} />}
            <span className="text-sm font-medium">
              {showAwayPlaceholder ? awayPlaceholder : (awayTeam?.name || "TBD")}
            </span>
          </div>
          {isPlayed && <span className="font-display font-bold">{match.reg_away_score}</span>}
        </div>
        {match?.ot_played && isPlayed && (
          <p className="text-xs text-muted-foreground mt-1">
            {match.so_played ? "Penales (SO)" : "Overtime (OT)"}
          </p>
        )}
      </CardContent>
    </Card>
  );

  if (match && isPlayed) {
    return <Link to={`/match/${match.id}`}>{content}</Link>;
  }
  return content;
}

export default function Playoffs() {
  const { tournamentId } = useTournament();
  const { data: playoffMatches } = useQuery({
    queryKey: ["playoff-matches", tournamentId],
    queryFn: async () => {
      const { data } = await supabase
        .from("matches")
        .select("*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)")
        .eq("tournament_id", tournamentId)
        .neq("stage", "REGULAR")
        .order("match_number", { ascending: true });
      return data || [];
    },
  });

  const getMatch = (stage: string) => {
    return playoffMatches?.find((m: any) => m.stage === stage);
  };

  const p1a = getMatch("P1A");
  const p1b = getMatch("P1B");
  const semi = getMatch("SEMI");
  const p2 = getMatch("P2");
  const finalM = getMatch("FINAL");
  const third = getMatch("THIRD");

  // Helper: resolve winner / loser teams from a finished match.
  const winnerOf = (m: any) => {
    if (!m?.winner_team_id) return undefined;
    if (m.home_team?.id === m.winner_team_id) return m.home_team;
    if (m.away_team?.id === m.winner_team_id) return m.away_team;
    return undefined;
  };
  const loserOf = (m: any) => {
    if (!m?.winner_team_id) return undefined;
    if (m.home_team?.id === m.winner_team_id) return m.away_team;
    if (m.away_team?.id === m.winner_team_id) return m.home_team;
    return undefined;
  };

  // P1A / P1B: show the teams already assigned to the match in the DB.
  const p1aHome = p1a?.home_team;
  const p1aAway = p1a?.away_team;
  const p1bHome = p1b?.home_team;
  const p1bAway = p1b?.away_team;

  // SEMI: Ganador P1A vs Ganador P1B (only when those winners exist).
  const semiHome = winnerOf(p1a);
  const semiAway = winnerOf(p1b);

  // P2: Perdedor P1A vs Perdedor P1B.
  const p2Home = loserOf(p1a);
  const p2Away = loserOf(p1b);

  // FINAL: Reapers (the team already assigned as away in the DB — rank #1) vs Ganador Semi.
  // Per the request, Reapers should always show; the other slot is "Ganador Semi" until resolved.
  const finalReapers = finalM?.away_team ?? finalM?.home_team;
  const semiWinner = winnerOf(semi);

  // THIRD: Perdedor Semi vs Ganador P2.
  const thirdHome = loserOf(semi);
  const thirdAway = winnerOf(p2);

  return (
    <div className="container py-8">
      <h1 className="font-display text-4xl font-bold uppercase mb-2">Bracket de Playoffs</h1>
      <p className="text-muted-foreground mb-8">
        #1 pasa directo a la Final
      </p>

      <div className="overflow-x-auto">
        <div className="flex gap-8 items-center min-w-[900px] py-4">
          {/* Round 1 */}
          <div className="flex flex-col gap-8">
            <BracketMatch
              match={p1a}
              label="Playoff 1A"
              homePlaceholder="Puesto 2"
              awayPlaceholder="Puesto 3"
              homeTeamResolved={p1aHome}
              awayTeamResolved={p1aAway}
            />
            <BracketMatch
              match={p1b}
              label="Playoff 1B"
              homePlaceholder="Puesto 4"
              awayPlaceholder="Puesto 5"
              homeTeamResolved={p1bHome}
              awayTeamResolved={p1bAway}
            />
          </div>

          {/* Connectors */}
          <div className="flex flex-col gap-8 text-muted-foreground text-2xl">
            <span>→</span>
            <span>→</span>
          </div>

          {/* Semifinal + P2 */}
          <div className="flex flex-col gap-8">
            <BracketMatch
              match={semi}
              label="Semifinal"
              homePlaceholder="Ganador P1A"
              awayPlaceholder="Ganador P1B"
              homeTeamResolved={semiHome}
              awayTeamResolved={semiAway}
            />
            <BracketMatch
              match={p2}
              label="Playoff 2"
              homePlaceholder="Perdedor P1A"
              awayPlaceholder="Perdedor P1B"
              homeTeamResolved={p2Home}
              awayTeamResolved={p2Away}
            />
          </div>

          {/* Connectors */}
          <div className="flex flex-col gap-8 text-muted-foreground text-2xl">
            <span>→</span>
            <span>→</span>
          </div>

          {/* Final + 3rd */}
          <div className="flex flex-col gap-8">
            <BracketMatch
              match={finalM}
              label="Final"
              homePlaceholder="Puesto 1"
              awayPlaceholder="Ganador Semi"
              homeTeamResolved={finalReapers}
              awayTeamResolved={semiWinner}
            />
            <BracketMatch
              match={third}
              label="3ro / 4to"
              homePlaceholder="Perdedor Semi"
              awayPlaceholder="Ganador P2"
              homeTeamResolved={thirdHome}
              awayTeamResolved={thirdAway}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
