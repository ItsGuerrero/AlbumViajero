// Color de identidad de cada destino. Es puramente visual: se usa como
// valor de la custom property --accent que consumen las utilidades
// accent-* de globals.css.

const RISO = [
  "var(--color-ultra)",
  "var(--color-teal)",
  "var(--color-violet)",
  "var(--color-flare-deep)",
];

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

// Los accent_color que hay hoy en la base de datos son terracotas de la
// identidad anterior, así que por defecto no se usan. Pon esto a true si
// algún día se cargan colores acordes con la paleta nueva.
const HONOR_DB_ACCENT = false;

/**
 * Reparte una tinta de la paleta de forma estable a partir del slug: el
 * mismo destino sale siempre del mismo color en el listado y en su página,
 * y el orden de la lista no lo altera.
 */
export function accentFor(destination: {
  slug: string;
  accent_color: string | null;
}): string {
  if (HONOR_DB_ACCENT) {
    const custom = destination.accent_color?.trim();
    if (custom && HEX.test(custom)) return custom;
  }

  let hash = 0;
  for (let i = 0; i < destination.slug.length; i++) {
    hash = (hash * 31 + destination.slug.charCodeAt(i)) >>> 0;
  }
  return RISO[hash % RISO.length];
}
