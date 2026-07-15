import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
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
            <Route path="/playoffs" element={<Playoffs />} />
            <Route path="/editions" element={<Editions />} />
            <Route path="/match/:id" element={<MatchDetail />} />
            <Route path="/team/:slug" element={<TeamDetail />} />
          </Route>

          {/* Admin routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/match/:id" element={<AdminMatchManage />} />

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

export default App;
