import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { TOURNAMENT_ID as LEGACY_TOURNAMENT_ID } from "@/lib/tournament";
import { applyEditionTheme } from "@/lib/theme";

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
  header_color: string | null;
  footer_color: string | null;
  bg_color: string | null;
  title_color: string | null;
  text_color: string | null;
  font_family: string | null;
  font_size: string | null;
  hero_color: string | null;
  hero_gradient_to: string | null;
  sponsors_enabled: boolean | null;
}

interface TournamentContextValue {
  tournaments: TournamentEdition[];
  activeTournament: TournamentEdition | null;
  currentTournament: TournamentEdition | null;
  viewedTournament: TournamentEdition | null;
  tournamentId: string;
  activeTournamentId: string;
  viewedTournamentId: string;
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
  const [tournamentsFetched, setTournamentsFetched] = useState(false);
  const [themeApplied, setThemeApplied] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const editionParam = searchParams.get("edition");

  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from("tournaments")
      .select("id,name,year,semester,status,season,created_at,primary_color,hero_logo_url,logo_url,header_color,footer_color,bg_color,title_color,text_color,font_family,font_size,hero_color,hero_gradient_to,sponsors_enabled")
      .order("year", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
    setTournaments((data ?? []) as unknown as TournamentEdition[]);
    setTournamentsFetched(true);
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

  // Apply the viewed edition's full appearance theme on every switch, and
  // only then flip `loading` to false. Splitting this into its own effect
  // (instead of setting loading straight from refresh()) guarantees the
  // CSS variables are on the DOM before PublicLayout stops showing the
  // loading gate — otherwise the page can flash the hardcoded default
  // theme and the fallback tournament's stats for a moment.
  useEffect(() => {
    if (!tournamentsFetched) return;
    if (currentTournament) applyEditionTheme(currentTournament);
    setThemeApplied(true);
  }, [
    tournamentsFetched,
    currentTournament?.id,
    currentTournament?.primary_color,
    currentTournament?.header_color,
    currentTournament?.footer_color,
    currentTournament?.bg_color,
    currentTournament?.title_color,
    currentTournament?.text_color,
    currentTournament?.font_family,
    currentTournament?.font_size,
    currentTournament?.hero_color,
    currentTournament?.hero_gradient_to,
  ]);

  const loading = !tournamentsFetched || !themeApplied;

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
    viewedTournamentId: tournamentId,
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
