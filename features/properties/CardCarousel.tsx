"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { CardImage } from "@/features/properties/CardImage";

const MAX_SLIDES = 8;

const arrowBase =
  "absolute top-1/2 z-20 hidden size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-card/90 text-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:hover)]:flex";

// Fotos de la tarjeta: se deslizan de costado (con snap) y cada foto lleva
// a la ficha. Va por encima del link estirado de la tarjeta (z-10) para que
// el gesto de deslizar no lo capture ese link. Puntos abajo; flechas solo
// en dispositivos con puntero.
export function CardCarousel({
  images,
  title,
  href,
  sizes,
}: {
  images: string[];
  title: string;
  href: string;
  sizes: string;
}) {
  const slides = images.slice(0, MAX_SLIDES);
  const scroller = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);

  if (slides.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-fg-disabled">
        <ImageOff className="h-6 w-6" aria-hidden="true" />
      </div>
    );
  }

  const go = (to: number) => {
    const el = scroller.current;
    if (el) el.scrollTo({ left: to * el.clientWidth, behavior: "smooth" });
  };

  return (
    <>
      <ul
        ref={scroller}
        onScroll={(e) => {
          const el = e.currentTarget;
          setIndex(Math.round(el.scrollLeft / el.clientWidth));
        }}
        className="absolute inset-0 z-10 flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((src, i) => (
          <li key={`${src}-${i}`} className="relative h-full w-full shrink-0 snap-center">
            <Link href={href} tabIndex={-1} aria-label={title} className="absolute inset-0 block">
              <CardImage src={src} alt={i === 0 ? title : `${title}, foto ${i + 1}`} sizes={sizes} />
            </Link>
          </li>
        ))}
      </ul>

      {slides.length > 1 && (
        <>
          <div className="pointer-events-none absolute inset-x-0 bottom-2.5 z-20 flex justify-center gap-1.5" aria-hidden="true">
            {slides.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full bg-white shadow-sm transition-all ${i === index ? "w-4" : "w-1.5 opacity-60"}`}
              />
            ))}
          </div>
          {index > 0 && (
            <button type="button" aria-label="Foto anterior" onClick={() => go(index - 1)} className={`${arrowBase} left-2`}>
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
          {index < slides.length - 1 && (
            <button type="button" aria-label="Foto siguiente" onClick={() => go(index + 1)} className={`${arrowBase} right-2`}>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </>
      )}
    </>
  );
}
