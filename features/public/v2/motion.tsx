"use client";

import { useEffect, useRef } from "react";
import {
  animate,
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";

// Curva común del sitio: arranque rápido, frenado largo (expo-out).
export const EASE = [0.16, 1, 0.3, 1] as const;

type HeadingTag = "h1" | "h2" | "h3" | "p";

// Titular que entra palabra por palabra, cada una subiendo desde detrás
// de una máscara. Marca la jerarquía: el título llega primero y el resto
// de la sección se acomoda alrededor. `trigger="mount"` anima al cargar
// (hero); `"view"` al entrar en pantalla. El texto queda entero en el DOM
// para buscadores y lectores de pantalla.
export function SplitHeading({
  text,
  as = "h2",
  id,
  className,
  trigger = "view",
  delay = 0,
}: {
  text: string;
  as?: HeadingTag;
  id?: string;
  className?: string;
  trigger?: "mount" | "view";
  delay?: number;
}) {
  const reduce = useReducedMotion();
  const Tag = motion[as];
  // "\n" fuerza un corte de línea (para evitar una palabra sola al final).
  const lines = text.split("\n");
  const LineTag = lines.length > 1 ? "span" : null;

  if (reduce) {
    const Plain = as;
    return (
      <Plain id={id} className={className}>
        {lines.map((line, i) => (
          <span key={i} className={LineTag ? "block" : undefined}>
            {line}
          </span>
        ))}
      </Plain>
    );
  }

  const play = { y: "0%" };
  return (
    <Tag
      id={id}
      className={className}
      initial="hidden"
      {...(trigger === "mount"
        ? { animate: "show" }
        : { whileInView: "show", viewport: { once: true, amount: 0.6, margin: "99999px 0px 0px 0px" } })}
      transition={{ staggerChildren: 0.06, delayChildren: delay }}
    >
      {lines.map((line, l) => {
        const words = line.split(" ");
        return (
          <span key={l} className={LineTag ? "block" : undefined}>
            {words.map((word, i) => (
              <span key={i}>
                {/* El padding inferior deja lugar a los descendentes (g, p, q)
                    dentro de la máscara; el margen negativo lo compensa. */}
                <span className="-mb-[0.18em] inline-block overflow-hidden pb-[0.18em] align-top">
                  <motion.span
                    className="inline-block will-change-transform"
                    variants={{ hidden: { y: "105%" }, show: play }}
                    transition={{ duration: 0.9, ease: EASE }}
                  >
                    {word}
                  </motion.span>
                </span>
                {i < words.length - 1 ? " " : null}
              </span>
            ))}
            {/* Espacio entre líneas para buscadores y lectores de pantalla. */}
            {l < lines.length - 1 ? " " : null}
          </span>
        );
      })}
    </Tag>
  );
}

// Grilla que entra en cascada: cada hijo sube y aparece con un pequeño
// retraso según su columna, así la fila se lee de izquierda a derecha.
export function StaggerItem({
  children,
  index,
  columns = 3,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  index: number;
  columns?: number;
  className?: string;
  as?: "div" | "li";
}) {
  const reduce = useReducedMotion();
  const Tag = motion[as];
  if (reduce) {
    const Plain = as;
    return <Plain className={className}>{children}</Plain>;
  }
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2, margin: "99999px 0px 0px 0px" }}
      transition={{ duration: 0.8, delay: (index % columns) * 0.09, ease: EASE }}
    >
      {children}
    </Tag>
  );
}

// Cifra que cuenta desde 0 al entrar en pantalla ("1.240", "37 días").
// Separa el número del sufijo y respeta el separador de miles es-AR.
// Escribe directo en el DOM: no re-renderiza React en cada cuadro.
export function CountUp({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();

  const match = value.match(/^([\d.]+)(.*)$/);
  const target = match ? Number(match[1].replace(/\./g, "")) : NaN;
  const suffix = match ? match[2] : "";

  useEffect(() => {
    const el = ref.current;
    if (!el || !inView || reduce || !Number.isFinite(target)) return;
    const controls = animate(0, target, {
      duration: 1.6,
      ease: EASE,
      onUpdate: (n) => {
        el.textContent = Math.round(n).toLocaleString("es-AR") + suffix;
      },
    });
    return () => controls.stop();
  }, [inView, reduce, target, suffix]);

  return (
    <span ref={ref} className={className}>
      {value}
    </span>
  );
}

// Foto que se desplaza más lento que la página (parallax suave). Da
// profundidad sin mover el layout: solo transform sobre la imagen, que
// está agrandada para que el corrimiento nunca deje bordes vacíos.
export function Parallax({
  children,
  className,
  distance = 0.12,
}: {
  children: React.ReactNode;
  className?: string;
  distance?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const pct = `${distance * 100}%`;
  const y = useTransform(scrollYProgress, [0, 1], [`-${pct}`, pct]);

  return (
    <div ref={ref} className={`relative overflow-hidden ${className ?? ""}`}>
      <motion.div
        className="absolute inset-x-0 will-change-transform"
        style={reduce ? { inset: 0 } : { y, top: `-${pct}`, bottom: `-${pct}` }}
      >
        {children}
      </motion.div>
    </div>
  );
}
