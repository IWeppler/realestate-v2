"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, MessageCircle } from "lucide-react";
import { useHideOnScroll } from "@/hooks/use-hide-on-scroll";
import { BRAND, whatsappLink } from "@/lib/brand";
import { CONTACT_CTA_LABEL } from "@/features/public/v2/content";
import { EASE } from "@/features/public/v2/motion";

const NAV_LINKS = [
  { href: "/propiedades?tipo=venta", label: "Comprar", hint: "Casas, departamentos y lotes" },
  { href: "/propiedades?tipo=alquiler", label: "Alquilar", hint: "Casas y departamentos" },
  { href: "/propiedades?vista=mapa", label: "Ver en el mapa", hint: "Todas las zonas" },
  { href: "/tasar", label: "Tasar mi propiedad", hint: "Sin costo" },
  { href: "/contacto", label: "Contacto", hint: "Oficina y WhatsApp" },
];

const WHATSAPP_MESSAGE = "Hola, quería hacer una consulta.";

// Navegación del sitio. Cerrada es mínima (logo + "Menú"), así el
// contenido manda. Abierta es una capa a pantalla completa que entra como
// un cambio de página: se descubre de arriba hacia abajo y las secciones
// suben una a una en tipografía grande. Con "reducir movimiento" solo hay
// un fundido.
export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [hidden, setHidden] = useHideOnScroll();
  const reduce = useReducedMotion();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  const close = useCallback(() => setOpen(false), []);

  // Cambio de ruta (ej. atrás del navegador): el menú se cierra.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  // Abierto: sin scroll de fondo, la página queda inerte (fuera del Tab y
  // de lectores), Escape cierra y el foco vuelve al botón al cerrar.
  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const background = [document.getElementById("contenido"), document.querySelector("footer")].filter(
      (el): el is HTMLElement => Boolean(el),
    );
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    background.forEach((el) => (el.inert = true));
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    const focusTimer = window.setTimeout(() => firstLinkRef.current?.focus({ preventScroll: true }), reduce ? 0 : 450);
    return () => {
      document.body.style.overflow = overflow;
      background.forEach((el) => (el.inert = false));
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(focusTimer);
      trigger?.focus({ preventScroll: true });
    };
  }, [open, reduce]);


  return (
    <>
      <a
        href="#contenido"
        className="sr-only z-[60] rounded-full bg-card px-4 py-2 text-sm font-semibold text-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Saltar al contenido
      </a>

      <motion.header
        className={`fixed inset-x-0 top-0 z-50 h-20 transition-colors duration-500 ${
          open ? "bg-transparent text-background" : "bg-background/90 text-foreground backdrop-blur-md"
        }`}
        initial={false}
        animate={{ y: hidden && !open ? "-100%" : "0%" }}
        transition={reduce ? { duration: 0 } : { duration: 0.3, ease: EASE }}
        // Con teclado: si el foco entra al header, se muestra.
        onFocusCapture={() => setHidden(false)}
      >
        <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between gap-6 px-6 md:px-8">
          <Link
            href="/"
            onClick={close}
            className="font-display text-[1.75rem] leading-none font-normal tracking-[-0.02em] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
          >
            {BRAND.name}
          </Link>

          <button
            ref={triggerRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            className="group -mr-2 flex h-11 cursor-pointer items-center gap-3 rounded-full px-2 text-[15px] font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
          >
            {/* Etiqueta que cambia con el estado; el ancho fijo evita que el ícono salte. */}
            <span className="relative block h-5 w-14 overflow-hidden text-right" aria-hidden="true">
              <span
                className={`absolute inset-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${open ? "-translate-y-full" : ""}`}
              >
                Menú
              </span>
              <span
                className={`absolute inset-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${open ? "" : "translate-y-full"}`}
              >
                Cerrar
              </span>
            </span>
            {/* Dos líneas que se cruzan en una X al abrir. */}
            <span className="relative block h-3 w-7" aria-hidden="true">
              <span
                className={`absolute left-0 h-px w-full bg-current transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  open ? "top-1/2 rotate-45" : "top-0 group-hover:translate-x-1"
                }`}
              />
              <span
                className={`absolute left-0 h-px w-full bg-current transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  open ? "top-1/2 -rotate-45" : "bottom-0 group-hover:-translate-x-1"
                }`}
              />
            </span>
          </button>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="site-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menú"
            className="fixed inset-0 z-40 overflow-y-auto bg-foreground text-background"
            initial={reduce ? { opacity: 0 } : { clipPath: "inset(0% 0% 100% 0%)" }}
            animate={reduce ? { opacity: 1 } : { clipPath: "inset(0% 0% 0% 0%)" }}
            exit={reduce ? { opacity: 0 } : { clipPath: "inset(0% 0% 100% 0%)", transition: { duration: 0.6, ease: EASE, delay: 0.1 } }}
            transition={{ duration: 0.8, ease: EASE }}
          >
            <div className="mx-auto grid min-h-full w-full max-w-7xl grid-cols-1 gap-12 px-6 pt-28 pb-10 md:px-8 lg:grid-cols-12 lg:gap-16 lg:pt-32 lg:pb-14">
              <nav aria-label="Principal" className="flex flex-col justify-center lg:col-span-8">
                <motion.ul
                  className="group/list"
                  initial="hidden"
                  animate="show"
                  exit="hidden"
                  variants={{
                    show: { transition: { staggerChildren: 0.07, delayChildren: reduce ? 0 : 0.3 } },
                    hidden: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
                  }}
                >
                  {NAV_LINKS.map((link, i) => {
                    // Solo las páginas propias; Comprar/Alquilar/Mapa comparten /propiedades.
                    const active = pathname === link.href;
                    return (
                      <li key={link.href} className="border-t border-background/12 last:border-b">
                        <Link
                          ref={i === 0 ? firstLinkRef : undefined}
                          href={link.href}
                          onClick={close}
                          aria-current={active ? "page" : undefined}
                          // Al recorrer la lista, el ítem activo se adelanta y los demás se apagan.
                          className="group/item flex items-baseline gap-4 py-[clamp(0.5rem,1.6dvh,1.1rem)] transition-opacity duration-500 group-hover/list:opacity-35 hover:opacity-100! focus-visible:opacity-100! focus-visible:outline-none md:gap-8"
                        >
                          <span className="w-7 shrink-0 text-xs font-medium text-background/50 tabular-nums md:w-10">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          {/* Máscara: el texto sube desde abajo al abrir. */}
                          <span className="-mb-[0.15em] block min-w-0 overflow-hidden pr-6 pb-[0.15em]">
                            <motion.span
                              className="block font-display text-[clamp(2rem,min(9vw,10dvh),6.5rem)] leading-[1] font-normal tracking-[-0.03em] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/item:translate-x-3 group-focus-visible/item:translate-x-3 group-aria-[current=page]/item:italic"
                              variants={
                                reduce
                                  ? { hidden: { opacity: 0 }, show: { opacity: 1 } }
                                  : { hidden: { y: "110%" }, show: { y: "0%" } }
                              }
                              transition={{ duration: 0.9, ease: EASE }}
                            >
                              {link.label}
                            </motion.span>
                          </span>
                          <span className="ml-auto hidden shrink-0 items-center gap-2 self-center text-sm text-background/55 transition-colors duration-300 group-hover/item:text-background md:flex">
                            {link.hint}
                            <ArrowUpRight
                              className="h-4 w-4 -translate-x-1 opacity-0 transition-[opacity,transform] duration-300 group-hover/item:translate-x-0 group-hover/item:opacity-100"
                              aria-hidden="true"
                            />
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </motion.ul>
              </nav>

              <motion.aside
                aria-label="Contacto"
                className="flex flex-col justify-end gap-8 text-sm text-background/70 lg:col-span-4 lg:pb-2"
                initial={{ opacity: 0, y: reduce ? 0 : 16 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE, delay: reduce ? 0 : 0.7 } }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
              >
                <p className="max-w-[30ch] text-base leading-relaxed text-background/80">
                  ¿Buscás algo puntual? Contanos qué necesitás y te ayudamos a encontrarlo.
                </p>
                <a
                  href={whatsappLink(WHATSAPP_MESSAGE)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-[52px] w-fit items-center gap-2 rounded-full bg-background px-7 text-base font-semibold whitespace-nowrap text-foreground transition-[background-color,transform] hover:bg-main-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-background active:scale-[0.98]"
                >
                  <MessageCircle className="h-5 w-5" aria-hidden="true" />
                  {CONTACT_CTA_LABEL}
                </a>
                <dl className="grid grid-cols-1 gap-4 border-t border-background/12 pt-6 sm:grid-cols-2 lg:grid-cols-1">
                  <div>
                    <dt className="text-xs text-background/50">Email</dt>
                    <dd className="mt-1">
                      <a href={`mailto:${BRAND.email}`} className="text-background underline-offset-4 hover:underline">
                        {BRAND.email}
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-background/50">Teléfono</dt>
                    <dd className="mt-1 text-background">{BRAND.phoneDisplay}</dd>
                  </div>
                  {BRAND.address && (
                    <div>
                      <dt className="text-xs text-background/50">Oficina</dt>
                      <dd className="mt-1 text-background">{BRAND.address}</dd>
                    </div>
                  )}
                </dl>
              </motion.aside>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
