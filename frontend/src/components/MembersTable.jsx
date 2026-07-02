const statusStyles = {
  Active: {
    row: "bg-white dark:bg-gray-800",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    label: "Activa",
  },
  ExpiringSoon: {
    row: "bg-white dark:bg-gray-800",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    label: "Por vencer",
  },
  Expired: {
    row: "bg-white dark:bg-gray-800",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
    label: "Vencida",
  },
  Pending: {
    row: "bg-gray-50 dark:bg-gray-900/60",
    badge: "bg-gray-100 text-gray-800",
    label: "Pendiente",
  },
  Suspended: {
    row: "bg-gray-50 dark:bg-gray-900/60",
    badge: "bg-gray-100 text-gray-800",
    label: "Suspendida",
  },
  Cancelled: {
    row: "bg-gray-50 dark:bg-gray-900/60",
    badge: "bg-gray-100 text-gray-800",
    label: "Cancelada",
  },
};

function getStatusStyle(status, tailwindClass) {
  if (statusStyles[status]) {
    return statusStyles[status];
  }

  return {
    row: "bg-white dark:bg-gray-900",
    badge: tailwindClass || "bg-gray-100 text-gray-800",
    label: status || "Sin estado",
  };
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const [year, month, day] = String(value).split("-").map(Number);
  const date = year && month && day ? new Date(year, month - 1, day) : new Date(value);

  return new Intl.DateTimeFormat("es-CO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

export default function MembersTable({
  members = [],
  selectedMemberId,
  membershipFilter = "all",
  onMembershipFilterChange,
  onSelectMember,
  isLoading = false,
}) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
        Cargando miembros...
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
        No hay miembros para mostrar.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
          <thead className="bg-slate-50/80 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">Miembro</th>
              <th className="px-4 py-3">
                <div className="flex min-w-44 flex-col gap-2">
                  <span>Membresia</span>
                  {onMembershipFilterChange ? (
                    <select
                      className="h-8 rounded-md border border-gray-300 bg-white px-2 text-xs font-medium normal-case text-gray-700 outline-none focus:border-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-gray-200"
                      value={membershipFilter}
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) => onMembershipFilterChange(event.target.value)}
                    >
                      <option value="all">Todas</option>
                      <option value="Active">Activas</option>
                      <option value="ExpiringSoon">Por vencer</option>
                      <option value="Expired">Vencidas</option>
                    </select>
                  ) : null}
                </div>
              </th>
              <th className="px-4 py-3">Inicio</th>
              <th className="px-4 py-3">Vence</th>
              <th className="px-4 py-3">Dias restantes</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {members.map((member) => {
              const style = getStatusStyle(member.status, member.tailwindClass);

              return (
                <tr
                  key={member.memberId}
                  className={`${style.row} cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/80 ${
                    selectedMemberId === member.memberId ? "bg-emerald-50/70 ring-1 ring-inset ring-emerald-400 dark:bg-emerald-950/20" : ""
                  }`}
                  onClick={() => onSelectMember?.(member)}
                >
                  <td className="px-4 py-3">
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
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    <div className="font-medium text-gray-900 dark:text-gray-100">{member.planName}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{formatDate(member.startDate)} - {formatDate(member.endDate)}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{formatDate(member.startDate)}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{formatDate(member.endDate)}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{member.daysToExpire}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${style.badge}`}>
                      {style.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
