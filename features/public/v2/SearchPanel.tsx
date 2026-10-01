"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import {
  LocationCombobox,
  type LocationSuggestion,
  type SearchValue,
} from "@/features/properties/LocationCombobox";

const OPERATIONS = [
  { label: "Comprar", value: "venta" },
  { label: "Alquilar", value: "alquiler" },
];

// Buscador del hero v2: operación + zonas (chips, varias) + texto libre.
// Manda `tipo`, `loc` (ciudades separadas por coma) y `q`, que
// /propiedades ya interpreta.
export function SearchPanel({ locations }: { locations: LocationSuggestion[] }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [operation, setOperation] = useState("venta");
  const [search, setSearch] = useState<SearchValue>({ locs: [], q: "" });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({ tipo: operation });
    if (search.locs.length) params.set("loc", search.locs.join(","));
    if (search.q) params.set("q", search.q);
    router.push(`/propiedades?${params.toString()}`);
  };

  return (
    <form
      role="search"
      onSubmit={handleSearch}
      className="flex w-full flex-col gap-2 rounded-[28px] border border-border bg-card p-2 shadow-[0_16px_40px_-24px_rgb(33_44_51/0.35)] transition-[border-color] focus-within:border-border-strong sm:flex-row sm:items-center"
    >
      <div role="group" aria-label="Operación" className="flex shrink-0 self-start rounded-full bg-muted p-1 sm:self-center">
        {OPERATIONS.map((op) => {
          const active = operation === op.value;
          return (
            <button
              key={op.value}
              type="button"
              aria-pressed={active}
              onClick={() => setOperation(op.value)}
              className={`relative flex-1 cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition-colors sm:flex-none ${
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="v2-operation"
                  className="absolute inset-0 rounded-full bg-card shadow-sm"
                  transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <span className="relative">{op.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-2 pl-2 sm:pl-3">
        <LocationCombobox
          locations={locations}
          value={search}
          onChange={setSearch}
          className="flex-1 py-1"
        />
        <button
          type="submit"
          className="group flex h-11 shrink-0 cursor-pointer items-center gap-1.5 self-start rounded-full bg-main px-6 text-[15px] font-semibold whitespace-nowrap text-primary-foreground transition-[background-color,transform] hover:bg-main-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97] sm:self-center"
        >
          Buscar
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}
