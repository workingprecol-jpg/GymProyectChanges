import { CalendarDays, ChartColumn, Package, ScanLine, Users, Wallet } from "lucide-react";
import { Reveal, SectionHeader } from "./Reveal";

/* Módulos principales del sistema */
const FEATURES = [
  {
    icon: Wallet,
    title: "Finanzas",
    description: "Controla ingresos, pagos y reportes del gimnasio desde un solo panel.",
  },
  {
    icon: Package,
    title: "Inventario",
    description: "Administra equipos, productos y existencias sin perder el control.",
  },
  {
    icon: Users,
    title: "Miembros / Clientes",
    description: "Registro completo e información de cada persona que asiste al gym.",
  },
  {
    icon: ScanLine,
    title: "Check-in y accesos",
    description: "Controla la entrada de los miembros de forma rápida y ordenada.",
  },
  {
    icon: CalendarDays,
    title: "Clases",
    description: "Organiza horarios y sesiones para que nada se cruce.",
  },
  {
    icon: ChartColumn,
    title: "Analítica y progreso",
    description: "Métricas del negocio y seguimiento del progreso de tus clientes.",
  },
];

export default function Features() {
  return (
    <section id="funciones" className="scroll-mt-24 py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Funciones"
          title="¿Qué puedes hacer con Gym Assist?"
          subtitle="Seis módulos que trabajan juntos para que la operación diaria de tu gimnasio deje de vivir en hojas de cálculo."
        />

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <Reveal key={feature.title} delay={index * 0.08} className="h-full">
              {/* Tarjeta blanca con levantamiento, sombra y borde verde al hover */}
              <article className="group h-full rounded-3xl bg-white p-8 shadow-xl shadow-black/20 ring-1 ring-transparent transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-500/25 hover:ring-emerald-400/50">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-400 text-white shadow-lg shadow-emerald-500/30 transition-transform duration-300 group-hover:scale-110">
                  <feature.icon aria-hidden="true" className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-lg font-bold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{feature.description}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
