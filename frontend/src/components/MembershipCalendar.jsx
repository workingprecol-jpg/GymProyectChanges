import { useEffect, useState } from "react";
import { getMembershipStatusStyle } from "../membershipStatus.js";

function parseDate(value) {
  const [year, month, day] = String(value).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("es-CO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(parseDate(value));
}

function getCalendarDays(monthDate) {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const calendarStart = new Date(firstDay);
  calendarStart.setDate(firstDay.getDate() - ((firstDay.getDay() + 6) % 7));

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);
    return date;
  });
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function getMonthStart(value) {
  const date = parseDate(value);
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

const dateDisplayClass =
  "flex h-10 w-full items-center rounded-md border border-gray-200 bg-gray-50 px-3 text-sm font-medium text-gray-950 dark:border-gray-700 dark:bg-gray-950/60 dark:text-gray-50";

export default function MembershipCalendar({ member }) {
  const [visibleMonth, setVisibleMonth] = useState(() => getMonthStart(member?.startDate || new Date().toISOString().slice(0, 10)));

  useEffect(() => {
    if (member?.startDate) {
      setVisibleMonth(getMonthStart(member.startDate));
    }
  }, [member?.memberId, member?.startDate]);

  if (!member) {
    return null;
  }

  const start = parseDate(member.startDate);
  const end = parseDate(member.endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = toDateKey(today);
  const endKey = member.endDate;
  const calendarDays = getCalendarDays(visibleMonth);
  const totalDays = Math.max(1, Math.ceil((end - start) / 86400000) + 1);
  const elapsedDays = clamp(Math.ceil((today - start) / 86400000), 0, totalDays);
  const remainingDays = Math.max(0, member.daysToExpire);
  const progress = clamp((elapsedDays / totalDays) * 100, 0, 100);
  // El contador de dias sale del mismo estado que pinta la tabla de clientes, asi que su color no
  // puede contradecir ni a la franja del recuadro exterior (la pone MemberDetail) ni a la insignia
  // de la fila. La franja no va aqui a proposito: envuelve toda la ficha, no solo la mensualidad.
  const statusStyle = getMembershipStatusStyle(member.status, member.tailwindClass);
  const monthLabel = new Intl.DateTimeFormat("es-CO", {
    month: "long",
    year: "numeric",
  }).format(visibleMonth);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex flex-col gap-3 border-b border-gray-200 pb-3 sm:flex-row sm:items-center sm:justify-between dark:border-gray-700">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Membresia</p>
          {/* Las fechas que iban aqui debajo se quitaron: ya estan completas en los campos
              Inicio / Fin justo abajo, y repetirlas solo restaba sitio al nombre del plan. */}
          <h3 className="text-3xl font-bold text-gray-950 dark:text-white">{member.planName}</h3>
        </div>
        <div className={`rounded-2xl px-4 py-3 text-center text-white shadow-md ${statusStyle.counter}`}>
          <p className="text-2xl font-semibold">{remainingDays}</p>
          <p className={`text-xs font-medium uppercase tracking-wide ${statusStyle.counterCaption}`}>dias restantes</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1 text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">Inicio</span>
          <p className={dateDisplayClass}>{formatDate(member.startDate)}</p>
        </div>
        <div className="space-y-1 text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">Fin</span>
          <p className={dateDisplayClass}>{formatDate(member.endDate)}</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">{totalDays} dias de suscripcion</span>
          <span className="text-gray-500 dark:text-gray-400">{Math.round(progress)}% usado</span>
        </div>
        {/* La barra va cambiando de verde a ambar y a rojo a medida que el plan se agota, en vez
            del turquesa fijo de antes: el color sale del mismo estado que la franja de la ficha y
            el contador, asi que los tres avisan a la vez y ninguno contradice a los otros. */}
        <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div className={`h-full rounded-full ${statusStyle.progress}`} style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setVisibleMonth((current) => addMonths(current, -1))}
          className="h-9 rounded-md border border-gray-300 px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          Anterior
        </button>
        <span className="text-sm font-semibold capitalize text-gray-800 dark:text-gray-100">{monthLabel}</span>
        <button
          type="button"
          onClick={() => setVisibleMonth((current) => addMonths(current, 1))}
          className="h-9 rounded-md border border-gray-300 px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          Siguiente
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">
        {["L", "M", "M", "J", "V", "S", "D"].map((day, index) => (
          <div key={`${day}-${index}`} className="py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {calendarDays.map((date) => {
          const key = toDateKey(date);
          const isInMonth = date.getMonth() === visibleMonth.getMonth();
          const isInRange = date >= start && date <= end;
          const isUsed = isInRange && date < today;
          const isEnd = key === endKey;
          const isToday = key === todayKey;

          return (
            <div
              key={key}
              className={`flex h-9 items-center justify-center rounded-md text-xs font-semibold ${
                isInRange
                  ? isUsed
                    ? // Los dias ya consumidos se quedan verdes pase lo que pase: son historia, ese
                      // tiempo ya se disfruto, y repintarlos de rojo al vencer contaria otra cosa.
                      "bg-teal-100 text-teal-900 dark:bg-teal-950/70 dark:text-teal-100"
                    : // Los que faltan si llevan el color del estado, asi que el calendario va del
                      // verde al ambar y al rojo a medida que el plan se agota.
                      statusStyle.calendarPending
                  : "text-gray-400 dark:text-gray-500"
              } ${!isInMonth ? "opacity-50" : ""} ${
                isEnd ? "bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-100" : ""
              } ${isToday ? "ring-2 ring-gray-950 dark:ring-white" : ""}`}
              title={isEnd ? "Fin" : isToday ? "Hoy" : undefined}
            >
              {date.getDate()}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-300">
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-teal-100 ring-1 ring-teal-200 dark:bg-teal-950 dark:ring-teal-700" />
          Usado
        </span>
        {/* La muestra de "Pendiente" tiene que seguir al estado igual que las celdas, o la leyenda
            estaria prometiendo un color que el calendario ya no pinta. */}
        <span className="inline-flex items-center gap-2">
          <span className={`h-3 w-3 rounded ${statusStyle.calendarPendingSwatch}`} />
          Pendiente
        </span>
        {/* No hay marca de "Inicio": el primer dia del plan ya se lee como el primero de la
            secuencia coloreada, y su verde chocaba con el verde de los dias consumidos. */}
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-red-100 ring-1 ring-red-200" />
          Fin
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-white ring-2 ring-gray-950 dark:bg-gray-900 dark:ring-white" />
          Hoy
        </span>
      </div>
    </div>
  );
}
