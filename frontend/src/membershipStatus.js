// Un solo sitio para los colores del estado de la mensualidad.
//
// Lo usan la tabla de clientes (la franja de color a la izquierda de cada fila y la insignia de
// estado) y la tarjeta de membresia del perfil (su propia franja izquierda y el contador de dias
// restantes). Estaba solo en MembersTable, y al pedir "una linea como las de la base de datos" en
// la tarjeta la opcion facil era copiar el mapa: dos mapas equivalentes hoy que se separan en
// cuanto alguien retoque un tono en uno de los dos. Con un solo mapa son iguales por construccion.
//
// `status` lo decide el backend (MembershipStatusService, derivado de la fecha de fin y del estado
// de la suscripcion), no el componente: el umbral de "por vencer" es una regla de negocio y no debe
// reimplementarse aqui con otro numero.

export const membershipStatusStyles = {
  Active: {
    label: "Activa",
    row: "bg-white dark:bg-gray-800",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    accent: "border-l-emerald-500 dark:border-l-emerald-400",
    hover: "hover:!bg-emerald-50 dark:hover:!bg-emerald-950/40",
    // Circulo con las iniciales del cliente, en la ficha y en la tabla.
    avatar: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    // Barra de progreso del plan: se llena de verde a ambar y a rojo segun se agota.
    progress: "bg-emerald-500 dark:bg-emerald-400",
    // Dias que aun faltan en el calendario. Los ya consumidos se quedan verdes siempre (son
    // historia: ese tiempo se disfruto), asi que el aviso de "se esta acabando" lo dan estos.
    // Un tono mas claro que el de los consumidos para que la division siga leyendose cuando
    // ambos son verdes, es decir mientras el plan va bien.
    calendarPending: "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100",
    calendarPendingSwatch: "bg-emerald-50 ring-1 ring-emerald-200 dark:bg-emerald-950 dark:ring-emerald-800",
    // Contador de dias restantes: bloque de color solido, no la pastilla suave de la tabla.
    counter: "bg-emerald-500 shadow-emerald-500/20",
    counterCaption: "text-emerald-50",
  },
  ExpiringSoon: {
    label: "Por vencer",
    row: "bg-white dark:bg-gray-800",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    accent: "border-l-amber-500 dark:border-l-amber-400",
    hover: "hover:!bg-amber-50 dark:hover:!bg-amber-950/40",
    avatar: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    progress: "bg-amber-500 dark:bg-amber-400",
    calendarPending: "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-100",
    calendarPendingSwatch: "bg-amber-100 ring-1 ring-amber-300 dark:bg-amber-950 dark:ring-amber-700",
    // Naranja en el contador, ambar en la franja: la franja tiene que seguir siendo la misma que
    // la de la tabla, y el contador se pidio explicitamente naranja.
    counter: "bg-orange-500 shadow-orange-500/20",
    counterCaption: "text-orange-50",
  },
  Expired: {
    label: "Vencida",
    row: "bg-white dark:bg-gray-800",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
    accent: "border-l-rose-500 dark:border-l-rose-400",
    hover: "hover:!bg-rose-50 dark:hover:!bg-rose-950/40",
    avatar: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
    progress: "bg-rose-500 dark:bg-rose-400",
    calendarPending: "bg-rose-100 text-rose-900 dark:bg-rose-950/60 dark:text-rose-100",
    calendarPendingSwatch: "bg-rose-100 ring-1 ring-rose-300 dark:bg-rose-950 dark:ring-rose-700",
    counter: "bg-rose-500 shadow-rose-500/20",
    counterCaption: "text-rose-50",
  },
  Pending: {
    label: "Pendiente",
    row: "bg-gray-50 dark:bg-gray-900/60",
    badge: "bg-gray-100 text-gray-800",
    accent: "border-l-gray-400 dark:border-l-gray-500",
    hover: "hover:!bg-gray-100 dark:hover:!bg-gray-800/60",
    avatar: "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    progress: "bg-gray-400 dark:bg-gray-500",
    calendarPending: "bg-gray-100 text-gray-700 dark:bg-gray-800/60 dark:text-gray-200",
    calendarPendingSwatch: "bg-gray-100 ring-1 ring-gray-300 dark:bg-gray-800 dark:ring-gray-600",
    counter: "bg-gray-400 shadow-gray-400/20",
    counterCaption: "text-gray-50",
  },
  Suspended: {
    label: "Suspendida",
    row: "bg-gray-50 dark:bg-gray-900/60",
    badge: "bg-gray-100 text-gray-800",
    accent: "border-l-gray-400 dark:border-l-gray-500",
    hover: "hover:!bg-gray-100 dark:hover:!bg-gray-800/60",
    avatar: "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    progress: "bg-gray-400 dark:bg-gray-500",
    calendarPending: "bg-gray-100 text-gray-700 dark:bg-gray-800/60 dark:text-gray-200",
    calendarPendingSwatch: "bg-gray-100 ring-1 ring-gray-300 dark:bg-gray-800 dark:ring-gray-600",
    counter: "bg-gray-400 shadow-gray-400/20",
    counterCaption: "text-gray-50",
  },
  Cancelled: {
    label: "Cancelada",
    row: "bg-gray-50 dark:bg-gray-900/60",
    badge: "bg-gray-100 text-gray-800",
    accent: "border-l-gray-400 dark:border-l-gray-500",
    hover: "hover:!bg-gray-100 dark:hover:!bg-gray-800/60",
    avatar: "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    progress: "bg-gray-400 dark:bg-gray-500",
    calendarPending: "bg-gray-100 text-gray-700 dark:bg-gray-800/60 dark:text-gray-200",
    calendarPendingSwatch: "bg-gray-100 ring-1 ring-gray-300 dark:bg-gray-800 dark:ring-gray-600",
    counter: "bg-gray-400 shadow-gray-400/20",
    counterCaption: "text-gray-50",
  },
};

// `tailwindClass` es el color que ya manda el backend para la insignia; se respeta como respaldo
// para un estado que aun no este en el mapa, en vez de inventarle un color.
export function getMembershipStatusStyle(status, tailwindClass) {
  if (membershipStatusStyles[status]) {
    return membershipStatusStyles[status];
  }

  return {
    label: status || "Sin estado",
    row: "bg-white dark:bg-gray-900",
    badge: tailwindClass || "bg-gray-100 text-gray-800",
    accent: "border-l-gray-400 dark:border-l-gray-500",
    hover: "hover:!bg-gray-100 dark:hover:!bg-gray-800/60",
    avatar: "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    progress: "bg-gray-400 dark:bg-gray-500",
    calendarPending: "bg-gray-100 text-gray-700 dark:bg-gray-800/60 dark:text-gray-200",
    calendarPendingSwatch: "bg-gray-100 ring-1 ring-gray-300 dark:bg-gray-800 dark:ring-gray-600",
    counter: "bg-gray-400 shadow-gray-400/20",
    counterCaption: "text-gray-50",
  };
}
