import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Dumbbell, Menu, X } from "lucide-react";

/* Enlaces del menú principal (hacen smooth scroll a cada sección) */
const NAV_LINKS = [
  { label: "Funciones", href: "#funciones" },
  { label: "Planes", href: "#planes" },
  { label: "Contacto", href: "#contacto" },
];

/* Botón "Admin" estilo glassmorphism, reutilizado en desktop y móvil */
const adminButtonClasses =
  "inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300/60 hover:bg-white/10 hover:shadow-[0_0_28px_rgba(16,185,129,0.35)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  /* El header se vuelve sólido (blur + borde + sombra) al hacer scroll */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-white/10 bg-navy-950/80 shadow-lg shadow-black/30 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <a
          href="#inicio"
          className="group flex items-center gap-3 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.45)] transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105">
            <Dumbbell aria-hidden="true" className="h-6 w-6 text-white" strokeWidth={2.4} />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-lg font-extrabold tracking-tight text-white">Gym Assist</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-300/90">
              Management Suite
            </span>
          </span>
        </a>

        {/* Navegación desktop con subrayado animado */}
        <nav className="hidden items-center gap-8 md:flex" aria-label="Principal">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="relative rounded text-sm font-medium text-slate-300 transition-colors duration-300 after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-gradient-to-r after:from-emerald-600 after:to-emerald-400 after:transition-all after:duration-300 hover:text-white hover:after:w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {/* Botón Admin: sale de la landing y entra al dashboard, que Nginx
              sirve como una app aparte bajo /app/ (ver nginx.conf en la raíz). */}
          <a href="/app/" className={`hidden md:inline-flex ${adminButtonClasses}`}>
            Admin
          </a>

          {/* Toggle del menú móvil */}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/5 text-white backdrop-blur-md transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 md:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Menú móvil desplegable */}
      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden border-t border-white/10 bg-navy-950/95 backdrop-blur-xl md:hidden"
            aria-label="Menú móvil"
          >
            <div className="space-y-1 px-4 py-4">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-2">
                <a href="/app/" className={`w-full ${adminButtonClasses}`}>
                  Admin
                </a>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
