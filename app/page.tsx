import type { CSSProperties } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Destination } from "@/lib/supabase";
import { accentFor } from "./accent";
import NewAlbum from "./NewAlbum";

export const revalidate = 0;

async function getDestinations(): Promise<Destination[]> {
  const { data, error } = await supabase
    .from("destinations")
    .select("*")
    .order("visited_on", { ascending: true, nullsFirst: false });

  if (error) {
    console.error(error);
    return [];
  }
  return data ?? [];
}

function formatDate(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("es-ES", {
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default async function Home() {
  const destinations = await getDestinations();

  return (
    <main className="flex-1 pb-[calc(var(--sab)+7rem)]">
      {/* Bloque de tinta plana: lo primero que se ve al abrir. */}
      <header className="halftone gutter rounded-b-[2rem] bg-ultra pt-[calc(var(--sat)+2.25rem)] pb-8 text-paper">
        <p className="font-label text-[10px] font-medium tracking-[0.24em] uppercase text-paper/70">
          Colección familiar
        </p>

        <h1 className="title mt-3 text-[clamp(2.75rem,14vw,3.75rem)] text-balance">
          Álbum
          <br />
          Viajero
        </h1>

        <p className="mt-4 max-w-[32ch] text-[15px] leading-[1.5] text-paper/80">
          Acerca el móvil a un imán de la nevera y se abre su álbum: las
          fotos, quién estuvo y qué se cuenta de allí.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="font-label rounded-full bg-paper/15 px-3 py-1.5 text-[10px] tracking-[0.14em] uppercase">
            {destinations.length}{" "}
            {destinations.length === 1 ? "destino" : "destinos"}
          </span>
          <span className="font-label flex items-center gap-1.5 rounded-full bg-zest px-3 py-1.5 text-[10px] tracking-[0.14em] text-ink uppercase">
            <span
              aria-hidden
              className="block h-1.5 w-1.5 rounded-full bg-ink"
            />
            NFC
          </span>
        </div>
      </header>

      <section className="gutter mt-7">
        <h2 className="font-label text-[10px] font-medium tracking-[0.24em] text-ink-mute uppercase">
          Los imanes
        </h2>

        {destinations.length === 0 ? (
          <div className="mt-3 rounded-card border border-dashed border-line bg-card px-5 py-8 text-center">
            <p className="title-sm text-[19px]">Todavía no hay destinos</p>
            <p className="mt-2 text-[14px] leading-snug text-ink-soft">
              Toca «Nuevo álbum» y crea el primero: tendrás su dirección
              lista para grabar en una pegatina NFC.
            </p>
          </div>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {destinations.map((d) => {
              const accent = accentFor(d);
              const date = formatDate(d.visited_on);

              return (
                <li key={d.id}>
                  <Link
                    href={`/${d.slug}`}
                    style={{ "--accent": accent } as CSSProperties}
                    className="tap relative flex overflow-hidden rounded-card border border-line bg-card"
                  >
                    {/* Portada o inicial del destino. */}
                    <div className="accent-tint relative w-[100px] shrink-0">
                      {d.cover_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element -- la portada puede vivir en cualquier dominio
                        <img
                          src={d.cover_image_url}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : (
                        <span
                          aria-hidden
                          className="title accent-ink absolute inset-0 flex items-center justify-center text-[2.5rem] opacity-70"
                        >
                          {d.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Troquelado de billete entre la portada y los datos. */}
                    <span aria-hidden className="relative w-0 shrink-0">
                      <span className="absolute inset-y-0 left-0 border-l border-dashed border-line" />
                      <span className="absolute -top-2 -left-2 h-4 w-4 rounded-full bg-paper" />
                      <span className="absolute -bottom-2 -left-2 h-4 w-4 rounded-full bg-paper" />
                    </span>

                    <div className="min-w-0 flex-1 py-3.5 pr-4 pl-4">
                      <p className="font-label accent-ink truncate text-[10px] font-medium tracking-[0.18em] uppercase">
                        {d.country ?? "Destino"}
                      </p>

                      <h3 className="title-sm mt-1 text-[21px] text-pretty">
                        {d.name}
                      </h3>

                      {d.description && (
                        <p className="mt-1.5 line-clamp-2 text-[13px] leading-[1.35] text-ink-soft">
                          {d.description}
                        </p>
                      )}

                      <div className="mt-2 flex items-end justify-between gap-2">
                        <p className="font-label text-[10px] tracking-[0.1em] text-ink-mute">
                          {date ?? "—"}
                        </p>
                        <span
                          aria-hidden
                          className="accent-ink text-[15px] leading-none"
                        >
                          →
                        </span>
                      </div>
                    </div>

                    {/* Pestaña de color: identidad del destino. */}
                    <span aria-hidden className="accent-solid w-1.5 shrink-0" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        <footer className="mt-10 border-t border-line pt-5">
          <p className="font-label text-[10px] tracking-[0.18em] text-ink-mute uppercase">
            Hecho a mano, imán a imán
          </p>
        </footer>
      </section>

      <NewAlbum />
    </main>
  );
}
