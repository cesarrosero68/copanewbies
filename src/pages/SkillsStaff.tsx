import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getStaffSession, clearStaffSession } from "@/lib/skillsTypes";
import { useSkillsCompetitionData } from "@/hooks/useSkillsCompetitionData";
import { useTournament } from "@/lib/tournamentContext";
import PlayersTab from "@/components/skills/PlayersTab";
import TimedTestTab from "@/components/skills/TimedTestTab";
import SniperTestTab from "@/components/skills/SniperTestTab";
import AccuracyTestTab from "@/components/skills/AccuracyTestTab";
import ShootoutTestTab from "@/components/skills/ShootoutTestTab";
import { LogOut } from "lucide-react";

export default function SkillsStaff() {
  const navigate = useNavigate();
  const staff = getStaffSession();
  const { activeTournamentId } = useTournament();
  const { players, results, pointScales, refresh } = useSkillsCompetitionData({ tournamentId: activeTournamentId });

  useEffect(() => {
    if (!staff) {
      navigate("/skills/login");
    }
  }, [navigate, staff]);

  const handleLogout = () => {
    clearStaffSession();
    navigate("/skills/login");
  };

  if (!staff) return null;

  const fieldShootoutOptions = [
    { key: "goal", label: "⚽ Gol (+3)", points: 3 },
    { key: "miss_outside", label: "↗ Afuera (-1)", points: -1 },
    { key: "saved", label: "🧤 Atajado (+1)", points: 1 },
  ];

  const gkShootoutOptions = [
    { key: "saved", label: "🧤 Atajado (+3)", points: 3 },
    { key: "outside", label: "↗ Afuera (+1)", points: 1 },
    { key: "goal_against", label: "⚽ Gol en contra (-1)", points: -1 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-secondary text-secondary-foreground">
        <div className="container flex h-14 items-center justify-between">
          <span className="font-display text-lg font-bold uppercase">🏒 Skills Staff</span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-secondary-foreground/70">{staff.user_name}</span>
            <Button size="sm" variant="ghost" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-4">
        <Tabs defaultValue="players">
          <TabsList className="flex h-auto flex-wrap gap-1">
            <TabsTrigger value="players">Jugadores</TabsTrigger>
            <TabsTrigger value="test1">T1 - Fastest Lap</TabsTrigger>
            <TabsTrigger value="test2">T2 - Fastest Circuit</TabsTrigger>
            <TabsTrigger value="test3">T3 - Target Sniper</TabsTrigger>
            <TabsTrigger value="test4">T4 - Goal Sniper</TabsTrigger>
            <TabsTrigger value="test5">T5 - Penalty Shot</TabsTrigger>
            <TabsTrigger value="test6">T6 - Penalty Save</TabsTrigger>
            <TabsTrigger value="test7">T7 - Goalie Equipment</TabsTrigger>
          </TabsList>

          <TabsContent value="players">
            <PlayersTab players={players} onRefresh={refresh} />
          </TabsContent>

          <TabsContent value="test1">
            <TimedTestTab
              testNumber={1}
              title="Test 1 — Fastest Lap Skater"
              players={players}
              results={results}
              onRefresh={refresh}
              pointScales={pointScales}
              roleFilter="all"
            />
          </TabsContent>

          <TabsContent value="test2">
            <TimedTestTab
              testNumber={2}
              title="Test 2 — Fastest Circuit Skater"
              players={players}
              results={results}
              onRefresh={refresh}
              pointScales={pointScales}
              roleFilter="all"
            />
          </TabsContent>

          <TabsContent value="test3">
            <SniperTestTab players={players} results={results} onRefresh={refresh} pointScales={pointScales} />
          </TabsContent>

          <TabsContent value="test4">
            <AccuracyTestTab players={players} results={results} onRefresh={refresh} pointScales={pointScales} />
          </TabsContent>

          <TabsContent value="test5">
            <ShootoutTestTab
              testNumber={5}
              title="Test 5 — Shootouts (Jugadores)"
              players={players}
              results={results}
              onRefresh={refresh}
              pointScales={pointScales}
              roleFilter="field"
              options={fieldShootoutOptions}
            />
          </TabsContent>

          <TabsContent value="test6">
            <ShootoutTestTab
              testNumber={6}
              title="Test 6 — Shootouts (Arqueros)"
              players={players}
              results={results}
              onRefresh={refresh}
              pointScales={pointScales}
              roleFilter="goalkeeper"
              options={gkShootoutOptions}
              maxShootouts={12}
            />
          </TabsContent>

          <TabsContent value="test7">
            <TimedTestTab
              testNumber={7}
              title="Test 7 — Equipment Challenge (Arqueros)"
              players={players}
              results={results}
              onRefresh={refresh}
              pointScales={pointScales}
              roleFilter="goalkeeper"
              maxAttempts={1}
              showMinutes
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
