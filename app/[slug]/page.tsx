import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Destination, Photo } from "@/lib/supabase";
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

  return (
    <main className="flex-1 bg-ink text-paper">
      <div className="airmail-border h-2 w-full" />

      <div className="mx-auto max-w-5xl px-6 py-14 sm:py-20">
        <a
          href="/"
          className="font-label text-xs tracking-[0.2em] uppercase text-paper/50 hover:text-brass-soft transition-colors"
        >
          ← Álbum Viajero
        </a>

        <header className="mt-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 border-b border-paper/15 pb-8">
          <div>
            {destination.country && (
              <p className="font-label text-xs tracking-[0.25em] uppercase text-brass-soft">
                {destination.country}
              </p>
            )}
            <h1 className="mt-2 font-display italic text-5xl sm:text-6xl text-balance">
              {destination.name}
            </h1>
            {destination.description && (
              <p className="mt-4 max-w-xl text-paper/70 leading-relaxed">
                {destination.description}
              </p>
            )}
          </div>

          <div className="shrink-0 self-start rounded-full border-2 border-dashed border-brass-soft/60 h-24 w-24 flex flex-col items-center justify-center text-center rotate-6">
            <span className="font-label text-[9px] uppercase tracking-wide text-brass-soft">
              visitado
            </span>
            <span className="font-label text-[11px] text-paper/80 leading-tight px-1">
              {formatDate(destination.visited_on) ?? "fecha libre"}
            </span>
          </div>
        </header>

        <PhotoGallery destination={destination} initialPhotos={photos} />
      </div>
    </main>
  );
}
