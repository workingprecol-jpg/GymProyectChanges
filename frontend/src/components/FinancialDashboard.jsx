import { useEffect, useMemo, useState } from "react";

const inputClass =
  "h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-950 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-200 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-50 dark:focus:border-gray-200 dark:focus:ring-gray-700";

const paymentMethods = ["Efectivo", "Transferencia", "Tarjeta"];

const expenseCategoryStyles = {
  Infraestructura: {
    border: "border-amber-300 dark:border-amber-700",
    accent: "border-l-amber-300 dark:border-l-amber-700",
    hover: "hover:!bg-amber-50 dark:hover:!bg-amber-950/40",
    text: "text-amber-600 dark:text-amber-400",
    circle: "bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-300",
    icon: (
      <path
        d="M4 21V9l8-5 8 5v12M4 21h16M9 21v-5h6v5M9 12h.01M15 12h.01M9 16h.01M15 16h.01"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  Maquinaria: {
    border: "border-fuchsia-300 dark:border-fuchsia-700",
    accent: "border-l-fuchsia-300 dark:border-l-fuchsia-700",
    hover: "hover:!bg-fuchsia-50 dark:hover:!bg-fuchsia-950/40",
    text: "text-fuchsia-600 dark:text-fuchsia-400",
    circle: "bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-900/50 dark:text-fuchsia-300",
    icon: (
      <>
        <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
        <path
          d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82A1.65 1.65 0 0 0 3 13.09H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
  },
  Servicios: {
    border: "border-sky-300 dark:border-sky-700",
    accent: "border-l-sky-300 dark:border-l-sky-700",
    hover: "hover:!bg-sky-50 dark:hover:!bg-sky-950/40",
    text: "text-sky-600 dark:text-sky-400",
    circle: "bg-sky-100 text-sky-600 dark:bg-sky-900/50 dark:text-sky-300",
    icon: <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" strokeLinecap="round" strokeLinejoin="round" />,
  },
};

// Acento izquierdo + sombra de las tarjetas de datos, el mismo tratamiento que el formulario de
// "Crear cliente". Aqui el color dice de que trata la tabla: verde lo que entra, rojo lo que se
// debe o sale. En "Gastos recientes" cada fila lleva ademas el color de su categoria.
// El "!" no es decorativo: index.css trae dos reglas globales mas especificas que las utilidades
// de Tailwind (`.app-content .border-gray-200` fija el color del borde y
// `.app-content .overflow-hidden.rounded-lg` fija la sombra), y estas tarjetas llevan justo esas
// clases. Sin el important, la linea sale gris y la sombra gris.
const dataCardAccent = {
  emerald: "!shadow-lg !shadow-emerald-500/10 dark:!shadow-emerald-900/30",
  rose: "!shadow-lg !shadow-rose-500/10 dark:!shadow-rose-900/30",
};

// La linea vertical izquierda. Donde va depende de si las filas ya tienen color propio:
//   - Sin color por fila (Pagos recientes, Cartera por cobrar): en la tarjeta, baja completa.
//   - Con color por fila (Gastos recientes, por categoria): solo en el encabezado y el
//     subencabezado, para que no corra pegada a las lineas de color de cada fila.
const leftLine = {
  emerald: "border-l-4 !border-l-emerald-500 dark:!border-l-emerald-400",
  rose: "border-l-4 !border-l-rose-500 dark:!border-l-rose-400",
};

// La linea de cada fila de "Gastos recientes" y su color al pasar el mouse. `accent` usa el mismo
// tono que el `border` de la tarjeta de esa categoria arriba (300 en claro, 700 en oscuro): son la
// misma cosa vista en dos sitios, si se separan la tabla deja de leerse contra las tarjetas.
// Un gasto de una categoria que no este en el mapa (las tres son las unicas que ofrece el
// formulario, pero el backend no lo impone) cae al rojo de la tarjeta en vez de quedarse sin linea.
function getExpenseRowStyle(category) {
  const style = expenseCategoryStyles[category];

  return {
    accent: style?.accent || "border-l-rose-300 dark:border-l-rose-700",
    hover: style?.hover || "hover:!bg-rose-50 dark:hover:!bg-rose-950/40",
  };
}

const initialExpenseForm = {
  category: "Servicios",
  description: "",
  amount: "",
  expenseDate: new Date().toISOString().slice(0, 10),
  paymentMethod: "Transferencia",
  provider: "",
};

// Mismas abreviaturas que MonthAbbreviations en FinanceController, para rellenar los meses
// que la historia no traiga sin que el eje cambie de idioma a mitad del año.
const MONTH_ABBREVIATIONS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

// Mitad del ancho del globo del grafico (w-52 = 208px). Si cambia esa clase, cambia esto.
const HALF_TOOLTIP_PX = 104;

function formatCurrency(value, currency = "USD") {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatCompactCurrency(value, currency = "USD") {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value || 0);
}

function formatDateSimple(value, forceUtc = false) {
  if (!value) {
    return "-";
  }

  const date = forceUtc ? new Date(`${value}T00:00:00Z`) : new Date(value);

  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(forceUtc ? { timeZone: "UTC" } : {}),
  }).format(date);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("es-CO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function formatMonthName(value, forceUtc = false) {
  if (!value) {
    return "-";
  }

  const date = forceUtc ? new Date(`${value}T00:00:00Z`) : new Date(value);
  const label = new Intl.DateTimeFormat("es-CO", {
    month: "long",
    ...(forceUtc ? { timeZone: "UTC" } : {}),
  }).format(date);

  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatYear(value, forceUtc = false) {
  if (!value) {
    return "-";
  }

  const date = forceUtc ? new Date(`${value}T00:00:00Z`) : new Date(value);

  return new Intl.DateTimeFormat("es-CO", {
    year: "numeric",
    ...(forceUtc ? { timeZone: "UTC" } : {}),
  }).format(date);
}

function formatTimePart(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

// Dias que faltan para el vencimiento; negativo si ya paso. Antes solo se contaban
// los dias vencidos, porque una cuenta por cobrar solo podia nacer vencida. Ahora una
// inscripcion sin pagar la crea con fecha futura y decir "vencio" seria falso.
function getDaysUntilDue(dueDate) {
  if (!dueDate) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${dueDate}T00:00:00`);
  if (Number.isNaN(due.getTime())) {
    return null;
  }

  return Math.floor((due - today) / 86400000);
}

function describeDueDate(daysUntilDue) {
  if (daysUntilDue === null) return "";
  if (daysUntilDue < 0) return `${Math.abs(daysUntilDue)} dias vencido`;
  if (daysUntilDue === 0) return "Vence hoy";
  return `Faltan ${daysUntilDue} dias`;
}

// El pastel que toma cada fila de "Pagos recientes" al pasar el mouse. Son los mismos estados y
// el mismo orden de respaldo que PaymentStatusBadge justo debajo, a proposito: la fila se tiñe del
// color de la insignia que muestra, no de un tono fijo de la tarjeta.
// El "!" no es decorativo: index.css pinta `.app-content table tbody tr:hover` de gris y esa regla
// le gana a una utilidad de Tailwind. Sin el important la fila sale gris. Mismo motivo que en
// MembersTable y que en las filas de "Gastos recientes".
const paymentRowHover = {
  Paid: "hover:!bg-emerald-50 dark:hover:!bg-emerald-950/40",
  Pending: "hover:!bg-amber-50 dark:hover:!bg-amber-950/40",
  Failed: "hover:!bg-rose-50 dark:hover:!bg-rose-950/40",
  Refunded: "hover:!bg-gray-100 dark:hover:!bg-gray-800/60",
};

function PaymentStatusBadge({ status }) {
  const styles = {
    Paid: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
    Pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200",
    Failed: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
    Refunded: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
  };
  const labels = {
    Paid: "Pagado",
    Pending: "Pendiente",
    Failed: "Fallido",
    Refunded: "Reembolsado",
  };

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status] || styles.Pending}`}>
      {labels[status] || "Pendiente"}
    </span>
  );
}

function MetricCard({ label, value, detail, tone = "default", icon = "arrow" }) {
  const valueStyles = {
    default: "text-gray-950 dark:text-white",
    positive: "text-emerald-700 dark:text-emerald-300",
    info: "text-sky-700 dark:text-sky-300",
    warning: "text-amber-700 dark:text-amber-300",
    negative: "text-rose-700 dark:text-rose-300",
  };
  const iconStyles = {
    default: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    positive: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300",
    info: "bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-300",
    warning: "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300",
    negative: "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300",
  };
  const accentStyles = {
    default: "bg-slate-400 dark:bg-slate-300",
    positive: "bg-emerald-500 dark:bg-emerald-300",
    info: "bg-sky-500 dark:bg-sky-300",
    warning: "bg-amber-500 dark:bg-amber-300",
    negative: "bg-rose-500 dark:bg-rose-300",
  };
  // Solo el color de la sombra al pasar el mouse. En reposo las cinco tarjetas comparten la misma
  // sombra gris (va en la tarjeta, junto al tamaño: shadow-lg en reposo, shadow-xl al pasar el
  // mouse) y el color del tono aparece solo en hover, igual que la barra de acento de arriba: la
  // fila entera se ve neutra y quieta hasta que el usuario apunta a una tarjeta concreta.
  // En oscuro baja a un tono 900 y sube la opacidad, porque un 500 al 20% sobre un fondo casi
  // negro no se ve — el mismo criterio que dataCardAccent. Aqui no hace falta el "!" que si llevan
  // aquellas: las reglas de index.css que pisan la sombra apuntan a `article.rounded-lg` y estas
  // tarjetas son `rounded-2xl`, asi que no compiten. Y el hover gana sobre la sombra gris en
  // reposo por especificidad (`:hover` pesa mas que una clase), no por el orden de las clases.
  const shadowStyles = {
    default: "hover:shadow-slate-500/30 dark:hover:shadow-slate-950/60",
    positive: "hover:shadow-emerald-500/30 dark:hover:shadow-emerald-900/50",
    info: "hover:shadow-sky-500/30 dark:hover:shadow-sky-900/50",
    warning: "hover:shadow-amber-500/30 dark:hover:shadow-amber-900/50",
    negative: "hover:shadow-rose-500/30 dark:hover:shadow-rose-900/50",
  };
  const icons = {
    arrow: <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />,
    income: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8M12 18V6" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    expense: (
      <path d="M22 17l-8.5-8.5-5 5L2 7M16 17h6v-6" strokeLinecap="round" strokeLinejoin="round" />
    ),
    profit: (
      <path d="M3 3v18h18M8 17v-3M13 17V9M18 17V5" strokeLinecap="round" strokeLinejoin="round" />
    ),
    receivable: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  };

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-lg shadow-slate-500/25 transition hover:-translate-y-0.5 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:shadow-slate-950/60 ${shadowStyles[tone]}`}
    >
      <span
        aria-hidden="true"
        className={`absolute inset-x-0 top-0 h-1 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100 ${accentStyles[tone]}`}
      />
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{label}</p>
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-xl group-hover:animate-icon-nudge ${iconStyles[tone]}`}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            {icons[icon] || icons.arrow}
          </svg>
        </span>
      </div>
      <p className={`mt-3 text-2xl font-bold tracking-tight ${valueStyles[tone]}`}>{value}</p>
      <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{detail}</p>
    </article>
  );
}

function ActionButton({ title, description, onClick, icon, tone = "neutral" }) {
  const toneStyles = {
    green:
      "border-emerald-500 bg-gradient-to-r from-emerald-500 to-teal-400 text-white shadow-md shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-500",
    red: "border-rose-500 bg-gradient-to-r from-rose-600 to-pink-500 text-white shadow-md shadow-rose-500/20 hover:from-rose-700 hover:to-pink-600",
    gray: "border-slate-600 bg-gradient-to-r from-slate-700 to-slate-500 text-white shadow-md shadow-slate-500/20 hover:from-slate-800 hover:to-slate-600",
    neutral:
      "border-gray-200 bg-white hover:border-gray-400 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-500 dark:hover:bg-gray-700",
  };
  const isSolid = tone !== "neutral";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-start gap-3 rounded-lg border p-4 text-left transition ${toneStyles[tone]}`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          isSolid ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{title}</span>
        <span className={`mt-1 block text-xs ${isSolid ? "text-white/80" : "text-gray-500 dark:text-gray-400"}`}>
          {description}
        </span>
      </span>
    </button>
  );
}

function formatDateShort(value) {
  if (!value) {
    return "-";
  }

  const [year, month, day] = String(value).split("-").map(Number);
  const date = year && month && day ? new Date(year, month - 1, day) : new Date(value);

  const parts = new Intl.DateTimeFormat("es-CO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).formatToParts(date);

  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${byType.day} ${byType.month} ${byType.year}`;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysToIsoDate(isoDate, days) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function ClientPaymentsTable({ members, plans, currency, onCancel, onRenew, onToggleSuspend, initialNameQuery = "" }) {
  const [nameQuery, setNameQuery] = useState(initialNameQuery);
  const [paymentMethodByMember, setPaymentMethodByMember] = useState({});
  const [startDateByMember, setStartDateByMember] = useState({});
  const [planByMember, setPlanByMember] = useState({});

  const visibleMembers = useMemo(() => {
    const query = nameQuery.trim().toLowerCase();

    return members.filter((member) => !query || member.fullName.toLowerCase().includes(query));
  }, [members, nameQuery]);

  function getMethod(memberId) {
    return paymentMethodByMember[memberId] || "Efectivo";
  }

  function getStartDate(memberId) {
    return startDateByMember[memberId] || todayIso();
  }

  function getSelectedPlanName(member) {
    return planByMember[member.memberId] || member.planName;
  }

  function getSelectedPlan(member) {
    return plans.find((plan) => plan.name === getSelectedPlanName(member));
  }

  function getPlanDuration(member) {
    return getSelectedPlan(member)?.durationDays || 30;
  }

  function getComputedEndDate(member) {
    return addDaysToIsoDate(getStartDate(member.memberId), getPlanDuration(member));
  }

  function getDisplayValue(member) {
    const selectedPlan = getSelectedPlan(member);

    if (getSelectedPlanName(member) === member.planName) {
      return member.subscriptionValue || selectedPlan?.price;
    }

    return selectedPlan?.price;
  }

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-950 dark:text-white">Registrar pago</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Busca un cliente para renovar su membresia o suspenderla.</p>
        </div>
        <button type="button" onClick={onCancel} className="text-sm font-medium text-gray-500 hover:text-gray-950 dark:hover:text-white">
          Cerrar
        </button>
      </div>

      <div className="mt-4">
        <input
          type="text"
          value={nameQuery}
          onChange={(event) => setNameQuery(event.target.value)}
          placeholder="Buscar por nombre..."
          className={inputClass}
        />
      </div>

      <div
        className={`mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 ${dataCardAccent.emerald}`}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
            <thead className="bg-transparent text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
              <tr>
                <th className={`${leftLine.emerald} px-4 py-3`}>Nombre</th>
                <th className="px-4 py-3">Membresia</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Nueva fecha de inicio</th>
                <th className="px-4 py-3">Inicio / Vence</th>
                <th className="px-4 py-3">Medio de pago</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {visibleMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                    No se encontraron clientes con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                visibleMembers.map((member) => {
                  const isSuspended = member.status === "Suspended";

                  return (
                    <tr key={member.memberId}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-950 dark:text-white">{member.fullName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{member.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          className={inputClass}
                          value={getSelectedPlanName(member)}
                          onChange={(event) =>
                            setPlanByMember((current) => ({ ...current, [member.memberId]: event.target.value }))
                          }
                        >
                          {plans.map((plan) => (
                            <option key={plan.name} value={plan.name}>
                              {plan.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-300">
                        {formatCurrency(getDisplayValue(member), currency)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <input
                          type="date"
                          className={inputClass}
                          value={getStartDate(member.memberId)}
                          onChange={(event) =>
                            setStartDateByMember((current) => ({ ...current, [member.memberId]: event.target.value }))
                          }
                        />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-300">
                        <div>{formatDateShort(getStartDate(member.memberId))}</div>
                        <div>{formatDateShort(getComputedEndDate(member))}</div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          className={inputClass}
                          value={getMethod(member.memberId)}
                          onChange={(event) =>
                            setPaymentMethodByMember((current) => ({ ...current, [member.memberId]: event.target.value }))
                          }
                        >
                          {paymentMethods.map((method) => (
                            <option key={method}>{method}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              onRenew(
                                member.memberId,
                                getMethod(member.memberId),
                                getStartDate(member.memberId),
                                getSelectedPlanName(member),
                              )
                            }
                            className="h-9 rounded-md bg-emerald-500 px-3 text-xs font-semibold text-white transition hover:bg-emerald-600"
                          >
                            Renovar
                          </button>
                          <button
                            type="button"
                            onClick={() => onToggleSuspend(member.memberId)}
                            className={`h-9 rounded-md border px-3 text-xs font-semibold transition ${
                              isSuspended
                                ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
                                : "border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950/30"
                            }`}
                          >
                            {isSuspended ? "Reactivar" : "Suspender"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ExpenseForm({ onCancel, onSubmit }) {
  const [form, setForm] = useState(initialExpenseForm);

  function handleSubmit(event) {
    event.preventDefault();
    const amount = Number(form.amount);

    if (!form.description.trim() || amount <= 0) {
      return;
    }

    onSubmit({
      ...form,
      amount,
      description: form.description.trim(),
      provider: form.provider.trim(),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-rose-200 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950/30">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-950 dark:text-white">Registrar gasto</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Las categorias pueden ser modificadas en configuracion.
          </p>
        </div>
        <button type="button" onClick={onCancel} className="text-sm font-medium text-gray-500 hover:text-gray-950 dark:hover:text-white">
          Cerrar
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-1 text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">Categoria</span>
          <select
            className={inputClass}
            value={form.category}
            onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
          >
            <option>Infraestructura</option>
            <option>Maquinaria</option>
            <option>Servicios</option>
          </select>
        </label>

        <label className="space-y-1 text-sm md:col-span-2 xl:col-span-1">
          <span className="font-medium text-gray-700 dark:text-gray-300">Descripcion</span>
          <input
            className={inputClass}
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            placeholder="Concepto del gasto"
            required
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">Monto</span>
          <input
            className={inputClass}
            type="number"
            min="1"
            value={form.amount}
            onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
            required
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">Fecha del gasto</span>
          <input
            className={inputClass}
            type="date"
            value={form.expenseDate}
            onChange={(event) => setForm((current) => ({ ...current, expenseDate: event.target.value }))}
            required
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">Medio de pago</span>
          <select
            className={inputClass}
            value={form.paymentMethod}
            onChange={(event) => setForm((current) => ({ ...current, paymentMethod: event.target.value }))}
          >
            <option>Efectivo</option>
            <option>Transferencia</option>
            <option>Tarjeta</option>
          </select>
        </label>

        <label className="space-y-1 text-sm md:col-span-2 xl:col-span-1">
          <span className="font-medium text-gray-700 dark:text-gray-300">Proveedor (opcional)</span>
          <input
            className={inputClass}
            value={form.provider}
            onChange={(event) => setForm((current) => ({ ...current, provider: event.target.value }))}
            placeholder="Nombre del proveedor"
          />
        </label>

        <div className="flex items-end">
          <button type="submit" className="h-10 w-full rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-600">
            Guardar gasto
          </button>
        </div>
      </div>
    </form>
  );
}

function ChartRangeButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`h-8 rounded-full border px-3 text-xs font-semibold transition ${
        active
          ? "border-emerald-500 bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
          : "border-gray-300 bg-white text-gray-600 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-gray-500"
      }`}
    >
      {children}
    </button>
  );
}

function TooltipRow({ label, swatch, valueClass, children }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="inline-flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
        <span className={`h-2 w-2 shrink-0 rounded-sm ${swatch}`} />
        {label}
      </dt>
      <dd className={`font-semibold tabular-nums ${valueClass}`}>{children}</dd>
    </div>
  );
}

export default function FinancialDashboard({
  summary,
  currency = "USD",
  memberCount = 0,
  members = [],
  plans = [],
  isLoading = false,
  onRegisterExpense,
  onRenewMembership,
  onToggleSuspend,
  initialAction = null,
  initialPaymentQuery = "",
  onInitialActionConsumed,
}) {
  const [activeAction, setActiveAction] = useState(initialAction);
  const [notice, setNotice] = useState("");
  // "recent" = la ventana movil de 6 meses de siempre; un numero = ese año completo.
  const [chartRange, setChartRange] = useState("recent");
  // Indice de la columna del grafico bajo el cursor, o null. Es el indice y no el mes
  // porque al cambiar de rango los meses se repiten entre años.
  const [hoveredMonth, setHoveredMonth] = useState(null);

  useEffect(() => {
    if (initialAction) {
      setActiveAction(initialAction);
      onInitialActionConsumed?.();
    }
  }, [initialAction, onInitialActionConsumed]);

  const data = summary || {
    currentMonthRevenue: 0,
    previousMonthRevenue: 0,
    currentMonthExpenses: 0,
    currentMonthPaidPayments: 0,
    monthlyRevenue: [],
    monthlyHistory: [],
    accountsReceivable: [],
    recentExpenses: [],
    recentPayments: [],
  };

  const totals = useMemo(() => {
    const receivable = data.accountsReceivable.reduce((sum, item) => sum + item.amount, 0);
    const profit = data.currentMonthRevenue - data.currentMonthExpenses;
    const delta = data.currentMonthRevenue - data.previousMonthRevenue;
    const deltaPercentage = data.previousMonthRevenue ? (delta / data.previousMonthRevenue) * 100 : 0;
    return { receivable, profit, delta, deltaPercentage };
  }, [data]);

  const monthlyHistory = data.monthlyHistory || [];

  // Todos los años que cubre la historia, tengan movimiento o no. El backend la emite
  // desde el año en que se adquirio la cuenta hasta el mes actual, asi que esto es
  // exactamente "desde que existe el gimnasio hasta hoy". Antes se ofrecian solo los años
  // con movimiento, lo que dejaba fuera un año en el que no se registro nada — y ese vacio
  // tambien es informacion. Se rellena el rango por si la serie llegara con huecos.
  const availableYears = useMemo(() => {
    const years = monthlyHistory.map((point) => point.year);
    if (years.length === 0) {
      return [];
    }

    const oldest = Math.min(...years);
    const newest = Math.max(...years);
    const range = [];
    for (let year = newest; year >= oldest; year -= 1) {
      range.push(year);
    }
    return range;
  }, [monthlyHistory]);

  // Si el año seleccionado deja de existir (un refresco que ya no lo trae), vuelve
  // a la vista por defecto en lugar de quedarse en un grafico vacio.
  useEffect(() => {
    if (chartRange !== "recent" && !availableYears.includes(chartRange)) {
      setChartRange("recent");
    }
  }, [availableYears, chartRange]);

  const chartData = useMemo(() => {
    if (chartRange === "recent") {
      return data.monthlyRevenue.map((item, index) => ({
        ...item,
        expenses: item.expenses || 0,
        users: index === data.monthlyRevenue.length - 1 ? memberCount : item.users || 0,
        isCurrent: index === data.monthlyRevenue.length - 1,
      }));
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthNumber = now.getMonth() + 1;

    const pointsByMonth = new Map(
      monthlyHistory.filter((point) => point.year === chartRange).map((point) => [point.monthNumber, point]),
    );

    // Un año pasado se dibuja completo y el actual se corta en el mes en curso. Los meses sin
    // registro se rellenan en cero en vez de desaparecer: asi un año sin movimiento se ve como
    // lo que es (un año plano) y no como un grafico roto, y Ene-Dic queda alineado al comparar
    // un año con otro.
    const lastMonth = chartRange === currentYear ? currentMonthNumber : 12;
    const months = [];
    for (let monthNumber = 1; monthNumber <= lastMonth; monthNumber += 1) {
      const point = pointsByMonth.get(monthNumber);
      const isCurrent = chartRange === currentYear && monthNumber === currentMonthNumber;
      months.push({
        month: point?.month || MONTH_ABBREVIATIONS[monthNumber - 1],
        revenue: point?.revenue || 0,
        expenses: point?.expenses || 0,
        // El mes en curso usa el conteo vivo de miembros, igual que la vista de 6 meses.
        users: isCurrent ? memberCount : point?.users || 0,
        isCurrent,
      });
    }

    return months;
  }, [chartRange, data.monthlyRevenue, monthlyHistory, memberCount]);

  const categoryExpenseTotals = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return data.recentExpenses.reduce((totalsByCategory, expense) => {
      let year;
      let month;

      if (expense.expenseDate) {
        const date = new Date(`${expense.expenseDate}T00:00:00Z`);
        year = date.getUTCFullYear();
        month = date.getUTCMonth();
      } else {
        const date = new Date(expense.createdAt);
        year = date.getFullYear();
        month = date.getMonth();
      }

      if (year !== currentYear) {
        return totalsByCategory;
      }

      const entry = totalsByCategory[expense.category] || { month: 0, year: 0 };
      entry.year += expense.amount;
      if (month === currentMonth) {
        entry.month += expense.amount;
      }
      totalsByCategory[expense.category] = entry;

      return totalsByCategory;
    }, {});
  }, [data.recentExpenses]);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
        Cargando finanzas...
      </div>
    );
  }

  // Un año completo son 12 columnas donde antes habia 6: con la separacion de siempre las
  // barras quedan como hilos. Las dos filas (barras y etiquetas) tienen que usar la misma,
  // o los meses dejan de alinearse con sus barras.
  const columnGapClass = chartData.length > 8 ? "gap-1.5" : "gap-3";
  // Ahora que se puede elegir un año sin registros, ese caso hay que decirlo: maxMoney cae
  // a su tope minimo de 1 y el pie anunciaba "hasta $ 1", que no significa nada.
  const hasMovement = chartData.some((item) => item.revenue > 0 || item.expenses > 0);
  const maxMoney = Math.max(...chartData.flatMap((item) => [item.revenue, item.expenses]), 1);
  const maxUsers = Math.max(...chartData.map((item) => item.users), 1);
  const chartWidth = Math.max(chartData.length * 100, 100);
  const chartLinePoints = chartData
    .map((item, index) => {
      const x = (index + 0.5) * (chartWidth / chartData.length);
      const y = 190 - (item.users / maxUsers) * 150;
      return `${x},${y}`;
    })
    .join(" ");

  // El indice se valida contra los datos actuales: al cambiar de rango el grafico puede
  // tener menos columnas que cuando se guardo el hover.
  const hoveredPoint = hoveredMonth !== null ? chartData[hoveredMonth] : null;
  const hoveredTooltip = hoveredPoint
    ? {
        item: hoveredPoint,
        profit: hoveredPoint.revenue - hoveredPoint.expenses,
        // Centro de la columna, en porcentaje del area de barras. El clamp lo mantiene
        // dentro de la tarjeta: el globo se centra sobre la columna mientras quepa y se
        // apoya en el borde cuando no. Con 12 columnas no basta con tratar la primera y la
        // ultima, porque las tres de cada extremo se salen. HALF_TOOLTIP_PX es la mitad del
        // ancho del globo (w-52 = 208px).
        left: ((hoveredMonth + 0.5) / chartData.length) * 100,
        // Flota justo encima de la barra mas alta. El tope de 46% deja sitio para el alto
        // del globo, para que nunca se salga por arriba cuando esa barra ocupa todo el area.
        bottom: Math.min(
          (Math.max(hoveredPoint.revenue, hoveredPoint.expenses) / maxMoney) * 100 + 3,
          46,
        ),
      }
    : null;

  function finishAction(message) {
    setActiveAction(null);
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3500);
  }

  function showNotice(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3500);
  }

  function downloadReport() {
    const ledgerRows = [
      ...data.recentPayments.map((item) => {
        const timestamp = item.paidAt || item.createdAt;
        const member = members.find((candidate) => candidate.fullName === item.memberName);
        return {
          timestamp,
          fecha: formatDateSimple(timestamp),
          mes: formatMonthName(timestamp),
          ano: formatYear(timestamp),
          hora: formatTimePart(timestamp),
          categoria: "Pago",
          concepto: item.memberName,
          plan: item.planName || "",
          fechaLimite: member?.endDate ? formatDate(member.endDate) : "",
          descripcion: "",
          medioDePago: item.method || "",
          proveedor: "",
          monto: item.amount,
        };
      }),
      ...data.recentExpenses.map((item) => ({
        timestamp: item.createdAt,
        fecha: item.expenseDate ? formatDateSimple(item.expenseDate, true) : formatDateSimple(item.createdAt),
        mes: item.expenseDate ? formatMonthName(item.expenseDate, true) : formatMonthName(item.createdAt),
        ano: item.expenseDate ? formatYear(item.expenseDate, true) : formatYear(item.createdAt),
        hora: formatTimePart(item.createdAt),
        categoria: "Gasto",
        concepto: item.category,
        plan: "",
        fechaLimite: "",
        descripcion: item.description || "",
        medioDePago: item.paymentMethod || "",
        proveedor: item.provider || "",
        monto: item.amount,
      })),
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const rows = [
      ["Base de datos"],
      ["Fecha", "Mes", "Año", "Hora", "Categoria", "Concepto", "Descripcion", "Plan", "Fecha limite", "Monto", "Medio de pago", "Proveedor"],
      ...ledgerRows.map((item) => [
        item.fecha,
        item.mes,
        item.ano,
        item.hora,
        item.categoria,
        item.concepto,
        item.descripcion,
        item.plan,
        item.fechaLimite,
        item.monto,
        item.medioDePago,
        item.proveedor,
      ]),
    ];
    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(";"))
      .join("\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `reporte-financiero-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    finishAction("Reporte financiero descargado.");
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-950 dark:text-white">Resumen financiero</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Ingresos, gastos, utilidad y cartera del mes actual.</p>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{data.currentMonthPaidPayments} pagos recibidos este mes</p>
      </div>

      {notice ? (
        <div role="status" className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800 dark:border-green-900 dark:bg-green-950/40 dark:text-green-200">
          {notice}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Ingresos"
          icon="income"
          value={formatCurrency(data.currentMonthRevenue, currency)}
          detail={`${totals.deltaPercentage >= 0 ? "+" : ""}${totals.deltaPercentage.toFixed(1)}% frente al mes anterior`}
          tone={totals.delta >= 0 ? "positive" : "negative"}
        />
        <MetricCard
          label="Gastos"
          icon="expense"
          value={formatCurrency(data.currentMonthExpenses, currency)}
          detail={`${((data.currentMonthExpenses / Math.max(data.currentMonthRevenue, 1)) * 100).toFixed(1)}% de los ingresos`}
          tone="negative"
        />
        <MetricCard
          label="Utilidad neta"
          icon="profit"
          value={formatCurrency(totals.profit, currency)}
          detail="Ingresos menos gastos registrados"
          tone={totals.profit >= 0 ? "info" : "negative"}
        />
        <MetricCard
          label="Cartera pendiente"
          icon="receivable"
          value={formatCurrency(totals.receivable, currency)}
          detail={`${data.accountsReceivable.length} clientes con saldo pendiente`}
          tone={totals.receivable > 0 ? "warning" : "positive"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-gray-950 dark:text-white">Ingresos, gastos y usuarios</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {chartRange === "recent"
                  ? "Relacion mensual entre el movimiento financiero y los usuarios registrados."
                  : `Movimiento mensual registrado durante ${chartRange}.`}
              </p>
            </div>
            {/* La variacion compara el mes actual contra el anterior, asi que solo tiene
                sentido en la vista reciente: sobre un año pasado se leeria como suya. */}
            {chartRange === "recent" ? (
              <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800 dark:bg-green-900/40 dark:text-green-200">
                {totals.deltaPercentage >= 0 ? "+" : ""}
                {totals.deltaPercentage.toFixed(1)}%
              </span>
            ) : null}
          </div>

          {availableYears.length > 0 ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <ChartRangeButton active={chartRange === "recent"} onClick={() => setChartRange("recent")}>
                Ultimos 6 meses
              </ChartRangeButton>
              {availableYears.map((year) => (
                <ChartRangeButton key={year} active={chartRange === year} onClick={() => setChartRange(year)}>
                  {year}
                </ChartRangeButton>
              ))}
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-4 text-xs font-medium text-gray-600 dark:text-gray-300">
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm bg-emerald-500" />
              Ingresos
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm bg-rose-500" />
              Gastos
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-0.5 w-5 bg-indigo-500" />
              Usuarios
            </span>
          </div>

          <div className="relative mt-5 h-72 border-b border-gray-200 px-2 dark:border-gray-700">
            <div className={`absolute inset-x-2 bottom-8 top-0 flex items-end ${columnGapClass}`}>
              {chartData.map((item, index) => {
                const revenueHeight = Math.max((item.revenue / maxMoney) * 100, 3);
                const expenseHeight = Math.max((item.expenses / maxMoney) * 100, 3);

                return (
                  // La columna entera es la zona sensible, no solo las barras: apuntar a
                  // una barra de 3% de alto seria imposible en un mes sin movimiento.
                  <div
                    key={item.month}
                    className="group flex h-full min-w-0 flex-1 items-end justify-center gap-1"
                    onMouseEnter={() => setHoveredMonth(index)}
                    onMouseLeave={() => setHoveredMonth((current) => (current === index ? null : current))}
                  >
                    <div
                      className="w-1/3 rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-400 transition duration-200 ease-out group-hover:-translate-y-1.5 group-hover:shadow-lg group-hover:shadow-emerald-500/30"
                      style={{ height: `${revenueHeight}%` }}
                    />
                    <div
                      className="w-1/3 rounded-t-md bg-gradient-to-t from-rose-600 to-rose-400 transition duration-200 ease-out group-hover:-translate-y-1.5 group-hover:shadow-lg group-hover:shadow-rose-500/30"
                      style={{ height: `${expenseHeight}%` }}
                    />
                  </div>
                );
              })}
            </div>

            {hoveredTooltip ? (
              // Mismo marco que las barras (inset-x-2 bottom-8 top-0), asi los porcentajes
              // de posicion se leen contra el area del grafico y no contra la tarjeta.
              <div className="pointer-events-none absolute inset-x-2 bottom-8 top-0 z-10">
                <div
                  className="absolute w-52 rounded-lg border border-gray-200 bg-white/95 p-3 shadow-xl backdrop-blur-sm dark:border-gray-600 dark:bg-gray-900/95"
                  style={{
                    left: `clamp(${HALF_TOOLTIP_PX}px, ${hoveredTooltip.left}%, calc(100% - ${HALF_TOOLTIP_PX}px))`,
                    bottom: `${hoveredTooltip.bottom}%`,
                    transform: "translateX(-50%)",
                  }}
                >
                  <p className="text-xs font-semibold text-gray-950 dark:text-white">{hoveredTooltip.item.month}</p>
                  <dl className="mt-2 space-y-1.5 text-[11px]">
                    <TooltipRow label="Ingresos" swatch="bg-emerald-500" valueClass="text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(hoveredTooltip.item.revenue, currency)}
                    </TooltipRow>
                    <TooltipRow label="Gastos" swatch="bg-rose-500" valueClass="text-rose-600 dark:text-rose-400">
                      {formatCurrency(hoveredTooltip.item.expenses, currency)}
                    </TooltipRow>
                    <div className="border-t border-gray-200 pt-1.5 dark:border-gray-700">
                      <TooltipRow
                        label="Utilidad neta"
                        swatch={hoveredTooltip.profit >= 0 ? "bg-sky-500" : "bg-rose-500"}
                        valueClass={
                          hoveredTooltip.profit >= 0
                            ? "text-sky-600 dark:text-sky-300"
                            : "text-rose-600 dark:text-rose-400"
                        }
                      >
                        {formatCurrency(hoveredTooltip.profit, currency)}
                      </TooltipRow>
                      <TooltipRow label="Usuarios" swatch="bg-indigo-500" valueClass="text-indigo-600 dark:text-indigo-300">
                        {hoveredTooltip.item.users}
                      </TooltipRow>
                    </div>
                  </dl>
                </div>
              </div>
            ) : null}

            <svg
              className="pointer-events-none absolute inset-x-2 bottom-8 top-0 h-[calc(100%-2rem)] w-[calc(100%-1rem)] overflow-visible text-indigo-600 dark:text-indigo-300"
              viewBox={`0 0 ${chartWidth} 200`}
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {/* La linea de usuarios cruza por encima de barras verdes y rojas, donde el
                  azul se pierde. Se dibuja dos veces: primero un trazo grueso del color
                  del fondo de la tarjeta (blanco, o gray-800 en oscuro) que hace de
                  contorno, y encima el trazo azul. */}
              <polyline
                points={chartLinePoints}
                fill="none"
                strokeWidth="7"
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                className="stroke-white dark:stroke-gray-800"
              />
              <polyline
                points={chartLinePoints}
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
              {chartData.map((item, index) => {
                const x = (index + 0.5) * (chartWidth / chartData.length);
                const y = 190 - (item.users / maxUsers) * 150;

                return (
                  <g key={`${item.month}-users`}>
                    <circle
                      cx={x}
                      cy={y}
                      r="5"
                      fill="currentColor"
                      strokeWidth="2"
                      vectorEffect="non-scaling-stroke"
                      className="stroke-white dark:stroke-gray-800"
                    />
                    {/* paintOrder="stroke" pinta el contorno debajo del relleno, asi el
                        numero azul conserva su forma y solo gana el halo alrededor. */}
                    <text
                      x={x}
                      y={Math.max(y - 12, 16)}
                      textAnchor="middle"
                      fill="currentColor"
                      strokeWidth="3"
                      strokeLinejoin="round"
                      paintOrder="stroke"
                      vectorEffect="non-scaling-stroke"
                      className="stroke-white text-[11px] font-semibold dark:stroke-gray-800"
                    >
                      {item.users}
                    </text>
                  </g>
                );
              })}
            </svg>

            <div className={`absolute inset-x-2 bottom-0 flex ${columnGapClass}`}>
              {chartData.map((item) => (
                <div
                  key={`${item.month}-label`}
                  className={`min-w-0 flex-1 py-2 text-center text-xs font-medium ${
                    item.isCurrent ? "text-sky-700 dark:text-sky-300" : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {item.month}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>
              {hasMovement
                ? `Escala monetaria: hasta ${formatCompactCurrency(maxMoney, currency)}`
                : "Sin ingresos ni gastos registrados en este periodo"}
            </span>
            <span>Usuarios: hasta {maxUsers}</span>
          </div>
        </div>

        <div className="space-y-3">
          {["Infraestructura", "Maquinaria", "Servicios"].map((category) => {
            const style = expenseCategoryStyles[category];
            const totals = categoryExpenseTotals[category] || { month: 0, year: 0 };

            return (
              <article
                key={category}
                className={`group rounded-lg border-2 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-lg dark:bg-gray-800 ${style.border}`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-125 ${style.circle}`}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      {style.icon}
                    </svg>
                  </span>
                  <p className={`text-xs font-semibold uppercase tracking-wide ${style.text}`}>{category}</p>
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Gastos registrados en esta categoria</p>
                <div className="mt-3 grid grid-cols-2 divide-x divide-gray-200 dark:divide-gray-700">
                  <div className="pr-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Mes</p>
                    <p className="mt-0.5 truncate text-lg font-semibold text-gray-950 dark:text-white">
                      {formatCurrency(totals.month, currency)}
                    </p>
                  </div>
                  <div className="pl-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Año</p>
                    <p className="mt-0.5 truncate text-lg font-semibold text-gray-950 dark:text-white">
                      {formatCurrency(totals.year, currency)}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-950 dark:text-white">Acciones rapidas</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Mantiene el resumen actualizado durante la operacion diaria.</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <ActionButton
            title="Registrar pago"
            description="Suma ingresos y descuenta cartera."
            onClick={() => setActiveAction(activeAction === "payment" ? null : "payment")}
            tone="green"
            icon={
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="2.5" y="6" width="19" height="12" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="2.25" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6 12h.01M18 12h.01" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          />
          <ActionButton
            title="Registrar gasto"
            description="Clasifica infraestructura, maquinaria o servicios."
            onClick={() => setActiveAction(activeAction === "expense" ? null : "expense")}
            tone="red"
            icon={
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M3 7l6 6 4-4 8 8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21 11v6h-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          />
          <ActionButton
            title="Descargar reporte"
            description="Exporta resumen, pagos y cartera en CSV."
            onClick={downloadReport}
            tone="gray"
            icon={
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M12 3v12m0 0l-4-4m4 4l4-4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          />
        </div>
      </div>

      {activeAction === "payment" ? (
        <ClientPaymentsTable
          key="payment-table"
          members={members}
          plans={plans}
          currency={currency}
          initialNameQuery={initialPaymentQuery}
          onCancel={() => setActiveAction(null)}
          onRenew={(memberId, method, startDate, planName) => {
            onRenewMembership(memberId, method, startDate, planName);
            showNotice("Membresia renovada y pago registrado.");
          }}
          onToggleSuspend={(memberId) => {
            onToggleSuspend(memberId);
            showNotice("Estado de la membresia actualizado.");
          }}
        />
      ) : null}

      {activeAction === "expense" ? (
        <ExpenseForm
          key="expense-form"
          onCancel={() => setActiveAction(null)}
          onSubmit={(expense) => {
            onRegisterExpense(expense);
            finishAction("Gasto registrado y utilidad actualizada.");
          }}
        />
      ) : null}

      {/* Los pesos salen de los tres anchos naturales medidos en el navegador, no a ojo:
          Pagos 384px, Gastos 473px, Cartera 325px (1182px en total). Con el reparto anterior
          (1 / 1.15 / 0.85) Gastos era la unica que no llegaba a lo suyo — a 1580px de ventana
          tenia 452px y necesitaba 473 — mientras las otras dos sobraban unos pocos pixeles.
          Lo que le falta a Gastos sale sobre todo del hueco entre tarjetas, no de las vecinas:
          `gap-x-5` en vez de `gap-6` devuelve 8px al contenido y no se nota. El resto sale de
          Pagos y de Cartera, en ese orden de preferencia inversa a lo que cuesta quedarse corto:
          en una tabla el scroll horizontal ESCONDE la columna Fecha, mientras que Cartera es una
          lista de div y como mucho parte el subtitulo en dos lineas sin ocultar nada.
          El eje vertical se queda en 6 para no cambiar el apilado en movil. */}
      <div className="grid gap-y-6 gap-x-5 xl:grid-cols-[minmax(0,0.99fr)_minmax(0,1.2fr)_minmax(0,0.81fr)]">
        <div
          className={`overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 ${dataCardAccent.emerald} ${leftLine.emerald}`}
        >
          <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <h2 className="text-base font-semibold text-gray-950 dark:text-white">Pagos recientes</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
              <thead className="bg-transparent text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                <tr>
                  <th className="px-4 py-3">Miembro</th>
                  <th className="px-4 py-3">Monto</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {data.recentPayments
                  .filter((payment) => payment.status !== "Pending")
                  .map((payment) => (
                  <tr
                    key={payment.paymentId}
                    className={`transition-colors ${paymentRowHover[payment.status] || paymentRowHover.Pending}`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-950 dark:text-white">{payment.memberName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{payment.planName}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-300">
                      {formatCurrency(payment.amount, payment.currency || currency)}
                    </td>
                    <td className="px-4 py-3">
                      <PaymentStatusBadge status={payment.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-300">
                      {formatDateSimple(payment.paidAt || payment.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div
          className={`overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 ${dataCardAccent.rose}`}
        >
          <div
            className={`border-b border-gray-200 ${leftLine.rose} px-4 py-3 dark:border-gray-700`}
          >
            <h2 className="text-base font-semibold text-gray-950 dark:text-white">Gastos recientes</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
              <thead className="bg-transparent text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                <tr>
                  <th className={`${leftLine.rose} px-4 py-3`}>Concepto</th>
                  <th className="px-4 py-3">Monto</th>
                  <th className="px-4 py-3">Pago</th>
                  <th className="px-4 py-3">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {data.recentExpenses.map((expense) => {
                  const rowStyle = getExpenseRowStyle(expense.category);

                  return (
                  <tr key={expense.expenseId} className={`transition-colors ${rowStyle.hover}`}>
                    <td className={`border-l-4 ${rowStyle.accent} px-4 py-3`}>
                      <p className="font-medium text-gray-950 dark:text-white">{expense.category}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{expense.description}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-300">
                      {formatCurrency(expense.amount, currency)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-300">
                      <p>{expense.paymentMethod || "-"}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{expense.provider || "Sin proveedor"}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-300">
                      {expense.expenseDate ? formatDateSimple(expense.expenseDate, true) : formatDateSimple(expense.createdAt)}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div
          className={`overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 ${dataCardAccent.rose} ${leftLine.rose}`}
        >
          <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <h2 className="text-base font-semibold text-gray-950 dark:text-white">Cartera por cobrar</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Saldos que requieren seguimiento.</p>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {data.accountsReceivable.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">No hay saldos pendientes.</p>
            ) : (
              data.accountsReceivable.map((receivable) => {
                const daysUntilDue = getDaysUntilDue(receivable.dueDate);
                const isOverdue = daysUntilDue !== null && daysUntilDue < 0;

                return (
                  // Mismo pastel que ya usan el monto y los dias de la fila: ambar mientras solo
                  // esta por vencer, rojo cuando ya vencio. Aqui las filas son div y no tr, asi que
                  // no compiten con el hover gris de `.app-content table tbody tr:hover` y no hace
                  // falta el "!" que si llevan las dos tablas vecinas.
                  <div
                    key={receivable.receivableId}
                    className={`flex items-center justify-between gap-4 px-4 py-3 transition-colors ${
                      isOverdue
                        ? "hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        : "hover:bg-amber-50 dark:hover:bg-amber-950/40"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-950 dark:text-white">{receivable.memberName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {receivable.planName}
                        {receivable.dueDate ? ` · ${isOverdue ? "Vencio" : "Vence"} ${formatDate(receivable.dueDate)}` : ""}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p
                        className={`text-sm font-semibold ${
                          isOverdue ? "text-red-700 dark:text-red-300" : "text-amber-700 dark:text-amber-300"
                        }`}
                      >
                        {formatCurrency(receivable.amount, currency)}
                      </p>
                      <p
                        className={`text-xs ${
                          isOverdue ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {describeDueDate(daysUntilDue)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
