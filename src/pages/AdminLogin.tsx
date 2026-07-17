import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { ChevronLeft } from "lucide-react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin + "/admin" },
      });
      if (error) {
        toast({ title: "Error al registrar", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Cuenta creada", description: "Ahora puedes iniciar sesión." });
        setMode("login");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({ title: "Error de autenticación", description: error.message, variant: "destructive" });
      } else {
        navigate("/admin");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2">
            <ChevronLeft className="w-4 h-4" />
            Volver al sitio
          </Link>
          <span className="text-4xl mb-2 block">🏒</span>
          <CardTitle className="font-display text-2xl uppercase">
            {mode === "signup" ? "Crear cuenta" : "Admin Panel"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required />

            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required />

            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Procesando..." : mode === "signup" ? "Registrarse" : "Ingresar"}
            </Button>
            <button
              type="button"
              onClick={() => setMode(mode === "signup" ? "login" : "signup")}
              className="text-xs text-muted-foreground hover:text-foreground w-full text-center"
            >
              {mode === "signup" ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate"}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>);

}