"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ImageOff, MapPin, MapPinOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { CardImage } from "@/features/properties/CardImage";
import { PropertyMeta, cardImages } from "@/features/properties/PropertyCard";
import type { PropertyCardData } from "@/app/types/entities";
import {
  isLocated,
  type LocatedProperty,
  type MapProperty,
} from "@/features/properties/PublicPropertiesMap";

// MapLibre solo en cliente. El placeholder ocupa el mismo lugar que el
// mapa para no mover el layout al cargar.
const PublicPropertiesMap = dynamic(() => import("@/features/properties/PublicPropertiesMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-muted" aria-label="Cargando mapa" />,
});

// Vista mapa del listado público: panel de resultados + mapa con pines de
// precio, sincronizados. Hover en una tarjeta resalta su pin y viceversa;
// click en "Ver en mapa" vuela al pin y abre la vista previa; click en la
// vista previa lleva a la ficha. Ocupa el alto que le da el contenedor.
export function PublicMapView({ properties }: { properties: MapProperty[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focus, setFocus] = useState<LocatedProperty | null>(null);
  const rowRefs = useRef<Map<string, HTMLLIElement>>(new Map());

  const located = useMemo(() => properties.filter(isLocated), [properties]);
  const unlocated = useMemo(() => properties.filter((p) => !isLocated(p)), [properties]);

  const highlightedId = activeId ?? selectedId;

  // Hover o click en un pin: traer la tarjeta a la vista del panel. Solo
  // desde el mapa; el hover en la propia lista no la desplaza.
  const [scrollTarget, setScrollTarget] = useState<string | null>(null);
  useEffect(() => {
    if (!scrollTarget) return;
    rowRefs.current.get(scrollTarget)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [scrollTarget]);

  const onMapActive = (id: string | null) => {
    setActiveId(id);
    if (id) setScrollTarget(id);
  };
  const onMapSelect = (id: string | null) => {
    setSelectedId(id);
    if (id) setScrollTarget(id);
  };

  const selectFromList = (p: LocatedProperty) => {
    setSelectedId(p.id);
    setFocus({ ...p });
  };

  return (
    <div className="absolute inset-0 grid grid-rows-[minmax(0,1fr)_minmax(0,1.1fr)] gap-4 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:grid-rows-1 lg:gap-6 xl:grid-cols-[minmax(0,11fr)_minmax(0,9fr)]">
      <aside className="order-2 flex min-h-0 flex-col lg:order-1">
        {unlocated.length > 0 && (
          <p className="pb-3 text-xs text-muted-foreground">
            {unlocated.length} {unlocated.length === 1 ? "propiedad no tiene" : "propiedades no tienen"} ubicación en el mapa
          </p>
        )}

        {/* Mismas tarjetas que el listado. El resaltado (hover o pin) es un
            anillo en la foto, sincronizado con el pin del mapa. */}
        <ul className="grid min-h-0 flex-1 auto-rows-min grid-cols-1 gap-x-5 gap-y-8 overflow-y-auto overscroll-contain pr-1 pb-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {[...located, ...unlocated].map((p) => {
            const onMap = isLocated(p);
            const highlighted = highlightedId === p.id;
            const cover = cardImages(p.property_images)[0];
            return (
              <li
                key={p.id}
                ref={(el) => {
                  if (el) rowRefs.current.set(p.id, el);
                  else rowRefs.current.delete(p.id);
                }}
                onMouseEnter={() => onMap && setActiveId(p.id)}
                onMouseLeave={() => setActiveId(null)}
                className="group relative flex flex-col"
              >
                <div
                  className={cn(
                    "relative aspect-4/3 w-full overflow-hidden rounded-[8px] bg-sunken ring-offset-2 ring-offset-background transition-shadow duration-200 group-has-[a:focus-visible]:ring-2 group-has-[a:focus-visible]:ring-ring",
                    highlighted && "ring-2 ring-main",
                  )}
                >
                  {cover ? (
                    <CardImage src={cover} alt={p.title} sizes="(min-width: 1280px) 22vw, (min-width: 1024px) 420px, 50vw" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-fg-disabled">
                      <ImageOff className="h-6 w-6" aria-hidden="true" />
                    </div>
                  )}
                </div>

                <PropertyMeta property={p as unknown as PropertyCardData} compact />

                {/* Por encima del link estirado de la tarjeta. */}
                <div className="relative z-10 mt-2">
                  {onMap ? (
                    <button
                      type="button"
                      onClick={() => selectFromList(p)}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-full text-xs font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                      Ver en el mapa
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPinOff className="h-3.5 w-3.5" aria-hidden="true" />
                      Sin ubicación en el mapa
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </aside>

      <div className="relative order-1 min-h-0 overflow-hidden rounded-3xl bg-sunken lg:order-2">
        {located.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 bg-muted p-6 text-center text-muted-foreground">
            <MapPinOff className="h-8 w-8 opacity-60" aria-hidden="true" />
            <p>Ninguna de estas propiedades tiene ubicación cargada en el mapa.</p>
          </div>
        ) : (
          <PublicPropertiesMap
            properties={located}
            activeId={activeId}
            selectedId={selectedId}
            onActiveChange={onMapActive}
            onSelect={onMapSelect}
            focus={focus}
          />
        )}
      </div>
    </div>
  );
}
