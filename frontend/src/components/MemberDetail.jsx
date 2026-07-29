import MembershipCalendar from "./MembershipCalendar.jsx";
import { getMembershipStatusStyle } from "../membershipStatus.js";

// La fecha llega como "YYYY-MM-DD" y se parte a mano en vez de pasarla a `new Date()`: ese
// constructor la lee como medianoche UTC y en Colombia (UTC-5) la fecha se mostraria un dia antes.
// Mismo criterio que en MembershipCalendar.
function formatBirthDate(value) {
  if (!value) {
    return "";
  }

  const [year, month, day] = String(value).split("-").map(Number);
  if (!year || !month || !day) {
    return "";
  }

  return new Intl.DateTimeFormat("es-CO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(year, month - 1, day));
}

// Los tres datos de contacto van con su icono delante, del mismo trazo que los del formulario
// de registro. El icono no encoge y el texto se recorta, para que un correo largo no rompa la fila.
function InfoLine({ icon, children }) {
  return (
    <p className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
      <span className="shrink-0 text-gray-400 dark:text-gray-500">{icon}</span>
      <span className="min-w-0 truncate">{children}</span>
    </p>
  );
}

function CakeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75-1.5.75a3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0L3 16.5m15-3.379a48.474 48.474 0 0 0-6-.371c-2.032 0-4.034.126-6 .371m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.169c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 0 1 3 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 0 1 6 13.12" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h1.5a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
    </svg>
  );
}

function Metric({ label, value, suffix }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-lg font-semibold text-gray-950 dark:text-white">
        {value ? `${value}${suffix}` : "-"}
      </p>
    </div>
  );
}

export default function MemberDetail({ member }) {
  if (!member) {
    return (
      <aside className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
        Selecciona un usuario para ver su informacion.
      </aside>
    );
  }

  const metrics = member.bodyMetrics || {};
  const birthDateLabel = formatBirthDate(member.birthDate);
  // La franja de color va en el recuadro exterior, el que envuelve toda la ficha, no en la tarjeta
  // de la mensualidad: el estado es del cliente, no de un bloque suelto de la ficha. Sale del mismo
  // mapa que pinta las filas de la tabla de clientes, asi que las dos coinciden siempre.
  //
  // El borde neutro de ese recuadro es `slate-200/90`, no `gray-200`: `index.css` define
  // `.app-content .border-gray-200`, un selector de dos clases que fija el atajo `border-color` y
  // por especificidad pisa las cuatro caras, dejando la franja del color neutro. Los dos tonos
  // elegidos son justo los que esa regla ya aplicaba, asi que el recuadro se ve igual que antes.
  const statusStyle = getMembershipStatusStyle(member.status, member.tailwindClass);

  return (
    <aside className={`rounded-lg border border-l-4 border-slate-200/90 ${statusStyle.accent} bg-white p-4 dark:border-slate-700/70 dark:bg-gray-800 lg:p-6`}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ${statusStyle.avatar}`}>
              {member.fullName.split(" ").map((name) => name[0]).slice(0, 2).join("")}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-600 dark:text-emerald-400">Perfil del cliente</p>
              <h2 className="truncate text-xl font-bold text-gray-950 dark:text-white">{member.fullName}</h2>
              <div className="mt-1 space-y-0.5">
                <InfoLine icon={<CakeIcon />}>{birthDateLabel || "Sin fecha de nacimiento"}</InfoLine>
                {/* El correo es opcional en el registro, asi que necesita su propio texto de
                    respaldo: sin el, el icono quedaba solo al lado de una linea vacia. */}
                <InfoLine icon={<MailIcon />}>{member.email || "Sin correo"}</InfoLine>
                <InfoLine icon={<PhoneIcon />}>{member.phone || "Sin telefono"}</InfoLine>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Metric label="Edad" value={member.age} suffix=" años" />
            <Metric label="Genero" value={member.gender === "female" ? "Mujer" : "Hombre"} suffix="" />
            <Metric label="Estatura" value={metrics.heightCm} suffix=" cm" />
            <Metric label="Peso" value={metrics.weightKg} suffix=" kg" />
            <Metric label="Pecho" value={metrics.chestCm} suffix=" cm" />
            <Metric label="Cintura" value={metrics.waistCm} suffix=" cm" />
            <Metric label="Cadera" value={metrics.hipCm} suffix=" cm" />
          </div>
        </div>

        <MembershipCalendar member={member} />
      </div>
    </aside>
  );
}
