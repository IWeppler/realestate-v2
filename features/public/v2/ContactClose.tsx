import { Mail } from "lucide-react";
import { WhatsAppIcon } from "@/shared/components/WhatsAppIcon";
import { BRAND, whatsappLink } from "@/lib/brand";
import { CONTACT_CTA_LABEL } from "@/features/public/v2/content";
import { Reveal } from "@/features/public/v2/Reveal";
import { SplitHeading } from "@/features/public/v2/motion";

// Cierre de la página, tipográfico (el hero ya usa foto a sangre). Un solo
// CTA de contacto (WhatsApp); el email va como dato, no como segundo
// botón con la misma intención.
export function ContactClose() {
  return (
    <section aria-labelledby="v2-contact-title" id="contacto" className="w-full bg-surface-alt">
      <div className="mx-auto w-full max-w-7xl px-6 py-20 md:px-8 lg:py-40">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <SplitHeading
              id="v2-contact-title"
              text="¿No encontrás lo que buscás?"
              className="max-w-[18ch] font-display text-5xl leading-[0.95] font-normal tracking-[-0.03em] text-foreground md:text-7xl lg:text-[5.75rem]"
            />
            <Reveal delay={0.3}>
              <p className="mt-6 max-w-[44ch] text-xl leading-[1.5] text-fg-secondary">
                Muchas propiedades se venden antes de publicarse. Contanos qué necesitás y te avisamos.
              </p>
            </Reveal>
          </div>

          <Reveal delay={0.4} className="flex flex-col items-start gap-4 lg:col-span-4 lg:items-end">
            <a
              href={whatsappLink("Hola, estoy buscando una propiedad y quería hacer una consulta.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-[52px] items-center gap-2 rounded-full bg-main px-8 text-lg font-semibold whitespace-nowrap text-primary-foreground transition-[background-color,transform] hover:bg-main-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98]"
            >
              <WhatsAppIcon className="h-5 w-5" aria-hidden="true" />
              {CONTACT_CTA_LABEL}
            </a>
            <a
              href={`mailto:${BRAND.email}`}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              {BRAND.email}
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
