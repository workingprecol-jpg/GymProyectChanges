import { Check, Crown, Star } from "lucide-react";
import { Reveal, SectionHeader } from "./Reveal";

/* Información de los tres planes de Gym Assist */
const PLANS = [
  {
    name: "Plan Básico",
    tagline: "Lo esencial para poner tu gym en orden.",
    features: ["Finanzas", "Registro", "Clientes"],
    config: [
      "Datos del gym",
      "Crear hasta 20 planes diferentes",
      "Usuarios solo 3: Administrador, Recepción, Entrenador",
    ],
  },
  {
    name: "Plan Pro",
    tagline: "Para gimnasios en pleno crecimiento.",
    featured: true,
    features: ["Finanzas", "Check-in", "Registro", "Clientes", "Clases", "Inventario"],
    config: [
      "Datos del gym",
      "Crear hasta 50 planes diferentes",
      "Usuarios hasta 5: Administrador, Recepción, Recepción 2, Entrenador, etc.",
    ],
  },
  {
    name: "Plan Premium",
    tagline: "Control total de toda la operación.",
    premium: true,
    features: [
      "Finanzas",
      "Analítica",
      "Check-in",
      "Registro",
      "Clientes",
      "Progreso",
      "Clases",
      "Inventario",
      "Operaciones",
    ],
    config: [
      "Datos del gym",
      "Crear planes ilimitados",
      "Usuarios hasta 10: Administrador, Recepción, Recepción 2, Entrenador, etc.",
      "Creación virtual de infraestructura por máquinas para llevar un control y orden de la cantidad de máquinas y sus debidos mantenimientos",
    ],
  },
];

/* Feature con checkmark verde */
function FeatureItem({ children, dark = false }) {
  return (
    <li className="flex items-start gap-3">
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
          dark ? "bg-emerald-400/15 text-emerald-300" : "bg-emerald-500/10 text-emerald-600"
        }`}
      >
        <Check aria-hidden="true" className="h-3 w-3" strokeWidth={3.5} />
      </span>
      <span className={`text-sm font-medium ${dark ? "text-emerald-50/90" : "text-slate-700"}`}>
        {children}
      </span>
    </li>
  );
}

/* Elemento de la lista de configuración del plan */
function ConfigItem({ children, dark = false }) {
  return (
    <li className="flex items-start gap-3">
      <span
        className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${
          dark ? "bg-emerald-300/80" : "bg-emerald-500/70"
        }`}
      />
      <span className={`text-sm leading-relaxed ${dark ? "text-emerald-100/60" : "text-slate-500"}`}>
        {children}
      </span>
    </li>
  );
}

/* Contenido interior común a las tres tarjetas */
function PlanBody({ plan }) {
  const dark = Boolean(plan.premium);
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h3
          className={`text-2xl font-extrabold tracking-tight ${
            dark ? "text-white" : "text-slate-900"
          }`}
        >
          {plan.name}
        </h3>
        {plan.premium && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-300">
            <Crown aria-hidden="true" className="h-3.5 w-3.5" />
            Premium
          </span>
        )}
      </div>
      <p className={`mt-2 text-sm ${dark ? "text-emerald-100/60" : "text-slate-500"}`}>
        {plan.tagline}
      </p>

      <ul className="mt-7 space-y-3">
        {plan.features.map((feature) => (
          <FeatureItem key={feature} dark={dark}>
            {feature}
          </FeatureItem>
        ))}
      </ul>

      <div className={`my-7 border-t ${dark ? "border-white/10" : "border-slate-100"}`} />

      <p
        className={`text-[11px] font-bold uppercase tracking-[0.25em] ${
          dark ? "text-emerald-300" : "text-emerald-600"
        }`}
      >
        Configuración
      </p>
      <ul className="mt-4 space-y-3">
        {plan.config.map((option) => (
          <ConfigItem key={option} dark={dark}>
            {option}
          </ConfigItem>
        ))}
      </ul>

      <div className="mt-auto pt-8">
        <a
          href="#contacto"
          className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-400 px-6 py-3.5 text-sm font-bold text-white shadow-[0_0_24px_rgba(16,185,129,0.3)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_38px_rgba(16,185,129,0.5)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
        >
          Elegir plan
        </a>
      </div>
    </>
  );
}

function PlanCard({ plan, index }) {
  /* PRO: borde degradado, insignia "Más popular" y escala mayor en desktop */
  if (plan.featured) {
    return (
      <Reveal delay={index * 0.12} className="h-full">
        <div className="relative h-full rounded-[26px] bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-600 p-0.5 shadow-2xl shadow-emerald-500/30 transition-all duration-300 hover:-translate-y-2 hover:shadow-emerald-500/50 lg:scale-[1.04]">
          <span className="absolute -top-3.5 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg shadow-emerald-500/40">
            <Star aria-hidden="true" className="h-3 w-3 fill-current" />
            Más popular
          </span>
          <div className="flex h-full flex-col rounded-[24px] bg-white p-8">
            <PlanBody plan={plan} />
          </div>
        </div>
      </Reveal>
    );
  }

  /* BÁSICO (tarjeta blanca) y PREMIUM (degradado verde oscuro) */
  return (
    <Reveal delay={index * 0.12} className="h-full">
      <div
        className={`flex h-full flex-col rounded-3xl p-8 transition-all duration-300 hover:-translate-y-2 ${
          plan.premium
            ? "border border-emerald-400/25 bg-gradient-to-b from-emerald-950 to-navy-900 shadow-xl shadow-black/30 hover:shadow-2xl hover:shadow-emerald-500/30"
            : "bg-white shadow-xl shadow-black/20 hover:shadow-2xl hover:shadow-emerald-500/25"
        }`}
      >
        <PlanBody plan={plan} />
      </div>
    </Reveal>
  );
}

export default function Plans() {
  return (
    <section id="planes" className="scroll-mt-24 py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Nuestros planes"
          title="Un plan a la medida de tu gimnasio"
          subtitle="Empieza con lo esencial y desbloquea más módulos a medida que tu operación crece."
        />

        <div className="mt-16 grid items-stretch gap-8 lg:mt-20 lg:grid-cols-3">
          {PLANS.map((plan, index) => (
            <PlanCard key={plan.name} plan={plan} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
