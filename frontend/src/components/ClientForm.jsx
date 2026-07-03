import { useEffect, useState } from "react";

const initialForm = {
  fullName: "",
  gender: "female",
  age: "",
  weightKg: "",
  heightCm: "",
  phone: "",
  email: "",
  chestCm: "",
  armCm: "",
  waistCm: "",
  hipCm: "",
  legCm: "",
  planId: "",
};

function formatCurrency(value) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function Field({ label, children }) {
  return (
    <label className="space-y-1 text-sm">
      <span className="font-medium uppercase text-gray-700 dark:text-gray-300">{label}</span>
      {children}
    </label>
  );
}

function SectionHeading({ title, subtitle }) {
  return (
    <div className="mt-6 border-t border-gray-200 pt-4 dark:border-gray-700">
      <h3 className="text-sm font-semibold uppercase text-gray-950 dark:text-white">{title}</h3>
      {subtitle ? <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p> : null}
    </div>
  );
}

const inputClass =
  "h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-950 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-200 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-50 dark:focus:border-gray-200 dark:focus:ring-gray-700";

export default function ClientForm({ onCreate, plans = [] }) {
  const [form, setForm] = useState(initialForm);
  const selectedPlan = plans.find((plan) => plan.id === form.planId) ?? null;

  useEffect(() => {
    setForm((current) =>
      plans.some((plan) => plan.id === current.planId)
        ? current
        : { ...current, planId: plans[0]?.id ?? "" },
    );
  }, [plans]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!form.fullName.trim() || !selectedPlan) {
      return;
    }

    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + (selectedPlan.durationDays || 30));

    onCreate({
      memberId: crypto.randomUUID(),
      fullName: form.fullName.trim(),
      email: form.email.trim() ? form.email.trim().toLowerCase() : "",
      phone: form.phone.trim(),
      gender: form.gender,
      age: Number(form.age) || null,
      planName: selectedPlan.name,
      subscriptionValue: selectedPlan.price || 0,
      startDate: today.toISOString().slice(0, 10),
      endDate: endDate.toISOString().slice(0, 10),
      daysToExpire: selectedPlan.durationDays || 30,
      status: "Active",
      visualColor: "Green",
      tailwindClass: "bg-green-100 text-green-800",
      bodyMetrics: {
        heightCm: Number(form.heightCm) || null,
        weightKg: Number(form.weightKg) || null,
        chestCm: Number(form.chestCm) || null,
        armCm: Number(form.armCm) || null,
        waistCm: Number(form.waistCm) || null,
        hipCm: Number(form.hipCm) || null,
        legCm: Number(form.legCm) || null,
      },
    });

    setForm({ ...initialForm, planId: selectedPlan.id });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-gray-200 pb-3 dark:border-gray-700">
        <h2 className="text-base font-semibold uppercase text-gray-950 dark:text-white">Crear cliente</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Datos basicos.</p>
      </div>

      <div className="mt-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Nombre">
            <input
              className={inputClass}
              value={form.fullName}
              onChange={(event) => updateField("fullName", event.target.value)}
              placeholder="Nombre completo"
              required
            />
          </Field>

          <Field label="Genero">
            <select
              className={inputClass}
              value={form.gender}
              onChange={(event) => updateField("gender", event.target.value)}
            >
              <option value="female">Mujer</option>
              <option value="male">Hombre</option>
            </select>
          </Field>

          <Field label="Edad">
            <input
              className={inputClass}
              type="number"
              min="0"
              value={form.age}
              onChange={(event) => updateField("age", event.target.value)}
              placeholder="25"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Peso kg">
            <input
              className={inputClass}
              type="number"
              min="0"
              step="0.1"
              value={form.weightKg}
              onChange={(event) => updateField("weightKg", event.target.value)}
              placeholder="68.5"
            />
          </Field>

          <Field label="Altura cm">
            <input
              className={inputClass}
              type="number"
              min="0"
              value={form.heightCm}
              onChange={(event) => updateField("heightCm", event.target.value)}
              placeholder="170"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Telefono">
            <input
              className={inputClass}
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              placeholder="+57 300 000 0000"
            />
          </Field>

          <Field label="Correo (opcional)">
            <input
              className={inputClass}
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              placeholder="cliente@gym.com"
            />
          </Field>
        </div>
      </div>

      <SectionHeading title="Biometria" subtitle="Medidas corporales del cliente." />
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <Field label="Pecho cm">
          <input
            className={inputClass}
            type="number"
            min="0"
            value={form.chestCm}
            onChange={(event) => updateField("chestCm", event.target.value)}
            placeholder="96"
          />
        </Field>

        <Field label="Brazo cm">
          <input
            className={inputClass}
            type="number"
            min="0"
            value={form.armCm}
            onChange={(event) => updateField("armCm", event.target.value)}
            placeholder="32"
          />
        </Field>

        <Field label="Cintura cm">
          <input
            className={inputClass}
            type="number"
            min="0"
            value={form.waistCm}
            onChange={(event) => updateField("waistCm", event.target.value)}
            placeholder="78"
          />
        </Field>

        <Field label="Cadera cm">
          <input
            className={inputClass}
            type="number"
            min="0"
            value={form.hipCm}
            onChange={(event) => updateField("hipCm", event.target.value)}
            placeholder="98"
          />
        </Field>

        <Field label="Pierna cm">
          <input
            className={inputClass}
            type="number"
            min="0"
            value={form.legCm}
            onChange={(event) => updateField("legCm", event.target.value)}
            placeholder="55"
          />
        </Field>
      </div>

      <SectionHeading title="Membresia" subtitle="Selecciona el plan del cliente." />
      {plans.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          No hay planes registrados. Crea uno en Configuracion para poder asignarlo aqui.
        </p>
      ) : (
      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {plans.map((plan) => {
            const isSelected = form.planId === plan.id;
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => updateField("planId", plan.id)}
                className={`h-10 rounded-full border px-4 text-sm font-medium transition ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
                    : "border-gray-300 bg-white text-gray-600 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300"
                }`}
              >
                {plan.name}
              </button>
            );
          })}
        </div>

        {selectedPlan ? (
          <div className="text-sm sm:text-right">
            <span className="block text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
              Valor de la suscripcion
            </span>
            <span className="text-base font-semibold text-gray-950 dark:text-white">
              {formatCurrency(selectedPlan.price)}
            </span>
          </div>
        ) : null}
      </div>
      )}

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          className="shine-btn h-10 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/30"
        >
          Finalizar registro
        </button>
      </div>
    </form>
  );
}
