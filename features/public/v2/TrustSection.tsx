import { STATS, TESTIMONIALS } from "@/features/public/v2/content";
import { Reveal } from "@/features/public/v2/Reveal";
import { CountUp, SplitHeading } from "@/features/public/v2/motion";

// Prueba social: cifras a la izquierda, una reseña destacada y dos
// secundarias a la derecha. Sin cards: jerarquía por tamaño y espacio.
// Única sección en azul de la página: corta el ritmo arena/crema justo
// en la prueba social.
export function TrustSection() {
  const [featured, ...rest] = TESTIMONIALS;

  return (
    <section aria-labelledby="v2-trust-title" className="w-full bg-main text-primary-foreground">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-14 px-6 py-20 md:px-8 lg:py-36 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-5">
          <SplitHeading
            id="v2-trust-title"
            text="Quienes ya operaron con nosotros"
            className="max-w-[14ch] font-display text-5xl leading-[0.95] font-normal tracking-[-0.03em] text-primary-foreground md:text-6xl"
          />

          <Reveal delay={0.2}>
          <dl className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3 lg:grid-cols-1">
            {STATS.map((stat) => (
              <div key={stat.label} className="flex flex-col-reverse gap-1">
                <dt className="text-sm text-primary-foreground/70">{stat.label}</dt>
                <dd className="font-display text-5xl font-normal tracking-tight text-primary-foreground">
                  <CountUp value={stat.value} />
                </dd>
              </div>
            ))}
          </dl>
          </Reveal>
        </div>

        <Reveal delay={0.25} className="flex flex-col gap-12 lg:col-span-7 lg:pt-2">
          <figure>
            <blockquote className="font-display text-2xl leading-snug font-normal tracking-tight text-primary-foreground md:text-3xl">
              “{featured.quote}”
            </blockquote>
            <figcaption className="mt-5 text-sm">
              <span className="font-semibold text-primary-foreground">{featured.name}</span>
              <span className="text-primary-foreground/70"> · {featured.role}</span>
            </figcaption>
          </figure>

          <div className="grid grid-cols-1 gap-10 border-t border-primary-foreground/15 pt-10 md:grid-cols-2">
            {rest.map((t) => (
              <figure key={t.name}>
                <blockquote className="text-base leading-relaxed text-primary-foreground/85">“{t.quote}”</blockquote>
                <figcaption className="mt-4 text-sm">
                  <span className="font-semibold text-primary-foreground">{t.name}</span>
                  <span className="text-primary-foreground/70"> · {t.role}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
