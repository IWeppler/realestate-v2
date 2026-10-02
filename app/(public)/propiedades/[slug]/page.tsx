import { createClientServer } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { BRAND, formatLocation, formatPrice } from "@/lib/brand";
import {
  ArrowLeft,
  ArrowRight,
  Bath,
  BedDouble,
  Building,
  CalendarClock,
  Car,
  Check,
  DoorOpen,
  MapPin,
  Maximize2,
  Navigation,
  Receipt,
  Ruler,
  Tag,
} from "lucide-react";

import { ClientPropertyMap } from "@/features/properties/ClientPropertyMap";
import { DescriptionWithReadMore } from "@/features/properties/DescriptionReadMore";
import { PropertyJsonLd } from "@/features/public/seo/PropertyJsonLd";
import { PropertyFullDetails } from "@/features/properties/types/index";
import { ShareButton } from "@/features/properties/ShareButton";
import { FactChip, KeyFacts, type Fact } from "@/features/properties/KeyFacts";
import PropertyCard from "@/features/properties/PropertyCard";
import type { PropertyCardData } from "@/app/types/entities";
import { ViewCounter } from "@/features/public/v2/ViewCounter";
import { PropertyMedia } from "@/features/public/v2/PropertyMedia";
import {
  MobileContactBar,
  PropertyContactCard,
  PropertyInquiryForm,
} from "@/features/public/v2/PropertyContact";
import { Reveal } from "@/features/public/v2/Reveal";
import { SplitHeading, StaggerItem } from "@/features/public/v2/motion";

// --- Carga de Datos Principal ---
async function getPropertyDetails(
  slug: string,
): Promise<PropertyFullDetails | null> {
  const supabase = await createClientServer();
  const { data, error } = await supabase
    .from("properties")
    .select(
      `
      id, title, street_address, neighborhood, city, province, status, operation_type,
      price, currency, bedrooms, bathrooms, total_area, covered_area, rooms,
      description, latitude, longitude, expensas, antiguedad, cocheras,
      property_types ( name ),
      property_images ( image_url, order ),
      property_amenities ( amenities ( name ) ),
      agents!properties_agent_id_fkey ( id, full_name, avatar_url, phone, email )
    `,
    )
    .eq("id", slug)
    .single();

  if (error) {
    console.error("Error fetching property details:", error);
    if (error.code === "PGRST116") return null;
    throw new Error("No se pudieron cargar los datos de la propiedad.");
  }
  return data as unknown as PropertyFullDetails;
}

// --- Cargar Recomendados ---
// Mismas tarjetas que el listado. Primero misma ciudad y operación; si no
// hay, misma operación en cualquier ciudad.
const RECO_FIELDS =
  "id, title, price, currency, bedrooms, bathrooms, total_area, cocheras, city, street_address, status, property_images ( image_url, order )";

async function getRecommendedProperties(
  currentId: string,
  city: string | null,
  operationType: string,
): Promise<PropertyCardData[]> {
  const supabase = await createClientServer();

  let { data } = await supabase
    .from("properties")
    .select(RECO_FIELDS)
    .eq("operation_type", operationType)
    .in("status", ["EN_VENTA", "EN_ALQUILER"])
    .eq("city", city || "")
    .neq("id", currentId)
    .limit(3);

  if (!data || data.length === 0) {
    const fallback = await supabase
      .from("properties")
      .select(RECO_FIELDS)
      .eq("operation_type", operationType)
      .in("status", ["EN_VENTA", "EN_ALQUILER"])
      .neq("id", currentId)
      .limit(3);

    data = fallback.data;
  }

  return (data ?? []) as PropertyCardData[];
}

// --- Metadata (SEO / OG) ---
// E2.1: la imagen de previsualización la genera opengraph-image.tsx (misma
// carpeta) -- Next la agrega sola a og:image y twitter:image, no hace
// falta declararla acá. Título y descripción con precio + ubicación para
// que la tarjeta de WhatsApp/redes sea informativa sin abrir el link.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClientServer();

  const { data: property } = await supabase
    .from("properties")
    .select(
      "title, description, price, currency, city, province, neighborhood, bedrooms, total_area, operation_type",
    )
    .eq("id", slug)
    .single();

  if (!property) return { title: "Propiedad no encontrada" };

  const price = formatPrice(property.price, property.currency);
  const location = formatLocation(property);
  const specs = [
    property.bedrooms ? `${property.bedrooms} dorm.` : null,
    property.total_area ? `${property.total_area} m²` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const operation =
    property.operation_type?.toUpperCase() === "ALQUILER"
      ? "En alquiler"
      : "En venta";

  const shortDescription = [
    [operation, price, specs].filter(Boolean).join(" · "),
    location,
    property.description?.replace(/\s+/g, " ").substring(0, 120),
  ]
    .filter(Boolean)
    .join(" — ");

  return {
    title: `${property.title} | ${price}`,
    description: shortDescription,
    alternates: { canonical: `/propiedades/${slug}` },
    openGraph: {
      title: `${property.title} · ${price}`,
      description: shortDescription,
      url: `/propiedades/${slug}`,
      siteName: BRAND.name,
      locale: "es_AR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${property.title} · ${price}`,
      description: shortDescription,
    },
  };
}

const STATUS_LABELS: Record<string, string> = {
  EN_VENTA: "En venta",
  EN_ALQUILER: "En alquiler",
  RESERVADO: "Reservada",
  VENDIDO: "Vendida",
  ALQUILADO: "Alquilada",
};

function SectionTitle({ id, children }: { id: string; children: string }) {
  return (
    <h2 id={id} className="font-display text-3xl leading-[1] font-normal tracking-[-0.02em] text-foreground md:text-4xl">
      {children}
    </h2>
  );
}

// --- Página Principal ---
// Ficha de propiedad: encabezado editorial, galería, contenido a la
// izquierda y tarjeta de contacto fija a la derecha (en mobile, barra
// inferior con precio y acciones). Cierra con propiedades parecidas.
export default async function PropertyPage({
  params: paramsPromise,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await paramsPromise;
  const property = await getPropertyDetails(slug);

  if (!property) notFound();

  const recommendedProperties = await getRecommendedProperties(
    property.id,
    property.city,
    property.operation_type ?? "",
  );

  const {
    title,
    street_address,
    neighborhood,
    city,
    province,
    status,
    price,
    currency,
    property_images,
    property_amenities,
  } = property;

  const locationString = [street_address, neighborhood, city, province].filter(Boolean).join(", ");
  const statusDisplay = STATUS_LABELS[status] || status;
  const typeName = property.property_types?.name ?? null;

  const priceDisplay =
    typeof price === "number" && price > 0
      ? `${currency || "USD"} ${price.toLocaleString("es-AR")}`
      : "Consultar precio";

  const amenities = property_amenities?.map((a) => a.amenities?.name).filter((n): n is string => Boolean(n)) || [];
  const images = [...(property_images || [])]
    .sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER))
    .map((img) => img.image_url)
    .filter((url): url is string => Boolean(url));
  const available = status === "EN_VENTA" || status === "EN_ALQUILER";
  const isRent =
    property.operation_type?.toUpperCase() === "ALQUILER" || status === "EN_ALQUILER" || status === "ALQUILADO";
  const priceLabel = isRent ? "Alquiler mensual" : "Precio de venta";
  const expensasDisplay =
    property.expensas && property.expensas > 0 ? `ARS ${property.expensas.toLocaleString("es-AR")}` : null;
  const pricePerM2 =
    !isRent && typeof price === "number" && price > 0 && property.total_area && property.total_area > 0
      ? `${currency || "USD"} ${Math.round(price / property.total_area).toLocaleString("es-AR")}`
      : null;
  const keyFacts = (
    [
      { icon: DoorOpen, label: "Ambientes", value: property.rooms },
      { icon: BedDouble, label: "Dormitorios", value: property.bedrooms },
      { icon: Bath, label: "Baños", value: property.bathrooms },
      { icon: Maximize2, label: "Sup. total", value: property.total_area, unit: "m²" },
      { icon: Ruler, label: "Sup. cubierta", value: property.covered_area, unit: "m²" },
      { icon: Car, label: "Cocheras", value: property.cocheras },
    ] as { icon: React.ElementType; label: string; value: number | string | null | undefined; unit?: string }[]
  ).filter((f): f is Fact => f.value !== null && f.value !== undefined && f.value !== "" && f.value !== 0);
  const hasCoords = typeof property.latitude === "number" && typeof property.longitude === "number";
  const refCode = property.id.slice(0, 8).toUpperCase();
  // Resumen junto al precio: lo primero que se compara entre propiedades.
  const headlineSpecs = [
    property.bedrooms ? { key: "bed", icon: BedDouble, text: `${property.bedrooms} ${property.bedrooms === 1 ? "dormitorio" : "dormitorios"}` } : null,
    property.bathrooms ? { key: "bath", icon: Bath, text: `${property.bathrooms} ${property.bathrooms === 1 ? "baño" : "baños"}` } : null,
    property.total_area ? { key: "area", icon: Maximize2, text: `${Number(property.total_area).toLocaleString("es-AR")} m²` } : null,
  ].filter(Boolean) as { key: string; icon: React.ElementType; text: string }[];

  return (
    <div className="w-full bg-background pb-28 lg:pb-0">
      <ViewCounter propertyId={property.id} />
      <PropertyJsonLd property={property} />

      <div className="mx-auto w-full max-w-7xl px-6 pt-8 md:px-8 md:pt-10">
        {/* --- Portada: foto grande, presentación y tira de fotos --- */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link
            href="/propiedades"
            className="inline-flex items-center gap-2 rounded-full text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Todas las propiedades
          </Link>
          <ShareButton title={title} price={priceDisplay} location={locationString} />
        </div>

        <PropertyMedia images={images} title={title}>
          <header className="mt-10 grid grid-cols-1 gap-8 md:mt-14 lg:grid-cols-12 lg:items-end lg:gap-16">
            <div className="min-w-0 lg:col-span-7">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{statusDisplay}</span>
                {typeName ? ` · ${typeName}` : ""}
              </p>
              <SplitHeading
                as="h1"
                trigger="mount"
                delay={0.3}
                text={title}
                className="mt-4 font-display text-5xl leading-[0.95] font-normal tracking-[-0.03em] text-balance text-foreground md:text-6xl lg:text-7xl"
              />
              {locationString && (
                <p className="site-rise mt-5 flex items-start gap-2 text-lg text-fg-secondary [--rise-delay:650ms]">
                  <MapPin className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
                  {locationString}
                </p>
              )}
            </div>

            <div className="site-rise flex flex-col gap-5 lg:col-span-5 lg:items-end lg:text-right [--rise-delay:500ms]">
              <div>
                <p className="text-sm text-muted-foreground">{priceLabel}</p>
                <p className="mt-1 font-display text-5xl leading-none font-normal tracking-[-0.02em] text-foreground md:text-6xl">
                  {priceDisplay}
                </p>
                {expensasDisplay && <p className="mt-2 text-sm text-muted-foreground">+ {expensasDisplay} de expensas</p>}
              </div>
              {headlineSpecs.length > 0 && (
                <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-fg-secondary lg:justify-end">
                  {headlineSpecs.map(({ key, icon: Icon, text }) => (
                    <li key={key} className="inline-flex items-center gap-1.5">
                      <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                      {text}
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex items-center gap-4 border-t border-border pt-5 lg:w-full lg:justify-end">
                <span className="text-xs text-muted-foreground tabular-nums">Cód. {refCode}</span>
              </div>
            </div>
          </header>
        </PropertyMedia>

        {/* --- Contenido + contacto --- */}
        <div className="mt-14 grid grid-cols-1 gap-16 lg:mt-20 lg:grid-cols-12 lg:gap-16">
          <div className="flex flex-col gap-20 lg:col-span-7">
            <section aria-labelledby="facts-title">
              <SectionTitle id="facts-title">La propiedad de un vistazo</SectionTitle>
              <div className="mt-10">
                <KeyFacts facts={keyFacts} />
              </div>
              <div className="mt-8 flex flex-wrap gap-2">
                <FactChip icon={Building} label="Tipo" value={typeName} />
                <FactChip icon={Tag} label="Precio por m²" value={pricePerM2} />
                <FactChip icon={Receipt} label="Expensas" value={expensasDisplay} />
                <FactChip icon={CalendarClock} label="Antigüedad" value={property.antiguedad} />
              </div>
            </section>

            <Reveal>
              <section aria-labelledby="desc-title">
                <SectionTitle id="desc-title">Descripción</SectionTitle>
                <div className="mt-8">
                  <DescriptionWithReadMore text={property.description || ""} />
                </div>
              </section>
            </Reveal>

            {amenities.length > 0 && (
              <section aria-labelledby="amenities-title">
                <SectionTitle id="amenities-title">Características</SectionTitle>
                <ul className="mt-8 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                  {amenities.map((name, i) => (
                    <StaggerItem
                      as="li"
                      key={name}
                      index={i}
                      columns={2}
                      className="flex items-center gap-3 border-b border-border pb-4 text-base text-foreground"
                    >
                      <Check className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      {name}
                    </StaggerItem>
                  ))}
                </ul>
              </section>
            )}

            <Reveal>
              <section aria-labelledby="map-title">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <SectionTitle id="map-title">Ubicación</SectionTitle>
                    {locationString && <p className="mt-3 text-base text-fg-secondary">{locationString}</p>}
                  </div>
                  {hasCoords && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${property.latitude},${property.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Navigation className="h-4 w-4" aria-hidden="true" />
                      Cómo llegar
                    </a>
                  )}
                </div>
                <div className="mt-8 h-[380px] w-full overflow-hidden rounded-3xl bg-sunken md:h-[460px]">
                  <ClientPropertyMap lat={property.latitude} lng={property.longitude} title={property.title} />
                </div>
              </section>
            </Reveal>

            <Reveal>
              <section aria-labelledby="inquiry-title" className="rounded-4xl bg-surface-alt p-6 md:p-10">
                <SectionTitle id="inquiry-title">Consultá por esta propiedad</SectionTitle>
                <p className="mt-3 mb-8 text-base text-fg-secondary">Tu consulta le llega directo al asesor a cargo.</p>
                <PropertyInquiryForm propertyId={property.id} title={title} />
              </section>
            </Reveal>
          </div>

          <aside className="hidden lg:col-span-5 lg:block">
            <div className="sticky top-28">
              <PropertyContactCard
                propertyId={property.id}
                title={title}
                available={available}
                priceDisplay={priceDisplay}
                priceLabel={priceLabel}
                expensasDisplay={expensasDisplay}
                agent={property.agents}
              />
            </div>
          </aside>
        </div>
      </div>

      {/* --- Parecidas --- */}
      {recommendedProperties.length > 0 && (
        <section aria-labelledby="reco-title" className="mt-24 w-full bg-surface-alt lg:mt-36">
          <div className="mx-auto w-full max-w-7xl px-6 py-20 md:px-8 lg:py-28">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SplitHeading
                id="reco-title"
                text="También te puede interesar"
                className="max-w-[16ch] font-display text-4xl leading-[0.95] font-normal tracking-[-0.03em] text-foreground md:text-5xl"
              />
              <Link
                href={isRent ? "/propiedades?tipo=alquiler" : "/propiedades?tipo=venta"}
                className="group inline-flex items-center gap-1.5 text-sm font-semibold text-foreground underline-offset-4 hover:underline"
              >
                Ver todas
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            </div>
            <ul className="mt-12 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {recommendedProperties.map((p, i) => (
                <StaggerItem as="li" key={p.id} index={i}>
                  <PropertyCard property={p} />
                </StaggerItem>
              ))}
            </ul>
          </div>
        </section>
      )}

      <MobileContactBar
        propertyId={property.id}
        title={title}
        available={available}
        priceDisplay={priceDisplay}
        priceLabel={priceLabel}
      />
    </div>
  );
}
