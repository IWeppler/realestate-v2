// Piezas compartidas de los formularios públicos (tasación, contacto):
// etiqueta arriba, ayuda opcional al lado, error debajo del campo.

export const inputClass =
  "h-12 w-full rounded-xl border border-input bg-background px-4 text-base text-foreground transition-colors placeholder:text-fg-disabled hover:border-border-strong focus:border-foreground focus:ring-3 focus:ring-ring/15 focus:outline-none aria-invalid:border-destructive";

export const submitClass =
  "group inline-flex h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-main px-8 text-lg font-semibold text-primary-foreground transition-[background-color,transform] hover:bg-main-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.99] disabled:cursor-wait disabled:opacity-80 sm:w-fit";

export function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
        {hint && <span className="font-normal text-muted-foreground"> {hint}</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

// Atributos de accesibilidad para un campo con error.
export function invalidProps(error: string | undefined, id: string) {
  return error ? { "aria-invalid": true as const, "aria-describedby": `${id}-error` } : {};
}
