import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { BRAND, whatsappLink } from "@/lib/brand";
import { ContactForm } from "@/features/public/v2/ContactForm";
import { Parallax, SplitHeading, StaggerItem } from "@/features/public/v2/motion";
import { Reveal } from "@/features/public/v2/Reveal";
import { CardImage } from "@/features/properties/CardImage";

export const metadata: Metadata = {
  title: "Contacto",
  description: `Escribinos por WhatsApp, llamanos o dejanos un mensaje: un agente de ${BRAND.name} te responde.`,
};

type Channel = { label: string; value: string; href?: string; external?: boolean };

// Canales directos, de más rápido a más formal. La oficina solo aparece si
// está configurada (NEXT_PUBLIC_BRAND_ADDRESS): nunca una dirección de relleno.
function channels(): Channel[] {
  const list: Channel[] = [
    {
      label: "WhatsApp",
      value: "Escribinos",
      href: whatsappLink("Hola, quería hacer una consulta."),
      external: true,
    },
    { label: "Teléfono", value: BRAND.phoneDisplay, href: `tel:${BRAND.phoneDisplay.replace(/[^\d+]/g, "")}` },
    { label: "Email", value: BRAND.email, href: `mailto:${BRAND.email}` },
  ];
  if (BRAND.address) list.push({ label: "Oficina", value: BRAND.address });
  return list;
}

export default function ContactoPage() {
  return (
    <section className="w-full bg-background">
      <div className="mx-auto w-full max-w-7xl px-6 pt-10 pb-24 md:px-8 md:pt-14 lg:pb-36">
        <div className="max-w-3xl">
          <SplitHeading
            as="h1"
            trigger="mount"
            text="Contanos qué estás buscando"
            className="max-w-[14ch] font-display text-5xl leading-[0.95] font-normal tracking-[-0.03em] text-foreground md:text-6xl lg:text-[5rem]"
          />
          <p className="site-rise mt-6 max-w-[44ch] text-xl leading-[1.5] text-fg-secondary [--rise-delay:450ms]">
            Escribinos por el canal que te quede más cómodo y un agente te va a responder.
          </p>
        </div>

        {/* Mobile: canales → formulario → foto. Desktop: canales y foto a la
            izquierda, formulario a la derecha. */}
        <div className="mt-14 grid grid-cols-1 gap-x-16 gap-y-12 lg:mt-20 lg:grid-cols-12 lg:grid-rows-[auto_1fr]">
          <nav aria-label="Canales de contacto" className="lg:col-span-5 lg:col-start-1 lg:row-start-1">
            <ul className="border-b border-border">
              {channels().map((c, i) => {
                const content = (
                  <>
                    <span className="w-24 shrink-0 text-sm text-muted-foreground">{c.label}</span>
                    <span className="min-w-0 flex-1 font-display text-[clamp(1.5rem,2.4vw,2rem)] leading-tight break-words font-normal tracking-[-0.02em] text-foreground transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-2">
                      {/* Si no entra, el email corta después de la "@" y no a mitad del dominio. */}
                      {c.value.includes("@") ? (
                        <>
                          {c.value.split("@")[0]}@<wbr />
                          {c.value.split("@")[1]}
                        </>
                      ) : (
                        c.value
                      )}
                    </span>
                    {c.href && (
                      <ArrowUpRight
                        className="h-5 w-5 shrink-0 text-muted-foreground transition-[color,transform] duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
                        aria-hidden="true"
                      />
                    )}
                  </>
                );
                return (
                  <StaggerItem as="li" key={c.label} index={i} columns={4} className="border-t border-border">
                    {c.href ? (
                      <a
                        href={c.href}
                        {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        className="group flex items-center gap-4 py-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
                      >
                        {content}
                      </a>
                    ) : (
                      <div className="flex items-center gap-4 py-6">{content}</div>
                    )}
                  </StaggerItem>
                );
              })}
            </ul>
          </nav>

          <div className="lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1">
            <div className="site-rise rounded-4xl bg-card p-6 shadow-[0_24px_60px_-36px_rgb(33_44_51/0.35)] md:p-10 [--rise-delay:300ms]">
              <h2 className="text-xl font-semibold text-foreground">Dejanos un mensaje</h2>
              <p className="mt-1 mb-8 text-sm text-muted-foreground">Te respondemos por teléfono o por email.</p>
              <ContactForm />
            </div>
          </div>

          <Reveal className="lg:col-span-5 lg:col-start-1 lg:row-start-2">
            <Parallax className="aspect-[4/3] w-full rounded-4xl bg-sunken">
              <CardImage src="/contact.webp" alt="Fachada de una casa blanca de dos plantas" sizes="(min-width: 1024px) 40vw, 100vw" />
            </Parallax>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
