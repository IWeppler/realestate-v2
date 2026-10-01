import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { APPRAISAL_STEPS } from "@/features/public/v2/content";
import { Reveal } from "@/features/public/v2/Reveal";
import { Parallax, SplitHeading, StaggerItem } from "@/features/public/v2/motion";

// Bloque de captación para propietarios. Único bloque con el acento de
// fondo en toda la página: es la conversión secundaria del sitio.
export function AppraisalBand() {
  return (
    <section aria-labelledby="v2-appraisal-title" className="w-full bg-background px-6 py-20 md:px-8 lg:py-36">
      <Reveal className="mx-auto grid w-full max-w-7xl grid-cols-1 overflow-hidden rounded-4xl bg-main-soft text-foreground lg:grid-cols-12">
        <div className="flex flex-col px-6 py-14 md:px-14 md:py-20 lg:col-span-7 lg:py-24">
          <SplitHeading
            id="v2-appraisal-title"
            text="¿Querés vender o alquilar tu propiedad?"
            delay={0.2}
            className="max-w-[18ch] font-display text-5xl leading-[0.95] font-normal tracking-[-0.03em] md:text-6xl"
          />
          <p className="mt-6 max-w-[44ch] text-xl leading-[1.5] text-fg-secondary">
            Te decimos cuánto vale hoy, sin costo, y la publicamos donde se mueve la demanda.
          </p>

          <ol className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
            {APPRAISAL_STEPS.map((step, i) => (
              <StaggerItem as="li" key={step.title} index={i} className="flex flex-col gap-2 border-t border-foreground/15 pt-4">
                <span className="text-sm font-semibold text-muted-foreground" aria-hidden="true">
                  {i + 1}
                </span>
                <p className="text-base font-semibold">{step.title}</p>
                <p className="text-sm leading-relaxed text-fg-secondary">{step.body}</p>
              </StaggerItem>
            ))}
          </ol>

          <Link
            href="/tasar"
            className="group mt-12 inline-flex h-[52px] w-fit items-center gap-2 rounded-full bg-main px-8 text-lg font-semibold whitespace-nowrap text-primary-foreground transition-[background-color,transform] hover:bg-main-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-main-soft active:scale-[0.98]"
          >
            Tasar mi propiedad
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>

        <Parallax className="min-h-72 lg:col-span-5 lg:min-h-full">
          <Image
            src="/contact.webp"
            alt="Casa blanca de dos plantas con jardín"
            fill
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="object-cover"
          />
        </Parallax>
      </Reveal>
    </section>
  );
}
