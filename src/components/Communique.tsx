interface CommuniqueProps {
  logo: string;
  name: string;
}

// Portada informativa: es lo único que ve el público cuando
// site_theme.communique_mode = true. Para cambiar el texto, edita este archivo.
export default function Communique({ logo, name }: CommuniqueProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 py-12">
      <article className="w-full max-w-2xl text-center space-y-6">
        <img alt={name} src={logo} className="h-28 w-28 mx-auto rounded-full object-cover" />

        <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide">
          Comunicado a la comunidad Copa Newbies
        </h1>

        <div className="space-y-4 text-left text-base leading-relaxed text-foreground/90">
          <p>
            A los equipos, jugadoras, familias, patrocinadores y a toda la comunidad del hockey en línea:
          </p>
          <p>
            Copa Newbies nació con un propósito: abrir un espacio de competencia para niñas y mujeres que no lo
            tenían en los torneos oficiales. En año y medio, gracias a ustedes, creció mucho más de lo que imaginamos.
          </p>
          <p>
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

        <p className="text-left font-medium">
          Con respeto y gratitud,
          <br />
          César Rosero
        </p>
      </article>
    </div>
  );
}
