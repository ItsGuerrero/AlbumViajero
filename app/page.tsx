import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Destination } from "@/lib/supabase";

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
    <main className="flex-1 bg-ink text-paper px-6 py-16 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <header className="mb-16 max-w-2xl">
          <p className="font-label text-xs tracking-[0.25em] uppercase text-brass-soft">
            Colección familiar · imanes con memoria
          </p>
          <h1 className="mt-4 font-display text-5xl sm:text-6xl italic text-paper text-balance">
            Álbum Viajero
          </h1>
          <p className="mt-5 text-lg text-paper/70 leading-relaxed">
            Cada imán de la nevera esconde una pegatina NFC. Acércale el
            móvil y se abre el álbum de ese viaje: sus fotos, quién estuvo
            y qué se cuenta de allí.
          </p>
        </header>

        {destinations.length === 0 ? (
          <p className="text-paper/60 font-body">
            Todavía no hay destinos dados de alta.
          </p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {destinations.map((d) => (
              <li key={d.id}>
                <Link
                  href={`/${d.slug}`}
                  className="group block rounded-sm bg-paper text-ink p-6 shadow-[6px_6px_0_0_rgba(0,0,0,0.25)] transition-transform hover:-translate-y-1 hover:shadow-[8px_8px_0_0_rgba(0,0,0,0.3)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-label text-[11px] tracking-[0.2em] uppercase text-ink/50">
                        {d.country ?? "Destino"}
                      </p>
                      <h2 className="mt-1 font-display text-3xl leading-tight text-balance">
                        {d.name}
                      </h2>
                    </div>
                    <span className="shrink-0 rounded-full border border-ink/20 h-9 w-9 flex items-center justify-center font-label text-[10px] text-ink/60 group-hover:border-stamp-red group-hover:text-stamp-red transition-colors">
                      NFC
                    </span>
                  </div>
                  {d.visited_on && (
                    <p className="mt-4 font-label text-xs text-ink/50">
                      {formatDate(d.visited_on)}
                    </p>
                  )}
                  {d.description && (
                    <p className="mt-2 text-sm text-ink/70 line-clamp-2">
                      {d.description}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}

        <footer className="mt-24 border-t border-paper/10 pt-6 text-xs text-paper/40 font-label">
          hecho a mano, imán a imán
        </footer>
      </div>
    </main>
  );
}
