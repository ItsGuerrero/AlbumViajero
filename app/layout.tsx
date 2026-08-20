import type { Metadata, Viewport } from "next";
import { Azeret_Mono, Bricolage_Grotesque, Figtree } from "next/font/google";
import "./globals.css";

// Display con eje de anchura variable: los titulares van anchos (wdth 115)
// para tener carácter sin recurrir a una serif.
const display = Bricolage_Grotesque({
  variable: "--f-display",
  subsets: ["latin"],
  axes: ["opsz", "wdth"],
  display: "swap",
});

// Texto: geométrica cálida, muy legible a 14-16px en pantallas pequeñas.
const body = Figtree({
  variable: "--f-body",
  subsets: ["latin"],
  display: "swap",
});

// Micro-etiquetas tipo sello (país, fecha, NFC). Solo dos pesos estáticos
// para no cargar otra fuente variable en móvil.
const label = Azeret_Mono({
  variable: "--f-label",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Álbum Viajero",
  description: "Cada imán de la nevera es la puerta a un álbum de viaje.",
  // Si alguien lo añade a la pantalla de inicio, que se comporte como app.
  appleWebApp: {
    capable: true,
    title: "Álbum Viajero",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Imprescindible para que env(safe-area-inset-*) devuelva valores reales.
  viewportFit: "cover",
  // Al abrirse el teclado, el viewport se encoge en vez de taparlo: así la
  // hoja inferior de subida no queda por detrás del teclado en Android.
  interactiveWidget: "resizes-content",
  themeColor: "#f5f6f8",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${display.variable} ${body.variable} ${label.variable}`}
    >
      <body className="flex min-h-[100svh] flex-col bg-paper font-sans text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
