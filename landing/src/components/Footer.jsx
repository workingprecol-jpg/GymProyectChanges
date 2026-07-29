import { Dumbbell } from "lucide-react";

/* Enlaces de sección (smooth scroll dentro de la landing) */
const FOOTER_LINKS = [
  { label: "Funciones", href: "#funciones" },
  { label: "Planes", href: "#planes" },
  { label: "Contacto", href: "#contacto" },
];

/* Páginas legales: HTML estático en public/, servido sin extensión por Nginx
   (ver el bloque try_files $uri.html en nginx.conf en la raíz del repo). */
const LEGAL_LINKS = [
  { label: "Privacidad", href: "/privacidad" },
  { label: "Términos", href: "/terminos" },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
          {/* Logo reducido */}
          <a
            href="#inicio"
            className="group flex items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.35)] transition-transform duration-300 group-hover:-rotate-6">
              <Dumbbell aria-hidden="true" className="h-4 w-4 text-white" strokeWidth={2.4} />
            </span>
            <span className="text-sm font-extrabold tracking-tight text-white">
              Gym Assist <span className="font-medium text-slate-500">· Management Suite</span>
            </span>
          </a>

          {/* Enlaces rápidos */}
          <nav
            aria-label="Enlaces del pie de página"
            className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2"
          >
            {FOOTER_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded text-sm text-slate-400 transition-colors hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                {link.label}
              </a>
            ))}
            <a
              href="/app/"
              className="rounded text-sm text-slate-400 transition-colors hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              Admin
            </a>
          </nav>
        </div>

        {/* Barra inferior: copyright + enlaces legales */}
        <div className="mt-8 flex flex-col items-center gap-4 border-t border-white/10 pt-6 sm:flex-row sm:justify-between">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Gym Assist. Todos los derechos reservados.
          </p>

          <nav
            aria-label="Enlaces legales"
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
          >
            {LEGAL_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded text-xs text-slate-500 transition-colors hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
