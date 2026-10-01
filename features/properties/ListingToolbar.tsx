"use client";

import { usePathname, useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Check, ChevronDown, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { cn } from "@/lib/utils";
import { useFilterParams } from "@/features/properties/useFilterParams";
import { PropertySearchCombobox } from "@/features/properties/PropertySearchCombobox";
import type { LocationSuggestion } from "@/features/properties/LocationCombobox";

type Option = { value: string; label: string };

type Props = {
  types: { id: number; name: string }[];
  amenities: { id: number; name: string }[];
  cities: string[];
  locations: LocationSuggestion[];
  view: "lista" | "mapa";
};

const SORTS: Option[] = [
  { value: "", label: "Más recientes" },
  { value: "price_asc", label: "Menor precio" },
  { value: "price_desc", label: "Mayor precio" },
];

const OPERATIONS: Option[] = [
  { value: "", label: "Todas" },
  { value: "venta", label: "Venta" },
  { value: "alquiler", label: "Alquiler" },
];

const pillBase =
  "inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";
const pillIdle = "border-border bg-card text-foreground hover:border-border-strong";
const pillOn = "border-foreground bg-foreground text-background";

// Selector segmentado en píldora (Operación, Lista/Mapa): una sola opción
// activa, con el fondo que se desliza entre opciones.
function Segmented({
  id,
  label,
  options,
  value,
  onChange,
}: {
  id: string;
  label: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
}) {
  const reduce = useReducedMotion();
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex h-10 shrink-0 items-center rounded-full bg-muted p-1">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value || "all"}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => !active && onChange(o.value)}
            className={cn(
              "relative h-full cursor-pointer rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-full bg-card shadow-sm"
                transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// Barra de filtros del listado, única para lista y mapa. Todo vive en la
// URL (compartible, sobrevive al cambio de vista). Debajo, los filtros
// activos como chips para ver y quitar de un vistazo.
export function ListingToolbar({ types, amenities, cities, locations, view }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { toggle, clear, activeCount, searchParams } = useFilterParams();

  const navigate = (mutate: (p: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const setParam = (name: string, value: string) =>
    navigate((p) => (value ? p.set(name, value) : p.delete(name)));

  const typeOptions = types.map((t) => ({ value: String(t.id), label: t.name }));
  const amenityOptions = amenities.map((a) => ({ value: String(a.id), label: a.name }));
  const cityOptions = cities.map((c) => ({ value: c, label: c }));

  const selected = (name: string, multi: boolean) => {
    const raw = searchParams.get(name) ?? "";
    return multi ? raw.split(",").filter(Boolean) : raw ? [raw] : [];
  };

  // Píldora con desplegable. `chips`: opciones cortas en fila (1+ 2+ 3+).
  const filter = (name: string, label: string, options: Option[], { multi = false, chips = false } = {}) => {
    const values = selected(name, multi);
    const summary =
      values.length === 0
        ? label
        : multi
          ? `${label} (${values.length})`
          : chips
            ? `${values[0]}+ ${label.toLowerCase()}`
            : (options.find((o) => o.value === values[0])?.label ?? label);

    return (
      <Popover key={name}>
        <PopoverTrigger asChild>
          <button type="button" className={cn(pillBase, values.length ? pillOn : pillIdle)}>
            {summary}
            <ChevronDown className="h-4 w-4 opacity-60" aria-hidden="true" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className={cn("rounded-2xl p-2", chips ? "w-auto" : "w-64")}>
          {chips ? (
            <div role="group" aria-label={label} className="flex gap-1.5 p-1">
              {options.map((o) => {
                const on = values.includes(o.value);
                return (
                  <button
                    key={o.value}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(name, o.value)}
                    className={cn(pillBase, "h-9 px-3.5", on ? pillOn : pillIdle)}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          ) : (
            <ul className="max-h-72 overflow-y-auto overscroll-contain">
              {options.map((o) => {
                const on = values.includes(o.value);
                return (
                  <li key={o.value}>
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggle(name, o.value)}
                      className={cn(
                        "flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none",
                        on && "font-semibold",
                      )}
                    >
                      {o.label}
                      {on && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </PopoverContent>
      </Popover>
    );
  };

  const sort = searchParams.get("sortBy") ?? "";
  const sortLabel = SORTS.find((s) => s.value === sort)?.label ?? SORTS[0].label;

  // Chips de filtros activos (Operación se ve en su selector; no se repite).
  const chips: { key: string; name: string; value: string; label: string }[] = [
    ...selected("typeId", false).map((v) => ({ name: "typeId", value: v, label: typeOptions.find((o) => o.value === v)?.label ?? v })),
    ...selected("loc", true).map((v) => ({ name: "loc", value: v, label: v })),
    ...selected("bedrooms", false).map((v) => ({ name: "bedrooms", value: v, label: `${v}+ dormitorios` })),
    ...selected("bathrooms", false).map((v) => ({ name: "bathrooms", value: v, label: `${v}+ baños` })),
    ...selected("amenities", true).map((v) => ({ name: "amenities", value: v, label: amenityOptions.find((o) => o.value === v)?.label ?? v })),
  ].map((c) => ({ ...c, key: `${c.name}-${c.value}` }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="min-w-0 flex-1 md:max-w-xl">
          <PropertySearchCombobox locations={locations} />
        </div>
        <div className="flex items-center gap-2 md:ml-auto">
          <Popover>
            <PopoverTrigger asChild>
              <button type="button" className={cn(pillBase, pillIdle)} aria-label={`Ordenar: ${sortLabel}`}>
                <span className="hidden text-muted-foreground sm:inline">Ordenar:</span> {sortLabel}
                <ChevronDown className="h-4 w-4 opacity-60" aria-hidden="true" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-52 rounded-2xl p-2">
              <ul>
                {SORTS.map((s) => (
                  <li key={s.value || "default"}>
                    <button
                      type="button"
                      aria-pressed={sort === s.value}
                      onClick={() => setParam("sortBy", s.value)}
                      className={cn(
                        "flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none",
                        sort === s.value && "font-semibold",
                      )}
                    >
                      {s.label}
                      {sort === s.value && <Check className="h-4 w-4" aria-hidden="true" />}
                    </button>
                  </li>
                ))}
              </ul>
            </PopoverContent>
          </Popover>
          <Segmented
            id="view"
            label="Vista"
            value={view === "mapa" ? "mapa" : ""}
            options={[
              { value: "", label: "Lista" },
              { value: "mapa", label: "Mapa" },
            ]}
            onChange={(v) => setParam("vista", v)}
          />
        </div>
      </div>

      {/* En mobile la fila se desliza de costado; en desktop hace salto de línea. */}
      <div className="-mx-6 flex items-center gap-2 overflow-x-auto px-6 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0 md:pb-0 [&::-webkit-scrollbar]:hidden">
        <Segmented
          id="op"
          label="Operación"
          options={OPERATIONS}
          value={searchParams.get("tipo") ?? ""}
          onChange={(v) => setParam("tipo", v)}
        />
        <span className="mx-1 hidden h-6 w-px bg-border md:block" aria-hidden="true" />
        {filter("typeId", "Tipo", typeOptions)}
        {filter("loc", "Ubicación", cityOptions, { multi: true })}
        {filter("bedrooms", "Dormitorios", [1, 2, 3, 4].map((n) => ({ value: String(n), label: `${n}+` })), { chips: true })}
        {filter("bathrooms", "Baños", [1, 2, 3].map((n) => ({ value: String(n), label: `${n}+` })), { chips: true })}
        {filter("amenities", "Amenities", amenityOptions, { multi: true })}
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => toggle(c.name, c.value)}
              aria-label={`Quitar filtro ${c.label}`}
              className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full bg-main-soft pr-2 pl-3 text-[13px] font-medium text-foreground transition-colors hover:bg-main-soft/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {c.label}
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          ))}
          {activeCount > 1 && (
            <button
              type="button"
              onClick={() => clear()}
              className="ml-1 cursor-pointer rounded-sm text-[13px] font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Limpiar todo
            </button>
          )}
        </div>
      )}
    </div>
  );
}
