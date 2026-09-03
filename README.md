# 📖 Álbum Viajero NFC

Web del proyecto de imanes NFC: cada imán del frigorífico esconde un destino de viaje. Al tocarlo con el móvil, se abre la página de ese destino con su galería de fotos y un formulario para que cualquiera con el enlace sume las suyas — sin necesidad de crear cuenta.

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

**🔗 Demo en vivo:** [albumviajero.vercel.app](https://albumviajero.vercel.app)

## ✨ Funcionalidades

- 📍 Una página por destino (`/tunez`, `/roma`, ...): galería de fotos con visor a pantalla completa y gestos de deslizar.
- 📸 Subir fotos sin cuenta: cualquiera con el enlace añade una foto, con su nombre y un comentario opcional, directamente desde el móvil.
- ➕ Crear álbumes nuevos desde la propia web: un botón en la portada da de alta un destino nuevo (genera su URL automáticamente) sin tocar Supabase a mano.
- 🧲 Pensado para NFC: la URL de cada destino es la que se graba en el imán físico (NTAG213) con NFC Tools.
- 📱 Diseño mobile-first: pensado para abrirse con el móvil nada más tocar el imán.

## ⚙️ Cómo funciona

- Alguien acerca el móvil a un imán NFC y el teléfono abre `tudominio.com/<destino>`.
- La página del destino consulta Supabase (`destinations`) por su `slug` y muestra sus fotos (`photos`).
- Al añadir una foto, el archivo sube al bucket de Supabase Storage y se crea su fila en la tabla `photos`; la galería se actualiza al momento.
- Desde la portada (`/`) se puede dar de alta un destino nuevo en cualquier momento; su página se genera sola en cuanto existe en la base de datos.

## 🧱 Stack tecnológico

| Parte | Tecnología |
|---|---|
| Frontend | Next.js (App Router) + React + TypeScript |
| Backend | Supabase (Postgres + Storage) |
| Hosting | Vercel |

## 📁 Estructura del proyecto

```
app/
├─ page.tsx              # Álbum maestro: lista de destinos
├─ NewAlbum.tsx           # Formulario para crear un destino nuevo
└─ [slug]/
   ├─ page.tsx            # Página de un destino (busca el registro por slug)
   └─ PhotoGallery.tsx    # Galería + formulario de subida de fotos
lib/
└─ supabase.ts            # Cliente de Supabase y tipos (Destination, Photo)
```

## 🚀 Puesta en marcha en local

```bash
npm install
npm run dev
```

Abre `http://localhost:3000` para el álbum maestro, y `http://localhost:3000/tunez` para el álbum de ejemplo.

No hace falta configurar nada: la URL y la clave pública ("anon") de Supabase ya están puestas por defecto en `lib/supabase.ts` — son seguras de exponer, el control de acceso real lo hacen las políticas de la base de datos (RLS). Si prefieres pasarlas por variables de entorno, crea un `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://aqghbbyydwhfihshtiyf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<la clave anon del proyecto>
```

## ☁️ Despliegue

Ya está publicado en Vercel: **[albumviajero.vercel.app](https://albumviajero.vercel.app)**. Si necesitas volver a desplegarlo (por ejemplo, en otra cuenta):

- Sube esta carpeta a un repositorio de GitHub (o usa `npx vercel` desde aquí mismo con tu propia cuenta).
- En [vercel.com](https://vercel.com), Add New → Project, e importa el repositorio. Vercel detecta Next.js automáticamente.
- Deploy. En un par de minutos tienes tu URL pública (`tu-proyecto.vercel.app`).
- ⚠️ En Settings → Deployment Protection, asegúrate de que "Vercel Authentication" esté desactivado para producción — si no, la web pedirá iniciar sesión en Vercel para verla, y no podrás abrir el álbum simplemente al tocar el imán.

## ➕ Añadir un destino manualmente (alternativa a la web)

Desde el panel de Supabase (Table Editor → `destinations`) o por SQL:

```sql
insert into destinations (slug, name, country, description, visited_on)
values ('roma', 'Roma', 'Italia', 'El viaje de la boda de Marta.', '2025-05-10');
```

El álbum aparece automáticamente en `tudominio.com/roma` y en la portada del álbum maestro (`/`).

## 📌 Estado actual

- ✅ Backend en Supabase funcionando (proyecto `album-viajero-nfc`).
- ✅ Frontend desplegado y en producción en [albumviajero.vercel.app](https://albumviajero.vercel.app).
- ⏳ Pendiente: dar de alta los destinos reales y grabar sus URLs en los imanes NFC.
