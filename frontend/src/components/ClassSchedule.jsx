import { useMemo, useState } from "react";

const initialClassForm = {
  name: "",
  coach: "",
  date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
  time: "18:00",
  duration: "60",
  capacity: "12",
  room: "Salon principal",
};

// Plazas fijas de entrenador. No hay entidad ni endpoint para esto todavia, asi que
// son etiquetas locales y no usuarios reales del gimnasio.
const trainerSlots = Array.from({ length: 6 }, (_, index) => ({
  id: `entrenador-${index + 1}`,
  label: `Entrenador ${index + 1}`,
}));

function formatDate(date, time) {
  return new Intl.DateTimeFormat("es-CO", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(`${date}T${time}:00`));
}

export default function ClassSchedule({
  classes,
  classCatalog = [],
  members,
  reservations,
  canManageClasses,
  currentUser,
  trainerAssignments = {},
  onAssignMembersToTrainer,
  onUnassignMemberTrainer,
  onCreateClassWithReservation,
  onReserve,
  onCancelReservation,
}) {
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || "");
  const [selectedMemberId, setSelectedMemberId] = useState(members[0]?.memberId || "");
  const [classForm, setClassForm] = useState({ ...initialClassForm, coach: currentUser.name });
  const [notice, setNotice] = useState(null);
  const [memberQuery, setMemberQuery] = useState("");
  const [scheduleMemberId, setScheduleMemberId] = useState("");
  const [scheduleNotice, setScheduleNotice] = useState(null);
  const [assignmentQuery, setAssignmentQuery] = useState("");
  const [selectedForAssignment, setSelectedForAssignment] = useState([]);
  const [activeTrainerId, setActiveTrainerId] = useState("");
  const [trainerFilter, setTrainerFilter] = useState("all");
  const [assignmentNotice, setAssignmentNotice] = useState(null);

  const scheduleMembers = useMemo(() => {
    const query = memberQuery.trim().toLowerCase();

    return members.filter((member) => !query || member.fullName.toLowerCase().includes(query));
  }, [members, memberQuery]);

  const assignmentMembers = useMemo(() => {
    const query = assignmentQuery.trim().toLowerCase();

    return members.filter((member) => !query || member.fullName.toLowerCase().includes(query));
  }, [members, assignmentQuery]);

  // La seleccion se guarda por id, no por fila visible: al cambiar el filtro se conserva
  // lo ya marcado, que es lo que permite filtrar y seguir sumando miembros.
  const selectedIds = useMemo(() => new Set(selectedForAssignment), [selectedForAssignment]);
  const visibleIds = assignmentMembers.map((member) => member.memberId);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const someVisibleSelected = visibleIds.some((id) => selectedIds.has(id));
  const activeTrainer = trainerSlots.find((item) => item.id === activeTrainerId);

  // Se cuenta sobre los miembros actuales, no sobre el mapa: un miembro eliminado no
  // debe seguir sumando en el total de su entrenador.
  const assignmentCounts = useMemo(() => {
    const counts = {};

    members.forEach((member) => {
      const trainerId = trainerAssignments[member.memberId];

      if (trainerId) {
        counts[trainerId] = (counts[trainerId] || 0) + 1;
      }
    });

    return counts;
  }, [members, trainerAssignments]);

  const assignedMembers = useMemo(
    () =>
      members.filter((member) => {
        const trainerId = trainerAssignments[member.memberId];

        return trainerFilter === "all" ? Boolean(trainerId) : trainerId === trainerFilter;
      }),
    [members, trainerAssignments, trainerFilter],
  );

  const selectedClass = classes.find((item) => item.id === selectedClassId) || classes[0];
  const selectedReservations = reservations.filter(
    (reservation) => reservation.classId === selectedClass?.id && reservation.status === "confirmed",
  );

  const classCards = useMemo(
    () =>
      [...classes].sort((a, b) =>
        `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`),
      ),
    [classes],
  );

  async function reserve(event) {
    event.preventDefault();
    const result = await onReserve(selectedClass.id, selectedMemberId);
    setNotice(result);
  }

  function toggleMemberSelection(memberId) {
    setAssignmentNotice(null);
    setSelectedForAssignment((current) =>
      current.includes(memberId) ? current.filter((id) => id !== memberId) : [...current, memberId],
    );
  }

  function toggleVisibleSelection() {
    setAssignmentNotice(null);
    setSelectedForAssignment((current) =>
      allVisibleSelected
        ? current.filter((id) => !visibleIds.includes(id))
        : Array.from(new Set([...current, ...visibleIds])),
    );
  }

  function assignSelectedMembers() {
    if (!activeTrainer || selectedForAssignment.length === 0) {
      return;
    }

    const total = selectedForAssignment.length;

    onAssignMembersToTrainer?.(activeTrainer.id, selectedForAssignment);
    setAssignmentNotice({
      message: `${total} ${total === 1 ? "miembro asignado" : "miembros asignados"} a ${activeTrainer.label}.`,
    });
    setSelectedForAssignment([]);
    // Deja el filtro en el entrenador recien asignado para que el conteo se vea de una vez.
    setTrainerFilter(activeTrainer.id);
  }

  function applyClassTemplate(name) {
    const template = classCatalog.find((item) => item.name === name);

    setClassForm((current) => ({
      ...current,
      name,
      ...(template
        ? {
            coach: template.coach,
            duration: String(template.duration),
            capacity: String(template.capacity),
            room: template.room,
          }
        : {}),
    }));
  }

  async function createClass(event) {
    event.preventDefault();

    if (!classForm.name.trim() || !classForm.coach.trim()) {
      return;
    }

    if (!scheduleMemberId) {
      setScheduleNotice({ ok: false, message: "Selecciona un miembro de la lista para confirmar la reserva." });
      return;
    }

    const newClass = {
      id: crypto.randomUUID(),
      ...classForm,
      name: classForm.name.trim(),
      coach: classForm.coach.trim(),
      duration: Number(classForm.duration),
      capacity: Number(classForm.capacity),
    };
    const result = await onCreateClassWithReservation(newClass, scheduleMemberId);
    setScheduleNotice(result);

    if (result?.ok) {
      // The API assigns the real id; fall back to the local one for demo accounts.
      setSelectedClassId(result.id || newClass.id);
      setClassForm({ ...initialClassForm, coach: currentUser.name });
      setScheduleMemberId("");
      setMemberQuery("");
    }
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Clases programadas</p>
          <p className="mt-2 text-3xl font-bold">{classes.length}</p>
        </article>
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Reservas activas</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">
            {reservations.filter((item) => item.status === "confirmed").length}
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Cupos disponibles</p>
          <p className="mt-2 text-3xl font-bold text-sky-600">
            {classes.reduce(
              (total, item) =>
                total +
                Math.max(
                  0,
                  item.capacity -
                    reservations.filter(
                      (reservation) => reservation.classId === item.id && reservation.status === "confirmed",
                    ).length,
                ),
              0,
            )}
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Entrenadores</p>
          <p className="mt-2 text-3xl font-bold text-violet-600">{new Set(classes.map((item) => item.coach)).size}</p>
        </article>
      </div>

      {canManageClasses ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-lg shadow-emerald-500/10 dark:border-slate-800 dark:bg-slate-900 dark:shadow-emerald-900/30">
          <div>
            <h2 className="text-lg font-bold">Asignacion de entrenadores</h2>
            <p className="text-sm text-slate-500">
              Filtra y marca los miembros que quieras, elige un entrenador y confirma la asignacion.
            </p>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <div className="max-h-80 overflow-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
                  <thead className="sticky top-0 z-10 bg-white text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                    <tr>
                      <th className="w-12 border-l-4 border-l-emerald-500 px-4 py-3 dark:border-l-emerald-400">
                        <input
                          type="checkbox"
                          checked={allVisibleSelected}
                          ref={(node) => {
                            if (node) {
                              node.indeterminate = someVisibleSelected && !allVisibleSelected;
                            }
                          }}
                          onChange={toggleVisibleSelection}
                          disabled={visibleIds.length === 0}
                          aria-label="Seleccionar todos los miembros visibles"
                          className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 dark:border-gray-600"
                        />
                      </th>
                      <th className="px-4 py-3">
                        <div className="flex min-w-44 flex-col gap-2">
                          <span>Miembro</span>
                          <input
                            type="text"
                            value={assignmentQuery}
                            onChange={(event) => setAssignmentQuery(event.target.value)}
                            placeholder="Buscar por nombre..."
                            className="h-8 rounded-md border border-gray-300 !bg-gray-50 px-2 text-xs font-medium normal-case text-gray-700 outline-none focus:border-gray-900 dark:border-gray-600 dark:!bg-slate-900 dark:text-gray-100 dark:focus:border-gray-200"
                          />
                        </div>
                      </th>
                      <th className="px-4 py-3 text-right">Entrenador</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {assignmentMembers.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                          {members.length === 0
                            ? "No hay miembros registrados."
                            : "No se encontraron miembros con ese nombre."}
                        </td>
                      </tr>
                    ) : null}
                    {assignmentMembers.map((member) => {
                      const isChecked = selectedIds.has(member.memberId);
                      const trainer = trainerSlots.find((item) => item.id === trainerAssignments[member.memberId]);

                      return (
                        <tr
                          key={member.memberId}
                          onClick={() => toggleMemberSelection(member.memberId)}
                          className={`cursor-pointer transition-colors ${
                            isChecked
                              ? "bg-emerald-50/70 dark:bg-emerald-950/20"
                              : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                          }`}
                        >
                          <td
                            className={`border-l-4 px-4 py-3 ${
                              isChecked ? "border-l-emerald-500 dark:border-l-emerald-400" : "border-l-transparent"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleMemberSelection(member.memberId)}
                              onClick={(event) => event.stopPropagation()}
                              aria-label={`Seleccionar a ${member.fullName}`}
                              className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 dark:border-gray-600"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                                {member.fullName.split(" ").map((name) => name[0]).slice(0, 2).join("")}
                              </span>
                              <div className="min-w-0">
                                <div className="truncate font-semibold text-gray-950 dark:text-white">
                                  {member.fullName}
                                </div>
                                <div className="truncate text-xs text-gray-500 dark:text-gray-400">{member.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {trainer ? (
                              <span className="inline-flex rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
                                {trainer.label}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 dark:text-slate-500">Sin asignar</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-l-4 border-slate-200/80 border-l-emerald-500 px-4 py-3 text-xs text-gray-500 dark:border-slate-800 dark:border-l-emerald-400 dark:text-gray-400">
                <span>
                  Mostrando {assignmentMembers.length} de {members.length} miembros ·{" "}
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {selectedForAssignment.length} seleccionados
                  </span>
                </span>
                {selectedForAssignment.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setSelectedForAssignment([])}
                    className="font-semibold text-rose-600 hover:text-rose-700"
                  >
                    Limpiar seleccion
                  </button>
                ) : null}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  Entrenadores
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <div className="grid grid-cols-2 gap-2">
                    {trainerSlots.map((trainer) => {
                      const isActive = activeTrainerId === trainer.id;

                      return (
                        <button
                          key={trainer.id}
                          type="button"
                          onClick={() => {
                            setActiveTrainerId(trainer.id);
                            setAssignmentNotice(null);
                          }}
                          className={`h-11 rounded-xl border px-3 text-sm font-semibold transition ${
                            isActive
                              ? "border-violet-400 bg-violet-50 text-violet-700 shadow-sm dark:border-violet-500 dark:bg-violet-950/40 dark:text-violet-200"
                              : "border-slate-200 bg-white text-slate-600 hover:border-violet-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                          }`}
                        >
                          {trainer.label}
                          {assignmentCounts[trainer.id] ? (
                            <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-violet-600 px-1.5 text-[11px] font-bold text-white dark:bg-violet-500">
                              {assignmentCounts[trainer.id]}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={assignSelectedMembers}
                    disabled={!activeTrainer || selectedForAssignment.length === 0}
                    className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-white shadow-md shadow-emerald-500/20 transition hover:bg-emerald-600 disabled:opacity-40"
                  >
                    Asignar
                  </button>
                </div>

                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  {!activeTrainer
                    ? "Elige un entrenador para habilitar la asignacion."
                    : selectedForAssignment.length === 0
                      ? `Selecciona miembros en la tabla para asignarlos a ${activeTrainer.label}.`
                      : `Se ${
                          selectedForAssignment.length === 1
                            ? "asignara 1 miembro"
                            : `asignaran ${selectedForAssignment.length} miembros`
                        } a ${activeTrainer.label}.`}
                </p>

                {assignmentNotice ? (
                  <p
                    className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200"
                    aria-live="polite"
                  >
                    {assignmentNotice.message}
                  </p>
                ) : null}
              </div>

              <div className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Filtrar por entrenador
                  </span>
                  <select
                    value={trainerFilter}
                    onChange={(event) => setTrainerFilter(event.target.value)}
                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                  >
                    <option value="all">Todos los entrenadores</option>
                    {trainerSlots.map((trainer) => (
                      <option key={trainer.id} value={trainer.id}>
                        {trainer.label} ({assignmentCounts[trainer.id] || 0})
                      </option>
                    ))}
                  </select>
                </label>

                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                  <span className="text-lg font-bold text-violet-600 dark:text-violet-400">{assignedMembers.length}</span>{" "}
                  {assignedMembers.length === 1 ? "miembro asignado" : "miembros asignados"}
                  {trainerFilter === "all" ? " en total" : ""}.
                </p>

                <div className="mt-2 max-h-44 space-y-1 overflow-y-auto">
                  {assignedMembers.length === 0 ? (
                    <p className="py-3 text-sm text-slate-500 dark:text-slate-400">Aun no hay miembros asignados.</p>
                  ) : (
                    assignedMembers.map((member) => (
                      <div
                        key={member.memberId}
                        className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                            {member.fullName}
                          </p>
                          {trainerFilter === "all" ? (
                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                              {trainerSlots.find((item) => item.id === trainerAssignments[member.memberId])?.label}
                            </p>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => onUnassignMemberTrainer?.(member.memberId)}
                          className="shrink-0 text-xs font-semibold text-rose-600 hover:text-rose-700"
                        >
                          Quitar
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {classCards.map((gymClass) => {
              const booked = reservations.filter(
                (item) => item.classId === gymClass.id && item.status === "confirmed",
              ).length;
              const isSelected = selectedClass?.id === gymClass.id;
              const percentage = Math.min((booked / gymClass.capacity) * 100, 100);

              return (
                <button
                  key={gymClass.id}
                  type="button"
                  onClick={() => {
                    setSelectedClassId(gymClass.id);
                    setNotice(null);
                  }}
                  className={`rounded-2xl border p-5 text-left transition ${
                    isSelected
                      ? "border-emerald-400 bg-emerald-50/70 shadow-md shadow-emerald-500/10 dark:bg-emerald-950/20"
                      : "border-slate-200/80 bg-white hover:border-emerald-200 dark:border-slate-800 dark:bg-slate-900"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-bold">{gymClass.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{formatDate(gymClass.date, gymClass.time)}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {gymClass.duration} min
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-slate-500">{gymClass.coach} · {gymClass.room}</span>
                    <span className="font-bold">{booked}/{gymClass.capacity}</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full ${percentage >= 90 ? "bg-amber-500" : "bg-emerald-500"}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {canManageClasses ? (
            <form onSubmit={createClass} className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div>
                <h2 className="text-lg font-bold">Programar clase</h2>
                <p className="text-sm text-slate-500">Crea una sesion, elige un miembro y confirma su reserva.</p>
              </div>
              <div className="mt-5 grid gap-5 lg:grid-cols-[250px_minmax(0,1fr)]">
                <div className="lg:border-r lg:border-slate-200 lg:pr-5 dark:lg:border-slate-800">
                  <input
                    type="text"
                    value={memberQuery}
                    onChange={(event) => setMemberQuery(event.target.value)}
                    placeholder="Buscar por nombre..."
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                  <p className="mt-3 border-b border-slate-200 pb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:border-slate-800">
                    Miembro
                  </p>
                  <div className="mt-1 max-h-72 space-y-1 overflow-y-auto">
                    {scheduleMembers.length === 0 ? (
                      <p className="px-2 py-4 text-sm text-slate-500">No se encontraron miembros con ese nombre.</p>
                    ) : (
                      scheduleMembers.map((member) => {
                        const isSelected = scheduleMemberId === member.memberId;

                        return (
                          <button
                            key={member.memberId}
                            type="button"
                            onClick={() => {
                              setScheduleMemberId(member.memberId);
                              setScheduleNotice(null);
                            }}
                            className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition ${
                              isSelected
                                ? "bg-slate-100 ring-1 ring-inset ring-slate-300 dark:bg-slate-800 dark:ring-slate-600"
                                : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                            }`}
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                              {member.fullName.split(" ").map((name) => name[0]).slice(0, 2).join("")}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-semibold text-slate-950 dark:text-white">{member.fullName}</span>
                              <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{member.email}</span>
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                <div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <label>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Clase</span>
                      <select
                        value={classForm.name}
                        onChange={(event) => applyClassTemplate(event.target.value)}
                        className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                        required
                      >
                        <option value="" disabled>
                          {classCatalog.length === 0 ? "Sin clases registradas" : "Selecciona una clase"}
                        </option>
                        {classCatalog.map((template) => (
                          <option key={template.id} value={template.name}>
                            {template.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    {[
                      ["coach", "Entrenador", "Nombre del entrenador", "text"],
                      ["date", "Fecha", "", "date"],
                      ["time", "Hora", "", "time"],
                      ["duration", "Duracion (min)", "60", "number"],
                      ["capacity", "Capacidad", "12", "number"],
                      ["room", "Espacio", "Salon principal", "text"],
                    ].map(([field, label, placeholder, type]) => (
                      <label key={field} className={field === "room" ? "sm:col-span-2" : ""}>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</span>
                        <input
                          type={type}
                          min={type === "number" ? "1" : undefined}
                          value={classForm[field]}
                          onChange={(event) => setClassForm((current) => ({ ...current, [field]: event.target.value }))}
                          className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                          placeholder={placeholder}
                          required
                        />
                      </label>
                    ))}
                  </div>

                  {classCatalog.length === 0 ? (
                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                      Registra clases en Configuracion para que aparezcan aqui automaticamente.
                    </p>
                  ) : null}

                  {scheduleNotice ? (
                    <p
                      className={`mt-4 rounded-xl px-4 py-3 text-sm font-medium ${
                        scheduleNotice.ok
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200"
                          : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200"
                      }`}
                      aria-live="polite"
                    >
                      {scheduleNotice.message}
                    </p>
                  ) : null}

                  <div className="mt-5 flex justify-end">
                    <button
                      type="submit"
                      className="h-11 rounded-xl bg-emerald-500 px-8 text-sm font-bold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-600"
                    >
                      Confirmar reserva
                    </button>
                  </div>
                </div>
              </div>
            </form>
          ) : null}
        </div>

        <aside className="space-y-6">
          <form onSubmit={reserve} className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-600">Reservar cupo</p>
            <h2 className="mt-2 text-xl font-bold">{selectedClass?.name}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {selectedClass ? formatDate(selectedClass.date, selectedClass.time) : "Selecciona una clase"}
            </p>

            <label className="mt-5 block">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Cliente</span>
              <select
                value={selectedMemberId}
                onChange={(event) => {
                  setSelectedMemberId(event.target.value);
                  setNotice(null);
                }}
                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
              >
                {members.map((member) => (
                  <option key={member.memberId} value={member.memberId}>
                    {member.fullName} · {member.planName}
                  </option>
                ))}
              </select>
            </label>

            {notice ? (
              <p className={`mt-4 rounded-xl px-4 py-3 text-sm font-medium ${
                notice.ok
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200"
                  : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200"
              }`}>
                {notice.message}
              </p>
            ) : null}

            <button type="submit" disabled={!selectedClass || !selectedMemberId} className="mt-5 h-11 w-full rounded-xl bg-emerald-500 text-sm font-bold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-600 disabled:opacity-40">
              Confirmar reserva
            </button>
          </form>

          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-lg shadow-emerald-500/10 dark:border-slate-800 dark:bg-slate-900 dark:shadow-emerald-900/30">
            <div className="border-b border-l-4 border-slate-200 border-l-emerald-500 px-5 py-4 dark:border-slate-800 dark:border-l-emerald-400">
              <h2 className="font-bold">Lista de asistentes</h2>
              <p className="text-xs text-slate-500">{selectedReservations.length} reservas confirmadas</p>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {selectedReservations.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-slate-500">Aun no hay reservas.</p>
              ) : (
                selectedReservations.map((reservation) => {
                  const member = members.find((item) => item.memberId === reservation.memberId);
                  return (
                    <div key={reservation.id} className="flex items-center justify-between gap-3 px-5 py-3">
                      <div>
                        <p className="text-sm font-semibold">{member?.fullName || "Cliente"}</p>
                        <p className="text-xs text-slate-500">{member?.planName}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onCancelReservation(reservation.id)}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                      >
                        Cancelar
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
