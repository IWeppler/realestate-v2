import Link from "next/link";
import { Bath, BedDouble, Car, Maximize } from "lucide-react";
import type { PropertyCardData } from "@/app/types/entities";
import { formatPrice } from "@/lib/brand";
import { CardCarousel } from "@/features/properties/CardCarousel";

type PropertyCardProps = {
  property: PropertyCardData;
};

type OrderedImage = { image_url: string | null; order?: number | null };

// Fotos en el orden que definió la inmobiliaria (si viene `order`).
export function cardImages(images: OrderedImage[] | null | undefined) {
  return [...(images ?? [])]
    .sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER))
    .map((img) => img.image_url)
    .filter((url): url is string => Boolean(url));
}

const OPERATION_LABEL: Record<string, string> = {
  EN_VENTA: "En venta",
  EN_ALQUILER: "En alquiler",
  RESERVADO: "Reservada",
  VENDIDO: "Vendida",
  ALQUILADO: "Alquilada",
};

const RENTAL_STATUSES = new Set(["EN_ALQUILER", "ALQUILADO"]);

// `cocheras` es texto libre en la base ("1", "2", "Sí"...).
function parkingText(cocheras: string | null) {
  const value = cocheras?.trim();
  if (!value || value === "0") return null;
  const n = Number(value);
  if (Number.isFinite(n)) return `${n} ${n === 1 ? "cochera" : "cocheras"}`;
  return "Cochera";
}

// Pie compartido de las tarjetas (listados y marquee del hero): una fila
// con el nombre (protagonista) y operación + precio (chico, a la derecha),
// y otra con las características con íconos. El link al título se estira
// sobre todo el contenedor `relative` más cercano (la tarjeta entera).
// `hidden`: copia decorativa (marquee), fuera del Tab y de lectores.
export function PropertyMeta({
  property,
  compact = false,
  hidden = false,
}: {
  property: PropertyCardData;
  compact?: boolean;
  hidden?: boolean;
}) {
  const operation = OPERATION_LABEL[property.status] ?? "Propiedad";
  const hasPrice = typeof property.price === "number" && property.price > 0;
  const price = hasPrice
    ? `${formatPrice(property.price, property.currency)}${RENTAL_STATUSES.has(property.status) ? "/mes" : ""}`
    : "Consultar";

  const parking = parkingText(property.cocheras);
  const specs = [
    property.bedrooms ? { key: "bed", icon: BedDouble, text: `${property.bedrooms} dorm.` } : null,
    property.bathrooms ? { key: "bath", icon: Bath, text: `${property.bathrooms} ${property.bathrooms === 1 ? "baño" : "baños"}` } : null,
    property.total_area ? { key: "area", icon: Maximize, text: `${Number(property.total_area).toLocaleString("es-AR")} m²` } : null,
    parking ? { key: "parking", icon: Car, text: parking } : null,
  ].filter(Boolean) as { key: string; icon: React.ElementType; text: string }[];

  const Title = compact ? "p" : "h3";

  return (
    <>
      <div className="mt-3 flex items-center justify-between gap-4">
        <Title
          className={`min-w-0 truncate leading-snug font-semibold text-foreground ${compact ? "text-[15px]" : "text-[17px]"}`}
          title={property.title ?? undefined}
        >
          <Link
            href={`/propiedades/${property.id}`}
            tabIndex={hidden ? -1 : undefined}
            className="after:absolute after:inset-0 focus-visible:outline-none"
          >
            {property.title}
          </Link>
        </Title>
        <p className="shrink-0 text-[11px] font-medium whitespace-nowrap text-fg-secondary">
          {operation} <span className="px-0.5 text-fg-disabled" aria-hidden="true">|</span> {price}
        </p>
      </div>

      {specs.length > 0 && (
        <ul className={`flex items-center gap-x-4 overflow-hidden text-[11px] text-fg-secondary ${compact ? "mt-2" : "mt-2.5"}`}>
          {specs.map(({ key, icon: Icon, text }) => (
            <li key={key} className="inline-flex shrink-0 items-center gap-1">
              <Icon className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
              {text}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

// Tarjeta del listado público: la foto manda; abajo, el pie compartido.
// Sin caja, bordes ni nada encima de la foto. Toda la tarjeta lleva a la
// ficha (link estirado sobre el título).
export default function PropertyCard({ property }: PropertyCardProps) {
  const images = cardImages(property.property_images as OrderedImage[] | null);

  return (
    <article className="group relative flex flex-col">
      <div className="relative aspect-4/3 w-full overflow-hidden rounded-[8px] bg-sunken ring-ring ring-offset-2 ring-offset-background group-has-[a:focus-visible]:ring-2">
        <CardCarousel
          images={images}
          title={property.title || "Propiedad"}
          href={`/propiedades/${property.id}`}
          sizes="(min-width: 1280px) 30vw, (min-width: 640px) 50vw, 100vw"
        />
      </div>

      <PropertyMeta property={property} />
    </article>
  );
}
