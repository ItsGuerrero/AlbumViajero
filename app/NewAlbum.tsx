"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

/**
 * "Túnez" -> "tunez". El slug es la URL que se graba en la pegatina NFC,
 * así que se limpian tildes y todo lo que no sea a-z0-9.
 */
function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export default function NewAlbum() {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [visitedOn, setVisitedOn] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"idle" | "saving">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [host, setHost] = useState("");

  const saving = status === "saving";
  const slug = slugify(name);

  // El dominio se lee del navegador al abrir la hoja, para que la vista
  // previa de la URL valga igual en local que en producción.
  function openSheet() {
    setHost(window.location.host);
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg("Ponle un nombre al destino.");
      return;
    }
    if (!slug) {
      setErrorMsg("Ese nombre no genera una dirección válida. Usa letras o números.");
      return;
    }

    setStatus("saving");

    // El slug es la URL del imán: si ya está cogido, mejor avisar que
    // crear un segundo álbum con una dirección parecida.
    const { data: taken } = await supabase
      .from("destinations")
      .select("slug")
      .eq("slug", slug)
      .maybeSingle();

    if (taken) {
      setStatus("idle");
      setErrorMsg(`Ya hay un álbum en /${slug}. Prueba con otro nombre.`);
      return;
    }

    const { error } = await supabase.from("destinations").insert({
      slug,
      name: name.trim(),
      country: country.trim() || null,
      description: description.trim() || null,
      visited_on: visitedOn || null,
    });

    if (error) {
      setStatus("idle");
      // 42501 = la política RLS de Supabase no permite insertar.
      setErrorMsg(
        error.code === "42501"
          ? "La base de datos no permite crear álbumes todavía. Falta activar el permiso de escritura en Supabase."
          : "No se pudo crear el álbum. Inténtalo de nuevo."
      );
      return;
    }

    setStatus("idle");
    setOpen(false);
    setName("");
    setCountry("");
    setVisitedOn("");
    setDescription("");

    router.refresh();
    router.push(`/${slug}`);
  }

  return (
    <>
      <button
        type="button"
        onClick={openSheet}
        className="press fixed right-[max(1.25rem,var(--sar))] bottom-[calc(var(--sab)+1rem)] z-30 flex h-14 items-center gap-2 rounded-full bg-flare pr-6 pl-5 text-[15px] font-bold text-ink"
      >
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        Nuevo álbum
      </button>

      <div
        aria-hidden
        onClick={() => !saving && setOpen(false)}
        className={`fixed inset-0 z-40 bg-ink/55 transition-opacity duration-200 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Crear un álbum nuevo"
        inert={!open}
        className={`ease-tap scroll-lock rounded-t-sheet fixed inset-x-0 bottom-0 z-50 max-h-[88svh] overflow-y-auto bg-card transition-transform duration-[260ms] ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="gutter pt-3 pb-[calc(var(--sab)+1.25rem)]">
          <div aria-hidden className="mx-auto h-1.5 w-11 rounded-full bg-line" />

          <div className="mt-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="title-sm text-[22px]">Nuevo álbum</h2>
              <p className="mt-1 text-[13px] leading-snug text-ink-soft">
                Un destino nuevo para un imán nuevo.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={saving}
              aria-label="Cerrar"
              className="tap -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line text-[18px] text-ink-soft disabled:opacity-40"
            >
              <span aria-hidden>✕</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="font-label text-[10px] font-medium tracking-[0.18em] text-ink-mute uppercase">
                Destino
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Túnez, Roma, casa del abuelo..."
                maxLength={60}
                enterKeyHint="next"
                disabled={saving}
                required
                className="h-12 rounded-xl border border-line bg-paper px-3.5 text-ink placeholder:text-ink-mute focus:border-ultra focus:ring-2 focus:ring-ultra/25 focus:outline-none"
              />
            </label>

            {/* La URL es lo que se graba en la pegatina NFC: se ve mientras escribes. */}
            <div className="accent-tint accent-edge -mt-1 rounded-xl border border-dashed px-3.5 py-3">
              <p className="font-label text-[10px] font-medium tracking-[0.18em] text-ink-mute uppercase">
                Dirección del imán
              </p>
              <p className="font-label accent-ink mt-1.5 text-[13px] break-all">
                {host}/{slug || "…"}
              </p>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="font-label text-[10px] font-medium tracking-[0.18em] text-ink-mute uppercase">
                País (opcional)
              </span>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Túnez"
                maxLength={60}
                enterKeyHint="next"
                disabled={saving}
                className="h-12 rounded-xl border border-line bg-paper px-3.5 text-ink placeholder:text-ink-mute focus:border-ultra focus:ring-2 focus:ring-ultra/25 focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="font-label text-[10px] font-medium tracking-[0.18em] text-ink-mute uppercase">
                Cuándo fuisteis (opcional)
              </span>
              <input
                type="date"
                value={visitedOn}
                onChange={(e) => setVisitedOn(e.target.value)}
                disabled={saving}
                className="h-12 rounded-xl border border-line bg-paper px-3.5 text-ink focus:border-ultra focus:ring-2 focus:ring-ultra/25 focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="font-label text-[10px] font-medium tracking-[0.18em] text-ink-mute uppercase">
                Qué se cuenta de allí (opcional)
              </span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="El viaje que empezó con un imán en la nevera..."
                maxLength={280}
                rows={3}
                disabled={saving}
                className="min-h-[88px] resize-none rounded-xl border border-line bg-paper px-3.5 py-3 leading-snug text-ink placeholder:text-ink-mute focus:border-ultra focus:ring-2 focus:ring-ultra/25 focus:outline-none"
              />
            </label>

            {errorMsg && (
              <p
                role="alert"
                className="rounded-xl bg-flare/15 px-3.5 py-3 text-[14px] leading-snug font-medium text-flare-deep"
              >
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="press mt-1 flex h-13 items-center justify-center gap-2.5 rounded-full bg-ink text-[15px] font-bold text-paper disabled:opacity-60 [--press-c:var(--color-flare)]"
            >
              {saving && (
                <span
                  aria-hidden
                  className="block h-4 w-4 animate-spin rounded-full border-2 border-paper/30 border-t-paper"
                />
              )}
              {saving ? "Creando…" : "Crear álbum"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
