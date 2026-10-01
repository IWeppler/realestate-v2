import type { Metadata } from "next";
import { createClientServer } from "@/lib/supabase";
import { AppraisalForm } from "@/features/public/v2/AppraisalForm";
import { APPRAISAL_STEPS } from "@/features/public/v2/content";
import { Parallax, SplitHeading, StaggerItem } from "@/features/public/v2/motion";
import { Reveal } from "@/features/public/v2/Reveal";
import { CardImage } from "@/features/properties/CardImage";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/components/ui/accordion";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Tasar mi propiedad",
  description: "Pedí una tasación sin costo: visitamos tu propiedad y te enviamos un valor de mercado con comparables de la zona.",
};

const FACTORS = [
  { title: "Ubicación y entorno", body: "Barrio, accesos, servicios y cómo se mueve la demanda en la zona." },
  { title: "Estado y antigüedad", body: "Terminaciones, mantenimiento y lo que haría falta arreglar." },
  { title: "Superficie", body: "Metros cubiertos, semicubiertos y del terreno." },
  { title: "Comparables", body: "Propiedades parecidas publicadas y vendidas cerca." },
];

const FAQ = [
  {
    q: "¿La tasación tiene costo?",
    a: "No. La visita y el informe con el valor de mercado no tienen costo.",
  },
  {
    q: "¿Cómo calculan el valor?",
    a: "Visitamos la propiedad para ver estado, superficie y entorno, y la comparamos con propiedades similares publicadas y vendidas en la zona.",
  },
  {
    q: "¿Qué necesito tener a mano?",
    a: "La dirección alcanza para empezar. Si tenés planos, escritura o el último impuesto, nos ayudan a afinar el valor; si no, lo vemos en la visita.",
  },
  {
    q: "¿Pedir la tasación me compromete a publicar con ustedes?",
    a: "No. Con el informe en la mano decidís vos si avanzar, cuándo y cómo.",
  },
  {
    q: "¿Qué tipo de propiedades tasan?",
    a: "Casas, departamentos, PH, locales, lotes y campos, tanto para venta como para alquiler.",
  },
];

async function getData() {
  const supabase = await createClientServer();
  const [{ data: types }, { data: featured }] = await Promise.all([
    supabase.from("property_types").select("name").order("name"),
    // Foto de apoyo: una propiedad real de la cartera (la más vista con foto).
    supabase
      .from("properties")
      .select("title, property_images ( image_url, order )")
      .in("status", ["EN_VENTA", "EN_ALQUILER"])
      .order("views_count", { ascending: false, nullsFirst: false })
      .limit(5),
  ]);

  const photo = (featured ?? [])
    .map((p) => {
      const imgs = [...((p.property_images ?? []) as { image_url: string | null; order: number | null }[])].sort(
        (a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER),
      );
      return { title: p.title as string, src: imgs.find((i) => i.image_url)?.image_url ?? null };
    })
    .find((p) => p.src);

  return { propertyTypes: (types ?? []).map((t) => t.name as string), photo };
}

export default async function TasarPage() {
  const { propertyTypes, photo } = await getData();

  return (
    <div className="flex w-full flex-col">
      {/* --- Hero: propuesta + pasos a la izquierda, formulario a la derecha.
          El formulario se ve al entrar: es la acción principal de la página.
          En mobile el orden es titular → formulario → pasos; en desktop los
          pasos quedan debajo del titular, a la izquierda del formulario. --- */}
      <section className="w-full bg-background">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-x-16 gap-y-10 px-6 pt-10 pb-20 md:px-8 md:pt-14 lg:grid-cols-12 lg:grid-rows-[auto_1fr] lg:pb-28">
          <div className="flex flex-col lg:col-span-5 lg:col-start-1 lg:row-start-1 lg:pt-6">
            <SplitHeading
              as="h1"
              trigger="mount"
              text="¿Cuánto vale hoy tu propiedad?"
              className="max-w-[12ch] font-display text-5xl leading-[0.95] font-normal tracking-[-0.03em] text-foreground md:text-6xl lg:text-[5rem]"
            />
            <p className="site-rise mt-6 max-w-[40ch] text-xl leading-[1.5] text-fg-secondary [--rise-delay:450ms]">
              Te hacemos una tasación sin costo, con visita y un informe con comparables de la zona.
            </p>
          </div>

          <div className="lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1">
            <div className="site-rise rounded-4xl bg-card p-6 shadow-[0_24px_60px_-36px_rgb(33_44_51/0.35)] md:p-10 [--rise-delay:300ms]">
              <h2 className="text-xl font-semibold text-foreground">Pedí tu tasación</h2>
              <p className="mt-1 mb-8 text-sm text-muted-foreground">Te llamamos para coordinar la visita.</p>
              <AppraisalForm propertyTypes={propertyTypes} />
            </div>
          </div>

          <div className="lg:col-span-5 lg:col-start-1 lg:row-start-2">
            <ol className="flex flex-col">
              {APPRAISAL_STEPS.map((step, i) => (
                <StaggerItem
                  as="li"
                  key={step.title}
                  index={i}
                  columns={APPRAISAL_STEPS.length}
                  className="grid grid-cols-[2.5rem_1fr] gap-x-4 border-t border-border py-5 last:border-b"
                >
                  <span className="pt-0.5 text-sm font-medium text-muted-foreground tabular-nums" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="text-base font-semibold text-foreground">{step.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-fg-secondary">{step.body}</p>
                  </div>
                </StaggerItem>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* --- Qué miramos: foto real + factores --- */}
      <section aria-labelledby="tasar-factors-title" className="w-full bg-surface-alt">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 px-6 py-20 md:px-8 lg:grid-cols-12 lg:gap-16 lg:py-36">
          {photo?.src && (
            <Reveal className="lg:col-span-6">
              <Parallax className="aspect-[4/5] w-full rounded-4xl bg-sunken lg:aspect-[5/6]">
                <CardImage src={photo.src} alt={photo.title} sizes="(min-width: 1024px) 45vw, 100vw" />
              </Parallax>
            </Reveal>
          )}

          <div className={photo?.src ? "lg:col-span-6" : "lg:col-span-12"}>
            <SplitHeading
              id="tasar-factors-title"
              text="Qué miramos para tasar"
              className="max-w-[14ch] font-display text-5xl leading-[0.95] font-normal tracking-[-0.03em] text-foreground md:text-6xl"
            />
            <dl className="mt-12 grid grid-cols-1 gap-x-10 gap-y-10 sm:grid-cols-2">
              {FACTORS.map((f, i) => (
                <StaggerItem key={f.title} index={i} columns={2} className="border-t border-border pt-5">
                  <dt className="text-base font-semibold text-foreground">{f.title}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-fg-secondary">{f.body}</dd>
                </StaggerItem>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* --- Preguntas frecuentes --- */}
      <section aria-labelledby="tasar-faq-title" className="w-full bg-background">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-12 px-6 py-20 md:px-8 lg:grid-cols-12 lg:gap-16 lg:py-36">
          <div className="lg:col-span-4">
            <SplitHeading
              id="tasar-faq-title"
              text="Preguntas frecuentes"
              className="max-w-[10ch] font-display text-5xl leading-[0.95] font-normal tracking-[-0.03em] text-foreground md:text-6xl"
            />
          </div>

          <Reveal delay={0.15} className="lg:col-span-8">
            <Accordion type="single" collapsible defaultValue="faq-0" className="border-t border-border">
              {FAQ.map((item, i) => (
                <AccordionItem key={item.q} value={`faq-${i}`} className="border-b border-border">
                  <AccordionTrigger className="py-6 text-left text-lg font-semibold text-foreground hover:no-underline md:text-xl">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="max-w-[60ch] pb-6 text-base leading-relaxed text-fg-secondary">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
