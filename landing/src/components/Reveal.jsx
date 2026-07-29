import { motion } from "framer-motion";

/* Curva de easing compartida por todas las animaciones de entrada */
export const EASE = [0.22, 0.61, 0.36, 1];

/**
 * Envoltorio de scroll-reveal: la sección aparece con fade + slide-up
 * cuando entra al viewport (solo la primera vez).
 */
export function Reveal({ children, delay = 0, y = 32, className = "" }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-64px" }}
      transition={{ duration: 0.6, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/* Etiqueta "eyebrow": texto corto verde en mayúsculas sobre los títulos */
export function Eyebrow({ children, className = "" }) {
  return (
    <p className={`text-xs font-bold uppercase tracking-[0.35em] text-emerald-400 ${className}`}>
      {children}
    </p>
  );
}

/* Encabezado estándar de sección: eyebrow + título + subtítulo centrados */
export function SectionHeader({ eyebrow, title, subtitle }) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl lg:leading-[1.15]">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-5 text-base leading-relaxed text-slate-400 sm:text-lg">{subtitle}</p>
      )}
    </Reveal>
  );
}
