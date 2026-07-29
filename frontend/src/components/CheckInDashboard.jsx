import { useMemo, useState } from "react";

import BirthDatePicker from "./BirthDatePicker";

const statusStyles = {
  Active: {
    row: "bg-white dark:bg-gray-800",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    accent: "border-l-emerald-500 dark:border-l-emerald-400",
    hover: "hover:!bg-emerald-50 dark:hover:!bg-emerald-950/40",
    label: "Activa",
  },
  ExpiringSoon: {
    row: "bg-white dark:bg-gray-800",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    accent: "border-l-amber-500 dark:border-l-amber-400",
    hover: "hover:!bg-amber-50 dark:hover:!bg-amber-950/40",
    label: "Por vencer",
  },
  Expired: {
    row: "bg-white dark:bg-gray-800",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
    accent: "border-l-rose-500 dark:border-l-rose-400",
    hover: "hover:!bg-rose-50 dark:hover:!bg-rose-950/40",
    label: "Vencida",
  },
  Suspended: {
    row: "bg-gray-50 dark:bg-gray-900/60",
    badge: "bg-gray-100 text-gray-800",
    accent: "border-l-gray-400 dark:border-l-gray-500",
    hover: "hover:!bg-gray-100 dark:hover:!bg-gray-800/60",
    label: "Suspendida",
  },
};

function getStatusStyle(status) {
  return statusStyles[status] || {
    row: "bg-white dark:bg-gray-800",
    badge: "bg-gray-100 text-gray-800",
    accent: "border-l-gray-400 dark:border-l-gray-500",
    hover: "hover:!bg-gray-100 dark:hover:!bg-gray-800/60",
    label: status || "Sin estado",
  };
}

// "Registro reciente" es historico: el motivo guardado dice en que estado estaba el plan en el
// momento de esa visita, no en que estado esta el miembro hoy. Por eso la linea y el badge de esa
// fila se derivan del motivo y no del miembro: una entrada de hace un mes debe seguir contando lo
// que paso entonces. Los motivos que el backend puede devolver y no estan aqui ("Sin plan
// registrado", "Pago pendiente", "Plan cancelado") caen al gris neutro de `getStatusStyle`.
const reasonToStatus = {
  "Plan activo": "Active",
  "Plan por vencer": "ExpiringSoon",
  "Plan vencido": "Expired",
  "Plan suspendido": "Suspended",
};

const MAX_VISIBLE_MEMBERS = 10;
const LOGS_PER_PAGE = 10;

// Mismo aspecto que los filtros de la tabla de clientes. `normal-case` es necesario porque el
// thead aplica `uppercase` a todo lo que cuelga de el, incluidos los controles.
const filterControlClass =
  "h-8 rounded-md border border-gray-300 !bg-gray-50 px-2 text-xs font-medium normal-case text-gray-700 outline-none focus:border-gray-900 dark:border-gray-600 dark:!bg-slate-900 dark:text-gray-100 dark:focus:border-gray-200";

function getDateKey(value) {
  const date = value ? new Date(value) : new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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

function formatDateTime(value) {
  return new Intl.DateTimeFormat("es-CO", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getResultMessage(result) {
  if (result.action === "check-out") {
    return `Salida registrada ${formatDateTime(result.checkedOutAt)}.`;
  }

  if (result.action === "duplicate") {
    return result.reason;
  }

  if (!result.accessGranted) {
    return `Entrada bloqueada: ${result.reason}.`;
  }

  return `Entrada registrada ${formatDateTime(result.checkedAt)}.`;
}

function StatCard({ label, value, tone = "emerald" }) {
  const tones = {
    emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300",
    rose: "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300",
    amber: "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300",
    sky: "bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-300",
  };

  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tones[tone]}`}>
          <span className="h-2.5 w-2.5 rounded-full bg-current" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">{value}</p>
    </article>
  );
}

export default function CheckInDashboard({
  members,
  attendanceLogs,
  onCheckIn,
  onCheckOut,
  onReviewPayment,
  canReviewPayment = false,
}) {
  const [nameQuery, setNameQuery] = useState("");
  const [lastResult, setLastResult] = useState(null);
  const [logNameQuery, setLogNameQuery] = useState("");
  const [accessFilter, setAccessFilter] = useState("all");
  const [reasonFilter, setReasonFilter] = useState("all");
  const [logDate, setLogDate] = useState("");
  const [logPage, setLogPage] = useState(1);

  // Cambiar cualquier filtro vuelve a la primera pagina: quedarse en la pagina 3 de un resultado
  // que ahora tiene una sola es la forma mas rapida de creer que el filtro no encontro nada.
  function applyLogFilter(setter) {
    return (valor) => {
      setter(valor);
      setLogPage(1);
    };
  }

  const visibleMembers = useMemo(() => {
    const query = nameQuery.trim().toLowerCase();

    return members.filter((member) => !query || member.fullName.toLowerCase().includes(query));
  }, [members, nameQuery]);

  const totalVisibleCount = visibleMembers.length;
  const displayedMembers = visibleMembers.slice(0, MAX_VISIBLE_MEMBERS);

  const todayLogs = useMemo(() => {
    const todayKey = getDateKey();

    return attendanceLogs.filter((log) => getDateKey(log.checkedAt) === todayKey);
  }, [attendanceLogs]);

  // Los estados ofrecidos salen de los propios registros, igual que el filtro de plan en la tabla
  // de clientes: asi cada opcion visible corresponde a algo realmente registrado y no se listan
  // motivos que nunca han ocurrido en este gimnasio.
  const reasonOptions = useMemo(
    () => [...new Set(attendanceLogs.map((log) => log.reason).filter(Boolean))].sort(),
    [attendanceLogs],
  );

  const visibleLogs = useMemo(() => {
    const query = logNameQuery.trim().toLowerCase();

    return attendanceLogs.filter((log) => {
      if (query && !log.fullName.toLowerCase().includes(query)) {
        return false;
      }

      if (accessFilter !== "all" && String(Boolean(log.accessGranted)) !== accessFilter) {
        return false;
      }

      if (reasonFilter !== "all" && log.reason !== reasonFilter) {
        return false;
      }

      // Se compara por clave local YYYY-MM-DD, no convirtiendo la fecha elegida a UTC: el registro
      // se guarda en UTC y en Colombia (UTC-5) una entrada de las 7 p. m. cae al dia siguiente en
      // UTC. Comparando la fecha tal como la ve el usuario, el dia que elige es el que ve escrito
      // en la columna Entrada.
      return !logDate || getDateKey(log.checkedAt) === logDate;
    });
  }, [attendanceLogs, logNameQuery, accessFilter, reasonFilter, logDate]);

  const logPageCount = Math.max(1, Math.ceil(visibleLogs.length / LOGS_PER_PAGE));
  // Si un filtro reduce el resultado a menos paginas de las que hay ahora, la pagina actual dejaria
  // de existir y la tabla se veria vacia sin motivo. Se recorta al vuelo en vez de con un efecto,
  // asi no hay un render intermedio en blanco.
  const currentLogPage = Math.min(logPage, logPageCount);
  const logPageStart = (currentLogPage - 1) * LOGS_PER_PAGE;
  const displayedLogs = visibleLogs.slice(logPageStart, logPageStart + LOGS_PER_PAGE);

  function getOpenAttendance(memberId) {
    return attendanceLogs.find((log) => log.memberId === memberId && log.accessGranted && !log.checkedOutAt);
  }

  async function handleCheckIn(memberId) {
    const log = await onCheckIn?.(memberId);

    if (log) {
      setLastResult(log);
    }
  }

  async function handleCheckOut(memberId) {
    const log = await onCheckOut?.(memberId);

    if (log) {
      setLastResult(log);
    }
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Entradas hoy" value={todayLogs.filter((log) => log.accessGranted).length} />
        <StatCard label="Accesos bloqueados" value={todayLogs.filter((log) => !log.accessGranted).length} tone="rose" />
        <StatCard label="Planes por vencer" value={members.filter((member) => member.status === "ExpiringSoon").length} tone="amber" />
        <StatCard label="Personas dentro" value={attendanceLogs.filter((log) => log.accessGranted && !log.checkedOutAt).length} tone="sky" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-lg shadow-emerald-500/10 dark:border-slate-800 dark:bg-slate-900 dark:shadow-emerald-900/30">
        <div className="border-b border-l-4 border-gray-200 !border-l-emerald-500 px-4 py-3 dark:border-gray-700 dark:!border-l-emerald-400">
          <h2 className="text-base font-semibold text-gray-950 dark:text-white">Check-in de entrada</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Busca un cliente y valida su entrada o su salida.</p>
        </div>

        {lastResult ? (
          <div
            className={`border-b px-4 py-2.5 text-sm ${
              lastResult.accessGranted
                ? "border-emerald-100 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200"
                : "border-rose-100 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200"
            }`}
            aria-live="polite"
          >
            <span className="font-semibold">{lastResult.fullName}:</span> {getResultMessage(lastResult)}
          </div>
        ) : null}

        {members.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">No hay clientes disponibles para check-in.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
              <thead className="bg-transparent text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="border-l-4 border-l-emerald-500 px-4 py-3 dark:border-l-emerald-400">
                    <div className="flex min-w-44 flex-col gap-2">
                      <span>Miembro</span>
                      <input
                        type="text"
                        value={nameQuery}
                        onChange={(event) => setNameQuery(event.target.value)}
                        placeholder="Buscar por nombre..."
                        className="h-8 rounded-md border border-gray-300 !bg-gray-50 px-2 text-xs font-medium normal-case text-gray-700 outline-none focus:border-gray-900 dark:border-gray-600 dark:!bg-slate-900 dark:text-gray-100 dark:focus:border-gray-200"
                      />
                    </div>
                  </th>
                  <th className="px-4 py-3 align-top">Membresia</th>
                  <th className="px-4 py-3 align-top">Estado</th>
                  <th className="px-4 py-3 align-top">Vence</th>
                  <th className="px-4 py-3 align-top">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {totalVisibleCount === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                      No se encontraron clientes con ese nombre.
                    </td>
                  </tr>
                ) : (
                  displayedMembers.map((member) => {
                    const style = getStatusStyle(member.status);
                    const isSuspended = member.status === "Suspended";
                    const isExpired = member.status === "Expired" || member.daysToExpire < 0;
                    const isBlocked = isExpired || isSuspended;
                    const openAttendance = getOpenAttendance(member.memberId);

                    return (
                      <tr key={member.memberId} className={`${style.row} transition-colors ${style.hover}`}>
                        <td className={`border-l-4 ${style.accent} px-4 py-3`}>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                              {member.fullName.split(" ").map((name) => name[0]).slice(0, 2).join("")}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-950 dark:text-white">{member.fullName}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{member.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{member.planName}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${style.badge}`}>
                            {style.label}
                          </span>
                          {openAttendance ? (
                            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-current" />
                              Dentro desde {formatDateTime(openAttendance.checkedAt)}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <div className={isExpired ? "font-medium text-rose-600 dark:text-rose-300" : "text-gray-700 dark:text-gray-300"}>
                            {formatDateShort(member.endDate)}
                          </div>
                          {isExpired ? (
                            <div className="text-xs text-rose-500 dark:text-rose-400">Plan finalizado</div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleCheckIn(member.memberId)}
                              disabled={isBlocked || Boolean(openAttendance)}
                              title={
                                isBlocked
                                  ? isSuspended
                                    ? "La membresia esta suspendida."
                                    : "La membresia esta vencida."
                                  : openAttendance
                                    ? "El cliente ya tiene una entrada activa."
                                    : "Registra el dia y la hora de entrada."
                              }
                              className="h-9 rounded-md bg-emerald-500 px-3 text-xs font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 dark:disabled:bg-gray-700 dark:disabled:text-gray-400"
                            >
                              Validar entrada
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCheckOut(member.memberId)}
                              disabled={!openAttendance}
                              title={openAttendance ? "Cierra la visita activa." : "El cliente no tiene una entrada activa."}
                              className="h-9 rounded-md border border-sky-600 bg-sky-50 px-3 text-xs font-semibold text-sky-800 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-400 dark:border-sky-500 dark:bg-sky-950/40 dark:text-sky-200 dark:hover:bg-sky-950/70 dark:disabled:border-gray-600 dark:disabled:bg-gray-800 dark:disabled:text-gray-500"
                            >
                              Validar salida
                            </button>
                            {isBlocked && canReviewPayment ? (
                              <button
                                type="button"
                                onClick={() => onReviewPayment?.(member.memberId)}
                                title="Abre el registro de pagos en Finanzas."
                                className="h-9 rounded-md border border-amber-300 bg-white px-3 text-xs font-semibold text-amber-700 transition hover:bg-amber-50 dark:border-amber-700 dark:bg-transparent dark:text-amber-300 dark:hover:bg-amber-950/30"
                              >
                                Revisar pago
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
        {totalVisibleCount > 0 ? (
          <div className="border-t border-l-4 border-slate-200/80 border-l-emerald-500 px-4 py-3 text-center text-xs text-gray-500 dark:border-slate-800 dark:border-l-emerald-400 dark:text-gray-400">
            Mostrando {displayedMembers.length} de {totalVisibleCount} miembros registrados.
          </div>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white !shadow-lg !shadow-emerald-500/10 dark:border-gray-700 dark:bg-gray-800 dark:!shadow-emerald-900/30">
        <div className="border-b border-l-4 border-gray-200 !border-l-emerald-500 px-4 py-3 dark:border-gray-700 dark:!border-l-emerald-400">
          <h2 className="text-base font-semibold text-gray-950 dark:text-white">Registro reciente</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
            <thead className="bg-transparent text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
              <tr>
                <th className="border-l-4 border-l-emerald-500 px-4 py-3 dark:border-l-emerald-400">
                  <div className="flex min-w-44 flex-col gap-2">
                    <span>Cliente</span>
                    <input
                      type="text"
                      value={logNameQuery}
                      onChange={(event) => applyLogFilter(setLogNameQuery)(event.target.value)}
                      placeholder="Buscar por nombre..."
                      className={filterControlClass}
                    />
                  </div>
                </th>
                <th className="px-4 py-3 align-top">Plan</th>
                <th className="px-4 py-3">
                  <div className="flex min-w-32 flex-col gap-2">
                    <span>Acceso</span>
                    <select
                      className={filterControlClass}
                      value={accessFilter}
                      onChange={(event) => applyLogFilter(setAccessFilter)(event.target.value)}
                    >
                      <option value="all">Todos</option>
                      <option value="true">Permitido</option>
                      <option value="false">Bloqueado</option>
                    </select>
                  </div>
                </th>
                <th className="px-4 py-3">
                  <div className="flex min-w-40 flex-col gap-2">
                    <span>Estado</span>
                    <select
                      className={filterControlClass}
                      value={reasonFilter}
                      onChange={(event) => applyLogFilter(setReasonFilter)(event.target.value)}
                    >
                      <option value="all">Todos</option>
                      {reasonOptions.map((reason) => (
                        <option key={reason} value={reason}>
                          {reason}
                        </option>
                      ))}
                    </select>
                  </div>
                </th>
                <th className="px-4 py-3">
                  <div className="flex min-w-36 flex-col gap-2">
                    <span>Entrada</span>
                    <BirthDatePicker
                      value={logDate}
                      onChange={applyLogFilter(setLogDate)}
                      allowClear
                      compact
                      placeholder="Todas"
                    />
                  </div>
                </th>
                <th className="px-4 py-3 align-top">Salida</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {visibleLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                    No hay registros con los filtros aplicados.
                  </td>
                </tr>
              ) : null}
              {displayedLogs.map((log) => {
                const reasonStyle = getStatusStyle(reasonToStatus[log.reason] || log.reason);

                return (
                <tr key={log.id} className="bg-white dark:bg-gray-800">
                  <td
                    className={`border-l-4 ${reasonStyle.accent} px-4 py-3 font-medium text-gray-950 dark:text-white`}
                  >
                    {log.fullName}
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{log.planName}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        log.accessGranted ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {log.accessGranted ? "Permitido" : "Bloqueado"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${reasonStyle.badge}`}
                    >
                      {log.reason}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{formatDateTime(log.checkedAt)}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    {log.autoClosed ? (
                      // No se muestra la hora a proposito: es el corte configurado, no una salida
                      // observada, y presentarla como hora real seria inventar el dato.
                      <span
                        className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400"
                        title="Nadie registro la salida. El sistema cerro la visita automaticamente."
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        Cierre automatico
                      </span>
                    ) : log.checkedOutAt ? (
                      formatDateTime(log.checkedOutAt)
                    ) : log.accessGranted ? (
                      "Dentro"
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {visibleLogs.length > 0 ? (
          <div className="flex items-center justify-center gap-3 border-t border-l-4 border-gray-200 !border-l-emerald-500 px-4 py-3 text-center text-xs text-gray-500 dark:border-gray-700 dark:!border-l-emerald-400 dark:text-gray-400">
            {logPageCount > 1 ? (
              <button
                type="button"
                onClick={() => setLogPage(currentLogPage - 1)}
                disabled={currentLogPage === 1}
                className="rounded-md border border-gray-300 px-2 py-1 font-semibold transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                Anterior
              </button>
            ) : null}
            <span>
              Mostrando {logPageStart + 1}-{logPageStart + displayedLogs.length} de {visibleLogs.length} registros.
            </span>
            {logPageCount > 1 ? (
              <button
                type="button"
                onClick={() => setLogPage(currentLogPage + 1)}
                disabled={currentLogPage === logPageCount}
                className="rounded-md border border-gray-300 px-2 py-1 font-semibold transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                Siguiente
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
