import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTournament } from "@/lib/tournamentContext";
import { useNavigate } from "react-router-dom";

export default function Editions() {
  const { tournaments, activeTournament, setEdition, clearEdition, loading } = useTournament();
  const navigate = useNavigate();

const handleView = (id: string, isActive: boolean) => {
    if (isActive) {
      clearEdition();
      navigate("/");
    } else {
      setEdition(id);
      navigate("/?edition=" + id);
    }
  };

  return (
    <div className="container py-8">
      <h1 className="font-display text-4xl font-bold uppercase mb-2">Ediciones</h1>
      <p className="text-muted-foreground mb-6">
        Explora todas las ediciones de la Copa Newbies. Las ediciones anteriores se muestran en modo solo lectura.
      </p>

      {loading && <p className="text-muted-foreground">Cargando ediciones...</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tournaments.map((t) => {
          const isActive = t.status === "active";
          return (
            <Card key={t.id} className={isActive ? "border-primary" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg">{t.name}</CardTitle>
                  {isActive && <Badge className="bg-primary text-primary-foreground">Activa</Badge>}
                  {!isActive && <Badge variant="outline">Finalizada</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground space-y-1">
                  {t.year && <p>Año: <span className="text-foreground font-medium">{t.year}</span></p>}
                  {t.semester && <p>Semestre: <span className="text-foreground font-medium">{t.semester}</span></p>}
                </div>
                <Button
                  className="w-full"
                  variant={isActive ? "default" : "outline"}
                  onClick={() => handleView(t.id, isActive)}
                >
                  Ver Edición
                </Button>
              </CardContent>
            </Card>
          );
        })}
        {!loading && tournaments.length === 0 && (
          <p className="text-muted-foreground">No hay ediciones registradas.</p>
        )}
      </div>
    </div>
  );
}
