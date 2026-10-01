"use client";

import { useActionState, useState } from "react";
import { ArrowRight, Check, ChevronDown, Loader2, MessageCircle } from "lucide-react";
import { createAppraisalLeadAction } from "@/features/actions/createAppraisalLeadAction";
import { whatsappLink } from "@/lib/brand";
import { CONTACT_CTA_LABEL } from "@/features/public/v2/content";
import { cn } from "@/lib/utils";
import { Field, inputClass, invalidProps, submitClass } from "@/features/public/v2/formParts";

type FormState = { success: boolean; message: string };
type Errors = Partial<Record<"operationType" | "propertyType" | "address" | "name" | "phone" | "email", string>>;

const initialState: FormState = { success: false, message: "" };

// Mismas reglas que el schema de la Server Action (createAppraisalLeadAction),
// para avisar en el campo antes de enviar. El servidor vuelve a validar.
function validate(data: FormData): Errors {
  const v = (k: string) => String(data.get(k) ?? "").trim();
  const errors: Errors = {};
  if (!v("operationType")) errors.operationType = "Elegí si querés vender o alquilar.";
  if (!v("propertyType")) errors.propertyType = "Elegí el tipo de propiedad.";
  if (v("address").length < 5) errors.address = "Escribí la dirección (calle, número y ciudad).";
  if (v("name").length < 3) errors.name = "Escribí tu nombre.";
  if (v("phone").replace(/\D/g, "").length < 8) errors.phone = "Escribí un teléfono con código de área.";
  const email = v("email");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Revisá el email.";
  return errors;
}

// Formulario de tasación. Etiquetas arriba, errores debajo de cada campo,
// operación como selector segmentado. Al enviar bien, el formulario se
// reemplaza por la confirmación (con salida a WhatsApp).
export function AppraisalForm({ propertyTypes }: { propertyTypes: string[] }) {
  const [state, formAction, pending] = useActionState(createAppraisalLeadAction, initialState);
  const [errors, setErrors] = useState<Errors>({});

  if (state.success) {
    return (
      <div role="status" className="flex flex-col items-start gap-5 py-6">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-main text-primary-foreground">
          <Check className="h-6 w-6" aria-hidden="true" />
        </span>
        <h2 className="font-display text-4xl leading-[1] font-normal tracking-[-0.03em] text-foreground">
          Recibimos tu solicitud
        </h2>
        <p className="max-w-[40ch] text-lg leading-relaxed text-fg-secondary">
          Un agente te va a llamar para coordinar la visita. Si preferís, escribinos directo.
        </p>
        <a
          href={whatsappLink("Hola, acabo de pedir una tasación desde la web.")}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-[52px] items-center gap-2 rounded-full border border-border-strong px-7 text-base font-semibold whitespace-nowrap text-foreground transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <MessageCircle className="h-5 w-5" aria-hidden="true" />
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
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium text-foreground">¿Qué querés hacer?</legend>
        <div className="grid grid-cols-2 gap-1 rounded-full bg-muted p-1">
          {[
            { value: "VENTA", label: "Vender" },
            { value: "ALQUILER", label: "Alquilar" },
          ].map((o) => (
            <label key={o.value} className="relative">
              <input
                type="radio"
                name="operationType"
                value={o.value}
                defaultChecked={o.value === "VENTA"}
                className="peer sr-only"
              />
              <span className="flex h-11 cursor-pointer items-center justify-center rounded-full text-sm font-medium text-muted-foreground transition-colors peer-checked:bg-card peer-checked:text-foreground peer-checked:shadow-sm peer-focus-visible:ring-2 peer-focus-visible:ring-ring hover:text-foreground">
                {o.label}
              </span>
            </label>
          ))}
        </div>
        {errors.operationType && <p className="text-sm text-destructive">{errors.operationType}</p>}
      </fieldset>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field id="propertyType" label="Tipo de propiedad" error={errors.propertyType}>
          <div className="relative">
            <select
              id="propertyType"
              name="propertyType"
              defaultValue=""
              className={cn(inputClass, "cursor-pointer appearance-none pr-10 invalid:text-fg-disabled")}
              required
              {...described("propertyType")}
            >
              <option value="" disabled>
                Elegí una opción
              </option>
              {propertyTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          </div>
        </Field>

        <Field id="address" label="Dirección" error={errors.address}>
          <input id="address" name="address" autoComplete="street-address" className={inputClass} {...described("address")} />
        </Field>
      </div>

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

      <Field id="consulta" label="Algo que quieras contarnos" hint="(opcional)">
        <textarea
          id="consulta"
          name="consulta"
          rows={3}
          className={cn(inputClass, "h-auto resize-none py-3 leading-relaxed")}
          placeholder="Ej.: superficie, estado, si está ocupada…"
        />
      </Field>

      {state.message && !state.success && (
        <p role="alert" className="rounded-xl bg-destructive/8 px-4 py-3 text-sm text-destructive">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className={submitClass}
      >
        {pending ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            Enviando…
          </>
        ) : (
          <>
            Solicitar tasación
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </>
        )}
      </button>
    </form>
  );
}
