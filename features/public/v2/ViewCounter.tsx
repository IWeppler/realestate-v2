"use client";

import { useEffect } from "react";
import { createClientBrowser } from "@/lib/supabase-browser";

// Suma una visita a la propiedad (views_count, función increment_views de
// la base, habilitada para anónimos). Una vez por sesión del navegador:
// recargar o volver a la ficha no infla el número. No renderiza nada.
export function ViewCounter({ propertyId }: { propertyId: string }) {
  useEffect(() => {
    const key = `viewed:${propertyId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Sin sessionStorage (modo privado estricto): se cuenta igual.
    }
    createClientBrowser()
      .rpc("increment_views", { property_id: propertyId })
      .then(({ error }) => {
        if (error) console.error("No se pudo registrar la visita:", error.message);
      });
  }, [propertyId]);

  return null;
}
