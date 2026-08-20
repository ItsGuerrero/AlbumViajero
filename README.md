# Álbum Viajero NFC

Web para el proyecto de imanes NFC: cada destino tiene su propia página
(`/tunez`, `/roma`, ...) con galería de fotos y un formulario para que
cualquiera con el enlace añada las suyas, sin necesidad de cuenta.

## Estado actual

- **Backend (Supabase): ya está creado y funcionando**, proyecto
  `album-viajero-nfc` (ref `aqghbbyydwhfihshtiyf`), con las tablas
  `destinations` y `photos`, el bucket de almacenamiento `photos` (público,
  con subida abierta) y un destino de ejemplo ya cargado: **Túnez**
  (`slug = tunez`).
- **Frontend (esta carpeta): ya está construido** en Next.js y compila sin
  errores (`npx tsc --noEmit` limpio). Lo único que falta es publicarlo en
  un hosting, porque el equipo de Vercel conectado a esta sesión no dejó
  hacer el despliegue por permisos.

## Ejecutar en local

```bash
npm install
npm run dev
```

Abre `http://localhost:3000` para el álbum maestro, y
`http://localhost:3000/tunez` para el álbum de ejemplo.

No hace falta configurar nada: la URL y la clave pública de Supabase ya
están puestas por defecto en `lib/supabase.ts` (son seguras de exponer,
el control de acceso real lo hacen las políticas de la base de datos). Si
prefieres pasarlas por variables de entorno, crea un `.env.local` con:

```
NEXT_PUBLIC_SUPABASE_URL=https://aqghbbyydwhfihshtiyf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<la clave anon del proyecto>
```

## Desplegar en Vercel (tú mismo, en dos minutos)

1. Sube esta carpeta a un repositorio de GitHub (o usa `npx vercel` desde
   aquí mismo con tu propia cuenta).
2. En [vercel.com](https://vercel.com), *Add New → Project*, importa el
   repositorio. Vercel detecta Next.js automáticamente, no hace falta
   tocar nada más.
3. Deploy. En un par de minutos tienes tu URL pública
   (`tu-proyecto.vercel.app`).
4. Importante: en **Settings → Deployment Protection**, asegúrate de que
   "Vercel Authentication" esté **desactivado** para producción — si no,
   la web pedirá iniciar sesión en Vercel para verla, y tu familia no
   podrá abrir el álbum al tocar el imán.

## Añadir un nuevo destino (por ejemplo, "Roma")

Desde el panel de Supabase (Table Editor → `destinations`) o por SQL:

```sql
insert into destinations (slug, name, country, description, visited_on)
values ('roma', 'Roma', 'Italia', 'El viaje de la boda de Marta.', '2025-05-10');
```

El álbum aparecerá automáticamente en `tudominio.com/roma` y en la portada
del álbum maestro (`/`). Ese es el enlace (a través de tu propio dominio,
o del dominio `.vercel.app`) que grabarás en el NTAG213 de ese imán con
NFC Tools.

## Estructura

- `app/page.tsx` — álbum maestro (lista de destinos).
- `app/[slug]/page.tsx` — página de un destino (busca el registro en
  `destinations` por `slug`).
- `app/[slug]/PhotoGallery.tsx` — galería + formulario de subida (sube el
  archivo al bucket `photos` y crea la fila en la tabla `photos`).
- `lib/supabase.ts` — cliente de Supabase y tipos.
