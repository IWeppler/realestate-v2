import Link from "next/link";
import { createClientServer } from "@/lib/supabase";
import { SearchPanel } from "@/features/public/v2/SearchPanel";
import { SplitHeading } from "@/features/public/v2/motion";
import { CardImage } from "@/features/properties/CardImage";
import { PropertyMeta } from "@/features/properties/PropertyCard";
import { getUniqueLocations } from "@/shared/utils/getLocations";
import type { PropertyCardData } from "@/app/types/entities";

type OrderedImage = { image_url: string | null; order?: number | null };

// Portada según el orden que definió la inmobiliaria. (Copia local de
// `cardImages`: aquel vive en un módulo que usa componentes de cliente.)
function coverImage(images: PropertyCardData["property_images"]) {
  return (
    [...((images ?? []) as OrderedImage[])]
      .sort(
        (a, b) =>
          (a.order ?? Number.MAX_SAFE_INTEGER) -
          (b.order ?? Number.MAX_SAFE_INTEGER),
      )
      .map((img) => img.image_url)
      .find((url): url is string => Boolean(url)) ?? null
  );
}

async function countByStatus(status: "EN_VENTA" | "EN_ALQUILER") {
  const supabase = await createClientServer();
  const { count, error } = await supabase
    .from("properties")
    .select("id", { count: "exact", head: true })
    .eq("status", status);
  if (error)
    console.error(`Error al contar propiedades ${status}:`, error.message);
  return count ?? 0;
}

// Una propiedad del marquee: foto y el mismo pie que las tarjetas del
// listado (nombre + operación y precio; características con íconos). El
// alto lo da la pista (que ocupa lo que sobra del hero); el ancho sale del
// alto por la proporción 4:3.
function MarqueeItem({
  property,
  hidden,
}: {
  property: PropertyCardData;
  hidden?: boolean;
}) {
  const cover = coverImage(property.property_images);
  if (!cover) return null;

  return (
    <li
      className={`group relative flex h-full flex-none flex-col ${hidden ? "motion-reduce:hidden" : ""}`}
      aria-hidden={hidden || undefined}
    >
      <div className="relative aspect-[4/3] h-[calc(100%-3.5rem)] overflow-hidden rounded-2xl bg-sunken ring-ring ring-offset-2 ring-offset-background group-has-[a:focus-visible]:ring-2">
        <CardImage
          src={cover}
          alt={hidden ? "" : property.title || "Propiedad"}
          sizes="(min-width: 1024px) 34vw, 70vw"
        />
      </div>
      {/* El pie no suma ancho: siempre mide lo mismo que la foto. */}
      <div className="w-0 min-w-full">
        <PropertyMeta property={property} compact hidden={hidden} />
      </div>
    </li>
  );
}

// Hero a pantalla completa (100dvh menos el header), siempre entero: arriba
// titular, bajada y buscador; abajo un marquee de destacadas que ocupa todo
// el alto que sobra. Tipografía y espacios escalan con el alto de la
// pantalla (dvh), así entra también en notebooks bajas; con poco alto se
// ocultan bajada y conteos para que las fotos no se achiquen. Copy sin
// ubicación: el sitio es white-label.
export async function HeroV2({ featured }: { featured: PropertyCardData[] }) {
  const [locations, saleCount, rentCount] = await Promise.all([
    getUniqueLocations(),
    countByStatus("EN_VENTA"),
    countByStatus("EN_ALQUILER"),
  ]);

  // Con pocas propiedades se repite la lista para que la pista siempre
  // sea más ancha que la pantalla.
  const base =
    featured.length > 0 && featured.length < 6
      ? [...featured, ...featured]
      : featured;
  const duration = `${Math.max(base.length, 4) * 7}s`;

  return (
    <section className="flex h-[calc(100dvh-5rem)] w-full flex-col bg-background">
      <div className="mx-auto flex w-full max-w-7xl shrink-0 flex-col items-center px-6 pt-[clamp(1.5rem,6dvh,4.5rem)] text-center md:px-8">
        <SplitHeading
          as="h1"
          trigger="mount"
          delay={0.15}
          text="El lugar que buscás, sin vueltas."
          className="max-w-[18ch] font-display text-[clamp(2.75rem,min(10vw,9dvh),5.75rem)] leading-[1.02] font-normal tracking-[-0.03em] text-balance text-foreground lg:max-w-none"
        />

        <p className="site-rise mt-[clamp(0.75rem,2.5dvh,1.5rem)] hidden max-w-[52ch] sm:block [@media(max-height:620px)]:hidden text-[clamp(1rem,2.2dvh,1.25rem)] leading-[1.5] text-fg-secondary [--rise-delay:500ms]">
          Casas, departamentos y terrenos en venta y alquiler, <br /> con
          asesoramiento de principio a fin.
        </p>

        <div className="site-rise relative z-20 mt-[clamp(1.25rem,4dvh,2.5rem)] w-full max-w-2xl text-left [--rise-delay:620ms]">
          <SearchPanel locations={locations} />
          {saleCount + rentCount > 0 && (
            <p className="mt-3 flex flex-wrap justify-center gap-x-6 gap-y-1 text-sm text-muted-foreground tabular-nums [@media(max-height:760px)]:hidden">
              {saleCount > 0 && (
                <Link
                  href="/propiedades?tipo=venta"
                  className="underline-offset-4 hover:text-foreground hover:underline"
                >
                  <span className="font-semibold text-foreground">
                    {saleCount}
                  </span>{" "}
                  propiedades en venta
                </Link>
              )}
              {rentCount > 0 && (
                <Link
                  href="/propiedades?tipo=alquiler"
                  className="underline-offset-4 hover:text-foreground hover:underline"
                >
                  <span className="font-semibold text-foreground">
                    {rentCount}
                  </span>{" "}
                  en alquiler
                </Link>
              )}
            </p>
          )}
        </div>
      </div>

      {base.length > 0 && (
        <div
          aria-label="Propiedades destacadas"
          role="region"
          className="site-rise site-marquee-wrap relative mt-[clamp(1.5rem,5dvh,3.5rem)] min-h-0 flex-1 pb-[clamp(1.25rem,4dvh,2.5rem)] [--rise-delay:780ms] motion-reduce:overflow-x-auto"
        >
          {/* Bordes que se desvanecen: la fila entra y sale de la pantalla sin corte. */}
          <div className="h-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)] motion-reduce:overflow-visible motion-reduce:[mask-image:none]">
            <ul
              className="site-marquee flex h-full w-max gap-5 pl-5 motion-reduce:px-6 md:gap-6 md:pl-6"
              style={{ "--marquee-duration": duration } as React.CSSProperties}
            >
              {base.map((p, i) => (
                <MarqueeItem key={`a-${p.id}-${i}`} property={p} />
              ))}
              {/* Segunda copia para el loop continuo; fuera de lectores y del Tab. */}
              {base.map((p, i) => (
                <MarqueeItem key={`b-${p.id}-${i}`} property={p} hidden />
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
