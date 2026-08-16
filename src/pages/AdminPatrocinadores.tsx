import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useTournament } from "@/lib/tournamentContext";
import { ChevronLeft, ArrowUp, ArrowDown, Trash2, Plus } from "lucide-react";
import type { Session } from "@supabase/supabase-js";

export default function AdminPatrocinadores() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { activeTournamentId, activeTournament, refresh } = useTournament();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [speed, setSpeed] = useState("medium");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s); setLoading(false);
      if (!s) navigate("/admin/login");
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session); setLoading(false);
      if (!session) navigate("/admin/login");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (activeTournament) setEnabled(!!(activeTournament as any).sponsors_enabled);
  }, [activeTournament?.id, (activeTournament as any)?.sponsors_enabled]);

  const { data: sponsors, refetch } = useQuery({
    queryKey: ["admin-sponsors", activeTournamentId],
    queryFn: async () => {
      const { data } = await supabase
        .from("sponsors")
        .select("*")
        .eq("tournament_id", activeTournamentId)
        .order("display_order", { ascending: true, nullsFirst: false });
      return data || [];
    },
    enabled: !!activeTournamentId && !!session,
  });

  useEffect(() => {
    if (sponsors && sponsors.length > 0 && (sponsors[0] as any).speed) setSpeed((sponsors[0] as any).speed);
  }, [sponsors]);

  const invalidatePublic = () => qc.invalidateQueries({ queryKey: ["sponsors-marquee"] });

  const toggleEnabled = async (value: boolean) => {
    setEnabled(value);
    const { error } = await supabase.from("tournaments").update({ sponsors_enabled: value }).eq("id", activeTournamentId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    await refresh();
    invalidatePublic();
  };

  const changeSpeed = async (value: string) => {
    setSpeed(value);
    const { error } = await supabase.from("sponsors").update({ speed: value }).eq("tournament_id", activeTournamentId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    refetch();
    invalidatePublic();
  };

  const addSponsor = async () => {
    if (!name.trim()) {
      toast({ title: "Falta el nombre", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      let logoUrl: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop() || "png";
        const path = `sponsors/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("sponsors").upload(path, file, { upsert: true });
        if (upErr) throw upErr;
        logoUrl = supabase.storage.from("sponsors").getPublicUrl(path).data.publicUrl;
      }
      const nextOrder = (sponsors || []).length;
      const { error } = await supabase.from("sponsors").insert({
        tournament_id: activeTournamentId,
        name: name.trim(),
        website_url: url.trim() || null,
        logo_url: logoUrl,
        display_order: nextOrder,
        speed,
      });
      if (error) throw error;
      toast({ title: "Patrocinador agregado" });
      setName(""); setUrl(""); setFile(null);
      refetch();
      invalidatePublic();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const updateSponsor = async (id: string, patch: Record<string, any>) => {
    const { error } = await supabase.from("sponsors").update(patch).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    refetch();
    invalidatePublic();
  };

  const move = async (index: number, dir: -1 | 1) => {
    const list = [...(sponsors || [])];
    const target = index + dir;
    if (target < 0 || target >= list.length) return;
    const a: any = list[index];
    const b: any = list[target];
    await supabase.from("sponsors").update({ display_order: target }).eq("id", a.id);
    await supabase.from("sponsors").update({ display_order: index }).eq("id", b.id);
    refetch();
    invalidatePublic();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("sponsors").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Patrocinador eliminado" });
    refetch();
    invalidatePublic();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  if (!session) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-secondary text-secondary-foreground border-b border-border">
        <div className="container flex items-center justify-between h-14">
          <Link to="/admin" className="flex items-center gap-1 text-sm text-secondary-foreground/70 hover:text-secondary-foreground">
            <ChevronLeft className="w-4 h-4" /> Admin
          </Link>
          <h1 className="font-display text-lg font-bold uppercase">Patrocinadores</h1>
          <div />
        </div>
      </header>

      <div className="container py-8 space-y-6 max-w-3xl">
        <Card>
          <CardContent className="p-4 flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <Switch checked={enabled} onCheckedChange={toggleEnabled} id="sponsors-enabled" />
              <Label htmlFor="sponsors-enabled">Barra de patrocinadores visible</Label>
            </div>
            <div className="flex items-center gap-2">
              <Label>Velocidad</Label>
              <Select value={speed} onValueChange={changeSpeed}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="slow">Lenta</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="fast">Rápida</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div><Label>Nombre *</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><Label>Sitio web</Label><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." /></div>
            <div>
              <Label>Logo</Label>
              <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>
            <div className="md:col-span-3">
              <Button onClick={addSponsor} disabled={saving}>
                <Plus className="w-4 h-4 mr-1" /> {saving ? "Guardando..." : "Agregar patrocinador"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-2">
          {(sponsors || []).map((s: any, i: number) => (
            <Card key={s.id}>
              <CardContent className="p-3 flex flex-wrap items-center gap-3">
                {s.logo_url ? (
                  <img src={s.logo_url} alt={s.name} className="h-10 w-auto object-contain" />
                ) : (
                  <div className="h-10 w-10 rounded bg-muted" />
                )}
                <Input
                  className="flex-1 min-w-[140px]"
                  defaultValue={s.name}
                  onBlur={(e) => e.target.value !== s.name && updateSponsor(s.id, { name: e.target.value })}
                />
                <Input
                  className="flex-1 min-w-[140px]"
                  placeholder="https://..."
                  defaultValue={s.website_url || ""}
                  onBlur={(e) => e.target.value !== (s.website_url || "") && updateSponsor(s.id, { website_url: e.target.value || null })}
                />
                <Button variant="ghost" size="icon" onClick={() => move(i, -1)} disabled={i === 0}><ArrowUp className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => move(i, 1)} disabled={i === (sponsors || []).length - 1}><ArrowDown className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => remove(s.id)}><Trash2 className="w-4 h-4" /></Button>
              </CardContent>
            </Card>
          ))}
          {sponsors && sponsors.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">Sin patrocinadores</p>
          )}
        </div>
      </div>
    </div>
  );
}