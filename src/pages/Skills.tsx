import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSkillsCompetitionData } from "@/hooks/useSkillsCompetitionData";
import { useTournament } from "@/lib/tournamentContext";
import { SkillsPlayer } from "@/lib/skillsTypes";
import { getBestTimedResultMs, getDirectScoreFromResults, getPointsForPosition } from "@/lib/skillsRanking";
import { LogIn } from "lucide-react";

export default function Skills() {
  const { tournamentId } = useTournament();
  const { players, results, pointScales } = useSkillsCompetitionData({ activeOnly: true, tournamentId });

  const byTest = (testNumber: number) => results.filter((result) => result.test_number === testNumber);

  const bestTimeMs = (playerId: string, testNumber: number) => {
    const playerResults = byTest(testNumber).filter((result) => result.player_id === playerId);
    return getBestTimedResultMs(playerResults);
  };

  const timedRankingPoints = (testNumber: number, roleFilter: "field" | "goalkeeper") => {
    const eligiblePlayers = players.filter((player) => player.role === roleFilter);
    const ranked = eligiblePlayers
      .map((player) => ({ player, time: bestTimeMs(player.id, testNumber) }))
      .filter((entry): entry is { player: SkillsPlayer; time: number } => entry.time !== null)
      .sort((a, b) => a.time - b.time);

    const pointsMap: Record<string, number> = {};
    ranked.forEach(({ player }, index) => {
      pointsMap[player.id] = getPointsForPosition(index + 1, player.role, pointScales) ?? 0;
    });

    return pointsMap;
  };

  const directScore = (playerId: string, testNumber: number) => {
    const playerResults = byTest(testNumber).filter((result) => result.player_id === playerId);
    return getDirectScoreFromResults(playerResults, testNumber);
  };

  const ranking1Field = useMemo(() => {
    const test1Points = timedRankingPoints(1, "field");
    const test2Points = timedRankingPoints(2, "field");

    return players
      .filter((player) => player.role === "field")
      .map((player) => ({
        player,
        test1: test1Points[player.id] || 0,
        test2: test2Points[player.id] || 0,
        total: (test1Points[player.id] || 0) + (test2Points[player.id] || 0),
      }))
      .sort((a, b) => b.total - a.total);
  }, [players, results, pointScales]);

  const ranking1GK = useMemo(() => {
    const test1Points = timedRankingPoints(1, "goalkeeper");
    const test2Points = timedRankingPoints(2, "goalkeeper");

    return players
      .filter((player) => player.role === "goalkeeper")
      .map((player) => ({
        player,
        test1: test1Points[player.id] || 0,
        test2: test2Points[player.id] || 0,
        total: (test1Points[player.id] || 0) + (test2Points[player.id] || 0),
      }))
      .sort((a, b) => b.total - a.total);
  }, [players, results, pointScales]);

  const ranking2 = useMemo(() => {
    return players
      .filter((player) => player.role === "field")
      .map((player) => ({
        player,
        test3: directScore(player.id, 3),
        test4: directScore(player.id, 4),
        test5: directScore(player.id, 5),
        total: directScore(player.id, 3) + directScore(player.id, 4) + directScore(player.id, 5),
      }))
      .sort((a, b) => b.total - a.total);
  }, [players, results]);

  const ranking3 = useMemo(() => {
    const test1Points = timedRankingPoints(1, "goalkeeper");
    const test2Points = timedRankingPoints(2, "goalkeeper");
    const test7Points = timedRankingPoints(7, "goalkeeper");

    return players
      .filter((player) => player.role === "goalkeeper")
      .map((player) => ({
        player,
        test1: test1Points[player.id] || 0,
        test2: test2Points[player.id] || 0,
        test4: directScore(player.id, 4),
        test6: directScore(player.id, 6),
        test7: test7Points[player.id] || 0,
        total:
          (test1Points[player.id] || 0) +
          (test2Points[player.id] || 0) +
          directScore(player.id, 4) +
          directScore(player.id, 6) +
          (test7Points[player.id] || 0),
      }))
      .sort((a, b) => b.total - a.total);
  }, [players, results, pointScales]);

  const formatMs = (ms: number | null) => {
    if (ms === null) return "—";
    if (ms >= 60000) {
      const mins = Math.floor(ms / 60000);
      const secs = Math.floor((ms % 60000) / 1000);
      return `${mins}:${String(secs).padStart(2, "0")}`;
    }

    const secs = Math.floor(ms / 1000);
    const millis = ms % 1000;
    return `${secs}.${String(millis).padStart(3, "0")}`;
  };

  const RankingTable = ({
    data,
    columns,
  }: {
    data: { player: SkillsPlayer; total: number; [key: string]: string | number | SkillsPlayer }[];
    columns: { key: string; label: string }[];
  }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">Pos</TableHead>
          <TableHead>Jugador</TableHead>
          <TableHead>Club</TableHead>
          {columns.map((column) => (
            <TableHead key={column.key} className="text-center">
              {column.label}
            </TableHead>
          ))}
          <TableHead className="text-center font-bold">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row, index) => (
          <TableRow key={row.player.id}>
            <TableCell className="font-bold">{index + 1}</TableCell>
            <TableCell>
              #{row.player.consecutive_number} {row.player.full_name}
            </TableCell>
            <TableCell>{row.player.club}</TableCell>
            {columns.map((column) => (
              <TableCell key={column.key} className="text-center">
                {row[column.key] as string | number}
              </TableCell>
            ))}
            <TableCell className="text-center font-bold text-primary">{row.total}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const TestResultsTable = ({ testNum }: { testNum: number }) => {
    const testResults = byTest(testNum);
    const isTimed = [1, 2, 7].includes(testNum);

    if (isTimed) {
      const grouped = players
        .map((player) => ({
          player,
          results: testResults.filter((result) => result.player_id === player.id),
          best: bestTimeMs(player.id, testNum),
        }))
        .filter((entry): entry is { player: SkillsPlayer; results: typeof testResults; best: number } => entry.results.length > 0 && entry.best !== null)
        .sort((a, b) => a.best - b.best);

      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pos</TableHead>
              <TableHead>Jugador</TableHead>
              <TableHead>Club</TableHead>
              <TableHead>Mejor Tiempo</TableHead>
              <TableHead>Pts</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grouped.map((entry, index) => (
              <TableRow key={entry.player.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  #{entry.player.consecutive_number} {entry.player.full_name}{" "}
                  <Badge variant="outline" className="ml-1">
                    {entry.player.role === "goalkeeper" ? "GK" : "J"}
                  </Badge>
                </TableCell>
                <TableCell>{entry.player.club}</TableCell>
                <TableCell className="font-bold">{formatMs(entry.best)}</TableCell>
                <TableCell className="font-bold text-primary">
                  {getPointsForPosition(index + 1, entry.player.role, pointScales) ?? 0}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }

    const grouped = players
      .map((player) => ({
        player,
        score: directScore(player.id, testNum),
        hasResults: testResults.some((result) => result.player_id === player.id),
      }))
      .filter((entry) => entry.hasResults)
      .sort((a, b) => b.score - a.score);

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pos</TableHead>
            <TableHead>Jugador</TableHead>
            <TableHead>Club</TableHead>
            <TableHead>Resultado</TableHead>
            <TableHead>Pts</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {grouped.map((entry, index) => (
            <TableRow key={entry.player.id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>
                #{entry.player.consecutive_number} {entry.player.full_name}{" "}
                <Badge variant="outline" className="ml-1">
                  {entry.player.role === "goalkeeper" ? "GK" : "J"}
                </Badge>
              </TableCell>
              <TableCell>{entry.player.club}</TableCell>
              <TableCell className="font-bold">{entry.score}</TableCell>
              <TableCell className="font-bold text-primary">
                {getPointsForPosition(index + 1, entry.player.role, pointScales) ?? 0}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const testNames = [
    "",
    "T1 - Fastest Lap",
    "T2 - Fastest Circuit",
    "T3 - Target Sniper",
    "T4 - Goal Sniper",
    "T5 - Penalty Shot",
    "T6 - Penalty Save",
    "T7 - Goalie Equipment",
  ];

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold uppercase">🏒 Skills Competition</h1>
        <Link to="/skills/login">
          <Button size="sm" variant="outline">
            <LogIn className="mr-1 h-4 w-4" /> Staff
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="ranking1">
        <TabsList className="flex h-auto flex-wrap gap-1">
          <TabsTrigger value="ranking1">🏃 Fastest Skater</TabsTrigger>
          <TabsTrigger value="ranking2">🎯 Best Sniper</TabsTrigger>
          <TabsTrigger value="ranking3">🧤 Best Goalkeeper</TabsTrigger>
          <TabsTrigger value="results">📊 Resultados</TabsTrigger>
        </TabsList>

        <TabsContent value="ranking1" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ranking Fastest Skater — Jugadores</CardTitle>
            </CardHeader>
            <CardContent>
              <RankingTable data={ranking1Field} columns={[{ key: "test1", label: "T1" }, { key: "test2", label: "T2" }]} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Ranking Fastest Skater — Arqueros</CardTitle>
            </CardHeader>
            <CardContent>
              <RankingTable data={ranking1GK} columns={[{ key: "test1", label: "T1" }, { key: "test2", label: "T2" }]} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ranking2">
          <Card>
            <CardHeader>
              <CardTitle>Ranking Best Sniper — Jugadores</CardTitle>
            </CardHeader>
            <CardContent>
              <RankingTable
                data={ranking2}
                columns={[{ key: "test3", label: "T3" }, { key: "test4", label: "T4" }, { key: "test5", label: "T5" }]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ranking3">
          <Card>
            <CardHeader>
              <CardTitle>Ranking Best Goalkeeper</CardTitle>
            </CardHeader>
            <CardContent>
              <RankingTable
                data={ranking3}
                columns={[
                  { key: "test1", label: "T1" },
                  { key: "test2", label: "T2" },
                  { key: "test4", label: "T4" },
                  { key: "test6", label: "T6" },
                  { key: "test7", label: "T7" },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results">
          <Tabs defaultValue="t1">
            <TabsList className="flex h-auto flex-wrap gap-1">
              {[1, 2, 3, 4, 5, 6, 7].map((testNumber) => (
                <TabsTrigger key={testNumber} value={`t${testNumber}`}>
                  {testNames[testNumber]}
                </TabsTrigger>
              ))}
            </TabsList>
            {[1, 2, 3, 4, 5, 6, 7].map((testNumber) => (
              <TabsContent key={testNumber} value={`t${testNumber}`}>
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Test {testNumber} — {testNames[testNumber]}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TestResultsTable testNum={testNumber} />
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}
