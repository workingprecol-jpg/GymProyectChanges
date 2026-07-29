import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const POPUP_WIDTH = 288; // w-72
const POPUP_HEIGHT = 300; // alto real medido del panel; solo se usa para decidir si abre hacia arriba
const VIEWPORT_MARGIN = 8;

const MONTH_LABELS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sept", "Oct", "Nov", "Dic"];
const WEEKDAY_LABELS = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];
const YEARS_PER_PAGE = 12;

function parseDateValue(value) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function getCalendarDays(monthDate) {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const calendarStart = new Date(firstDay);
  calendarStart.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);
    return date;
  });
}

function getYearPageStart(year) {
  return Math.floor(year / YEARS_PER_PAGE) * YEARS_PER_PAGE;
}

function CalendarIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3.75 8.25h16.5M5.25 5.25h13.5a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-12a1.5 1.5 0 0 1 1.5-1.5Z" />
    </svg>
  );
}

function ChevronDownIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

function ChevronLeftIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  );
}

function ChevronRightIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

function formatDisplayDate(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getFullYear()}`;
}

// `allowClear`, `compact` y `placeholder` existen para poder reusar este calendario como filtro
// (el "Registro reciente" de Check-in) sin duplicarlo. Van por defecto en el comportamiento previo,
// asi que el uso original en ClientForm no cambia.
export default function BirthDatePicker({
  value,
  onChange,
  max,
  allowClear = false,
  compact = false,
  placeholder = "dd/mm/aaaa",
}) {
  const containerRef = useRef(null);
  const popupRef = useRef(null);
  const [anchor, setAnchor] = useState(null);
  const selectedDate = parseDateValue(value);
  const maxDate = parseDateValue(max);
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState("days");
  const [visibleMonth, setVisibleMonth] = useState(() => selectedDate || maxDate || new Date());
  const [yearPageStart, setYearPageStart] = useState(() =>
    getYearPageStart((selectedDate || maxDate || new Date()).getFullYear()),
  );

  // El panel se dibuja en un portal con posicion fija en vez de `absolute` dentro del campo. Es
  // necesario para poder usarlo dentro de una tabla: la tarjeta del "Registro reciente" tiene
  // `overflow-hidden` y su contenedor `overflow-x-auto`, asi que un panel absoluto se recortaba
  // (con una sola fila visible se perdian 244 de sus 298 px). Fijo y fuera del arbol, no lo puede
  // recortar ningun ancestro.
  const updateAnchor = useCallback(() => {
    const rect = containerRef.current?.getBoundingClientRect();

    if (rect) {
      setAnchor({ top: rect.top, bottom: rect.bottom, right: rect.right, left: rect.left });
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event) {
      const dentroDelCampo = containerRef.current?.contains(event.target);
      const dentroDelPanel = popupRef.current?.contains(event.target);

      if (!dentroDelCampo && !dentroDelPanel) {
        setIsOpen(false);
        setView("days");
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
        setView("days");
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    // `true` para capturar el scroll de cualquier contenedor intermedio, no solo el de la ventana.
    window.addEventListener("scroll", updateAnchor, true);
    window.addEventListener("resize", updateAnchor);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", updateAnchor, true);
      window.removeEventListener("resize", updateAnchor);
    };
  }, [isOpen, updateAnchor]);

  function openPicker() {
    const reference = selectedDate || maxDate || new Date();
    setVisibleMonth(reference);
    setYearPageStart(getYearPageStart(reference.getFullYear()));
    setView("days");
    updateAnchor();
    setIsOpen(true);
  }

  function togglePicker() {
    if (isOpen) {
      setIsOpen(false);
      setView("days");
    } else {
      openPicker();
    }
  }

  function handleSelectDay(date) {
    onChange(toDateKey(date));
    setIsOpen(false);
    setView("days");
  }

  function handleSelectMonth(monthIndex) {
    setVisibleMonth((current) => new Date(current.getFullYear(), monthIndex, 1));
    setView("days");
  }

  function handleSelectYear(year) {
    setVisibleMonth((current) => new Date(year, current.getMonth(), 1));
    setView("days");
  }

  const calendarDays = getCalendarDays(visibleMonth);
  const monthLabel = new Intl.DateTimeFormat("es-CO", { month: "long" }).format(visibleMonth);

  function getPopupStyle() {
    if (!anchor) {
      return { display: "none" };
    }

    // Alineado a la derecha del campo, como cuando era `right-0`, pero sin salirse de la pantalla.
    const left = Math.min(
      Math.max(VIEWPORT_MARGIN, anchor.right - POPUP_WIDTH),
      window.innerWidth - POPUP_WIDTH - VIEWPORT_MARGIN,
    );
    const abreArriba =
      window.innerHeight - anchor.bottom < POPUP_HEIGHT + VIEWPORT_MARGIN &&
      anchor.top > POPUP_HEIGHT + VIEWPORT_MARGIN;

    return {
      position: "fixed",
      left,
      width: POPUP_WIDTH,
      ...(abreArriba
        ? { bottom: window.innerHeight - anchor.top + VIEWPORT_MARGIN }
        : { top: anchor.bottom + VIEWPORT_MARGIN }),
    };
  }

  return (
    <div className="relative" ref={containerRef}>
      <span
        className={`pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center text-gray-400 dark:text-gray-500 ${
          compact ? "pl-2" : "pl-3"
        }`}
      >
        <CalendarIcon />
      </span>
      <button
        type="button"
        onClick={togglePicker}
        className={`w-full rounded-md border border-gray-300 !bg-gray-100 text-left outline-none transition focus:border-gray-900 focus:!bg-white focus:ring-2 focus:ring-gray-200 dark:border-gray-600 dark:!bg-gray-800 dark:focus:border-gray-200 dark:focus:!bg-gray-900 dark:focus:ring-gray-700 ${
          compact ? "h-8 pl-7 pr-7 text-xs font-medium normal-case" : "h-10 pl-9 pr-3 text-sm"
        } ${
          selectedDate
            ? "text-gray-950 shadow-[0_0_0_1.5px_rgba(16,185,129,0.55),0_8px_18px_-8px_rgba(16,185,129,0.4)] dark:text-gray-50 dark:shadow-[0_0_0_1.5px_rgba(52,211,153,0.45),0_8px_18px_-8px_rgba(16,185,129,0.35)]"
            : "text-gray-400 dark:text-gray-500"
        }`}
      >
        {selectedDate ? formatDisplayDate(selectedDate) : placeholder}
      </button>

      {allowClear && selectedDate ? (
        <button
          type="button"
          onClick={() => {
            onChange("");
            setIsOpen(false);
            setView("days");
          }}
          aria-label="Quitar filtro de fecha"
          title="Quitar filtro de fecha"
          className="absolute inset-y-0 right-0 z-10 flex items-center pr-2 text-gray-400 transition hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-200"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-3.5 w-3.5">
            <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      ) : null}

      {isOpen
        ? createPortal(
        <div
          ref={popupRef}
          style={getPopupStyle()}
          className="z-50 rounded-xl border border-gray-200 bg-white p-3 shadow-xl dark:border-gray-700 dark:bg-gray-900"
        >
          {view === "days" ? (
            <>
              <div className="flex items-center justify-between gap-1">
                <button
                  type="button"
                  onClick={() => setView("months")}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold capitalize text-gray-800 transition hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800"
                >
                  {monthLabel}
                  <ChevronDownIcon className="h-3.5 w-3.5" />
                </button>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setVisibleMonth((current) => addMonths(current, -1))}
                    aria-label="Mes anterior"
                    className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibleMonth((current) => addMonths(current, 1))}
                    aria-label="Mes siguiente"
                    className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setYearPageStart(getYearPageStart(visibleMonth.getFullYear()));
                    setView("years");
                  }}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold text-gray-800 transition hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800"
                >
                  {visibleMonth.getFullYear()}
                  <ChevronDownIcon className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-gray-400 dark:text-gray-500">
                {WEEKDAY_LABELS.map((day, index) => (
                  <div key={`${day}-${index}`}>{day}</div>
                ))}
              </div>

              <div className="mt-1 grid grid-cols-7 gap-1">
                {calendarDays.map((date) => {
                  const key = toDateKey(date);
                  const isDisabled = Boolean(maxDate) && date > maxDate;
                  const isSelected = Boolean(selectedDate) && key === toDateKey(selectedDate);
                  const isCurrentMonth = date.getMonth() === visibleMonth.getMonth();
                  const isToday = key === toDateKey(new Date());

                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => handleSelectDay(date)}
                      className={`flex h-8 items-center justify-center rounded-md text-xs font-medium transition ${
                        isSelected
                          ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
                          : isDisabled
                            ? "cursor-not-allowed text-gray-300 dark:text-gray-700"
                            : "text-gray-700 hover:bg-emerald-50 dark:text-gray-200 dark:hover:bg-emerald-950/40"
                      } ${!isCurrentMonth && !isSelected ? "opacity-40" : ""} ${
                        isToday && !isSelected ? "ring-1 ring-inset ring-emerald-400" : ""
                      }`}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </>
          ) : null}

          {view === "months" ? (
            <>
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => setView("days")}
                  className="rounded-md px-2 py-1 text-sm font-semibold text-gray-800 transition hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800"
                >
                  {visibleMonth.getFullYear()}
                </button>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {MONTH_LABELS.map((label, index) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => handleSelectMonth(index)}
                    className={`rounded-md px-2 py-2 text-xs font-medium transition ${
                      index === visibleMonth.getMonth()
                        ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
                        : "text-gray-700 hover:bg-emerald-50 dark:text-gray-200 dark:hover:bg-emerald-950/40"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </>
          ) : null}

          {view === "years" ? (
            <>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setYearPageStart((current) => current - YEARS_PER_PAGE)}
                  aria-label="Decada anterior"
                  className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {yearPageStart} - {yearPageStart + YEARS_PER_PAGE - 1}
                </span>
                <button
                  type="button"
                  onClick={() => setYearPageStart((current) => current + YEARS_PER_PAGE)}
                  aria-label="Decada siguiente"
                  className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {Array.from({ length: YEARS_PER_PAGE }, (_, index) => yearPageStart + index).map((year) => {
                  const isDisabled = Boolean(maxDate) && year > maxDate.getFullYear();
                  return (
                    <button
                      key={year}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => handleSelectYear(year)}
                      className={`rounded-md px-2 py-2 text-xs font-medium transition ${
                        year === visibleMonth.getFullYear()
                          ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
                          : isDisabled
                            ? "cursor-not-allowed text-gray-300 dark:text-gray-700"
                            : "text-gray-700 hover:bg-emerald-50 dark:text-gray-200 dark:hover:bg-emerald-950/40"
                      }`}
                    >
                      {year}
                    </button>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>,
            document.body,
          )
        : null}
    </div>
  );
}
