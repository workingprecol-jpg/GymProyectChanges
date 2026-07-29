import { useMemo, useState } from "react";
import { estimateBodyFat } from "../bodyFat.js";

const initialMeasurement = {
  date: new Date().toISOString().slice(0, 10),
  weightKg: "",
  chestCm: "",
  armCm: "",
  waistCm: "",
  hipCm: "",
  legCm: "",
  bodyFatPercentage: "",
};

const initialGoal = {
  title: "",
  targetValue: "",
  unit: "kg",
  targetDate: new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10),
};

function formatDate(value) {
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

const MONTHS_SHOWN = 8;

function formatMonthLabel(monthKey, withYear) {
  const month = new Intl.DateTimeFormat("es-CO", { month: "short", timeZone: "UTC" })
    .format(new Date(`${monthKey}-01T00:00:00Z`))
    .replace(".", "");
  return withYear ? `${month} ${monthKey.slice(2, 4)}` : month;
}

function TrendChart({ records, field, label, unit, color = "text-emerald-500" }) {
  // Un punto por mes, no por medicion: el eje mostraba la fecha exacta, asi que dos
  // mediciones del mismo dia salian como dos etiquetas identicas y una linea plana.
  // Se toma la ultima medicion de cada mes, que es donde quedo el cliente al cerrarlo.
  const byMonth = new Map();
  for (const record of records) {
    if (!Number.isFinite(record[field])) continue;
    byMonth.set(record.date.slice(0, 7), record);
  }

  // Sin mediciones no se dibuja ningun mes: un eje con meses vacios sugiere que hubo
  // seguimiento y no lo hubo.
  const points = [...byMonth.entries()].slice(-MONTHS_SHOWN);
  if (points.length === 0) {
    return (
      <div className="flex h-44 items-center justify-center rounded-2xl bg-slate-50 px-4 text-center text-sm text-slate-400 dark:bg-slate-950/50">
        Aun no hay mediciones de {label.toLowerCase()}.
      </div>
    );
  }

  const values = points.map(([, record]) => record[field]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);
  const width = 600;
  const height = 150;
  const plotTop = 18;
  const plotBottom = height - 30;
  // Con un solo mes no hay pendiente que dibujar: el punto se centra en vez de pegarse
  // arriba, que es donde caeria al ser a la vez el maximo y el minimo.
  const isSinglePoint = points.length === 1;
  const spanYears = points[0][0].slice(0, 4) !== points.at(-1)[0].slice(0, 4);
  const coordinates = points.map(([monthKey, record], index) => ({
    x: isSinglePoint ? width / 2 : 28 + index * ((width - 56) / (points.length - 1)),
    y: isSinglePoint ? (plotTop + plotBottom) / 2 : plotTop + ((max - record[field]) / range) * (plotBottom - plotTop),
    monthKey,
    record,
  }));

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-bold">{label}</p>
        <p className={`text-sm font-bold ${color}`}>
          {values.at(-1)} {unit}
        </p>
      </div>
      <div className="overflow-hidden rounded-2xl bg-slate-50 p-3 dark:bg-slate-950/50">
        <svg viewBox={`0 0 ${width} ${height}`} className={`h-40 w-full ${color}`} role="img" aria-label={`Tendencia de ${label}`}>
          {[35, 75, 115].map((y) => (
            <line key={y} x1="20" x2={width - 20} y1={y} y2={y} stroke="currentColor" strokeOpacity=".12" />
          ))}
          {isSinglePoint ? null : (
            <polyline
              points={coordinates.map((point) => `${point.x},${point.y}`).join(" ")}
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {coordinates.map(({ x, y, monthKey }) => (
            <g key={monthKey}>
              <circle cx={x} cy={y} r="6" fill="currentColor" />
              <text x={x} y={height - 8} textAnchor="middle" fill="currentColor" className="text-[10px]">
                {formatMonthLabel(monthKey, spanYears)}
              </text>
            </g>
          ))}
        </svg>
      </div>
      {isSinglePoint ? (
        <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
          Un solo mes con mediciones. La tendencia se dibuja cuando haya otro.
        </p>
      ) : null}
    </div>
  );
}

export default function MemberProgress({
  member,
  records,
  goals,
  notes,
  canEdit,
  currentUser,
  onAddMeasurement,
  onAddGoal,
  onToggleGoal,
  onAddNote,
}) {
  const [measurement, setMeasurement] = useState(initialMeasurement);
  const [goal, setGoal] = useState(initialGoal);
  const [note, setNote] = useState("");

  const memberRecords = useMemo(
    () =>
      records
        .filter((record) => record.memberId === member?.memberId)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [member?.memberId, records],
  );
  const memberGoals = goals.filter((item) => item.memberId === member?.memberId);
  const memberNotes = notes
    .filter((item) => item.memberId === member?.memberId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const latest = memberRecords.at(-1);
  const first = memberRecords[0];

  // Estimacion con el peso de la ultima medicion; la altura, edad y sexo salen de la ficha
  // porque no cambian entre mediciones. Solo se usa cuando no hay un valor medido a mano.
  const estimatedBodyFat = estimateBodyFat({
    weightKg: latest?.weightKg ?? member?.bodyMetrics?.weightKg,
    heightCm: member?.bodyMetrics?.heightCm,
    age: member?.age,
    gender: member?.gender,
  });

  // La del formulario usa el peso que se esta escribiendo, para que la sugerencia
  // acompane a lo que el usuario teclea y no al historial anterior.
  const estimatedForForm = estimateBodyFat({
    weightKg: measurement.weightKg,
    heightCm: member?.bodyMetrics?.heightCm,
    age: member?.age,
    gender: member?.gender,
  });

  const bodyFatValue = latest?.bodyFatPercentage ?? estimatedBodyFat;
  const bodyFatIsEstimated = latest?.bodyFatPercentage == null && estimatedBodyFat != null;

  // Cuando falta algun dato la formula no se puede aplicar. Sin este aviso el campo se
  // quedaba vacio sin explicar por que, que parece que la funcion esta rota.
  const missingForBodyFat = [
    Number(member?.bodyMetrics?.heightCm) > 0 ? null : "la estatura",
    Number(member?.age) > 0 ? null : "la fecha de nacimiento",
  ].filter(Boolean);

  // Solo hay variacion si ambos extremos tienen el dato y son mediciones distintas. Antes
  // restaba nulos, asi que una metrica nunca medida mostraba "0.0 % desde el inicio"
  // debajo de un guion.
  function diffSinceStart(field) {
    if (!first || !latest || first === latest) return null;
    // El descarte de null va antes de convertir: Number(null) es 0 y pasa isFinite, asi que
    // una medida sin tomar se comparaba como cero y salia una variacion inventada
    // ("-75.0 cm desde el inicio" debajo de un guion).
    if (first[field] == null || latest[field] == null) return null;
    const from = Number(first[field]);
    const to = Number(latest[field]);
    if (!Number.isFinite(from) || !Number.isFinite(to)) return null;
    return to - from;
  }

  if (!member) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
        Selecciona un cliente para revisar su progreso.
      </div>
    );
  }

  function submitMeasurement(event) {
    event.preventDefault();
    const payload = {
      id: crypto.randomUUID(),
      memberId: member.memberId,
      date: measurement.date,
      weightKg: Number(measurement.weightKg) || null,
      chestCm: Number(measurement.chestCm) || null,
      armCm: Number(measurement.armCm) || null,
      waistCm: Number(measurement.waistCm) || null,
      hipCm: Number(measurement.hipCm) || null,
      legCm: Number(measurement.legCm) || null,
      // Si el entrenador no escribe un valor medido, se guarda la estimacion: asi la
      // medicion queda con grasa en el historial en vez de un guion permanente.
      bodyFatPercentage: Number(measurement.bodyFatPercentage) || estimatedForForm,
      recordedBy: currentUser.name,
    };

    onAddMeasurement(payload);
    setMeasurement(initialMeasurement);
  }

  function submitGoal(event) {
    event.preventDefault();
    if (!goal.title.trim()) return;
    onAddGoal({
      id: crypto.randomUUID(),
      memberId: member.memberId,
      ...goal,
      title: goal.title.trim(),
      targetValue: Number(goal.targetValue) || null,
      completed: false,
      createdAt: new Date().toISOString(),
    });
    setGoal(initialGoal);
  }

  function submitNote(event) {
    event.preventDefault();
    if (!note.trim()) return;
    onAddNote({
      id: crypto.randomUUID(),
      memberId: member.memberId,
      text: note.trim(),
      author: currentUser.name,
      createdAt: new Date().toISOString(),
    });
    setNote("");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-sm font-bold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
            {member.fullName.split(" ").map((name) => name[0]).slice(0, 2).join("")}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-600 dark:text-violet-400">Seguimiento activo</p>
            <h2 className="text-xl font-bold">{member.fullName}</h2>
            <p className="text-sm text-slate-500">{member.planName} · {member.email}</p>
          </div>
        </div>
        <div className="rounded-xl bg-slate-50 px-4 py-3 text-right dark:bg-slate-950/60">
          <p className="text-xs font-semibold text-slate-500">Ultima medicion</p>
          <p className="font-bold">{latest ? formatDate(latest.date) : "Sin registros"}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          // El peso cae a la ficha del cliente si aun no hay mediciones: los socios dados de
          // alta antes de que el registro creara la medicion inicial no tienen historial.
          ["Peso actual", latest?.weightKg ?? member.bodyMetrics?.weightKg, "kg", diffSinceStart("weightKg")],
          // La estatura sale siempre de la ficha, no del historial: no es una medida que
          // cambie con el entrenamiento, asi que no tiene serie temporal ni variacion.
          ["Estatura", member.bodyMetrics?.heightCm, "cm", null],
          ["Cintura", latest?.waistCm, "cm", diffSinceStart("waistCm")],
          // Sin medicion manual se muestra la estimada, y la etiqueta lo dice para que
          // nadie la confunda con una lectura de plicometro o bioimpedancia.
          [
            bodyFatIsEstimated ? "Grasa corporal (estimada)" : "Grasa corporal",
            bodyFatValue,
            "%",
            diffSinceStart("bodyFatPercentage"),
          ],
          ["Objetivos activos", memberGoals.filter((item) => !item.completed).length, "", null],
        ].map(([label, value, unit, change]) => (
          <article key={label} className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-bold">{value ?? "-"}{value != null && unit ? ` ${unit}` : ""}</p>
            {change != null ? (
              <p className={`mt-1 text-xs font-semibold ${change <= 0 ? "text-emerald-600" : "text-amber-600"}`}>
                {change > 0 ? "+" : ""}{change.toFixed(1)} {unit} desde el inicio
              </p>
            ) : null}
          </article>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <TrendChart records={memberRecords} field="weightKg" label="Peso" unit="kg" />
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <TrendChart records={memberRecords} field="waistCm" label="Cintura" unit="cm" color="text-violet-500" />
        </div>
      </div>

      {canEdit ? (
        <form onSubmit={submitMeasurement} className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-bold">Registrar medicion</h2>
          <p className="text-sm text-slate-500">Agrega una nueva evaluacion corporal al historial.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["date", "Fecha", "date"],
              ["weightKg", "Peso kg", "number"],
              ["chestCm", "Pecho cm", "number"],
              ["armCm", "Brazo cm", "number"],
              ["waistCm", "Cintura cm", "number"],
              ["hipCm", "Cadera cm", "number"],
              ["legCm", "Pierna cm", "number"],
              ["bodyFatPercentage", "Grasa %", "number"],
            ].map(([field, label, type]) => (
              // La grasa se calcula sola al escribir el peso. La sugerencia va de placeholder
              // y no de value, para poder sobrescribirla con una medicion real sin pelearse
              // con el campo controlado.
              <label key={field}>
                <span className="text-sm font-semibold">{label}</span>
                <input
                  type={type}
                  min={type === "number" ? "0" : undefined}
                  step={type === "number" ? "0.1" : undefined}
                  value={measurement[field]}
                  onChange={(event) => setMeasurement((current) => ({ ...current, [field]: event.target.value }))}
                  className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                  required={field === "date" || field === "weightKg"}
                  placeholder={field === "bodyFatPercentage" && estimatedForForm != null ? `${estimatedForForm} (estimada)` : undefined}
                />
              </label>
            ))}
          </div>
          {estimatedForForm != null ? (
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              La grasa se estima en <span className="font-semibold">{estimatedForForm}%</span> con el peso, la estatura,
              la edad y el sexo del cliente. Si la dejas vacia se guarda ese valor; escribe el tuyo si la mediste con
              plicometro o bioimpedancia.
            </p>
          ) : missingForBodyFat.length > 0 ? (
            <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
              No se puede estimar la grasa: falta {missingForBodyFat.join(" y ")} de este cliente. Completala en su
              ficha y el calculo aparecera solo. Mientras tanto puedes escribir el porcentaje a mano.
            </p>
          ) : null}
          <button type="submit" className="mt-5 h-11 rounded-xl bg-violet-500 px-5 text-sm font-bold text-white shadow-md shadow-violet-500/20 hover:bg-violet-600">
            Guardar medicion
          </button>
        </form>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-bold">Objetivos</h2>
          <div className="mt-4 space-y-3">
            {memberGoals.length === 0 ? <p className="text-sm text-slate-500">No hay objetivos registrados.</p> : null}
            {memberGoals.map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={!canEdit}
                onClick={() => onToggleGoal(item.id)}
                className={`flex w-full items-center justify-between rounded-xl border p-3 text-left ${
                  item.completed
                    ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30"
                    : "border-slate-200 dark:border-slate-700"
                }`}
              >
                <div>
                  <p className={`text-sm font-semibold ${item.completed ? "line-through opacity-60" : ""}`}>{item.title}</p>
                  <p className="text-xs text-slate-500">Meta: {item.targetValue || "-"} {item.unit} · {formatDate(item.targetDate)}</p>
                </div>
                <span className={`text-xs font-bold ${item.completed ? "text-emerald-600" : "text-amber-600"}`}>
                  {item.completed ? "Completado" : "En curso"}
                </span>
              </button>
            ))}
          </div>
          {canEdit ? (
            <form onSubmit={submitGoal} className="mt-5 grid gap-3 sm:grid-cols-2">
              <input value={goal.title} onChange={(event) => setGoal((current) => ({ ...current, title: event.target.value }))} className="h-10 rounded-xl border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-950" placeholder="Objetivo" required />
              <input type="date" value={goal.targetDate} onChange={(event) => setGoal((current) => ({ ...current, targetDate: event.target.value }))} className="h-10 rounded-xl border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-950" required />
              <input type="number" step="0.1" value={goal.targetValue} onChange={(event) => setGoal((current) => ({ ...current, targetValue: event.target.value }))} className="h-10 rounded-xl border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-950" placeholder="Valor meta" />
              <select value={goal.unit} onChange={(event) => setGoal((current) => ({ ...current, unit: event.target.value }))} className="h-10 rounded-xl border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-950">
                <option>kg</option><option>cm</option><option>%</option><option>sesiones</option>
              </select>
              <button type="submit" className="h-10 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white dark:bg-white dark:text-slate-950 sm:col-span-2">Agregar objetivo</button>
            </form>
          ) : null}
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-bold">Notas del entrenador</h2>
          {canEdit ? (
            <form onSubmit={submitNote} className="mt-4">
              <textarea value={note} onChange={(event) => setNote(event.target.value)} className="min-h-24 w-full rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700 dark:bg-slate-950" placeholder="Observaciones, recomendaciones o ajustes de rutina..." required />
              <button type="submit" className="mt-2 h-10 rounded-xl bg-emerald-500 px-4 text-sm font-bold text-white hover:bg-emerald-600">Guardar nota</button>
            </form>
          ) : null}
          <div className="mt-5 space-y-3">
            {memberNotes.length === 0 ? <p className="text-sm text-slate-500">No hay notas registradas.</p> : null}
            {memberNotes.map((item) => (
              <article key={item.id} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950/60">
                <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">{item.text}</p>
                <p className="mt-2 text-xs font-semibold text-slate-400">
                  {item.author} · {new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(item.createdAt))}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-lg shadow-emerald-500/10 dark:border-slate-800 dark:bg-slate-900 dark:shadow-emerald-900/30">
        <div className="border-b border-l-4 border-slate-200 border-l-emerald-500 px-5 py-4 dark:border-slate-800 dark:border-l-emerald-400">
          <h2 className="font-bold">Historial de mediciones</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-transparent text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr><th className="border-l-4 border-l-emerald-500 px-5 py-3 dark:border-l-emerald-400">Fecha</th><th className="px-5 py-3">Peso</th><th className="px-5 py-3">Pecho</th><th className="px-5 py-3">Brazo</th><th className="px-5 py-3">Cintura</th><th className="px-5 py-3">Cadera</th><th className="px-5 py-3">Pierna</th><th className="px-5 py-3">Grasa</th><th className="px-5 py-3">Registrado por</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {[...memberRecords].reverse().map((record) => (
                <tr key={record.id}>
                  <td className="px-5 py-4 font-semibold">{formatDate(record.date)}</td>
                  <td className="px-5 py-4">{record.weightKg ?? "-"} kg</td>
                  <td className="px-5 py-4">{record.chestCm ?? "-"} cm</td>
                  <td className="px-5 py-4">{record.armCm ?? "-"} cm</td>
                  <td className="px-5 py-4">{record.waistCm ?? "-"} cm</td>
                  <td className="px-5 py-4">{record.hipCm ?? "-"} cm</td>
                  <td className="px-5 py-4">{record.legCm ?? "-"} cm</td>
                  <td className="px-5 py-4">{record.bodyFatPercentage ?? "-"}%</td>
                  <td className="px-5 py-4 text-slate-500">{record.recordedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
