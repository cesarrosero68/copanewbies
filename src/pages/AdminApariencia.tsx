import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { ChevronLeft, Save, RotateCcw } from "lucide-react";
import type { Session } from "@supabase/supabase-js";

const DEFAULTS = {
  primary_color: "#ff1493",
  accent_color: "#a8d400",
  background_color: "#0f1117",
  text_color: "#ffffff",
  border_color: "#2a2a3e",
  font_size_base: "16",
  font_family: "inter",
  logo_url: "",
};

const FONTS = [
  { value: "inter", label: "Inter" },
  { value: "roboto", label: "Roboto" },
  { value: "montserrat", label: "Montserrat" },
  { value: "oswald", label: "Oswald" },
  { value: "bebas-neue", label: "Bebas Neue" },
];

// WCAG contrast helpers
function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const num = parseInt(n, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}
function luminance({ r, g, b }: { r: number; g: number; b: number }) {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}
function contrast(a: string, b: string) {
  try {
    const la = luminance(hexToRgb(a));
    const lb = luminance(hexToRgb(b));
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  } catch { return 21; }
}

function applyTheme(t: any) {
  const root = document.documentElement;
  root.style.setProperty("--primary-custom", t.primary_color);
  root.style.setProperty("--accent-custom", t.accent_color);
  root.style.setProperty("--background-custom", t.background_color);
  root.style.setProperty("--text-custom", t.text_color);
  root.style.setProperty("--border-custom", t.border_color);
  root.style.setProperty("font-size", `${t.font_size_base}px`);
}

export default function AdminApariencia() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

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

  const { data: isAdmin, isLoading: checkingAdmin } = useQuery({
    queryKey: ["is-admin", session?.user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", session!.user.id).eq("role", "admin").maybeSingle();
      return !!data;
    },
    enabled: !!session,
  });

  const { data: theme } = useQuery({
    queryKey: ["site-theme"],
    queryFn: async () => {
      const { data } = await (supabase.from("site_theme" as any).select("*").eq("id", 1).maybeSingle() as any);
      return (data || DEFAULTS) as any;
    },
  });

  const [draft, setDraft] = useState<any>(DEFAULTS);
  useEffect(() => { if (theme) setDraft({ ...DEFAULTS, ...theme }); }, [theme]);

  const contrastRatio = useMemo(() => contrast(draft.background_color, draft.text_color), [draft.background_color, draft.text_color]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase.from("site_theme" as any).update({
        primary_color: draft.primary_color,
        accent_color: draft.accent_color,
        background_color: draft.background_color,
        text_color: draft.text_color,
        border_color: draft.border_color,
        font_size_base: draft.font_size_base,
        font_family: draft.font_family,
        logo_url: draft.logo_url || null,
        updated_at: new Date().toISOString(),
      }).eq("id", 1) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      applyTheme(draft);
      toast({ title: "Apariencia guardada y aplicada" });
      qc.invalidateQueries({ queryKey: ["site-theme"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (loading || checkingAdmin) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  if (!session) return null;
  if (isAdmin === false) return <div className="min-h-screen flex items-center justify-center">Acceso denegado</div>;

  const ColorField = ({ label, k }: { label: string; k: string }) => (
    <div>
      <Label>{label}</Label>
      <div className="flex gap-2 items-center">
        <input type="color" value={draft[k]} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} className="w-12 h-10 rounded border border-border cursor-pointer" />
        <Input value={draft[k]} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} className="font-mono" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-secondary text-secondary-foreground border-b border-border">
        <div className="container flex items-center justify-between h-14">
          <Link to="/admin" className="flex items-center gap-1 text-sm text-secondary-foreground/70 hover:text-secondary-foreground">
            <ChevronLeft className="w-4 h-4" /> Admin
          </Link>
          <h1 className="font-display text-lg font-bold uppercase">Apariencia</h1>
          <div />
        </div>
      </header>

      <div className="container py-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <ColorField label="Color primario" k="primary_color" />
          <ColorField label="Color de acento" k="accent_color" />
          <ColorField label="Color de fondo" k="background_color" />
          <ColorField label="Color de texto" k="text_color" />
          <ColorField label="Color de borde" k="border_color" />

          <div>
            <Label>Tamaño de fuente base: {draft.font_size_base}px</Label>
            <input type="range" min={12} max={20} step={1} value={parseInt(draft.font_size_base)} onChange={(e) => setDraft({ ...draft, font_size_base: e.target.value })} className="w-full" />
          </div>

          <div>
            <Label>Familia tipográfica</Label>
            <Select value={draft.font_family} onValueChange={(v) => setDraft({ ...draft, font_family: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {FONTS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>URL del logo</Label>
            <Input value={draft.logo_url || ""} onChange={(e) => setDraft({ ...draft, logo_url: e.target.value })} placeholder="https://..." />
            {draft.logo_url && <img src={draft.logo_url} alt="logo" className="mt-2 h-16 rounded" />}
          </div>

          {contrastRatio < 4.5 && (
            <div className="p-3 border border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-sm rounded-md">
              ⚠️ Contraste bajo entre texto y fondo ({contrastRatio.toFixed(2)}:1). WCAG recomienda mínimo 4.5:1.
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              <Save className="w-4 h-4 mr-1" /> {save.isPending ? "Guardando..." : "Guardar Apariencia"}
            </Button>
            <Button variant="outline" onClick={() => setDraft(DEFAULTS)}>
              <RotateCcw className="w-4 h-4 mr-1" /> Restaurar valores originales
            </Button>
          </div>
        </div>

        <div>
          <Label>Vista previa</Label>
          <div style={{ background: draft.background_color, color: draft.text_color, fontSize: `${draft.font_size_base}px` }} className="mt-2 p-6 rounded-lg border-2" >
            <h2 className="font-display text-3xl font-bold mb-2">Copa Newbies</h2>
            <p className="mb-4 opacity-80">Este es un párrafo de ejemplo para previsualizar el tema.</p>
            <div className="flex gap-2 mb-4">
              <button style={{ background: draft.primary_color, color: draft.text_color }} className="px-4 py-2 rounded-md font-medium">Botón Primario</button>
              <button style={{ background: draft.accent_color, color: draft.background_color }} className="px-4 py-2 rounded-md font-medium">Botón Acento</button>
            </div>
            <div style={{ borderColor: draft.border_color }} className="border-2 rounded-md p-4">
              <div className="font-semibold mb-1">Tarjeta de ejemplo</div>
              <div className="text-sm opacity-70">Contenido dentro de una tarjeta con el color de borde.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}