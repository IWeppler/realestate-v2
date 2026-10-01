"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

type DescriptionProps = {
  text: string;
};

// Descripción de la ficha: se muestra recortada con un desvanecido y un
// "Seguir leyendo" que la despliega. Si es corta, no hay botón.
export function DescriptionWithReadMore({ text }: DescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) {
    return <p className="text-lg text-fg-secondary">No hay descripción disponible.</p>;
  }

  const long = text.length > 600;
  const collapsed = long && !isExpanded;

  return (
    <div>
      <div className="relative">
        <div
          className={`max-w-[68ch] text-lg leading-relaxed whitespace-pre-wrap text-fg-secondary ${
            collapsed ? "max-h-64 overflow-hidden" : ""
          }`}
        >
          {text}
        </div>
        {collapsed && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-background to-transparent"
          />
        )}
      </div>

      {long && (
        <button
          type="button"
          onClick={() => setIsExpanded((v) => !v)}
          aria-expanded={isExpanded}
          className="mt-4 inline-flex cursor-pointer items-center gap-1.5 rounded-full text-base font-semibold text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {isExpanded ? "Ver menos" : "Seguir leyendo"}
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
      )}
    </div>
  );
}
