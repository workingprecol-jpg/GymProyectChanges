import { useState } from "react";
import GymRegistrationForm from "./GymRegistrationForm.jsx";
import InviteCodeGate from "./InviteCodeGate.jsx";

export default function AuthScreen({ onLogin, onRegisterGym }) {
  const hasInviteCodeInUrl = new URLSearchParams(window.location.search).has("code");
  const [mode, setMode] = useState(hasInviteCodeInUrl ? "code" : "login");
  const [inviteCode, setInviteCode] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    const result = await onLogin(form.email.trim().toLowerCase(), form.password);
    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.message);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10 text-white">
      <div className="absolute inset-0" aria-hidden="true">
        <div className="absolute -left-32 -top-32 h-96 w-96 animate-float-slow rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute -bottom-40 right-0 h-[30rem] w-[30rem] animate-float rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute left-1/2 top-1/4 h-72 w-72 animate-float rounded-full bg-emerald-400/10 blur-3xl [animation-delay:-4s]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] bg-[size:42px_42px]" />
      </div>

      <div className={`relative grid w-full overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] shadow-2xl shadow-black/30 backdrop-blur-xl lg:grid-cols-[1.05fr_.95fr] ${mode === "register" ? "max-w-6xl" : "max-w-5xl"}`}>
        <section className="hidden flex-col justify-between bg-gradient-to-br from-emerald-500 to-emerald-700 p-10 lg:flex">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                <path d="M6 7v10M3.5 9.5v5M18 7v10M20.5 9.5v5M6 12h12" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p className="text-xl font-bold">Gym Assist</p>
              <p className="text-sm text-emerald-100">Management suite</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-100">Un solo lugar</p>
            <h1 className="mt-3 max-w-md text-4xl font-bold leading-tight">Tu gimnasio, organizado y siempre bajo control.</h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-emerald-50/80">
              Gestiona miembros, accesos, clases, finanzas y operaciones con permisos adecuados para cada equipo.
            </p>
          </div>

          <p className="text-xs text-emerald-100/70">Los gimnasios registrados usan autenticacion real contra el backend. Las cuentas demo son solo un modo local de exploracion.</p>
        </section>

        <section className="max-h-[calc(100vh-5rem)] overflow-y-auto bg-white p-6 text-slate-950 sm:p-10 dark:bg-slate-900 dark:text-white">
          {/* Fila superior: la marca (solo en movil, en escritorio ya esta en el
              panel verde) y la salida hacia la landing. El dashboard vive bajo
              /app/ y la landing en la raiz del dominio, por eso href="/". */}
          <div className="mb-6 flex items-center justify-between gap-4">
            <p className="text-xl font-bold text-emerald-600 lg:hidden">Gym Assist</p>
            <a
              href="/"
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg text-sm font-semibold text-slate-500 transition hover:text-emerald-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-slate-400 dark:hover:text-emerald-400"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Volver al inicio
            </a>
          </div>
          {mode === "code" ? (
            <InviteCodeGate
              onValidated={(code) => {
                setInviteCode(code);
                setMode("register");
              }}
              onShowLogin={() => setMode("login")}
            />
          ) : mode === "register" ? (
            <GymRegistrationForm
              onRegister={(form) => onRegisterGym(form, inviteCode)}
              onShowLogin={() => setMode("login")}
            />
          ) : (
            <>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">Acceso seguro</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight">Bienvenido de nuevo</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Ingresa con una cuenta habilitada para continuar.</p>

              <form onSubmit={submit} className="mt-8 space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Correo</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                className="mt-1.5 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950"
                placeholder="usuario@gimnasio.com"
                required
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Contrasena</span>
              <div className="relative mt-1.5">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 pr-12 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950"
                  placeholder="Tu contrasena"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.4 5.2A9.5 9.5 0 0112 5c5 0 9 4.5 9 7a11 11 0 01-2.4 3.4M6.5 6.6C4.2 8 3 10.2 3 12c0 2.5 4 7 9 7a9.6 9.6 0 003.6-.7" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M3 12s3.6-7 9-7 9 7 9 7-3.6 7-9 7-9-7-9-7Z" />
                      <circle cx="12" cy="12" r="2.6" />
                    </svg>
                  )}
                </button>
              </div>
            </label>

            {error ? (
              <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="shine-btn h-12 w-full rounded-xl bg-emerald-500 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:bg-emerald-600 hover:shadow-xl hover:shadow-emerald-500/30 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Iniciando sesion..." : "Iniciar sesion"}
            </button>
              </form>

              <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
                Tu gimnasio aun no usa Gym Assist?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("code");
                    setError("");
                  }}
                  className="font-bold text-emerald-600 hover:text-emerald-700"
                >
                  Registrar gimnasio
                </button>
              </p>

              {/* Las paginas legales las sirve la landing en la raiz del dominio;
                  el dashboard vive bajo /app/, por eso los enlaces son absolutos.
                  Se abren en otra pestana para no perder el formulario. */}
              <p className="mt-8 border-t border-slate-200 pt-5 text-center text-xs leading-5 text-slate-400 dark:border-slate-800 dark:text-slate-500">
                Al continuar, aceptas los{" "}
                <a
                  href="/terminos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-slate-500 underline decoration-slate-300 underline-offset-2 transition hover:text-emerald-600 dark:text-slate-400 dark:decoration-slate-600 dark:hover:text-emerald-400"
                >
                  Terminos de uso
                </a>{" "}
                y la{" "}
                <a
                  href="/privacidad"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-slate-500 underline decoration-slate-300 underline-offset-2 transition hover:text-emerald-600 dark:text-slate-400 dark:decoration-slate-600 dark:hover:text-emerald-400"
                >
                  Politica de privacidad
                </a>{" "}
                de Gym Assist.
              </p>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
