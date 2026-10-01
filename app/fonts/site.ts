import { Geist, Instrument_Serif } from "next/font/google";

// Tipografía del sitio público (SIL OFL, servidas desde el propio dominio
// por next/font): Instrument Serif solo para titulares grandes (3xl en
// adelante, peso 400: no tiene negrita) y Geist para todo lo demás.
// Solo se importan desde los layouts públicos, así el panel no las precarga.
export const instrumentSerif = Instrument_Serif({
  subsets: ["latin", "latin-ext"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
  fallback: ["Georgia", "serif"],
});

export const geist = Geist({
  subsets: ["latin", "latin-ext"],
  weight: "variable",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

// Las fuentes se exponen en `body:has(.site-public)` (y no solo en el
// wrapper) para que también las hereden los portales de Radix (selects,
// popovers, menús) que se montan directo en <body>. Se inyecta con un
// <style> desde cada layout del sitio público.
export function siteFontVars() {
  return `body:has(.site-public){--site-font-body:${geist.style.fontFamily};--site-font-display:${instrumentSerif.style.fontFamily};}`;
}
