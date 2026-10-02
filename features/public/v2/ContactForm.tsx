"use client";

import { WhatsAppIcon } from "@/shared/components/WhatsAppIcon";
import { useActionState, useState } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { createContactLeadAction } from "@/features/actions/createContactLeadAction";
import { whatsappLink } from "@/lib/brand";
import { CONTACT_CTA_LABEL } from "@/features/public/v2/content";
import { cn } from "@/lib/utils";
import { Field, inputClass, invalidProps, submitClass } from "@/features/public/v2/formParts";

type FormState = { success: boolean; message: string };
type Errors = Partial<Record<"name" | "phone" | "email" | "message", string>>;

const initialState: FormState = { success: false, message: "" };

// Mismos valores que acepta el schema de createContactLeadAction.
const TOPICS = ["Comprar", "Alquilar", "Vender", "Otra consulta"] as const;

// Mismas reglas que el schema de la Server Action, para avisar en el
// campo antes de enviar. El servidor vuelve a validar.
function validate(data: FormData): Errors {
  const v = (k: string) => String(data.get(k) ?? "").trim();
  const errors: Errors = {};
  if (v("name").length < 3) errors.name = "Escribí tu nombre.";
  if (v("phone").replace(/\D/g, "").length < 8) errors.phone = "Escribí un teléfono con código de área.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v("email"))) errors.email = "Escribí un email válido.";
  if (v("message").length < 10) errors.message = "Contanos un poco más (al menos 10 caracteres).";
  return errors;
}

// Formulario de contacto: motivo (opcional, llega en la nota del lead para
// que el agente sepa de qué se trata), datos y mensaje. Al enviar bien se
// reemplaza por la confirmación.
export function ContactForm() {
  const [state, formAction, pending] = useActionState(createContactLeadAction, initialState);
  const [errors, setErrors] = useState<Errors>({});

  if (state.success) {
    return (
      <div role="status" className="flex flex-col items-start gap-5 py-6">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-main text-primary-foreground">
          <Check className="h-6 w-6" aria-hidden="true" />
        </span>
        <h2 className="font-display text-4xl leading-[1] font-normal tracking-[-0.03em] text-foreground">
          Recibimos tu mensaje
        </h2>
        <p className="max-w-[40ch] text-lg leading-relaxed text-fg-secondary">
          Un agente te va a responder por teléfono o por email. Si es urgente, escribinos por WhatsApp.
        </p>
        <a
          href={whatsappLink("Hola, acabo de dejar un mensaje en la web.")}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-[52px] items-center gap-2 rounded-full border border-border-strong px-7 text-base font-semibold whitespace-nowrap text-foreground transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <WhatsAppIcon className="h-5 w-5" aria-hidden="true" />
          {CONTACT_CTA_LABEL}
        </a>
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
          const first = Object.keys(found)[0];
          e.currentTarget.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
        }
      }}
      // Al corregir un campo, su error se va sin esperar al próximo envío.
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
      <fieldset>
        <legend className="mb-3 text-sm font-medium text-foreground">
          ¿Sobre qué es tu consulta? <span className="font-normal text-muted-foreground">(opcional)</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {TOPICS.map((t) => (
            <label key={t}>
              <input type="radio" name="topic" value={t} className="peer sr-only" />
              <span className="inline-flex h-10 cursor-pointer items-center rounded-full border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors peer-checked:border-foreground peer-checked:bg-foreground peer-checked:text-background peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 hover:border-border-strong">
                {t}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field id="name" label="Nombre y apellido" error={errors.name}>
          <input id="name" name="name" autoComplete="name" className={inputClass} {...described("name")} />
        </Field>
        <Field id="phone" label="Teléfono" error={errors.phone}>
          <input id="phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" className={inputClass} {...described("phone")} />
        </Field>
      </div>

      <Field id="email" label="Email" error={errors.email}>
        <input id="email" name="email" type="email" autoComplete="email" className={inputClass} {...described("email")} />
      </Field>

      <Field id="message" label="Mensaje" error={errors.message}>
        <textarea
          id="message"
          name="message"
          rows={4}
          className={cn(inputClass, "h-auto resize-none py-3 leading-relaxed")}
          placeholder="Ej.: busco una casa de 3 dormitorios en Funes, hasta USD 150.000."
          {...described("message")}
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
            Enviar mensaje
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </>
        )}
      </button>
    </form>
  );
}
