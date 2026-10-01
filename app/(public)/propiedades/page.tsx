import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { createClientServer } from "@/lib/supabase";
import { whatsappLink } from "@/lib/brand";
import PropertyCard from "@/features/properties/PropertyCard";
import { PropertyCardData } from "@/app/types/entities";
import { ListingToolbar } from "@/features/properties/ListingToolbar";
import { PublicMapView } from "@/features/properties/PublicMapView";
import type { MapProperty } from "@/features/properties/PublicPropertiesMap";
import { SplitHeading, StaggerItem } from "@/features/public/v2/motion";
import { CONTACT_CTA_LABEL } from "@/features/public/v2/content";
import { getUniqueLocations } from "@/shared/utils/getLocations";

export const revalidate = 60;

type PropertyType = { id: number; name: string };
type Amenity = { id: number; name: string };

type PageSearchParams = {
  tipo?: string;
  typeId?: string;
  loc?: string;
  amenities?: string;
  bedrooms?: string;
  bathrooms?: string;
  sortBy?: string;
  vista?: string;
  q?: string;
};

function titleFor(tipo?: string) {
  return tipo === "venta" ? "Propiedades en venta" : tipo === "alquiler" ? "Propiedades en alquiler" : "Todas las propiedades";
}

// Título de pestaña según la operación (el layout agrega la marca).
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}): Promise<Metadata> {
  const { tipo } = await searchParams;
  return { title: titleFor(tipo) };
}

export default async function PropiedadesPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  const searchParams = await searchParamsPromise;
  const supabase = await createClientServer();

  const amenityJoin = searchParams.amenities ? "property_amenities!inner" : "property_amenities";

  let query = supabase.from("properties").select(
    `
      id, title, price, currency, bedrooms, bathrooms,
      total_area, cocheras, city, street_address, status, latitude, longitude,
      property_images ( image_url, order ),
      ${amenityJoin} ( amenity_id )
    `,
  );

  if (searchParams.tipo === "venta") {
    query = query.eq("status", "EN_VENTA");
  } else if (searchParams.tipo === "alquiler") {
    query = query.eq("status", "EN_ALQUILER");
  }

  if (searchParams.typeId) {
    query = query.eq("property_type_id", searchParams.typeId);
  }

  // Ubicación: una o varias ciudades separadas por coma.
  const locs = searchParams.loc?.split(",").map((c) => c.trim()).filter(Boolean) ?? [];
  if (locs.length === 1) {
    query = query.eq("city", locs[0]);
  } else if (locs.length > 1) {
    query = query.in("city", locs);
  }

  // Búsqueda libre por palabras: cada palabra tiene que aparecer en algún
  // campo (título, calle, barrio, ciudad o provincia), así "casa tostado"
  // o "tostado santa fe" encuentran resultados aunque la frase completa no
  // esté escrita igual en ningún campo. Se quitan los caracteres que
  // PostgREST interpreta dentro de .or() y los comodines.
  const q = searchParams.q?.replace(/[,()%*\\.:"]/g, " ").trim().slice(0, 80);
  const words = (q ?? "").split(/\s+/).filter(Boolean).slice(0, 6);
  for (const word of words) {
    const like = `%${word}%`;
    query = query.or(
      [
        `title.ilike.${like}`,
        `street_address.ilike.${like}`,
        `neighborhood.ilike.${like}`,
        `city.ilike.${like}`,
        `province.ilike.${like}`,
      ].join(","),
    );
  }

  if (searchParams.bedrooms) {
    query = query.gte("bedrooms", searchParams.bedrooms);
  }

  if (searchParams.bathrooms) {
    query = query.gte("bathrooms", searchParams.bathrooms);
  }

  if (searchParams.amenities) {
    const amenityIds = searchParams.amenities.split(",");
    query = query.in("property_amenities.amenity_id", amenityIds);
  }

  if (searchParams.sortBy === "price_asc") {
    query = query.order("price", { ascending: true });
  } else if (searchParams.sortBy === "price_desc") {
    query = query.order("price", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  // Resultados y opciones de filtros en paralelo.
  const [{ data, error }, { data: propertyTypes }, { data: amenities }, locations] = await Promise.all([
    query,
    supabase.from("property_types").select("id, name").order("name"),
    supabase.from("amenities").select("id, name").order("name"),
    getUniqueLocations(),
  ]);

  if (error) {
    console.error("Error fetching properties:", error);
  }

  // Ciudades con cantidad: sugerencias del buscador y opciones de Ubicación.
  const cities = [...new Set(locations.map((l) => l.city))].sort((a, b) => a.localeCompare(b, "es"));

  const properties: PropertyCardData[] = (data as PropertyCardData[]) || [];
  const view = searchParams.vista === "mapa" ? "mapa" : "lista";
  const count = properties.length;

  // Encabezado y barra iguales en lista y mapa: al cambiar de vista solo
  // cambia el contenido de abajo.
  const header = (compact: boolean) => (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
        <SplitHeading
          as="h1"
          trigger="mount"
          text={titleFor(searchParams.tipo)}
          className={`font-display leading-[0.95] font-normal tracking-[-0.03em] text-foreground ${
            compact ? "text-4xl md:text-5xl" : "text-5xl md:text-6xl lg:text-[5rem]"
          }`}
        />
        <p className="pb-1 text-sm text-muted-foreground tabular-nums" aria-live="polite">
          <span className="font-semibold text-foreground">{count}</span> {count === 1 ? "propiedad" : "propiedades"}
          {q ? ` para “${q}”` : ""}
        </p>
      </div>

      <ListingToolbar
        types={(propertyTypes ?? []) as PropertyType[]}
        amenities={(amenities ?? []) as Amenity[]}
        cities={cities}
        locations={locations}
        view={view}
      />
    </div>
  );

  const emptyState = (
    <div className="flex flex-col items-start gap-6 rounded-4xl bg-surface-alt px-6 py-16 md:items-center md:px-12 md:py-24 md:text-center">
      <h2 className="max-w-[20ch] font-display text-4xl leading-[1] font-normal tracking-[-0.03em] text-foreground md:text-5xl">
        No encontramos propiedades con esos filtros
      </h2>
      <p className="max-w-[48ch] text-lg leading-relaxed text-fg-secondary">
        Probá quitando algún filtro o buscando otra zona. Si no aparece, contanos qué necesitás y te avisamos cuando entre.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/propiedades"
          className="inline-flex h-[52px] items-center rounded-full bg-main px-7 text-base font-semibold whitespace-nowrap text-primary-foreground transition-[background-color,transform] hover:bg-main-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98]"
        >
          Ver todas las propiedades
        </Link>
        <a
          href={whatsappLink("Hola, estoy buscando una propiedad y no encontré lo que necesito en la web.")}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-[52px] items-center gap-2 rounded-full border border-border-strong px-7 text-base font-semibold whitespace-nowrap text-foreground transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <MessageCircle className="h-5 w-5" aria-hidden="true" />
          {CONTACT_CTA_LABEL}
        </a>
      </div>
    </div>
  );

  // Vista mapa: el encabezado queda arriba y el bloque lista + mapa mide
  // casi toda la pantalla, así el mapa tiene alto de verdad. Al bajar un
  // poco queda entero a la vista (el header se esconde al scrollear).
  if (view === "mapa") {
    return (
      <div className="w-full bg-background">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 pt-6 pb-10 md:px-8 md:pt-8">
          {header(true)}
          <div key="mapa" className="site-fade relative h-[calc(100dvh-6rem)] min-h-[560px]">
            {count > 0 ? (
              <PublicMapView properties={(data ?? []) as unknown as MapProperty[]} />
            ) : (
              <div className="absolute inset-0 overflow-y-auto">{emptyState}</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-background">
      <div className="mx-auto w-full max-w-7xl px-6 pt-10 pb-24 md:px-8 md:pt-14 lg:pb-36">
        {header(false)}

        <section key="lista" aria-label="Resultados" className="site-fade mt-12 md:mt-14">
          {count > 0 ? (
            <ul className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {properties.map((property, i) => (
                <StaggerItem as="li" key={property.id} index={i}>
                  <PropertyCard property={property} />
                </StaggerItem>
              ))}
            </ul>
          ) : (
            emptyState
          )}
        </section>
      </div>
    </div>
  );
}
