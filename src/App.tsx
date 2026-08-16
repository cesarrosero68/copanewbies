import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TournamentProvider } from "@/lib/tournamentContext";
import PublicLayout from "./components/layout/PublicLayout";
import Home from "./pages/Home";
import Schedule from "./pages/Schedule";
import Standings from "./pages/Standings";
import Players from "./pages/Players";
import Playoffs from "./pages/Playoffs";
import MatchDetail from "./pages/MatchDetail";
import TeamDetail from "./pages/TeamDetail";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminMatchManage from "./pages/AdminMatchManage";
import Skills from "./pages/Skills";
import SkillsLogin from "./pages/SkillsLogin";
import SkillsStaff from "./pages/SkillsStaff";
import Editions from "./pages/Editions";
import Statistics from "./pages/Statistics";
import FairPlay from "./pages/FairPlay";
import Podio from "./pages/Podio";
import AdminPlantillas from "./pages/AdminPlantillas";
import AdminApariencia from "./pages/AdminApariencia";
import AdminReconocimientos from "./pages/AdminReconocimientos";
import AdminPatrocinadores from "./pages/AdminPatrocinadores";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    (async () => {
      const { data } = await (supabase.from("site_theme" as any).select("*").eq("id", 1).maybeSingle() as any);
      if (!data) return;
      const root = document.documentElement;
      if (data.primary_color) root.style.setProperty("--primary-custom", data.primary_color);
      if (data.accent_color) root.style.setProperty("--accent-custom", data.accent_color);
      if (data.background_color) root.style.setProperty("--background-custom", data.background_color);
      if (data.text_color) root.style.setProperty("--text-custom", data.text_color);
      if (data.border_color) root.style.setProperty("--border-custom", data.border_color);
      if (data.font_size_base) root.style.setProperty("font-size", `${data.font_size_base}px`);
      if (data.font_family && data.font_family !== "inter") {
        const fontName = data.font_family
          .split("-")
          .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
          .join("+");
        const id = `google-font-${data.font_family}`;
        if (!document.getElementById(id)) {
          const link = document.createElement("link");
          link.id = id;
          link.rel = "stylesheet";
          link.href = `https://fonts.googleapis.com/css2?family=${fontName}:wght@400;600;700&display=swap`;
          document.head.appendChild(link);
        }
        root.style.setProperty("--font-custom", fontName.replace(/\+/g, " "));
      }
    })();
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <TournamentProvider>
        <Routes>
          {/* Public routes with layout */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/standings" element={<Standings />} />
            <Route path="/players" element={<Players />} />
            <Route path="/estadisticas" element={<Statistics />} />
            <Route path="/fairplay" element={<FairPlay />} />
            <Route path="/podio" element={<Podio />} />
            <Route path="/playoffs" element={<Playoffs />} />
            <Route path="/editions" element={<Editions />} />
            <Route path="/match/:id" element={<MatchDetail />} />
            <Route path="/team/:slug" element={<TeamDetail />} />
          </Route>

          {/* Admin routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/match/:id" element={<AdminMatchManage />} />
          <Route path="/admin/plantillas" element={<AdminPlantillas />} />
          <Route path="/admin/apariencia" element={<AdminApariencia />} />
          <Route path="/admin/reconocimientos" element={<AdminReconocimientos />} />
          <Route path="/admin/patrocinadores" element={<AdminPatrocinadores />} />

          {/* Skills routes */}
          <Route element={<PublicLayout />}>
            <Route path="/skills" element={<Skills />} />
          </Route>
          <Route path="/skills/login" element={<SkillsLogin />} />
          <Route path="/skills/staff" element={<SkillsStaff />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
        </TournamentProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
