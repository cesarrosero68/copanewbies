interface CommuniqueProps {
  logo: string;
  name: string;
}

// Contenido de la portada informativa: se muestra dentro del layout público
// (header y footer normales) cuando site_theme.communique_mode = true.
// Para cambiar el texto, edita este archivo.
export default function Communique({ logo, name }: CommuniqueProps) {
  return (
    <div className="container py-8 space-y-8">
      {/* Banner con el logo, con los mismos colores de la portada */}
      <section
        className="py-8 md:py-10 px-6 md:px-10 rounded-xl relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, var(--hero-bg, hsl(var(--secondary))) 0%, var(--hero-gradient-to, var(--hero-bg, hsl(var(--secondary)))) 100%)",
          color: "hsl(var(--hero-foreground, 0 0% 100%))",
        }}
      >
        <div className="flex justify-center">
          <img alt={name} className="h-56 md:h-72 lg:h-80 object-contain drop-shadow-lg" src={logo} />
        </div>
      </section>

      {/* La carta */}
      <article className="max-w-3xl mx-auto rounded-xl border border-border bg-card p-6 md:p-10 space-y-6">
        <h1 className="font-display text-2xl md:text-4xl font-bold uppercase tracking-wide text-center">
          Comunicado a la comunidad Copa Newbies
        </h1>

        <div className="space-y-4 text-base leading-relaxed text-foreground/90">
          <p className="font-semibold">
            A los equipos, jugadoras, familias, patrocinadores y a toda la comunidad del hockey en línea:
          </p>
          <p>
            Copa Newbies nació con un propósito: abrir un espacio de competencia para niñas y mujeres que no lo
            tenían en los torneos oficiales. En año y medio, gracias a ustedes, creció mucho más de lo que imaginamos.
          </p>
          <p className="border-l-4 border-primary pl-4">
            Por medio del presente comunicado, me permito informar de manera formal que he sido desvinculado de la
            organización de Copa Newbies. Asimismo, manifiesto que existen diferencias en la toma de decisiones
            administrativas del torneo, las cuales no coinciden con los principios y valores con los que se idealizó
            su creación y que, a mi juicio, no benefician a la comunidad que lo conforma.
          </p>
          <p>
            Agradezco a cada jugadora, equipo, árbitro, voluntario y patrocinador que fue parte de este proceso. Lo
            construido en la cancha es de ustedes.
          </p>
          <p>
            Esta plataforma permanecerá activa, en esta versión informativa, hasta futuras ediciones. Esta situación
            será informada a las entidades deportivas correspondientes.
          </p>
        </div>

        <p className="font-medium pt-2">
          Con respeto y gratitud,
          <br />
          <span className="font-bold">César Rosero</span>
          <br />
          <span className="text-sm text-muted-foreground">Cofundador de Copa Newbies</span>
        </p>
      </article>
    </div>
  );
}
