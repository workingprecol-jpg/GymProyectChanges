import { useState } from "react";
import { CircleCheck, Mail, Phone, Send } from "lucide-react";
import { Reveal, SectionHeader } from "./Reveal";

/* Iconos de redes sociales en SVG inline (lucide 1.x ya no incluye iconos de marcas) */
function InstagramIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function FacebookIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function XBrandIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" {...props}>
      <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.59-6.64 7.59H.47l8.6-9.83L0 1.15h7.59l5.24 6.93 6.07-6.93ZM17.61 20.64h2.04L6.49 3.24H4.3l13.31 17.4Z" />
    </svg>
  );
}

/* Estilo compartido de los inputs: borde suave y anillo esmeralda al focus */
const inputClasses =
  "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/15";

const CONTACT_CHANNELS = [
  { icon: Mail, label: "Correo", value: "hola@gymflow.app", href: "mailto:hola@gymflow.app" },
  { icon: Phone, label: "Teléfono", value: "+52 (55) 1234 5678", href: "tel:+525512345678" },
];

/* Redes sociales (botones de demostración, sin enlace real todavía) */
const SOCIAL_LINKS = [
  { icon: InstagramIcon, label: "Instagram" },
  { icon: FacebookIcon, label: "Facebook" },
  { icon: XBrandIcon, label: "X (Twitter)" },
];

export default function Contact() {
  const [sent, setSent] = useState(false);

  /* Demo sin backend: solo confirma visualmente el envío */
  function handleSubmit(event) {
    event.preventDefault();
    setSent(true);
    event.target.reset();
  }

  return (
    <section id="contacto" className="scroll-mt-24 py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Contacto"
          title="¿Listo para transformar tu gimnasio?"
          subtitle="Déjanos tus datos y te contactamos para mostrarte Gym Assist funcionando."
        />

        <div className="mt-14 grid items-start gap-12 lg:mt-16 lg:grid-cols-[1fr_1.15fr] lg:gap-14">
          {/* Información de contacto */}
          <Reveal className="order-2 lg:order-1">
            <div className="space-y-8">
              <p className="text-base leading-relaxed text-slate-400">
                ¿Tienes dudas sobre los planes o quieres una demostración? Escríbenos y con gusto
                te ayudamos a elegir la mejor opción para tu gym.
              </p>

              <ul className="space-y-4">
                {CONTACT_CHANNELS.map((channel) => (
                  <li key={channel.label}>
                    <a
                      href={channel.href}
                      className="group flex items-center gap-4 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                    >
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-500/10 text-emerald-300 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                        <channel.icon aria-hidden="true" className="h-5 w-5" />
                      </span>
                      <span className="leading-tight">
                        <span className="block text-xs font-bold uppercase tracking-wide text-slate-500">
                          {channel.label}
                        </span>
                        <span className="block text-base font-semibold text-white transition-colors group-hover:text-emerald-300">
                          {channel.value}
                        </span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">
                  Síguenos
                </p>
                <div className="mt-4 flex gap-3">
                  {SOCIAL_LINKS.map((social) => (
                    <button
                      key={social.label}
                      type="button"
                      aria-label={social.label}
                      className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/5 text-slate-300 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300/50 hover:bg-white/10 hover:text-white hover:shadow-[0_0_20px_rgba(16,185,129,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                    >
                      <social.icon aria-hidden="true" className="h-5 w-5" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>

          {/* Formulario en tarjeta blanca (estilo del panel de login original) */}
          <Reveal delay={0.1} className="order-1 lg:order-2">
            <form
              onSubmit={handleSubmit}
              className="rounded-3xl bg-white p-6 shadow-2xl shadow-emerald-500/10 sm:p-9"
            >
              <div className="space-y-5">
                <div>
                  <label
                    htmlFor="contact-name"
                    className="mb-2 block text-sm font-semibold text-slate-900"
                  >
                    Nombre
                  </label>
                  <input
                    id="contact-name"
                    name="nombre"
                    type="text"
                    required
                    placeholder="Tu nombre"
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label
                    htmlFor="contact-email"
                    className="mb-2 block text-sm font-semibold text-slate-900"
                  >
                    Correo
                  </label>
                  <input
                    id="contact-email"
                    name="correo"
                    type="email"
                    required
                    placeholder="tu@correo.com"
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label
                    htmlFor="contact-message"
                    className="mb-2 block text-sm font-semibold text-slate-900"
                  >
                    Mensaje
                  </label>
                  <textarea
                    id="contact-message"
                    name="mensaje"
                    rows={4}
                    required
                    placeholder="Cuéntanos sobre tu gimnasio…"
                    className={`${inputClasses} resize-y`}
                  />
                </div>

                <button
                  type="submit"
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-400 px-6 py-3.5 text-sm font-bold text-white shadow-[0_0_24px_rgba(16,185,129,0.3)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_38px_rgba(16,185,129,0.5)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                >
                  Enviar mensaje
                  <Send
                    aria-hidden="true"
                    className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-1"
                  />
                </button>

                {sent && (
                  <p
                    role="status"
                    className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-600"
                  >
                    <CircleCheck aria-hidden="true" className="h-5 w-5 shrink-0" />
                    ¡Mensaje enviado! Te contactaremos muy pronto.
                  </p>
                )}
              </div>
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
