import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";
import { createClientServer } from "@/lib/supabase";
import { HeroV2 } from "@/features/public/v2/HeroV2";
import { LatestListings } from "@/features/public/v2/LatestListings";
import { TypeBento } from "@/features/public/v2/TypeBento";
import { AppraisalBand } from "@/features/public/v2/AppraisalBand";
import { TrustSection } from "@/features/public/v2/TrustSection";
import { ContactClose } from "@/features/public/v2/ContactClose";
import type { PropertyCardData } from "@/app/types/entities";

// Landing en rediseño. Vive aparte de "/" hasta aprobarla; noindex para
// no competir con la home en buscadores.
export const metadata: Metadata = {
  title: { absolute: `${BRAND.name} | Propiedades en venta y alquiler` },
  robots: { index: false, follow: false },
};

const CARD_FIELDS = `
  id,
  title,
  price,
  currency,
  bedrooms,
  bathrooms,
  total_area,
  cocheras,
  city,
  street_address,
  status,
  property_images ( image_url, order )
`;

async function latestByStatus(status: "EN_VENTA" | "EN_ALQUILER") {
  const supabase = await createClientServer();
  const { data, error } = await supabase
    .from("properties")
    .select(CARD_FIELDS)
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) {
    console.error(`Error al cargar propiedades ${status}:`, error.message);
  }
  return (data ?? []) as PropertyCardData[];
}

// Destacadas del hero: las disponibles más vistas (no hay una marca de
// "destacada" en la base; las visitas son la señal real de interés).
// Solo las que tienen foto, que es lo que muestra el marquee.
async function featuredProperties() {
  const supabase = await createClientServer();
  const { data, error } = await supabase
    .from("properties")
    .select(CARD_FIELDS)
    .in("status", ["EN_VENTA", "EN_ALQUILER"])
    .order("views_count", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(14);

  if (error) {
    console.error("Error al cargar destacadas:", error.message);
  }
  return ((data ?? []) as PropertyCardData[])
    .filter((p) => p.property_images?.some((img) => img.image_url))
    .slice(0, 10);
}

export default async function HomeV2() {
  const [featured, sale, rent] = await Promise.all([
    featuredProperties(),
    latestByStatus("EN_VENTA"),
    latestByStatus("EN_ALQUILER"),
  ]);

  return (
    <div className="flex w-full flex-col">
      <HeroV2 featured={featured} />
      <LatestListings sale={sale} rent={rent} />
      <TypeBento />
      <TrustSection />
      <AppraisalBand />
      <ContactClose />
    </div>
  );
}
