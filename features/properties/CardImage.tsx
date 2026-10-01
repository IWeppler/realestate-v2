"use client";

import { useCallback, useState } from "react";
import Image from "next/image";

// Foto de la tarjeta. Dos transiciones separadas para que no se pisen:
// - Carga: aparece con un fundido mientras se asienta (sin saltos).
// - Hover: zoom lento con frenado largo; al salir vuelve con la misma
//   curva. Solo en dispositivos con puntero (el `hover:` de Tailwind v4).
// Con "reducir movimiento" no hay zoom ni escala, solo el fundido.
export function CardImage({
  src,
  alt,
  sizes,
  className = "",
}: {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  // Si la foto ya bajó antes de hidratar (caché, conexión rápida), el
  // onLoad no llega a dispararse: se detecta al montar.
  const imgRef = useCallback((img: HTMLImageElement | null) => {
    if (img?.complete && img.naturalWidth > 0) setLoaded(true);
  }, []);

  return (
    <div
      className={`absolute inset-0 transition-transform duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100 ${className}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        ref={imgRef}
        onLoad={() => setLoaded(true)}
        className={`object-cover transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transform-none ${
          loaded ? "scale-100 opacity-100" : "scale-[1.04] opacity-0"
        }`}
      />
    </div>
  );
}
