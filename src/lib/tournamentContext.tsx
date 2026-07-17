import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { TOURNAMENT_ID as LEGACY_TOURNAMENT_ID } from "@/lib/tournament";

export interface TournamentEdition {
  id: string;
  name: string;
  year: number | null;
  semester: string | null;
  status: string;
  season: string | null;
  created_at: string;
  primary_color: string | null;
  hero_logo_url: string | null;
  logo_url: string | null;
}

interface TournamentContextValue {
  tournaments: TournamentEdition[];
  activeTournament: TournamentEdition | null;
  currentTournament: TournamentEdition | null;
  viewedTournament: TournamentEdition | null;
  tournamentId: string;
  activeTournamentId: string;
  isViewingActive: boolean;
  isReadOnly: boolean;
  loading: boolean;
  setEdition: (id: string) => void;
  clearEdition: () => void;
  refresh: () => Promise<void>;
}

const TournamentContext = createContext<TournamentContextValue | undefined>(undefined);

export function TournamentProvider({ children }: { children: ReactNode }) {
  const [tournaments, setTournaments] = useState<TournamentEdition[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const editionParam = searchParams.get("edition");

  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from("tournaments")
      .select("id,name,year,semester,status,season,created_at,primary_color,hero_logo_url,logo_url")
      .order("year", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
    setTournaments((data ?? []) as unknown as TournamentEdition[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const activeTournament = useMemo(
    () => tournaments.find((t) => t.status === "active") ?? null,
    [tournaments],
  );

  const activeTournamentId = activeTournament?.id ?? LEGACY_TOURNAMENT_ID;

  const currentTournament = useMemo(() => {
    if (editionParam) {
      const match = tournaments.find((t) => t.id === editionParam);
      if (match) return match;
    }
    return activeTournament;
  }, [editionParam, tournaments, activeTournament]);

  const tournamentId = currentTournament?.id ?? activeTournamentId;
  const isViewingActive = !currentTournament || currentTournament.id === activeTournamentId;
  const isReadOnly = !isViewingActive;

  // Apply the viewed edition's primary color to the theme on every switch.
  useEffect(() => {
    if (!currentTournament) return;
    const color = currentTournament.primary_color;
    if (color) {
      document.documentElement.style.setProperty("--primary", color);
      document.documentElement.style.setProperty("--primary-foreground", "#ffffff");
    }
  }, [currentTournament?.id, currentTournament?.primary_color]);

  const setEdition = useCallback(
    (id: string) => {
      const next = new URLSearchParams(searchParams);
      next.set("edition", id);
      setSearchParams(next, { replace: false });
    },
    [searchParams, setSearchParams],
  );

  const clearEdition = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete("edition");
    setSearchParams(next, { replace: false });
  }, [searchParams, setSearchParams]);

  const value: TournamentContextValue = {
    tournaments,
    activeTournament,
    currentTournament,
    viewedTournament: currentTournament,
    tournamentId,
    activeTournamentId,
    isViewingActive,
    isReadOnly,
    loading,
    setEdition,
    clearEdition,
    refresh,
  };

  return <TournamentContext.Provider value={value}>{children}</TournamentContext.Provider>;
}

export function useTournament(): TournamentContextValue {
  const ctx = useContext(TournamentContext);
  if (!ctx) {
    throw new Error("useTournament must be used within a TournamentProvider");
  }
  return ctx;
}