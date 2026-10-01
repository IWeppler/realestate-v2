export type Fact = {
  icon: React.ElementType;
  label: string;
  value: number | string;
  unit?: string;
};

// Datos principales de la ficha ("La propiedad de un vistazo"): cifra
// grande en la tipografía de títulos, etiqueta chica con su ícono arriba y
// un divisor fino. Sin cajas: la jerarquía la dan el tamaño y el espacio.
export function KeyFacts({ facts }: { facts: Fact[] }) {
  if (facts.length === 0) return null;

  return (
    <dl className="grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-3">
      {facts.map((fact) => {
        const Icon = fact.icon;
        return (
          <div key={fact.label} className="flex flex-col-reverse gap-2 border-t border-border pt-4">
            <dt className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              {fact.label}
            </dt>
            <dd className="font-display text-4xl leading-none font-normal tracking-[-0.02em] text-foreground">
              {typeof fact.value === "number" ? fact.value.toLocaleString("es-AR") : fact.value}
              {fact.unit && <span className="ml-1.5 font-sans text-base text-muted-foreground">{fact.unit}</span>}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

// Dato secundario en píldora (tipo, precio por m², expensas, antigüedad).
export function FactChip({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | null;
}) {
  if (!value) return null;
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm">
      <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}
