"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Check, Loader2, MessageCircle, Phone } from "lucide-react";
import { createLeadFromPublic } from "@/features/actions/createLeadActions";
import { whatsappLink } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { Field, inputClass, invalidProps, submitClass } from "@/features/public/v2/formParts";

type Agent = { full_name: string | null; avatar_url: string | null; phone: string | null } | null;

type ContactProps = {
  propertyId: string;
  title: string;
  available: boolean;
  priceDisplay: string;
  priceLabel: string;
  expensasDisplay: string | null;
  agent: Agent;
};

const primaryClass =
  "inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-main px-6 text-base font-semibold whitespace-nowrap text-primary-foreground transition-[background-color,transform] hover:bg-main-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.99]";
const secondaryClass =
  "inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-full border border-border-strong px-6 text-base font-semibold whitespace-nowrap text-foreground transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

function waMessage(title: string) {
  const url = typeof window !== "undefined" ? window.location.href : "";
  return `Hola, me interesa la propiedad "${title}"${url ? ` (${url})` : ""}. ¿Me pasan más información?`;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

// Tarjeta de contacto de la ficha (columna derecha, fija al scrollear):
// precio, acción principal (agendar visita) y secundaria (WhatsApp), y el
// asesor a cargo. Si la propiedad ya no está disponible, se ofrece
// consultar por otras parecidas en lugar de agendar.
export function PropertyContactCard({
  propertyId,
  title,
  available,
  priceDisplay,
  priceLabel,
  expensasDisplay,
  agent,
}: ContactProps) {
  return (
    <div className="rounded-4xl bg-card p-6 shadow-[0_24px_60px_-36px_rgb(33_44_51/0.35)] md:p-8">
      <p className="text-sm text-muted-foreground">{priceLabel}</p>
      <p className="mt-1 font-display text-4xl leading-none font-normal tracking-[-0.02em] text-foreground md:text-5xl">
        {priceDisplay}
      </p>
      {expensasDisplay && (
        <p className="mt-2 text-sm text-muted-foreground">
          + {expensasDisplay} de expensas
        </p>
      )}

      <div className="mt-8 flex flex-col gap-3">
        {available ? (
          <Link href={`/agendar/${propertyId}`} className={primaryClass}>
            <CalendarDays className="h-5 w-5" aria-hidden="true" />
            Agendar visita
          </Link>
        ) : (
          <p className="rounded-2xl bg-main-soft px-4 py-3 text-sm text-foreground">
            Esta propiedad ya no está disponible. Escribinos y te mostramos otras parecidas.
          </p>
        )}
        <a
          href={whatsappLink(waMessage(title))}
          target="_blank"
          rel="noopener noreferrer"
          className={available ? secondaryClass : primaryClass}
        >
          <MessageCircle className="h-5 w-5" aria-hidden="true" />
          Consultar por WhatsApp
        </a>
      </div>

      {agent?.full_name && (
        <div className="mt-8 flex items-center gap-4 border-t border-border pt-6">
          {agent.avatar_url ? (
            <Image
              src={agent.avatar_url}
              alt=""
              width={48}
              height={48}
              className="h-12 w-12 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-main-soft text-sm font-semibold text-foreground"
              aria-hidden="true"
            >
              {initials(agent.full_name)}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-foreground">{agent.full_name}</p>
            <p className="text-sm text-muted-foreground">Asesor a cargo</p>
          </div>
          {agent.phone && (
            <a
              href={`tel:${agent.phone.replace(/[^\d+]/g, "")}`}
              aria-label={`Llamar a ${agent.full_name}`}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}

type FormState = { success: boolean; message: string };
type Errors = Partial<Record<"name" | "phone" | "email", string>>;
const initialState: FormState = { success: false, message: "" };

function validate(data: FormData): Errors {
  const v = (k: string) => String(data.get(k) ?? "").trim();
  const errors: Errors = {};
  if (v("name").length < 3) errors.name = "Escribí tu nombre.";
  if (v("phone").replace(/\D/g, "").length < 8) errors.phone = "Escribí un teléfono con código de área.";
  const email = v("email");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Revisá el email.";
  return errors;
}

// Consulta por la propiedad (createLeadFromPublic): llega al asesor de la
// propiedad con el vínculo a la ficha. Mismas piezas que los otros
// formularios del sitio.
export function PropertyInquiryForm({ propertyId, title }: { propertyId: string; title: string }) {
  const [state, formAction, pending] = useActionState(createLeadFromPublic, initialState);
  const [errors, setErrors] = useState<Errors>({});

  if (state.success) {
    return (
      <div role="status" className="flex items-start gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-main text-primary-foreground">
          <Check className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-lg font-semibold text-foreground">Recibimos tu consulta</p>
          <p className="mt-1 text-base text-fg-secondary">El asesor de esta propiedad te va a contactar.</p>
        </div>
      </div>
    );
  }

  const described = (key: keyof Errors) => invalidProps(errors[key], key);

  return (
    <form
      noValidate
      action={formAction}
      onSubmit={(e) => {
        const found = validate(new FormData(e.currentTarget));
        setErrors(found);
        if (Object.keys(found).length > 0) {
          e.preventDefault();
          e.currentTarget.querySelector<HTMLElement>(`[name="${Object.keys(found)[0]}"]`)?.focus();
        }
      }}
      onChange={(e) => {
        const name = (e.target as unknown as HTMLInputElement).name as keyof Errors;
        if (!errors[name]) return;
        setErrors((prev) => {
          const next = { ...prev };
          delete next[name];
          return next;
        });
      }}
      className="flex flex-col gap-6"
    >
      <input type="hidden" name="propertyId" value={propertyId} />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field id="name" label="Nombre y apellido" error={errors.name}>
          <input id="name" name="name" autoComplete="name" className={inputClass} {...described("name")} />
        </Field>
        <Field id="phone" label="Teléfono" error={errors.phone}>
          <input id="phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" className={inputClass} {...described("phone")} />
        </Field>
      </div>
      <Field id="email" label="Email" hint="(opcional)" error={errors.email}>
        <input id="email" name="email" type="email" autoComplete="email" className={inputClass} {...described("email")} />
      </Field>
      <Field id="consulta" label="Consulta" hint="(opcional)">
        <textarea
          id="consulta"
          name="consulta"
          rows={3}
          defaultValue={`Hola, me interesa "${title}". ¿Sigue disponible?`}
          className={cn(inputClass, "h-auto resize-none py-3 leading-relaxed")}
        />
      </Field>

      {state.message && !state.success && (
        <p role="alert" className="rounded-xl bg-destructive/8 px-4 py-3 text-sm text-destructive">
          {state.message}
        </p>
      )}

      <button type="submit" disabled={pending} className={submitClass}>
        {pending ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            Enviando…
          </>
        ) : (
          <>
            Enviar consulta
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </>
        )}
      </button>
    </form>
  );
}

// Barra fija inferior en mobile: precio + acción principal siempre a mano.
export function MobileContactBar({
  propertyId,
  title,
  available,
  priceDisplay,
  priceLabel,
}: Pick<ContactProps, "propertyId" | "title" | "available" | "priceDisplay" | "priceLabel">) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden">
      <div className="mx-auto flex max-w-7xl items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">{priceLabel}</p>
          <p className="truncate text-lg font-semibold text-foreground">{priceDisplay}</p>
        </div>
        <a
          href={whatsappLink(waMessage(title))}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Consultar por WhatsApp"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border-strong text-foreground"
        >
          <MessageCircle className="h-5 w-5" aria-hidden="true" />
        </a>
        {available && (
          <Link
            href={`/agendar/${propertyId}`}
            className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-main px-5 text-sm font-semibold text-primary-foreground"
          >
            Agendar visita
          </Link>
        )}
      </div>
    </div>
  );
}
