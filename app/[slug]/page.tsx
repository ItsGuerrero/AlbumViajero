import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Destination, Photo } from "@/lib/supabase";
import { accentFor } from "../accent";
import PhotoGallery from "./PhotoGallery";

export const revalidate = 0;

async function getDestination(slug: string): Promise<Destination | null> {
  const { data } = await supabase
    .from("destinations")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return data;
}

async function getPhotos(destinationId: string): Promise<Photo[]> {
  const { data, error } = await supabase
    .from("photos")
    .select("*")
    .eq("destination_id", destinationId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error(error);
    return [];
  }
  return data ?? [];
}

function formatDate(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export default async function DestinationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const destination = await getDestination(slug);

  if (!destination) {
    notFound();
  }

  const photos = await getPhotos(destination.id);
  const accent = accentFor(destination);
  const visited = formatDate(destination.visited_on);

  return (
    <main
      style={{ "--accent": accent } as CSSProperties}
      // Espacio inferior para que el botón flotante nunca tape contenido.
      className="flex-1 pb-[calc(var(--sab)+7rem)]"
    >
      {/* Héroe: ocupa poco más de media pantalla en cualquier móvil. */}
      <header className="accent-block relative h-[clamp(290px,52svh,430px)] overflow-hidden">
        {destination.cover_image_url && (
          // eslint-disable-next-line @next/next/no-img-element -- la portada puede vivir en cualquier dominio
          <img
            src={destination.cover_image_url}
            alt=""
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

        <div aria-hidden className="accent-scrim absolute inset-0" />

        {/* Volver al álbum: llegando por NFC no hay historial de navegación. */}
        <Link
          href="/"
          aria-label="Volver al álbum"
          className="tap font-label absolute top-[calc(var(--sat)+0.75rem)] left-[max(1.25rem,var(--sal))] flex touch-44 items-center gap-1.5 rounded-full bg-paper/95 px-3.5 text-[10px] tracking-[0.16em] text-ink uppercase"
        >
          <span aria-hidden className="text-[14px] leading-none">
            ←
          </span>
          Álbum
        </Link>

        <div className="gutter absolute inset-x-0 bottom-0 pb-6">
          {destination.country && (
            <p className="font-label text-[10px] font-medium tracking-[0.24em] text-paper/85 uppercase">
              {destination.country}
            </p>
          )}

          <h1 className="title mt-2 text-[clamp(2.4rem,12.5vw,3.4rem)] text-balance text-paper">
            {destination.name}
          </h1>

          {visited && (
            <p className="font-label mt-3 inline-block -rotate-2 rounded-full border border-dashed border-paper/60 px-3 py-1.5 text-[10px] tracking-[0.12em] text-paper/90 uppercase">
              Visitado · {visited}
            </p>
          )}
        </div>
      </header>

      {destination.description && (
        <section className="gutter pt-5">
          <p className="text-[15px] leading-[1.55] text-ink-soft text-pretty">
            {destination.description}
          </p>
        </section>
      )}

      <PhotoGallery destination={destination} initialPhotos={photos} />

      <footer className="gutter mt-10 border-t border-line pt-5">
        <Link
          href="/"
          className="tap font-label flex touch-44 items-center gap-2 text-[10px] tracking-[0.18em] text-ink-mute uppercase"
        >
          <span aria-hidden>←</span>
          Ver todos los destinos
        </Link>
      </footer>
    </main>
  );
}
