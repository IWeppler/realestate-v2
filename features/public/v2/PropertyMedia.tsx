"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Images } from "lucide-react";
import { Lightbox } from "@/features/properties/ImageGallery";
import { CardImage } from "@/features/properties/CardImage";
import { EASE } from "@/features/public/v2/motion";

// Portada de la ficha: la primera foto grande (se abre desde un recorte al
// cargar y baja más lento al scrollear), la presentación de la propiedad
// (children, viene del servidor) y una tira deslizable con el resto de
// las fotos. Cualquier foto abre el lightbox en su posición.
export function PropertyMedia({
  images,
  title,
  children,
}: {
  images: string[];
  title: string;
  children: React.ReactNode;
}) {
  const [openAt, setOpenAt] = useState<number | null>(null);
  const [index, setIndex] = useState(0);
  const reduce = useReducedMotion();
  const coverRef = useRef<HTMLButtonElement>(null);
  const { scrollYProgress } = useScroll({ target: coverRef, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "12%"]);

  const open = (i: number) => {
    setIndex(i);
    setOpenAt(i);
  };

  const [cover, ...rest] = images;

  return (
    <>
      {cover ? (
        <motion.button
          ref={coverRef}
          type="button"
          onClick={() => open(0)}
          aria-label={`Ver las ${images.length} fotos de ${title}`}
          className="group relative block aspect-[4/3] w-full cursor-zoom-in overflow-hidden rounded-[8px] bg-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background md:aspect-[16/9] lg:aspect-auto lg:h-[min(46rem,calc(100dvh-10rem))]"
          initial={reduce ? false : { clipPath: "inset(6% 5% 0% 5% round 8px)" }}
          animate={{ clipPath: "inset(0% 0% 0% 0% round 8px)" }}
          transition={{ duration: 1.3, ease: EASE }}
        >
          <motion.span
            className="absolute inset-x-0 -top-[7%] -bottom-[7%] block will-change-transform"
            style={reduce ? { top: 0, bottom: 0 } : { y }}
            initial={reduce ? false : { scale: 1.12 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.6, ease: EASE }}
          >
            <Image
              src={cover}
              alt={`Foto principal de ${title}`}
              fill
              priority
              sizes="(min-width: 1280px) 1216px, 100vw"
              className="object-cover transition-transform duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
          </motion.span>
        </motion.button>
      ) : (
        <div className="flex aspect-[16/9] w-full flex-col items-center justify-center gap-2 rounded-[8px] bg-sunken text-muted-foreground">
          <Images className="h-8 w-8 opacity-50" aria-hidden="true" />
          Todavía no hay fotos de esta propiedad
        </div>
      )}

      {children}

      {rest.length > 0 && (
        <div className="site-rise mt-12 [--rise-delay:600ms]">
          {/* Bordes que se desvanecen: la tira sigue más allá de la pantalla. */}
          <ul
            aria-label="Fotos de la propiedad"
            className="-mx-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-2 [scrollbar-width:none] md:-mx-8 md:gap-4 md:px-8 [&::-webkit-scrollbar]:hidden"
          >
            <li className="snap-start">
              <button
                type="button"
                onClick={() => open(0)}
                className="flex h-40 w-40 shrink-0 cursor-pointer flex-col justify-between rounded-[8px] bg-foreground p-5 text-left text-background transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:h-56 md:w-56"
              >
                <Images className="h-5 w-5 opacity-70" aria-hidden="true" />
                <span>
                  <span className="block font-display text-5xl leading-none">{images.length}</span>
                  <span className="mt-1 block text-sm text-background/70">Ver todas las fotos</span>
                </span>
              </button>
            </li>
            {rest.map((src, i) => (
              <li key={`${src}-${i}`} className="snap-start">
                <button
                  type="button"
                  onClick={() => open(i + 1)}
                  aria-label={`Abrir foto ${i + 2} de ${images.length}`}
                  className="group relative block h-40 w-[13.5rem] shrink-0 cursor-zoom-in overflow-hidden rounded-[8px] bg-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:h-56 md:w-[18.5rem]"
                >
                  <CardImage src={src} alt={`Foto ${i + 2} de ${title}`} sizes="300px" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <AnimatePresence>
        {openAt !== null && (
          <Lightbox
            images={images}
            title={title}
            index={index}
            onIndexChange={setIndex}
            onClose={() => setOpenAt(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
