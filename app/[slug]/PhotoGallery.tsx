"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import type { Destination, Photo } from "@/lib/supabase";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB

function rotationFor(index: number) {
  const pattern = [-3, 2, -1, 3, -2, 1];
  return pattern[index % pattern.length];
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
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <section className="mt-14">
      {photos.length === 0 ? (
        <p className="font-body text-paper/60 italic">
          Todavía no hay fotos de {destination.name}. Sé la primera persona
          en añadir una.
        </p>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
          {photos.map((photo, index) => (
            <li
              key={photo.id}
              className="bg-paper p-3 pb-5 shadow-[4px_4px_0_0_rgba(0,0,0,0.3)] transition-transform hover:rotate-0 hover:scale-[1.03]"
              style={{ transform: `rotate(${rotationFor(index)}deg)` }}
            >
              <div className="relative aspect-square w-full overflow-hidden bg-ink-soft">
                <Image
                  src={photo.image_url}
                  alt={photo.caption ?? `Foto de ${destination.name}`}
                  fill
                  sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 45vw"
                  className="object-cover"
                />
              </div>
              {(photo.caption || photo.uploader_name) && (
                <p className="mt-2 font-label text-[11px] text-ink/70 leading-snug">
                  {photo.caption}
                  {photo.caption && photo.uploader_name ? " — " : ""}
                  {photo.uploader_name}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={handleSubmit}
        className="mt-16 max-w-md rounded-sm border border-brass-soft/40 bg-ink-soft/60 p-6"
      >
        <p className="font-label text-xs tracking-[0.2em] uppercase text-brass-soft">
          Añadir una foto
        </p>
        <p className="mt-1 text-sm text-paper/60">
          Cualquiera con este enlace puede sumar una foto al álbum.
        </p>

        <div className="mt-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="font-label text-[11px] uppercase tracking-wide text-paper/50">
              Tu foto
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-sm text-paper/80 file:mr-3 file:rounded-full file:border-0 file:bg-brass file:px-4 file:py-1.5 file:text-ink file:font-medium file:text-sm hover:file:bg-brass-soft file:cursor-pointer cursor-pointer"
              required
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-label text-[11px] uppercase tracking-wide text-paper/50">
              Tu nombre (opcional)
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Abuela, Javi, primo Marc..."
              className="rounded-sm bg-paper text-ink px-3 py-2 text-sm placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-brass"
              maxLength={60}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-label text-[11px] uppercase tracking-wide text-paper/50">
              Comentario (opcional)
            </span>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="El día que nos perdimos en la medina..."
              className="rounded-sm bg-paper text-ink px-3 py-2 text-sm placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-brass"
              maxLength={140}
            />
          </label>

          {errorMsg && (
            <p className="text-sm text-stamp-red font-medium">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={status === "uploading"}
            className="mt-1 self-start rounded-full bg-brass px-6 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-brass-soft disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {status === "uploading" ? "Subiendo..." : "Añadir al álbum"}
          </button>
        </div>
      </form>
    </section>
  );
}
