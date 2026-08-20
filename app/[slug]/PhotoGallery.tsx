"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import type { Destination, Photo } from "@/lib/supabase";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB

function formatBytes(bytes: number) {
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

export default function PhotoGallery({
  destination,
  initialPhotos,
}: {
  destination: Destination;
  initialPhotos: Photo[];
}) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [name, setName] = useState("");
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado puramente visual: hoja inferior, visor a pantalla completa,
  // vista previa del archivo elegido y aviso de confirmación.
  const [sheetOpen, setSheetOpen] = useState(false);
  const [viewer, setViewer] = useState<number | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState(false);

  const uploading = status === "uploading";
  const modalOpen = sheetOpen || viewer !== null;

  // Miniatura local de la foto elegida, sin subir nada todavía. La URL se
  // crea y se libera aquí para no dejar blobs colgando al cambiar de foto.
  const previewUrl = useRef<string | null>(null);

  function selectFile(next: File | null) {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = next ? URL.createObjectURL(next) : null;
    setFile(next);
    setPreview(previewUrl.current);
  }

  useEffect(
    () => () => {
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    },
    []
  );

  // Con una capa abierta, la página de debajo no debe desplazarse.
  useEffect(() => {
    if (!modalOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [modalOpen]);

  useEffect(() => {
    if (!justAdded) return;
    const timer = setTimeout(() => setJustAdded(false), 2600);
    return () => clearTimeout(timer);
  }, [justAdded]);

  const closeViewer = useCallback(() => setViewer(null), []);

  const step = useCallback(
    (delta: number) =>
      setViewer((position) => {
        if (position === null) return position;
        const next = position + delta;
        return next < 0 || next >= photos.length ? position : next;
      }),
    [photos.length]
  );

  useEffect(() => {
    if (!modalOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setViewer(null);
        setSheetOpen(false);
      }
      if (viewer === null) return;
      if (event.key === "ArrowLeft") step(-1);
      if (event.key === "ArrowRight") step(1);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modalOpen, viewer, step]);

  // Gestos del visor: deslizar en horizontal cambia de foto, hacia abajo cierra.
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  function handleTouchStart(event: React.TouchEvent) {
    const point = event.touches[0];
    touchStart.current = { x: point.clientX, y: point.clientY };
  }

  function handleTouchEnd(event: React.TouchEvent) {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;

    const point = event.changedTouches[0];
    const dx = point.clientX - start.x;
    const dy = point.clientY - start.y;

    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) {
      step(dx < 0 ? 1 : -1);
    } else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) {
      closeViewer();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!file) {
      setErrorMsg("Elige antes una foto.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setErrorMsg("La foto pesa demasiado (máximo 10MB).");
      return;
    }

    setStatus("uploading");

    const ext = file.name.split(".").pop() || "jpg";
    const path = `${destination.id}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("photos")
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      setStatus("error");
      setErrorMsg("No se pudo subir la foto. Inténtalo de nuevo.");
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("photos")
      .getPublicUrl(path);

    const { data: inserted, error: insertError } = await supabase
      .from("photos")
      .insert({
        destination_id: destination.id,
        image_url: publicUrlData.publicUrl,
        caption: caption.trim() || null,
        uploader_name: name.trim() || null,
      })
      .select()
      .single();

    if (insertError || !inserted) {
      setStatus("error");
      setErrorMsg("La foto se subió pero no se pudo guardar. Avisa en casa.");
      return;
    }

    setPhotos((prev) => [inserted as Photo, ...prev]);
    setStatus("idle");
    setCaption("");
    selectFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setSheetOpen(false);
    setJustAdded(true);
  }

  const current = viewer !== null ? photos[viewer] : null;

  return (
    <section className="gutter mt-8">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-label text-[10px] font-medium tracking-[0.24em] text-ink-mute uppercase">
          Fotos
        </h2>
        {photos.length > 0 && (
          <span className="font-label text-[10px] tracking-[0.12em] text-ink-mute">
            {photos.length}
          </span>
        )}
      </div>

      {photos.length === 0 ? (
        <div className="mt-3 rounded-card border border-dashed border-line bg-card px-5 py-9 text-center">
          <p className="title-sm text-[19px] text-balance">
            Aún no hay fotos de {destination.name}
          </p>
          <p className="mt-2 text-[14px] leading-snug text-ink-soft">
            Sé la primera persona en añadir una.
          </p>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="press mt-5 inline-flex touch-44 items-center rounded-full bg-ink px-5 text-[14px] font-semibold text-paper [--press-c:var(--color-flare)]"
          >
            Añadir la primera
          </button>
        </div>
      ) : (
        <ul className="mt-3 grid grid-cols-2 gap-2.5">
          {photos.map((photo, index) => (
            <li key={photo.id} className={index === 0 ? "col-span-2" : ""}>
              <button
                type="button"
                onClick={() => setViewer(index)}
                aria-label={photo.caption ?? `Ver foto de ${destination.name}`}
                className={`tap relative block w-full overflow-hidden rounded-[1rem] border border-line bg-paper ${
                  index === 0 ? "aspect-[5/4]" : "aspect-[4/5]"
                }`}
              >
                <Image
                  src={photo.image_url}
                  alt={photo.caption ?? `Foto de ${destination.name}`}
                  fill
                  sizes={index === 0 ? "100vw" : "50vw"}
                  preload={index === 0}
                  className="object-cover"
                />
                {photo.caption && (
                  <span className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/65 to-transparent px-2.5 pt-6 pb-2 text-left text-[11px] leading-tight font-medium text-white">
                    <span className="line-clamp-1">{photo.caption}</span>
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Botón flotante: siempre a tiro de pulgar, por encima del safe area. */}
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
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
        Añadir foto
      </button>

      {justAdded && (
        <div
          role="status"
          className="font-label animate-rise fixed inset-x-0 top-[calc(var(--sat)+0.75rem)] z-70 mx-auto w-max rounded-full bg-ink px-4 py-2.5 text-[11px] tracking-[0.1em] text-paper uppercase"
        >
          Foto añadida
        </div>
      )}

      {/* ------------------------------------------------------------- *
       * Hoja inferior: el formulario de subida
       * ------------------------------------------------------------- */}
      <div
        aria-hidden
        onClick={() => !uploading && setSheetOpen(false)}
        className={`fixed inset-0 z-40 bg-ink/55 transition-opacity duration-200 ${
          sheetOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Añadir una foto al álbum"
        inert={!sheetOpen}
        className={`ease-tap scroll-lock rounded-t-sheet fixed inset-x-0 bottom-0 z-50 max-h-[88svh] overflow-y-auto bg-card transition-transform duration-[260ms] ${
          sheetOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="gutter pt-3 pb-[calc(var(--sab)+1.25rem)]">
          <div aria-hidden className="mx-auto h-1.5 w-11 rounded-full bg-line" />

          <div className="mt-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="title-sm text-[22px]">Añadir una foto</h2>
              <p className="mt-1 text-[13px] leading-snug text-ink-soft">
                Cualquiera con este enlace puede sumar una foto al álbum.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              disabled={uploading}
              aria-label="Cerrar"
              className="tap -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line text-[18px] text-ink-soft disabled:opacity-40"
            >
              <span aria-hidden>✕</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
            {/* Selector de archivo: el input real cubre toda el área táctil. */}
            <div className="relative">
              <div
                className={`accent-edge rounded-card flex items-center gap-3 border-2 border-dashed bg-paper p-3 ${
                  file ? "" : "justify-center py-6"
                }`}
              >
                {file && preview ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element -- vista previa local (blob:) */}
                    <img
                      src={preview}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold">
                        {file.name}
                      </p>
                      <p className="font-label mt-0.5 text-[10px] tracking-[0.1em] text-ink-mute uppercase">
                        {formatBytes(file.size)} · Tocar para cambiar
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <svg
                      aria-hidden
                      viewBox="0 0 24 24"
                      className="accent-ink mx-auto h-7 w-7"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h2.2l1.2-2h8.2l1.2 2h2.2A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5z" />
                      <circle cx="12" cy="13" r="3.4" />
                    </svg>
                    <p className="mt-2 text-[15px] font-semibold">
                      Elegir una foto
                    </p>
                    <p className="font-label mt-1 text-[10px] tracking-[0.1em] text-ink-mute uppercase">
                      Cámara o galería · hasta 10 MB
                    </p>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => selectFile(e.target.files?.[0] ?? null)}
                disabled={uploading}
                required
                aria-label="Tu foto"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="font-label text-[10px] font-medium tracking-[0.18em] text-ink-mute uppercase">
                Tu nombre (opcional)
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Abuela, Javi, primo Marc..."
                maxLength={60}
                autoComplete="name"
                enterKeyHint="next"
                disabled={uploading}
                className="h-12 rounded-xl border border-line bg-paper px-3.5 text-ink placeholder:text-ink-mute focus:border-ultra focus:ring-2 focus:ring-ultra/25 focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="font-label text-[10px] font-medium tracking-[0.18em] text-ink-mute uppercase">
                Comentario (opcional)
              </span>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="El día que nos perdimos en la medina..."
                maxLength={140}
                enterKeyHint="done"
                disabled={uploading}
                className="h-12 rounded-xl border border-line bg-paper px-3.5 text-ink placeholder:text-ink-mute focus:border-ultra focus:ring-2 focus:ring-ultra/25 focus:outline-none"
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
              disabled={uploading}
              className="press mt-1 flex h-13 items-center justify-center gap-2.5 rounded-full bg-ink text-[15px] font-bold text-paper disabled:opacity-60 [--press-c:var(--color-flare)]"
            >
              {uploading && (
                <span
                  aria-hidden
                  className="block h-4 w-4 animate-spin rounded-full border-2 border-paper/30 border-t-paper"
                />
              )}
              {uploading ? "Subiendo…" : "Añadir al álbum"}
            </button>
          </form>
        </div>
      </div>

      {/* ------------------------------------------------------------- *
       * Visor a pantalla completa
       * ------------------------------------------------------------- */}
      {current && viewer !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Foto a pantalla completa"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="animate-fade fixed inset-0 z-60 flex h-[100dvh] flex-col bg-ink"
        >
          <div className="gutter flex items-center justify-between pt-[calc(var(--sat)+0.5rem)] pb-2">
            <span className="font-label text-[11px] tracking-[0.14em] text-paper/60">
              {viewer + 1} / {photos.length}
            </span>
            <button
              type="button"
              onClick={closeViewer}
              aria-label="Cerrar"
              className="tap flex h-11 w-11 items-center justify-center rounded-full bg-paper/15 text-[18px] text-paper"
            >
              <span aria-hidden>✕</span>
            </button>
          </div>

          <button
            type="button"
            onClick={closeViewer}
            aria-label="Cerrar"
            className="relative min-h-0 flex-1"
          >
            <Image
              key={current.id}
              src={current.image_url}
              alt={current.caption ?? `Foto de ${destination.name}`}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </button>

          <div className="gutter pt-3 pb-[calc(var(--sab)+1rem)]">
            {(current.caption || current.uploader_name) && (
              <p className="mb-3 text-center text-[14px] leading-snug text-paper/85 text-pretty">
                {current.caption}
                {current.caption && current.uploader_name ? " — " : ""}
                {current.uploader_name && (
                  <span className="font-label text-[11px] tracking-[0.1em] text-paper/55 uppercase">
                    {current.uploader_name}
                  </span>
                )}
              </p>
            )}

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => step(-1)}
                disabled={viewer === 0}
                aria-label="Foto anterior"
                className="tap flex h-14 w-14 items-center justify-center rounded-full bg-paper/15 text-[20px] text-paper disabled:opacity-25"
              >
                <span aria-hidden>←</span>
              </button>
              <span className="font-label px-2 text-[10px] tracking-[0.14em] text-paper/40 uppercase">
                Desliza
              </span>
              <button
                type="button"
                onClick={() => step(1)}
                disabled={viewer === photos.length - 1}
                aria-label="Foto siguiente"
                className="tap flex h-14 w-14 items-center justify-center rounded-full bg-paper/15 text-[20px] text-paper disabled:opacity-25"
              >
                <span aria-hidden>→</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
