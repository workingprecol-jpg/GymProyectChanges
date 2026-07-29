import { motion } from "framer-motion";
import { ArrowRight, Package, Users, Wallet } from "lucide-react";
import { EASE, Eyebrow } from "./Reveal";

/* Entrada escalonada del contenido del hero al cargar la página */
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};

const item = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE } },
};

/* Alturas (%) de las barras del gráfico del mockup y sus etiquetas */
const BARS = [42, 68, 55, 82, 64, 95, 74];
const DAYS = ["L", "M", "X", "J", "V", "S", "D"];

const PANEL_STATS = [
  { label: "Check-ins hoy", value: "128" },
  { label: "Clases hoy", value: "9" },
  { label: "Ocupación", value: "74%" },
];

/* Tarjeta flotante de estadística sobre el mockup del dashboard */
function StatCard({ icon: Icon, label, value, trend, className = "", delay = "0s" }) {
  return (
    <div
      style={{ animationDelay: delay }}
      className={`pointer-events-none absolute z-10 flex animate-float items-center gap-3 rounded-2xl bg-white p-3.5 shadow-2xl shadow-emerald-500/25 sm:p-4 ${className}`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-400 text-white shadow-lg shadow-emerald-500/30">
        <Icon aria-hidden="true" className="h-5 w-5" />
      </span>
      <span className="leading-tight">
        <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">
          {label}
        </span>
        <span className="block text-base font-extrabold text-slate-900 sm:text-lg">{value}</span>
        {trend && <span className="block text-[11px] font-bold text-emerald-600">{trend}</span>}
      </span>
    </div>
  );
}

export default function Hero() {
  return (
    <section id="inicio" className="relative overflow-hidden pb-24 pt-32 sm:pt-40 lg:pb-28">
      {/* Orbes verdes desenfocados flotando lentamente en el fondo */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-40 -top-40 h-[28rem] w-[28rem] animate-orb rounded-full bg-emerald-500/15 blur-3xl" />
        <div
          className="absolute -right-32 top-24 h-[24rem] w-[24rem] animate-orb rounded-full bg-emerald-600/15 blur-3xl"
          style={{ animationDelay: "-8s" }}
        />
        <div
          className="absolute -bottom-32 left-1/3 h-[20rem] w-[20rem] animate-orb rounded-full bg-emerald-400/10 blur-3xl"
          style={{ animationDelay: "-14s" }}
        />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-16 px-4 sm:px-6 lg:grid-cols-2 lg:gap-10 lg:px-8">
        {/* Columna de texto */}
        <motion.div variants={container} initial="hidden" animate="show" className="max-w-2xl">
          <motion.div variants={item}>
            <Eyebrow>Un solo lugar</Eyebrow>
          </motion.div>

          <motion.h1
            variants={item}
            className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl"
          >
            Tu gimnasio, organizado y siempre bajo control.
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-6 text-base leading-relaxed text-slate-400 sm:text-lg"
          >
            Gym Assist es un sistema de gestión integral para gimnasios: lleva las finanzas, controla
            el inventario y administra la información de los miembros que asisten a tu gym —
            registros, accesos, clases y operaciones — con permisos adecuados para cada equipo.
          </motion.p>

          <motion.div variants={item} className="mt-9 flex flex-wrap items-center gap-4">
            <a
              href="#contacto"
              className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-400 px-7 py-3.5 text-sm font-bold text-white shadow-[0_0_30px_rgba(16,185,129,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_45px_rgba(16,185,129,0.55)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            >
              Comenzar ahora
              <ArrowRight
                aria-hidden="true"
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
              />
            </a>
            <a
              href="#planes"
              className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-white/30 hover:bg-white/10 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              Ver planes
            </a>
          </motion.div>
        </motion.div>

        {/* Mockup abstracto del dashboard con tarjetas flotantes */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35, ease: EASE }}
          className="relative mx-auto w-full max-w-xl"
        >
          {/* Resplandor verde detrás del panel */}
          <div
            aria-hidden="true"
            className="absolute inset-8 -z-10 rounded-full bg-emerald-500/20 blur-3xl"
          />

          <div className="relative px-2 py-10 sm:px-10">
            {/* Panel principal */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  Panel · En vivo
                </div>
              </div>

              {/* Mini métricas del panel */}
              <dl className="grid grid-cols-3 gap-3 py-4">
                {PANEL_STATS.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"
                  >
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      {stat.label}
                    </dt>
                    <dd className="mt-1 text-lg font-extrabold text-white">{stat.value}</dd>
                  </div>
                ))}
              </dl>

              {/* Gráfico de barras de la semana */}
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Ingresos de la semana
              </p>
              <div className="mt-3 flex h-32 items-end gap-2 sm:gap-3">
                {BARS.map((height, i) => (
                  <motion.div
                    key={i}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.5, delay: 0.6 + i * 0.08, ease: "easeOut" }}
                    style={{ height: `${height}%` }}
                    className={`w-full origin-bottom rounded-t-lg ${
                      i === 5
                        ? "bg-gradient-to-t from-emerald-600 to-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                        : "bg-emerald-500/25"
                    }`}
                  />
                ))}
              </div>
              <div className="mt-2 grid grid-cols-7 gap-2 text-center text-[10px] font-medium text-slate-500 sm:gap-3">
                {DAYS.map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>
            </div>

            {/* Tarjetas flotantes de estadísticas */}
            <StatCard
              icon={Users}
              label="Miembros activos"
              value="384"
              trend="+12% este mes"
              className="left-0 top-0"
            />
            <StatCard
              icon={Wallet}
              label="Ingresos del mes"
              value="$12,480"
              trend="+8.4%"
              className="right-0 top-32 sm:top-36"
              delay="-2.5s"
            />
            <StatCard
              icon={Package}
              label="Inventario"
              value="98% en stock"
              className="bottom-0 left-6 sm:left-12"
              delay="-5s"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
