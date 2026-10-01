import type { NextRequest } from "next/server";
import { createClientServer } from "@/lib/supabase";
import { BRAND } from "@/lib/brand";

// Geocodificación para el formulario de propiedades del panel
// (PropertyForm → "Buscar en el mapa"). Usa Nominatim de OpenStreetMap:
// gratis y sin clave, con la política de uso de identificarse con un
// User-Agent propio y no superar ~1 consulta por segundo (es una acción
// manual de un agente, así que alcanza). Solo para usuarios con sesión:
// no es un proxy público.
//
// Si la calle exacta no aparece, cae a la localidad y después a la
// provincia; el formulario centra el mapa según la precisión.

export type GeocodeCandidate = {
  lat: number;
  lon: number;
  label: string;
  precision: "street" | "locality" | "region";
};

type NominatimResult = { lat: string; lon: string; display_name: string };

const ENDPOINT = "https://nominatim.openstreetmap.org/search";

async function search(params: Record<string, string>): Promise<NominatimResult[]> {
  const qs = new URLSearchParams({
    ...params,
    country: "Argentina",
    format: "jsonv2",
    limit: "5",
    "accept-language": "es",
  });
  const res = await fetch(`${ENDPOINT}?${qs}`, {
    headers: { "User-Agent": `${BRAND.name} (${BRAND.siteUrl})` },
    // Una misma dirección casi nunca cambia: se cachea un día.
    next: { revalidate: 86400 },
  });
  if (!res.ok) throw new Error(`Nominatim respondió ${res.status}`);
  return (await res.json()) as NominatimResult[];
}

function toCandidates(results: NominatimResult[], precision: GeocodeCandidate["precision"]): GeocodeCandidate[] {
  const seen = new Set<string>();
  return results
    .map((r) => ({ lat: Number(r.lat), lon: Number(r.lon), label: r.display_name, precision }))
    .filter((c) => {
      const key = `${c.lat.toFixed(5)},${c.lon.toFixed(5)}`;
      if (!Number.isFinite(c.lat) || !Number.isFinite(c.lon) || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export async function GET(request: NextRequest) {
  const supabase = await createClientServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("No autorizado", { status: 401 });

  const params = request.nextUrl.searchParams;
  const street = params.get("street")?.trim().slice(0, 120) ?? "";
  const city = params.get("city")?.trim().slice(0, 80) ?? "";
  const province = params.get("province")?.trim().slice(0, 80) ?? "";
  if (!city || !province) {
    return new Response("Faltan ciudad y provincia", { status: 400 });
  }

  try {
    if (street) {
      const exact = toCandidates(await search({ street, city, state: province }), "street");
      if (exact.length > 0) return Response.json({ candidates: exact });
    }
    const locality = toCandidates(await search({ city, state: province }), "locality");
    if (locality.length > 0) return Response.json({ candidates: locality });

    const region = toCandidates(await search({ state: province }), "region");
    return Response.json({ candidates: region.slice(0, 1) });
  } catch (error) {
    console.error("Error de geocodificación:", error);
    return new Response("El servicio de mapas no respondió", { status: 502 });
  }
}
