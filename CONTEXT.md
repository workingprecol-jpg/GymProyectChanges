# Project Context

Workspace path: `D:\Original Gym\GymProyectChanges-develop`

## Goal

Gym management SaaS with multi-tenant backend structure and a React/Tailwind admin dashboard.

## Stack

- Backend: C# ASP.NET Core Web API (net8.0), Entity Framework Core 8 + Npgsql, PostgreSQL.
- Frontend: React + Vite + Tailwind CSS.
- GitHub repo: `https://github.com/JohanInEd/GymProyectChanges.git`
- Current development branch: `main`

## Frontend

Location: `frontend/`

Run locally:

```bash
cd frontend
npm install
npm run dev
```

Default local URL: `http://localhost:5173`

Build:

```bash
npm run build
```

The frontend has been validated with `npm run build`.
The development server was also validated with an HTTP 200 response on June 11, 2026.

Deployment:

- 🔴 **`frontend/Dockerfile` and `frontend/nginx.conf` were DELETED on July 24, 2026.** The web tier is now one image built from the **repo root** that serves the landing page at `/` and this dashboard at `/app/` — see "Landing page, /app/ split and legal pages" below. **Coolify's "Front-end Server" Base Directory must change from `/frontend` to `/`** or the next deploy fails. They were deleted rather than left behind on purpose: with `base: "/app/"` now set in `frontend/vite.config.js`, the old Dockerfile would have built a *silently broken* image (assets emitted at `/app/assets/` but served from the root) — a failed build is a much better outcome than a white screen in production.
- `frontend/.dockerignore` excludes `node_modules`, `dist`, `.git`, env files.
- `VITE_API_BASE_URL` **is required at build time** (Vite bakes `import.meta.env.VITE_*` in at `npm run build`, not at runtime). Since July 16, 2026 the whole app depends on it, not just the invite-code check — without it a real gym cannot load any data. Locally it comes from `frontend/.env.local`; in Coolify it must be set and marked **Available at Buildtime**.
- There is still no router — the app switches views via in-memory tab state, not URL routes. That is why the emailed password-reset / verification links use query params (`/?reset=...`), which the frontend does not read yet. Since July 24, 2026 those links are built from `Frontend:BaseUrl = https://gymassist.online/app`, so they resolve to `/app/?reset=...`.
- Verified locally (no Docker available in this dev environment): `npm ci` and `npm run build` both succeed. Since July 24, 2026 `dist/index.html` points at **`/app/assets/...`** (not `/assets/...`), because `vite.config.js` sets `base: "/app/"`.
- In Coolify this is deployed as its own application ("Front-end Server", Dockerfile build pack, Ports Exposes `80`), separate from the backend app, per the "keep it separate" decision. **Base Directory is `/frontend` and must become `/`** — see the deleted-Dockerfile note above.
- Deployed and verified live at `https://gymassist.online` (the apex domain; moved here from the backend app on July 13, 2026). Since July 24, 2026 the apex serves the **landing page**; the dashboard moved to `https://gymassist.online/app/`.
- Requires a `VITE_API_BASE_URL` environment variable in Coolify marked **Available at Buildtime** (Vite bakes `import.meta.env.VITE_*` values in at `npm run build` time, not runtime), set to the backend app's URL. Without it, `inviteCodeApi.js` calls fail gracefully (relative-path fetch, shows a network-error message) rather than crashing.

Main files:

- `frontend/src/App.jsx`
- `frontend/src/auth.js`
- `frontend/src/apiClient.js` (added July 16, 2026 — shared fetch wrapper: base URL, `Authorization: Bearer`, plain-string error handling, 401 -> logout hook)
- `frontend/src/session.js` (added July 16, 2026 — persists `{token, user}` in `localStorage` under `gymflow-session`)
- `frontend/src/gymApi.js` (added July 16, 2026 — every business endpoint, grouped per feature)
- `frontend/src/adapters.js` (added July 16, 2026 — maps API DTOs onto the shapes the components already consume, so components needed no changes)
- `frontend/src/authApi.js`
- `frontend/src/locations.js` (added July 18, 2026 — 16 countries with flags and ~270 cities, plus `getCitiesForCountry`. Deliberately scoped to Latin America + Spain + the US; extend here, no component changes needed)
- `frontend/src/passwordStrength.js` (added July 18, 2026 — the 5 rules, a 0-4 score and a common-password list)
- `frontend/src/components/SearchableSelect.jsx` (added July 18, 2026 — filterable combobox: type to filter, keyboard navigation, accent-insensitive matching, disabled state)
- `frontend/src/inviteCodeApi.js`
- `frontend/src/main.jsx`
- `frontend/src/index.css`
- `frontend/tailwind.config.js`
- `frontend/.env.local` (gitignored; local dev only: `VITE_API_BASE_URL=http://localhost:5080`)
- `frontend/src/components/AccessManagement.jsx`
- `frontend/src/components/AnalyticsDashboard.jsx`
- `frontend/src/components/AuthScreen.jsx`
- `frontend/src/components/ClassSchedule.jsx`
- `frontend/src/components/ClientForm.jsx`
- `frontend/src/components/CheckInDashboard.jsx`
- `frontend/src/components/FinancialDashboard.jsx`
- `frontend/src/components/GymSetup.jsx`
- `frontend/src/components/InviteCodeGate.jsx`
- `frontend/src/components/MemberDetail.jsx`
- `frontend/src/components/MemberProgress.jsx`
- `frontend/src/components/MembersTable.jsx`
- `frontend/src/components/MembershipAlert.jsx`
- `frontend/src/components/MembershipCalendar.jsx`
- `frontend/src/components/OperationsDashboard.jsx`
- `frontend/src/components/Tabs.jsx`

Current UI features:

- Public gym registration from the authentication screen, gated by a one-time-use invite code (added July 13, 2026):
  - Clicking "Registrar gimnasio" shows `InviteCodeGate` first, not the registration form directly.
  - The gate calls the real backend (`POST /api/invite-codes/validate`, `frontend/src/inviteCodeApi.js`) — this is the first real (non-mock) backend call from the frontend. Requires `VITE_API_BASE_URL` set at Docker build time (see Deployment below); without it the check always fails gracefully with a network-error message.
  - If the page loads with a `?code=XYZ` query param, `AuthScreen` starts directly in the code-gate mode and auto-validates immediately, so a shared invite link passes through with no typing required. Otherwise the user enters a code manually.
  - Once validated, the code is held in memory (not yet marked used) and the existing gym/owner registration form appears.
  - The code is only actually consumed on final submit: `handleRegisterGym` in `App.jsx` calls `POST /api/auth/register-gym` (added July 15, 2026 — see Authentication below), which redeems the code, creates a real `Gym` + owner `User` row in Postgres, and returns a JWT in one atomic transaction; if redemption fails (already used, invalid) or the owner email is already taken, registration is aborted with an error and nothing is created. An abandoned code-gate attempt (validated but never submitted) does not burn the code. The standalone `POST /api/invite-codes/redeem` endpoint (see Invite codes below) still exists but is no longer called directly by the frontend.
  - Backend invite codes are a standalone, non-tenant-scoped entity (`InviteCode`: Code, IsUsed, CreatedAt, UsedAt) since they must be checkable before any tenant/gym exists.
- New gym onboarding includes:
  - Gym name.
  - **Country and city, both filterable dropdowns** (rewritten July 18, 2026 — see "Registration form" below).
  - Owner name, email, phone, and password with **live strength and match feedback**.
  - Initial SaaS plan selection.
  - Terms acceptance.
  - Automatic creation of the first user with the `Owner` role.
  - A clean tenant workspace that does not inherit demo gym data.
  - A 14-day trial with pending approval and pending email verification status.
  - Tenant registration and owner login persistence in `localStorage` under `gymflow-registered-gyms`.
  - Tenant-filtered user management so one gym cannot see another gym's users.
- **The app now runs in two modes (July 16, 2026 — this is the single most important thing to know about `App.jsx`):**
  - **Real gym (token-backed).** `const isBackendSession = Boolean(authToken)`. Every business feature reads and writes through the API and persists in PostgreSQL. Data survives refreshes and is shared across staff and devices. A newly registered gym starts empty (the clean workspace is now real: no rows yet, so nothing shows).
  - **Demo accounts (local-only).** The four "Cuentas demo" (password `Demo123!`) are in-memory mock data, no backend rows, lost on refresh — a deliberate shortcut. `handleLogin` checks the local mock `users` array first (any entry with a `password` field) and only falls through to the real backend for accounts without one. **(July 20, 2026: the one-click demo picker was removed from the login screen — see "Login screen: demo picker removed" below — but this login path is unchanged; a demo account still works by typing its email and `Demo123!`.)**
  - Every handler in `App.jsx` branches on `isBackendSession`: the backend path calls `gymApi`, then re-fetches via a `refreshX()` helper; the `else` path keeps the original local mock logic untouched.
- Before July 16, 2026 all business data lived only in React `useState` seeded from demo constants and was lost on every page refresh. That is no longer true for real gyms — this was the main blocker to piloting.
- Registered-gym login and registration use real backend authentication (see Authentication below): hashed passwords, a real `Gym`/`User` row in Postgres, and a JWT session. Approval status, email verification, trial and the subscription plan chosen at registration are **now real backend state** too (see SaaS billing below) — they are no longer `localStorage` mock bookkeeping.
- **Session survives refresh** (July 16, 2026): `session.js` stores `{token, user}` in `localStorage`; on load `App.jsx` restores it, re-validates the token against `GET /api/auth/me` before trusting it, and shows a brief "Restaurando sesion..." screen meanwhile. A 401 from the API while a session token is held clears the session and logs out cleanly (July 20, 2026: a 401 during login, with no token, is treated as bad credentials instead — see "Login screen: demo picker removed and failed-login message fixed"). Demo sessions are deliberately **not** persisted (no token).
- API failures surface in a dismissible red banner (`apiError` state + `reportApiError`), so writes rejected by the backend never fail silently.
- Local demo authentication screen with active/inactive user validation.
- The login password field has a show/hide toggle (added July 26, 2026), matching the one the gym
  registration form already had.
- Role-based navigation and action permissions:
  - Owner: full access, including user management.
  - Administrator: finance, analytics, clients, check-in, memberships, progress, classes, operations, and gym setup.
  - Reception: clients, check-in, memberships, and class reservations.
  - Trainer: read-only client access plus progress tracking, class scheduling, and reservations.
- User management includes:
  - Creating users with a role and temporary password.
  - Activating and deactivating accounts.
  - Permission summaries per role.
  - Protection against deactivating the current user.
- Demo accounts use password `Demo123!` (local-only, see above — not a real backend account). **The one-click demo picker was removed from the login screen on July 20, 2026; demo login now requires typing the email and this password.**
- Classes tab includes:
  - An "Asignacion de entrenadores" block between the four metric cards and the class cards (added
    July 29, 2026 — see that section below): a client table with multi-select, six `Entrenador N`
    buttons, an `Asignar` action and a per-trainer filter. **In-memory only, nothing persists.**
  - A "Programar clase" panel with a member picker on the left (name search, avatar, name, email, single selection) and the class form on the right (trainer, date, time, duration, capacity, room), separated by a vertical divider.
  - The Clase field is a select fed by the class catalog registered in Configuracion; choosing one auto-fills trainer, duration, capacity, and room (all still editable), while date and time stay manual.
  - When the catalog is empty the select shows "Sin clases registradas" and a hint pointing to Configuracion.
  - The panel's single `Confirmar reserva` action creates the class and registers the selected member's reservation in one step (`onCreateClassWithReservation`); no class is created if the member validation fails.
  - Client reservations into existing classes from the side "Reservar cupo" panel.
  - Duplicate-reservation prevention.
  - Capacity enforcement.
  - Expired-membership and suspended-membership blocking.
  - Reservation cancellation and attendee lists.
- Progress tab includes:
  - Per-member dated body measurement history.
  - Weight and waist trend charts.
  - Current weight, waist, body-fat, and active-goal metrics.
  - Body weight, chest, waist, hip, and body-fat registration.
  - Goals with target values, dates, units, and completion status.
  - Trainer notes with author and timestamp.
  - New measurements update the member's current body metrics.
  - Owners, administrators, and trainers can edit progress data.
  - Reception does not have access to progress health data.
- Analytics tab includes:
  - Six-month and twelve-month analysis periods.
  - Estimated retention and churn from current membership status.
  - Monthly new-member versus expired-membership comparison.
  - Average payment ticket.
  - Revenue grouped by plan.
  - Revenue grouped by payment method.
  - Gym attendance grouped by hour with peak-hour detection.
  - Automatically generated business insights.
  - Analytics access is limited to owners and administrators.
  - Retention and churn remain estimates until the backend stores explicit cancellation events.
- Operations tab includes:
  - Monthly expense budgets by category.
  - Budget utilization indicators.
  - Finance expense registrations automatically update matching operational budgets.
  - Equipment inventory, maintenance dates, and operational status.
  - Staff shift scheduling and commissions.
- Dark mode / light mode toggle in the header.
  - Uses Tailwind class-based dark mode (`darkMode: "class"`).
  - Stores the selected theme in `localStorage` under `gym-theme`.
  - Applies the `dark` class to `document.documentElement`.
- Permission-aware tabs: `Finanzas`, `Analitica`, `Clientes`, `Check-in`, `Mensualidad`, `Progreso`, `Clases`, `Inventario`, `Operaciones`, `Configuracion`, and `Usuarios`.
- Inventory tab includes:
  - Product catalog with SKU, name, category, sale price, current stock, and minimum stock.
  - Product search and category filtering.
  - Summary metrics for registered products, available units, inventory value, and low-stock products.
  - Low-stock alerts based on each product's configured minimum.
  - Owners and administrators can add, edit, and remove products.
  - Reception can view products and only adjust stock quantities.
  - Trainers do not have access to inventory.
- Finance tab includes:
  - Current-month income, expenses, net profit, and outstanding receivables.
  - Six-month combined chart with income, expenses, and registered-user count.
  - Grouped income/expense bars use a monetary scale.
  - Registered users use a separate line scale.
  - Outstanding receivables list with due dates and overdue days.
  - Quick action to register a payment.
  - Quick action to register a categorized expense.
  - Expense categories: Infrastructure, Machinery, and Services.
  - Expenses include description, amount, date, payment method, and optional provider.
  - Category summary cards show the accumulated amount for each expense category.
  - CSV finance report download, as the rightmost card in the "Acciones rapidas" row (Registrar pago, Registrar gasto, Descargar reporte).
  - The downloaded report is now only a single "Base de datos" ledger sheet (the "Resumen financiero" and "Cuentas por cobrar" sections were removed) with columns Fecha (DD/MM/YYYY), Mes, Año, Hora, Categoria, Concepto, Descripcion, Plan, Fecha limite, Monto, Medio de pago, Proveedor, combining every registered payment ("Pago", concepto = member name, Plan/Fecha limite from the matching member's current plan and endDate, Descripcion/Proveedor blank) and expense ("Gasto", concepto = expense category, Plan/Fecha limite blank, Descripcion/Proveedor = the expense's saved values if any), sorted newest first.
  - Registering a payment updates income, payment count, recent payments, the chart, and matching receivables.
  - The "Pagos recientes" table only lists payments with status other than Pending; pending/unpaid amounts are tracked exclusively in "Cartera por cobrar".
  - The "Fecha" column in both "Pagos recientes" and "Gastos recientes" tables shows a simple DD/MM/YYYY date (no time, no month name); `formatDateTime` was replaced by `formatDateSimple`.
  - The "Cartera pendiente" summary card uses the amber/warning tone (instead of red/negative) when there is a pending balance.
  - The "Utilidad neta" summary card uses a new sky-blue "info" tone (instead of emerald/green) when profit is non-negative; still falls back to the rose/negative tone when profit is negative.
  - The four summary MetricCards (Ingresos, Gastos, Utilidad neta, Cartera pendiente) now also show a colored top accent bar on hover, matching each card's tone (same color as its value text), in addition to the existing lift/shadow hover effect.
  - **At rest the four cards are neutral** (July 29, 2026): all of them carry the same gray drop shadow (`shadow-slate-500/25`, `slate-950/60` in dark), and the tone colour only appears on hover, where the shadow also grows to `shadow-xl` — same idea as the accent bar above, so the row reads calm until the user points at one card. The tone colour wins over the resting gray by specificity (`:hover` outweighs a plain class) and over `hover:shadow-xl`'s uncoloured shadow by source order (Tailwind emits `boxShadow` before `boxShadowColor`); neither depends on the order of the classes in the JSX. The icon badge keeps its tone colour at rest — only the shadow is neutralised.
  - The icon of each MetricCard does a **slight looping nudge while the card is hovered** (`animate-icon-nudge`, 2px up and 4 degrees, 1.4s): it replaced the old one-shot `icon-pop` (scale 1.2 plus rotation, 500ms), which was pronounced but over so fast it read as no animation at all. The keyframe opens and closes at rest so removing the class on mouse-out never snaps. `index.css` disables it under `prefers-reduced-motion`, and that rule has to repeat Tailwind's own `.group:hover .group-hover\:animate-icon-nudge` selector — a media query adds no specificity, and the bare `.animate-icon-nudge` never matches, because the class on the element is the `group-hover:` variant.
  - The "Ingresos, gastos y usuarios" chart bars now use a vertical gradient (emerald/rose) instead of a flat fill.
  - The Infraestructura/Maquinaria/Servicios expense-category cards were redesigned: colored border per category (amber/fuchsia/sky via `expenseCategoryStyles`), with a single category icon (building/gear/bolt) always shown first in a colored circle before the title (no duplicate corner icon), the "Gastos registrados en esta categoria" description below the title, and the amount split into two columns (Mes / Año) at the bottom, separated by a vertical divider. On hover the card lifts (`hover:-translate-y-0.5 hover:shadow-lg`) and that same leading icon circle enlarges (`group-hover:scale-125`).
  - `categoryExpenseTotals` (replacing the old all-time `expensesByCategory`) computes, per category, the sum of expenses whose date falls in the current real month ("Mes") and the sum for the current real year ("Año"), based on each expense's `expenseDate` (UTC-safe) or `createdAt` fallback.
  - The "Acciones rapidas" buttons (Registrar pago, Registrar gasto, Descargar reporte) now use a diagonal-free left-to-right gradient background per tone (`ActionButton`'s `toneStyles`: green = emerald-to-teal, red = rose-to-pink, gray = slate-700-to-slate-500) instead of a flat color; size, text, and icon unchanged.
  - Registering an expense updates expenses, net profit, category totals, recent expenses, and the chart.
  - The current chart user count follows the live number of clients in the frontend state.
- Client creation form with:
  - Personal info section, ordered Nombre, Genero, Edad, Peso, Altura, Telefono, Correo (Correo is optional).
  - Biometria section: Pecho, Brazo, Cintura, Cadera, Pierna.
  - Membresia section: the plans the gym registered in Configuracion, plus the cobro block added July 19, 2026 — a **read-only** "Valor a pagar" derived from the chosen plan's price (July 20, 2026: no longer editable), an optional **"Aplicar descuento" percentage** that recalculates it, a medio de pago (Efectivo/Transferencia/Tarjeta) and a Pagado/Pendiente toggle that decides whether the amount becomes income or a receivable. See "The client registration now charges" and "Client registration charge: fixed to the plan price, with an optional discount".
  - Submit button reads "Finalizar registro" and sits under the Membresia section.
  - All field and section titles render in uppercase.
- Client creation plan choices come from the gym's own registered plans (`GET /api/plans`), not a fixed list. **A brand-new gym therefore cannot create a client until it registers a plan first**: the Membresia section shows "No hay planes registrados. Crea uno en Configuracion para poder asignarlo aqui." Verified in the browser on July 18, 2026. (An earlier note in this file claimed a fixed Diario/Semanal/Mensual/Anual/VIP list — that is out of date.)
- Gym setup tab includes:
  - Gym name
  - City
  - Owner name ("Nombre propietario") and owner email ("Correo propietario") — renamed July 26, 2026
  - Admin phone
  - The owner's role, shown as a badge next to their name in the summary card. It was an editable
    dropdown until July 26, 2026, when it was removed for never having been persistable — see
    "Configuracion: owner labels, and the Rol field is gone"
  - Plan registration form, reused for both creating and editing plans
  - Registered plans table with edit and delete actions (minimalist icon buttons) and a custom confirmation modal for delete
  - A class registration form ("Registrar clase" / "Editar clase") below the plans table with class name, trainer, duration, capacity, and room
  - A "Registro de clases" table (Clase, Entrenador, Duracion, Capacidad, Espacio, Acciones) mirroring the plans table design, with edit/delete icon buttons and its own delete confirmation modal
  - Registering a class with an existing name updates it instead of duplicating (id-first matching like plans)
  - Feature suggestions for future product work
- Registered plans include:
  - Plan name
  - Price in COP
  - Duration in days
  - Included classes
  - Description
- Adding a plan with an existing name updates the previous plan instead of duplicating it.
- Members table is clickable.
- Check-in tab includes:
  - A table-based check-in styled like the client database table, with columns Miembro (avatar, name, email), Membresia, Estado, Vence, and Acciones.
  - The only filter is the name search inside the Miembro column header (plan and status filters were removed).
  - Estado badge shows Activa, Por vencer, Vencida, or Suspendida; suspensions toggled in Finanzas are reflected here immediately.
  - Vence shows the plan end date; already-finished plans add a "Plan finalizado" marker in red.
  - Per-row `Validar entrada` records the date and time of the moment it is pressed.
  - `Validar entrada` is disabled for expired or suspended plans and while the client has an active entry.
  - Per-row `Validar salida` closes the active visit and enables a future entry.
  - Only one active entry is allowed per client; the Estado cell shows "Dentro desde" with the entry time.
  - A visit nobody closed is retired automatically after 12 hours and the history shows "Cierre automatico" in the Salida column instead of an invented time (July 19, 2026 — see "Forgotten check-outs close themselves").
  - An inline banner above the table confirms the last entry/exit result with the member name and timestamp.
  - A `Revisar pago` button appears only on expired or suspended rows, and only for roles with finance permission; it navigates to Finanzas, auto-opens the Registrar pago panel, and pre-fills the search with that member's name.
  - Blocked entries record reason "Plan vencido" or "Plan suspendido".
  - Current people inside the gym are counted on the dashboard.
  - Daily counters for allowed entries, blocked attempts, and expiring plans.
  - Recent check-in history with entry/exit timestamps, result, and reason.
- Membership table column has filter:
  - Todas
  - Activas
  - Por vencer
  - Vencidas
- Alert appears when at least one membership has `5` days or fewer remaining.
- Alert has:
  - `Revisar` button: opens `Mensualidad` tab and filters by `Por vencer`.
  - `Quitar` button: dismisses alert from the screen.
- Membership detail includes a mini calendar:
  - Start and end dates shown as **read-only** text (July 20, 2026 — were editable inputs before; the direct edit from the profile was removed, date changes now go through renewal).
  - Previous / next month controls.
  - Full subscription range highlighted in sequence.
  - Used subscription days marked teal.
  - Pending subscription days marked sky blue.
  - Start date marked green.
  - End date marked red.
  - Today marked with dark ring.
  - Shows remaining days, total subscription length, and progress.
  - Changing the dates (now via the renewal flow, not this read-only profile calendar) recalculates days remaining, membership status, badge color, filters, and alerts.
- Human silhouette component was removed.

## Backend

Location: `backend/src/`

Backend now has a runnable ASP.NET project (`GymSaaS.Api.csproj` and `Program.cs`); see the "Important backend note" below for current caveats.

Main backend files:

- `backend/src/API/Controllers/DashboardController.cs` (dead: the frontend never calls `/api/dashboard`. Harmless — it is `[Authorize]`d and tenant-filtered — but it is dead weight)
- `backend/src/API/Controllers/CheckInController.cs`
- `backend/src/API/Controllers/InviteCodesController.cs`
- `backend/src/API/Controllers/AuthController.cs`
- Added July 16, 2026 (all `[Authorize(Policy = "TenantStaff")]`, all tenant-scoped):
  - `backend/src/API/Controllers/MembersController.cs` (`api/members`: list/create/update/soft-delete, `PUT {id}/membership` for dates + optional plan change, `POST {id}/suspend` toggle)
  - `backend/src/API/Controllers/PlansController.cs` (`api/plans`: list, upsert, delete)
  - `backend/src/API/Controllers/FinanceController.cs` (`api/finance`: `GET summary`, `POST payments`, `POST expenses`)
  - `backend/src/API/Controllers/InventoryController.cs` (`api/products`: list, upsert, `PUT {id}/stock`, delete)
  - `backend/src/API/Controllers/ClassesController.cs` (`api/classes`: templates CRUD, classes, reservations create/cancel)
  - `backend/src/API/Controllers/ProgressController.cs` (`api/progress`: records/goals/notes)
  - `backend/src/API/Controllers/OperationsController.cs` (`api/operations`: budgets/equipment/shifts)
  - `backend/src/API/Controllers/StaffController.cs` (`api/staff`: list/create/toggle within the tenant)
  - `backend/src/API/Controllers/GymProfileController.cs` (`api/gym`: get/update)
  - `backend/src/API/Controllers/BillingController.cs` (`api/billing`: the gym's own SaaS subscription + invoices, read-only)
  - `backend/src/API/Middleware/ExceptionHandlingMiddleware.cs`
- `backend/src/API/Properties/launchSettings.json` (added July 16, 2026 — sets `ASPNETCORE_ENVIRONMENT=Development` so `dotnet run` loads user-secrets; without it the app started in Production and the connection string was missing)
- `backend/src/API/GymSaaS.Api.csproj`
- `backend/src/API/Program.cs`
- `backend/src/API/appsettings.json`
- `backend/src/API/appsettings.Development.json`
- `backend/src/API/Program.example.cs`
- `backend/src/Application/Abstractions/ITenantProvider.cs`
- `backend/src/Application/Abstractions/IJwtTokenService.cs`
- `backend/src/Application/Abstractions/IInviteCodeService.cs`
- `backend/src/Application/Abstractions/IEmailSender.cs` + `backend/src/Infrastructure/Email/ConsoleEmailSender.cs` (added July 16, 2026)
- `backend/src/Application/DTOs/Dashboard/*`
- `backend/src/Application/DTOs/CheckIns/*`
- `backend/src/Application/DTOs/InviteCodes/*`
- `backend/src/Application/DTOs/Auth/*`
- `backend/src/Application/Services/IMembershipStatusService.cs`
- `backend/src/Application/Services/MembershipStatusService.cs`
- `backend/src/Domain/Common/ITenantScoped.cs`
- `backend/src/Domain/Entities/*`
- `backend/src/Domain/Enums/*`
- `backend/src/Infrastructure/DependencyInjection.cs`
- `backend/src/Infrastructure/Persistence/GymSaaSDbContext.cs`
- `backend/src/Infrastructure/Persistence/PostgresOptions.cs`
- `backend/src/Infrastructure/Persistence/InviteCodeService.cs`
- `backend/src/Infrastructure/Persistence/Migrations/*`
- `backend/src/Infrastructure/Tenancy/ClaimsTenantProvider.cs`
- `backend/src/Infrastructure/Auth/JwtTokenService.cs`
- `backend/src/Infrastructure/Auth/JwtOptions.cs`

Backend domain entities:

- `Gym` (extended July 16, 2026 with SaaS lifecycle: `SubscriptionPlan`, `ApprovalStatus`, `TrialEndsAt`, `EmailVerified`, `EmailVerifiedAt`)
- `Plan` (+ `MaxClasses`)
- `Member` (extended July 16, 2026: `Gender`, `Age`, and current body metrics `HeightCm`/`WeightKg`/`ChestCm`/`ArmCm`/`WaistCm`/`HipCm`/`LegCm`. **`Email` is now nullable** — the client form marks Correo optional. The unique index `(TenantId, Email)` is kept as-is because Postgres treats NULLs as distinct, so several members may have no email.)
- `Subscription` (a **member's membership**; do not confuse with `SaasSubscription`)
- `Payment`
- `Attendance`
- `InviteCode` (not tenant-scoped, no `ITenantScoped`/query filter — must be checkable before any Gym/tenant exists)
- `User` (not tenant-scoped, same reasoning)
- Added July 16, 2026 — all `ITenantScoped` with a tenant query filter:
  - `Expense` (finance expenses; there was no expense entity before)
  - `Product` (inventory)
  - `ClassTemplate` (the catalog registered in Configuracion), `GymClass` (a concrete scheduled class), `Reservation`
  - `ProgressRecord`, `ProgressGoal`, `ProgressNote`
  - `Budget` (monthly limit per category; "spent" is derived from `Expense` rows, not stored), `Equipment`, `Shift`
  - `SaasSubscription` + `SaasInvoice` (see SaaS billing below)
- `UserToken` (added July 16, 2026 — not tenant-scoped; single-use expiring tokens for password reset and email verification. Only the SHA-256 hash is stored; the raw token exists only in the emailed link.)

Multi-tenant structure:

- Tenant is represented by `Gym`.
- Tenant-scoped entities use `TenantId`.
- `GymSaaSDbContext` includes global query filters using `ITenantProvider`.
- `ClaimsTenantProvider` (replaced `HeaderTenantProvider` on July 15, 2026) reads tenant id from the `tenant_id` claim on the authenticated JWT — no longer trusts a client-supplied header. `HeaderTenantProvider.cs` was deleted; the `Tenant:HeaderName` config entry was removed.
- `Attendance` records allowed and blocked check-in attempts per tenant/member.
- `Attendance` stores entry and optional exit timestamps for allowed visits, plus `AutoClosed` (July 19, 2026) for visits the system closed because nobody recorded the exit — see "Forgotten check-outs close themselves".
- `CheckInController` exposes `POST /api/check-ins`, `POST /api/check-ins/check-out`, and `GET /api/check-ins/recent`; `RecordedByUserId`/`CheckedOutByUserId` are now populated from the authenticated principal (`ClaimTypes.NameIdentifier`), not client-supplied request fields.
- The backend rejects a second active entry and has a filtered unique index per tenant/member.

Authentication (added July 15, 2026):

- Real backend authentication replaces what was previously a no-op authorization policy (`"TenantStaff"` was `RequireAssertion(_ => true)`, i.e. it authorized everything) and the client-trusted `X-Tenant-Id` header.
- New `User` entity/table (`Users`): `Id`, `TenantId`, `Email` (globally unique, case-insensitive), `PasswordHash`, `FullName`, `Role` (`Owner`/`Admin`/`Reception`/`Trainer`), `IsActive`, `CreatedAt`. Deliberately **not** `ITenantScoped` (same reasoning as `InviteCode`): login must resolve the tenant from the email lookup before any tenant context exists.
- Passwords hashed via `Microsoft.AspNetCore.Identity.PasswordHasher<User>` (ships in the ASP.NET Core shared framework, no extra package).
- `AuthController` (`api/auth`, anonymous, rate-limited — see below):
  - `POST /api/auth/login`: `{ email, password }` -> `{ token, user }`.
  - `POST /api/auth/register-gym`: `{ gymName, city, phone, ownerName, email, password, acceptTerms, inviteCode }` -> `{ token, user }`. Wraps invite-code redemption (via `IInviteCodeService`, shared with `InviteCodesController`) and `Gym`+owner `User` creation in one DB transaction; slug is auto-generated from the gym name plus a random suffix.
- JWTs are signed HMAC-SHA256, carry `sub`/`ClaimTypes.NameIdentifier` (user id), `tenant_id` (custom claim, read by `ClaimsTenantProvider`), `ClaimTypes.Role`, email, and name. Config lives under `Jwt:*` (`Issuer`, `Audience`, `SigningKey`, `ExpiryMinutes`) in `appsettings*.json`, same override-via-environment-variable convention as the DB connection string. Default expiry is 720 minutes (12h); no refresh tokens — the frontend keeps the token in memory only (lost on refresh, same as before) and the user re-logs in.
- The `"TenantStaff"` authorization policy now requires an authenticated user (`RequireAuthenticatedUser()`).
- Rate limiting (added July 15, 2026): all anonymous, credential-guessable endpoints (`AuthController`'s login/register-gym, `InviteCodesController`'s validate/redeem) carry `[EnableRateLimiting("auth")]` — a fixed-window limiter, 10 requests/minute per client IP, configured in `Program.cs` via `AddRateLimiter`/`UseRateLimiter`. Rejections return 429 with a plain-string JSON body the frontend already knows how to surface. Complemented since July 23, 2026 by a **per-account** login lockout that is independent of IP (see "Account lockout: per-account brute-force protection" below) — the rate limiter throttles a noisy client, the lockout stops a distributed guess against one account.
- **Local dev secrets**: `appsettings.json`/`appsettings.Development.json` no longer contain a `Password=` in `ConnectionStrings:DefaultConnection` (removed July 15, 2026 — a real-shaped credential sitting in a committed file, even as a placeholder, was flagged as a risk in a security review). The project now has `UserSecretsId` set (`GymSaaS.Api.csproj`); each developer must run, once, from `backend/src/API`:
  ```
  dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=GymSaaS_Dev;Username=postgres;Password=postgres"
  ```
  (or whatever their local Postgres credentials are). This is machine-local, never committed. Production is unaffected — Coolify already fully overrides `ConnectionStrings:DefaultConnection` via its own environment variable, as before.

Account lifecycle, added July 16, 2026 (all on `AuthController`, anonymous + rate-limited unless noted):

- `GET /api/auth/me` (`[Authorize]`, `[DisableRateLimiting]`) -> current `AuthUserDto` from the token. The frontend calls it on load to re-validate a restored session before trusting it.
- `POST /api/auth/forgot-password` `{ email }` -> always 200 with the same generic message, whether or not the email exists (so it cannot be used to discover which emails are registered). If the user exists, a `UserToken` (`PasswordReset`, 1h expiry) is created and a reset link is emailed.
- `POST /api/auth/reset-password` `{ token, password }` -> validates the token (unused, unexpired), re-hashes the password, marks the token used.
- `POST /api/auth/verify-email` `{ token }` -> marks `Gym.EmailVerified`/`EmailVerifiedAt`.
- `register-gym` now also: stores the chosen `SubscriptionPlan` (the frontend collected it but **never sent it** before), sets `ApprovalStatus = Pending`, `TrialEndsAt = now + 14d`, creates the trial `SaasSubscription`, and emails an email-verification link (sent **after** the transaction commits, never inside it).
- Tokens are 32 random bytes, hex-encoded; only their SHA-256 hash is stored.
- **Login is deliberately NOT gated on approval or email verification** — a pilot gym must be able to work immediately. The status is stored and displayed ("Registro recibido, aprobacion pendiente"), not enforced. Flipping that to a hard gate is a one-line policy change in `Login`.
- `IEmailSender` (`Application/Abstractions/IEmailSender.cs`) with `ConsoleEmailSender` (`Infrastructure/Email/`) which **logs the email instead of sending it**. No real provider is wired yet: pick one (Resend/SendGrid/SES/SMTP) and register a different `IEmailSender` in `DependencyInjection`. Until then, password-reset and verification links only appear in the backend log.
- `Frontend:BaseUrl` config (in `appsettings*.json`) builds the emailed links: `{BaseUrl}/?reset=TOKEN` and `{BaseUrl}/?verify=TOKEN`. **The frontend does not yet read those query params** — the backend side is done, the UI to consume the links is not.

SaaS billing (added July 16, 2026):

- `SaasSubscription` — how a **gym pays us** (the platform). Named this way on purpose: `Subscription` already means a member's membership at a gym, and the two would be confused. Kept as rows rather than fields on `Gym` so plan changes and renewals have history. Fields: `PlanType`, `StartDate`, `EndDate`, `Status` (`Trial`/`Active`/`PastDue`/`Cancelled`).
- `SaasInvoice` — invoices issued to a gym: `Amount` (decimal), `Currency`, `IssuedAt`, `DueDate`, `PaidAt`, `Status`, `InvoiceUrl`.
- `GET /api/billing` returns the gym's own subscription + invoices. **Read-only on purpose**: invoices are issued by the platform operator, never self-served by the customer, so there is no create/update endpoint (same reasoning as invite codes). Both entities are tenant-query-filtered, so a gym can only ever see its own.
- Ported from the design in the user's local SQL Server `GymApp` database (`Gestion_Modelo_Saas` / `Saas_Invoices`), fixing money to `decimal(18,2)` (it was `int`/`nchar` there) and durations to real date types.

Invite codes (added July 13, 2026):

- `InviteCodesController` exposes `POST /api/invite-codes/validate` (read-only check, `{ code }` -> `{ isValid }`) and `POST /api/invite-codes/redeem` (`{ code }` -> `{ success, message }`, atomic `ExecuteUpdateAsync` compare-and-swap that sets `IsUsed`/`UsedAt` only if still unused). Both are intentionally anonymous (no `[Authorize]`) since they run before any account/tenant exists, and both are rate-limited (see Authentication above). The validate/redeem logic itself now lives in `IInviteCodeService`/`InviteCodeService` (`backend/src/Infrastructure/Persistence/InviteCodeService.cs`), shared with `AuthController.RegisterGym`; the controller is now a thin wrapper.
- Codes are matched case-insensitively (trimmed + upper-invariant) against `InviteCodes.Code`.
- No admin endpoint exists to generate codes (deliberately, to avoid an unauthenticated way to mint unlimited codes and defeat the capacity cap); codes are seeded directly into Postgres as needed.
- CORS is now configured (`Cors:AllowedOrigins` in appsettings, wired via `AddCors`/`UseCors` in `Program.cs`) since the frontend calls this API cross-origin for the first time. Production allows `https://gymassist.online`; add more origins there (not code changes) if needed.

PostgreSQL structure added:

- `appsettings.json` has `ConnectionStrings:DefaultConnection` (Npgsql-format: `Host=...;Port=...;Database=...;Username=...;Password=...`).
- `appsettings.Development.json` has a local Postgres example (placeholder credentials).
- `DependencyInjection.cs` registers:
  - `GymSaaSDbContext`
  - PostgreSQL provider via `UseNpgsql` (package `Npgsql.EntityFrameworkCore.PostgreSQL`)
  - `ITenantProvider` (-> `ClaimsTenantProvider`)
  - `IMembershipStatusService`
  - `IInviteCodeService`, `IJwtTokenService`
  - `IEmailSender` (-> `ConsoleEmailSender`; swap this for a real provider in production)
  - `IPasswordHasher<User>`
  - `IHttpContextAccessor`
- `PostgresOptions` (`Infrastructure/Persistence/PostgresOptions.cs`) configures `EnableSensitiveDataLogging` and `CommandTimeoutSeconds` under the `Postgres` config section.
- `Program.example.cs` shows how to call `AddInfrastructure(builder.Configuration)`.
- The backend was originally built for SQL Server and was switched to PostgreSQL on July 13, 2026: package reference, `UseNpgsql`, connection string format, and the `Attendances` filtered-unique-index raw SQL in `GymSaaSDbContext.cs` (was T-SQL bracket/bit syntax `[AccessGranted] = 1`, now `"AccessGranted" = true`). At that point no EF Core migrations existed yet, so nothing needed porting; the migrations listed below were all created afterwards, Postgres-first.

## Automated tests (added July 18, 2026)

Location: `backend/tests/GymSaaS.IntegrationTests/` — 62 xUnit integration tests. See that folder's
`README.md` for the full picture; the essentials:

- They boot the **real** application via `WebApplicationFactory<Program>` (real JWT bearer auth, the
  `TenantStaff` policy, rate limiter, middleware, every controller). Nothing is stubbed except the
  database connection. `Program.cs` ends with `public partial class Program;` purely so the factory
  can reach it.
- They need a **real PostgreSQL** (the behaviour under test is provider-level query filtering, plus
  the Postgres-specific filtered unique index). Each run creates and drops its own `gymsaas_test_*`
  database; `GymSaaS_Dev` is never touched. Connection string comes from `GYMSAAS_TEST_CONNECTION`,
  falling back to the API's user-secrets, so no extra setup on a machine where `dotnet run` works.
- Coverage: cross-tenant isolation (lists and **21 by-id endpoints** hit with the other gym's ids),
  auth boundaries (no token, wrong signature, tampered tenant claim, expired token, `X-Tenant-Id`
  header ignored), the EF model itself by reflection (every `ITenantScoped` entity has a filter that
  really uses `TenantId`; no new `IgnoreQueryFilters()`), anonymous-endpoint allow-list,
  registration/invite-code rules (including that the country is required and stored),
  subscription enforcement, the duplicate-SKU rules, the charge taken at client registration,
  per-account login lockout (independent of the caller's IP), and the date a renewal is anchored on
  when the payment is registered late.
- Test files: `TenantIsolationTests`, `AuthenticationBoundaryTests`, `TenantFilterConfigurationTests`,
  `RegistrationTests`, `AnonymousEndpointTests`, `SubscriptionEnforcementTests`, `InventorySkuTests`,
  `MemberRegistrationPaymentTests`, `AttendanceAutoCloseTests`, `AccountLockoutTests`,
  `PaymentRenewalDateTests`.
- **Verified to actually fail**: removing the `HasQueryFilter` from `Member` turns 8 tests red,
  naming the entity and the operations that became possible. Worth repeating after any change to the
  isolation mechanism — a suite that has never failed proves nothing.

```bash
# Postgres must be running first (it is not a Windows service — see Local development environment)
dotnet test backend/tests/GymSaaS.IntegrationTests/GymSaaS.IntegrationTests.csproj
```

**Implementation detail worth knowing:** the `_tenantProvider == null ||` escape hatch in the query
filters does **not** work at query time. EF evaluates `_tenantProvider.CurrentTenantId` while
extracting query parameters, before the `||` short-circuit applies, so a null provider throws instead
of returning every tenant's rows. It only matters for design-time model building. Tests that need to
read across tenants use `.IgnoreQueryFilters()` explicitly.

## CI (added July 18, 2026)

`.github/workflows/ci.yml` runs on every push and pull request:

- **backend**: `postgres:16` service container, Release build, the integration tests, results
  uploaded as an artifact. Uses `GYMSAAS_TEST_CONNECTION`; no user-secrets involved.
- **frontend**: `npm ci` + `npm run build`, mirroring the Dockerfile.

## Subscription enforcement (added July 18, 2026)

Until now `TrialEndsAt` and `SaasSubscription.Status` were written at registration and shown in the
UI, but **nothing ever checked them** — an expired gym kept working free forever. Now enforced:

- **Expired = read-only.** Every write (POST/PUT/DELETE) returns **402 Payment Required** with a
  plain-string message; every read still works. Chosen over a hard lockout on purpose: a customer
  must always be able to see, check and export their own records, including the invoice they are
  being asked to pay. Holding a gym's data hostage is both a poor way to collect and a poor answer
  to a data-access request.
- **Grace period: 1 day** past the end date, so a payment in transit over a weekend does not lock
  anyone out. Configurable via `Billing:GraceDays`.
- **Always exempt**, even when expired: `/api/auth/*` (they must be able to log in), `/api/billing`
  (they must be able to see what they owe) and `/api/invite-codes/*`. Locking these would leave a
  customer with no route back in.
- **Cancelled** subscriptions are read-only immediately, regardless of end date.
- **Fails open**: a gym with no `SaasSubscription` row at all keeps full access. Locking out a paying
  customer because of missing data on our side is worse than a few unbilled days.
- State is derived on each request from the subscription row — no scheduled job flips statuses at
  midnight, because this application has no scheduler.

Files: `Application/Abstractions/ISubscriptionAccessService.cs` (the `TenantAccess` result),
`Infrastructure/Billing/SubscriptionAccessService.cs` (the rule),
`Infrastructure/Billing/BillingOptions.cs`, `API/Middleware/SubscriptionEnforcementMiddleware.cs`
(registered after `UseAuthorization` in `Program.cs`).

`GET /api/gym` now also returns `accessLevel` (`"full"` / `"readOnly"`), `accessReason` and
`subscriptionEndsAt`, so the UI can warn before the user hits a rejected write. The frontend needs no
change to *surface* a block: `apiClient.js` already turns a non-OK plain-string body into the red
error banner, so the 402 message reaches the user as-is.

**Kill switch:** set `Billing:EnforceSubscription=false` to return to the previous behaviour without
a deploy, if enforcement ever misfires on a real customer.

Covered by `SubscriptionEnforcementTests` (7 tests): writes blocked when expired, all reads still
allowed, login and billing reachable when expired, the grace period works, cancelled is immediate,
and one gym's expiry never affects another's.

## Registration form: country, city and password (July 18, 2026)

The gym registration form (`GymRegistrationForm.jsx`) was rewritten. City used to be a free-text box
and there was no country at all; the password had no feedback beyond `minLength=8` and a match check
that only fired on submit.

**Country and city are now filterable dropdowns**, built on the new reusable
`components/SearchableSelect.jsx` (a native `<select>` cannot be typed into to filter):

- Data lives in `frontend/src/locations.js`: 16 countries (Latin America, Spain, the US) with flags
  and ~270 cities. Add more there — no component changes needed.
- Type to filter; prefix matches are ranked above substring matches, so typing "san" offers
  "San Jose" before "Bucaramanga".
- Matching **ignores accents** (NFD + `\p{Diacritic}`), because people type both "Bogota" and
  "Bogotá" and neither should come up empty.
- City starts **disabled** with "Elige primero un pais" and is populated from the chosen country.
- **Changing country clears the selected city.** "Cordoba" exists in both Argentina and Spain, and
  "Santiago" in Chile, Panama and the Dominican Republic; keeping the old city would store a
  combination that does not exist.
- Keyboard navigation (arrows/Enter/Escape), click-outside to close, `role="combobox"`/`listbox`,
  and a hidden mirrored input so native `required` validation still works.

**Password feedback** (`frontend/src/passwordStrength.js`): a 5-level strength bar, a checklist of
the five rules that fills in green as they are met, a live "coinciden / no coinciden" indicator with
the confirm field's border tinted to match, and a show/hide toggle. Scoring is not just "rules
passed" — length is weighted and a common password is forced down, because `password1!A` satisfies
all five rules and is still one of the first things any dictionary attack tries.

**This is guidance, not a security control.** The backend still only requires 8 characters
(`AuthController.RegisterGym`); anyone calling the API directly bypasses all of it. Raising the real
floor means changing the server rule too. This is stated in the file's own header comment.

Backend side: `Gym.Country` (nullable, max 80) + the `AddGymCountry` migration; `Country` added to
`RegisterGymRequest` (**required** — the server rejects a blank country with 400, it does not trust
the form), to `GymProfileDto` and to `UpdateGymProfileRequest`, so the country is also visible and
editable from Configuracion. Gyms registered before this change simply have `Country = NULL`.

Verified in the browser against the real backend: filtering, the country→city dependency, keyboard
selection, the full strength scale, the match indicator, and a completed registration whose country
reached PostgreSQL. Also removed the stale "Demo local: la verificacion... hasta conectar el backend"
line from this form.

**Note for whoever changes registration next:** making `Country` required broke 20 integration tests
at once, because the test helpers did not send it. That is the suite working as intended —
`ApiFixture.RegisterGymAsync` and `RegistrationTests.RegistrationBody` are the two places to update.

## Data-loss fix: duplicate SKU (July 18, 2026)

`InventoryController.Save` used to fall back to a lookup **by SKU** when no id was supplied:

```csharp
product ??= await _dbContext.Products.SingleOrDefaultAsync(p => p.Sku == sku, ct);
```

So registering a product whose code already existed did not create anything — it found the existing
row and overwrote its name, price, stock and minimum in place, returning **200**. A mistyped SKU at
reception silently destroyed a different product's data, with no error and no confirmation.

Now: creating with a SKU that is already taken returns **409 Conflict** and the existing product is
left untouched. Editing an existing product by id still works, including moving it to a free SKU;
moving it onto a taken one was already a 409 and still is. The comparison is now
**case-insensitive**, matching what the inventory screen already assumed (`App.jsx` compares SKUs
lowercased before calling the API), so `ABC-1` and `abc-1` are the same product to both sides.

The frontend already blocked this client-side, so nothing there had to change — the backend now
enforces what the UI assumed rather than trusting it. Covered by `InventorySkuTests` (5 tests),
including that two different gyms may still use the same SKU, since uniqueness is per tenant.

Note the same upsert-by-natural-key pattern still exists for **plans** (deduped by name) and **class
templates** (deduped by name). Those were deliberate and are far less destructive than the product
case, but they carry the same shape of risk if a name is reused.

## The client registration now charges (July 19, 2026)

Registering a client assigned them a value that **was not income anywhere**. `MembersController.Create`
created the `Member` and the `Subscription` but never a `Payment`, and `SubscriptionValue` was only
used by `ResolvePlanAsync` to set the plan's price when the plan was new or priced at 0. Meanwhile
the chart reads `monthlyRevenue`, which sums only `Payment` rows with `Status == Paid`. So the money
never appeared and reception had to capture the same client and the same amount a second time in
Finanzas. Renewing already charged (`handleRenewMembership` calls `registerPayment` first) — only the
initial registration didn't, which is what made it feel like double work.

Now the registration takes the charge, in the same `SaveChangesAsync` as the member and the
membership, so either all three exist or none do:

- **Pagado** creates a `Paid` payment: it lands in the month's income, the chart bar and "Pagos
  recientes" immediately.
- **Pendiente** creates a `Pending` payment: it goes to "Cartera por cobrar" and deliberately does
  **not** touch income. This was chosen over always assuming payment because a client who enrols
  today and pays on Friday is normal, and there is no endpoint to delete a payment invented by
  mistake.
- **The amount is editable**, pre-filled from the plan. `SubscriptionValue` stays the plan's list
  price and the new `PaymentAmount` is what was actually charged, so a discount for one client never
  rewrites what the plan costs everyone else.
- A charge with no plan, a non-positive amount, or an unknown status is rejected with **400 before
  anything is written** — a refused charge must not leave a member stranded without it.
- Omitting `PaymentStatus` charges nothing, so the previous request shape still behaves as it did.

**This is the first time "Cartera por cobrar" can hold anything.** It was dead UI (always $0, always
empty) because `FinanceController.RegisterPayment` hard-codes `Status = Paid` and nothing else
created payments. That is still true, so the gap is narrower, not closed: a *renewal* that has not
been paid still cannot be recorded. Registering a receivable at enrolment is now possible; doing it
later is not.

Because receivables could never exist, their row in `FinancialDashboard` had never actually been
rendered, and it hard-coded "Vencio {fecha}" / "N dias vencido". A registration debt is due in the
*future*, so it read "Vencio 19 de ago de 2026 · 0 dias vencido". It now says "Vence"/"Faltan N dias"
in amber while pending and switches to "Vencio"/"N dias vencido" in red once overdue.

Files: `CreateMemberRequest` (3 new optional fields), `MembersController.Create`,
`components/ClientForm.jsx` (the cobro block), `App.jsx` `handleCreateMember` — which now also calls
`refreshFinance()`, without which the backend charge would not reach the chart until a reload — and
`components/FinancialDashboard.jsx` for the receivable row.

Covered by `MemberRegistrationPaymentTests` (9 cases). **Verified to actually fail:** disabling the
payment block turns exactly 4 of them red (revenue, receivables, the discount, and cross-tenant
isolation of the new income) while the validation tests stay green.

Verified in the browser against the real backend and local Postgres on a freshly registered gym: a
paid registration put $120.000 into Ingresos, the July bar and "Pagos recientes" without opening
Finanzas; a pending one with a $90.000 discounted amount went to "Cartera por cobrar" and left
Ingresos untouched at $120.000.

**Worth knowing:** if reception also registers the payment in Finanzas out of habit, the income
doubles — there is no idempotency check. The form states what it will do and the payment shows up
immediately in "Pagos recientes", which is the only thing standing between the user and a double
count today.

## Forgotten check-outs close themselves (July 19, 2026)

A visit whose exit nobody recorded used to stay open forever, and that was **not cosmetic**: the
filtered unique index on `Attendances` (`"AccessGranted" = true AND "CheckedOutAt" IS NULL`) makes
`CheckIn` return 409, so **the member could not enter again**. The only cure, "Validar salida", is
offered only while the visit is still inside the 50 records the screen loads
(`getOpenAttendance` searches `attendanceLogs`, filled by `checkInApi.recent(50)`). In a busy gym
that is a day or two; after that the UI showed "Validar entrada" enabled, the click failed with the
raw English 409 (*"The selected member already has an active check-in"*), and there was **no way to
fix it from the interface at all**. "Personas dentro" also stayed inflated forever.

This was already happening: when this was implemented, `GymSaaS_Dev` held three open visits, two of
them abandoned since July 16 and 17.

The rule, in `Infrastructure/CheckIns/`:

- **A visit open for more than 12 hours is closed automatically.** Configurable via
  `CheckIn:AutoCloseAfterHours`; `CheckIn:AutoCloseStaleVisits=false` is the kill switch.
- **Why elapsed hours and not "end of day", which is the conceptually right rule:** the system does
  not store the gym's time zone anywhere. Everything is UTC, so a literal end-of-day cut would fire
  at 7pm Colombian time, with the gym full — worse than the bug. Twelve hours behaves like "the next
  day" and is time-zone independent. Doing it properly needs `TimeZone` on `Gym` first.
- **Why not just derive it at read time**, the way subscription expiry is derived: the index is
  enforced by PostgreSQL, so while the row still has `CheckedOutAt IS NULL` the next entry stays
  blocked no matter what the API computes. The row has to change. It is therefore written **lazily,
  when it matters** — inside `CheckIn` before the conflict check, and inside `GetRecent` so the
  counter is right as soon as the screen loads. Still no scheduler, same as everywhere else here.
- **The exit time is not invented.** `Attendance.AutoClosed` (new column, `AddAttendanceAutoClosed`
  migration, defaults false so existing rows are untouched) marks these, and `CheckedOutAt` holds
  *entry + 12h* — the cutoff — not the moment the sweep happened. A sweep running three days later
  must not claim the person left three days later. The UI shows **"Cierre automatico"** in the Salida
  column instead of a time, precisely so nobody reads a cutoff as an observation. If average stay
  time is ever computed, these rows must be excluded.

Files: `Domain/Entities/Attendance.cs`, `Application/Abstractions/IAttendanceMaintenanceService.cs`,
`Infrastructure/CheckIns/{CheckInOptions,AttendanceMaintenanceService}.cs`, `CheckInController`,
`AttendanceLogDto`, the `CheckIn` section in `appsettings.json`; frontend `adapters.js` and
`CheckInDashboard.jsx`.

Covered by `AttendanceAutoCloseTests` (6 tests). **Verified to actually fail:** setting
`AutoCloseStaleVisits=false` turns exactly 3 red (the blocked re-entry, the marking, and the
inflated counter) while the three that guard *live* visits stay green — which also proves the kill
switch works.

Verified in the browser on the QA gym: entry recorded, "Personas dentro 1"; the visit backdated 20h
in Postgres to simulate the forgotten exit; on reloading the screen the counter went to 0, the log
row read "Cierre automatico", and the member could **check in again normally** — the 409 that used
to be a dead end.

## Login screen: demo picker removed and failed-login message fixed (July 20, 2026)

Two changes to the authentication screen (`AuthScreen.jsx`):

**The "Cuentas demo" picker was removed.** The four quick-select demo buttons and the
"Selecciona una cuenta... Contrasena demo: Demo123!" line are gone. The demo **login logic itself is
untouched**: `handleLogin` in `App.jsx` still checks the local mock `users` array first, so a demo
account still works by typing its email and `Demo123!` — there is just no longer a one-click picker on
the login screen. Removing it made `useDemo`, the `getRoleLabel` import and the `users` prop dead, so
they were dropped from `AuthScreen` (and the `users` prop from the `AuthScreen` render in `App.jsx`).

**A failed login showed the wrong message.** `apiClient.js` treated *every* 401 as an expired
session: a wrong password on the login screen showed "Tu sesion expiro. Inicia sesion de nuevo."
(confusing — the user never had a session) and also fired the logout hook. Now the 401 handler
branches on whether a token is held: a 401 **with** a token is a real session expiry (logout, same as
before); a 401 **without** a token is a failed login (or other anonymous call) and surfaces the
backend's own plain-string body ("Correo o contrasena incorrectos.") without triggering logout. The
backend already returned that same message for both a wrong password and an unknown email (so it never
reveals which emails are registered); that message now actually reaches the user. The connection-error
text ("No se pudo conectar con el servidor") is now only shown for a genuinely unreachable backend.

Files: `components/AuthScreen.jsx`, `apiClient.js`, `App.jsx`. Verified in the browser against the real
backend and local Postgres.

## Membership dates are read-only in the client profile (July 20, 2026)

The mini-calendar in the client profile (`MembershipCalendar.jsx`, rendered by `MemberDetail`) had
**editable** `Inicio`/`Fin` date inputs that wrote straight to `PUT /api/members/{id}/membership` on
change. Editing a membership's dates from that profile view was not intended, so the two inputs are now
**read-only display text** (formatted with the component's `formatDate`), with no date picker.

The rest of the calendar (month navigation, the highlighted range, the legend) is unchanged.
**Legitimate date changes still happen** through the renewal flow (`handleUpdateMembership` in
`App.jsx`, still called by `handleRenewMembership`) — only the direct edit from the profile was
removed. The now-unused `onUpdateMembership` prop was dropped from `MembershipCalendar` and
`MemberDetail`, and from the `MemberDetail` render in `App.jsx`; the `handleUpdateMembership` handler
itself stays because renewal uses it.

Files: `components/MembershipCalendar.jsx`, `components/MemberDetail.jsx`, `App.jsx`.

## Client registration charge: fixed to the plan price, with an optional discount (July 20, 2026)

The cobro block added July 19 (see "The client registration now charges") let the receptionist **type
any amount** into "Valor a pagar". That free-text field was replaced by a **read-only** value plus an
explicit discount control:

- "Valor a pagar" is now **read-only**, derived from the selected plan's price — no longer a free
  number input.
- A **"Aplicar descuento" checkbox** reveals a percentage field (0-100). The value recalculates live as
  `round(planPrice * (1 - percent/100))`, with the original list price shown struck-through and the
  helper text spelling out the discount ("Incluye 10% de descuento sobre $ 60.000.").
- The percentage is clamped to 0-100; 100% enrols the client free (no payment row), 0% / no discount
  charges the full price.

**Why read-only + a discount toggle instead of a free field:** the free field could hold *any* number
unrelated to the plan, which made a typo silent and a discount indistinguishable from a fat-finger. A
percentage off the plan price is what a discount actually is, and it keeps the plan price as the anchor.

This maps onto the **existing backend model with no backend change**: `paymentAmount` is the discounted
amount actually charged (what reaches Finanzas / the receivable), while `subscriptionValue` stays the
plan's list price — so a discount for one client never rewrites what the plan costs everyone else (the
same separation "The client registration now charges" already relied on). The amount is now a
**derived value**, not React state, so it cannot desync from the plan and discount; the old `form.amount`
field was removed.

Files: `components/ClientForm.jsx`. Verified in the browser (Johan Gym Summit, Mensual $60.000 + 10% ->
$54.000 with $60.000 struck through, helper text correct); the registration was **not** submitted, to
avoid seeding a throwaway member into a real gym.

**Note:** this covers only the **initial registration**. A *renewal* still charges the plan price via
`handleRenewMembership` with no discount UI — extending the discount there is a separate change.

## Security fix: SubscriptionController deleted (July 18, 2026)

The `IgnoreQueryFilters()` scan in the new test suite found a real hole. `SubscriptionController` was
a prototype leftover that never received the July 15 auth hardening:
`POST /api/subscriptions/self-service/register-and-pay` was `[AllowAnonymous]`, took `TenantId`
**straight from the request body**, and called `IgnoreQueryFilters()` — so by design it wrote a
`Member`, `Subscription` and `Payment` into whichever gym the caller named, with no token and no rate
limiting. It was unreachable only by accident (`IPaymentGateway` had no implementation and was never
registered in DI, so the controller could not be constructed), and would have become a live
unauthenticated cross-tenant write the moment anyone wired up a payment gateway.

Its other action, `POST /api/subscriptions/admin/members`, merely duplicated `MembersController`
(worse: no biometrics, no optional email), which is what the frontend actually uses.

Deleted along with the 6 files it was the only consumer of: `Application/Payments/*` (the
`IPaymentGateway` abstraction) and `Application/DTOs/Subscriptions/*`. All recoverable from git
history if online card payments are rebuilt later — which should be done deliberately, not inherited
from a prototype. `AnonymousEndpointTests` now guards the general case: every endpoint reachable
without a token must be on a reviewed allow-list **and** be rate-limited.

## Account lockout: per-account brute-force protection (July 23, 2026)

The only defence against password guessing used to be the IP-based rate limiter
(`[EnableRateLimiting("auth")]`, 10/min per IP). That does nothing against a **distributed** guess —
one account, many IPs — and it punishes a whole gym behind one office IP for one person's fat
fingers. Login now also locks a **single account** after too many failures, tracked on the user row
so it is **independent of the caller's IP**. The two controls are complementary, not a replacement.

- Two new columns on `Users` (`AddUserLoginLockout` migration): `FailedLoginAttempts` (int, default
  0) and `LockoutEndsAt` (nullable `timestamptz`). Existing rows get `0` / `NULL`.
- `AuthController.Login`: a wrong password increments the counter; on reaching the threshold the
  account is locked (`LockoutEndsAt = now + LockoutMinutes`) and the counter reset. **While locked,
  even the correct password is refused** — the lock check runs *before* the password check, so a
  lucky guess during the window still fails. A successful login clears the counter and any stale lock.
- **Configurable, with a kill switch**, bound to the `AccountLockout` section (`AccountLockoutOptions`,
  next to `JwtOptions`): `MaxFailedAttempts` (5), `LockoutMinutes` (15), `Enabled` (true). Set
  `Enabled=false` to disable without a deploy if it ever misfires on a real customer — same
  escape-hatch pattern as `Billing:EnforceSubscription`. Named `AccountLockoutOptions` on purpose:
  `LockoutOptions` collides with `Microsoft.AspNetCore.Identity.LockoutOptions`, which is in scope
  wherever the password hasher is (a plain `LockoutOptions` fails to build with `CS0104`).

**Tradeoffs, chosen deliberately:**

- **Mild user enumeration.** A locked account returns a distinct "Demasiados intentos" message, so an
  attacker who has already guessed wrong `MaxFailedAttempts` times learns the account exists. Standard,
  and gated behind that many failures plus the IP limiter; kept because the alternative (a generic
  message even when the correct password is being refused) is worse for the real user, who then has no
  idea why the right password does not work.
- **Lockout is a DoS on the victim.** Anyone who knows an email can lock it for `LockoutMinutes` by
  failing on purpose. Inherent to any account lockout; mitigated by keeping the window short and
  self-expiring, and the lock never *extends* on further attempts while already locked.

Files: `Domain/Entities/User.cs`, `Infrastructure/Auth/AccountLockoutOptions.cs` (new),
`Infrastructure/DependencyInjection.cs`, `API/Controllers/AuthController.cs`, `API/appsettings.json`,
migration `20260724001303_AddUserLoginLockout` (the id is UTC, so it reads one day ahead of this
section's local date).

Covered by `AccountLockoutTests` (2 tests): the account locks after the threshold **even when every
attempt comes from a different IP** (proven via the test factory's random-per-request client IP — see
`GymApiFactory.ClientIpStartupFilter`), and a successful login before the threshold resets the
counter. **Verified to actually fail:** flipping `AccountLockout:Enabled` to `false` turns the lockout
test red. All 59 integration tests pass against the local Postgres.

## Landing page, /app/ split and legal pages (July 24, 2026)

The marketing landing page from the separate `D:\LandingPageGym-main` workspace was brought into this
repo as `landing/`. `gymassist.online` now serves the landing at the root and the dashboard at
`/app/`.

**Why two builds and not one app.** The two projects do not share a stack: the landing is
**Tailwind 4 / React 19 / Vite 8** (CSS-first `@theme`, `@tailwindcss/vite`, framer-motion,
lucide-react) and the dashboard is **Tailwind 3 / React 18 / Vite 6** (PostCSS, `tailwind.config.js`,
`darkMode: "class"`). Two Tailwind majors cannot share one build, and porting either one risks
breaking a working UI — the dashboard alone is ~20 components of v3 markup. So they stay as two
independent `npm` projects, built separately and combined only at the Nginx layer. Neither codebase
had to be restyled.

- **`Dockerfile` (repo root, new)** — three stages: `node:22-alpine` builds `landing/` (Vite 8 needs a
  newer Node than the dashboard's Vite 6), `node:20-alpine` builds `frontend/` (unchanged, proven),
  then `nginx:1.27-alpine` copies `landing/dist` to the web root and `frontend/dist` to `html/app`.
  `VITE_API_BASE_URL` is still a build arg on the dashboard stage only.
- **`nginx.conf` (repo root, new)** — one server, two SPA fallbacks. `/app/` gets its own
  `try_files ... /app/index.html` so a refresh inside the dashboard never lands on the landing.
  `location = /app` 301s to `/app/`. Cache rules are preserved from the old config and extended to
  both apps via the regex location `~ ^/(app/)?assets/` (regex locations beat prefix locations in
  Nginx, so it also covers `/app/assets/`), with both `index.html` shells `no-cache`.
- **`frontend/vite.config.js`** — `base: "/app/"`. This is what makes the dashboard's built asset URLs
  `/app/assets/...`. Verified in the build output. Nothing in the dashboard navigates by absolute
  path, so nothing else needed changing (checked).
- **`backend/.../appsettings*.json`** — `Frontend:BaseUrl` gained the `/app` suffix so emailed
  reset/verify links keep working. `AuthController` builds `{BaseUrl}/?reset=...` after trimming a
  trailing slash, so the result is `https://gymassist.online/app/?reset=TOKEN`.

**Legal pages.** `landing/public/privacidad.html` and `terminos.html`, plus the shared
`landing/public/_legal.css`. Plain static HTML on purpose — no router in either app, and a legal
document has no reason to be a React component. Nginx's `try_files $uri $uri.html` serves them at the
clean URLs **`/privacidad`** and **`/terminos`**.

They reference their stylesheet and favicon by **relative** path (`_legal.css`, not `/_legal.css`).
This matters: with a leading slash, double-clicking the file in Explorer loads
`file:///D:/_legal.css`, which does not exist, and the page renders as raw unstyled HTML — which is
exactly how it was first reported as "not working". Relative paths resolve correctly in all four
cases (`/privacidad`, `/privacidad.html`, the built `dist/`, and `file://`), because the pages and
the stylesheet always sit in the same directory. The cross-page links (`/`, `/terminos`, `/app/`)
stay absolute — they are site routes and must keep the clean URLs in production — so they are still
the one thing that cannot work from `file://`. A small inline script shows a banner explaining that,
but only when `location.protocol === "file:"`; served, it is inert and takes no space. They are styled to match the landing but load **no
external font and make zero third-party requests** (verified: `performance.getEntriesByType`
returned an empty list of non-localhost resources) — a privacy policy that phones home to a CDN
undercuts its own contents.

Both documents are **honest drafts, not publishable text**: 14 `[POR COMPLETAR]` markers for the
legal identity, retention periods, sub-processors and jurisdiction, and two amber "verify before
publishing" boxes on the Conservación and Seguridad sections — because the system does **not** yet
have scheduled deletion, production backups, or a working email sender, and a policy must not promise
those. The data inventory in them was read off the actual EF entities and is accurate.

The central legal point they encode: **for gym staff we are the controller, for gym members we are
the processor** — the member never signed up with us. That means a DPA annexed to each gym's
contract, which does not exist yet. Member body measurements, body fat and trainer notes are
health-related data (special category under GDPR, *dato sensible* under Ley 1581/2012), and nothing in
`ClientForm.jsx` captures the member's consent; the gym has to.

**Navigation.** The landing's three "Admin" buttons were dead `<button>`s; they are now
`<a href="/app/">`. The footer gained a bottom bar with **Privacidad** and **Términos**. On the
dashboard login screen, the "Al continuar, aceptas..." line (added the same day) links to the same
two pages, `target="_blank"` so the login form is not lost.

The return trip is a **"‹ Volver al inicio"** link (`<a href="/">`) in `AuthScreen.jsx`, placed in
the shared shell **outside** the three-way mode switch, so it renders identically on login, on the
invite-code gate and on the registration form. It replaced the old `lg:hidden` GymFlow wordmark
block, which is now the left half of the same flex row (still mobile-only, since the green panel
already carries the brand on `lg`). The login eyebrow lost its `mt-8 ... lg:mt-0` hack — that margin
only existed to clear the old wordmark, and the new row's `mb-6` now spaces all three modes
consistently.

⚠️ **In dev, "Volver al inicio" only works if you entered through the landing on 5174.** The link is
`/`, so from the dashboard's own dev server it resolves to `localhost:5173/`, which is not the
landing (that server has `base: "/app/"`). This is a dev-only artifact of running two servers; in
production one Nginx owns both paths on one origin, so `/` is always the landing.

**Dev ergonomics.** `landing` runs on **5174** (`strictPort`), since 5173 is the dashboard and that
port is baked into `.env.local`, CORS and `appsettings.Development.json`. Two small config additions
make dev match production: the landing proxies `/app` to `localhost:5173`, and the dashboard proxies
`/privacidad|/terminos|/_legal.css` to `localhost:5174`.

🔴 **Both dev servers must be running, or "Admin" looks broken.** Clicking Admin on the landing with
nothing listening on 5173 gives `GET /app/ -> 502 Bad Gateway` (`http proxy error: /app/`,
`ECONNREFUSED` in the landing's terminal) and the browser appears to do nothing. This was reported
as an Admin-button bug on July 24, 2026 and was not one — the link was fine, the dashboard server had
stopped. **This failure mode does not exist in production**, where a single Nginx serves both from
one image and there is no second process to be down. When Admin seems dead in dev, check
`localhost:5173/app/` directly before touching the markup. The landing also has a **12-line dev-only
Vite plugin** (`htmlExtensionFallback`) that reproduces Nginx's `$uri.html` probe — without it
`/privacidad` falls through to the SPA in dev and the footer links appear broken, which invites
someone to "fix" them to `/privacidad.html` and break production instead. `.claude/launch.json` has a
`landing` entry.

**Verified** with both dev servers running: landing renders with no console errors; `/privacidad` and
`/terminos` resolve at the clean URLs with correct styling, 3 tables, and every table-of-contents
anchor resolving; `/app/` serves the dashboard, which mounts and shows the login screen with assets
under `/app/`; the Admin links and legal links carry the right hrefs. `npm run build` passes for both
apps (landing 349 kB / 110 kB gzip, dashboard 406 kB / 107 kB gzip).

🔴 **NOT verified: the Docker image and the Nginx routing.** There is no Docker in this dev
environment, so the repo-root `Dockerfile` has never been built and `nginx.conf` has never been
parsed. The dev-server proxies reproduce the *routing* but not the *Nginx config itself*. On the first
deploy, check in this order: (1) the build succeeds at all — Base Directory must be `/`; (2)
`gymassist.online` shows the landing; (3) `gymassist.online/app/` shows the login screen and its
assets return 200, not 404; (4) a hard refresh on `/app/` stays on the dashboard; (5) `/privacidad`
resolves without the `.html`.

**Known cosmetic debt introduced with the landing** (all pre-existing in that project, none blocking):

- The **contact form is fake**: `Contact.jsx` `handleSubmit` only sets local state and shows
  "¡Mensaje enviado! Te contactaremos muy pronto." The message is discarded. This is a live promise
  the product does not keep and should be wired to a real endpoint or removed.
- Placeholder contact details: `hola@gymflow.app` and `+52 (55) 1234 5678` (a Mexico City number).
  The address kept its old spelling through the July 26 rename **on purpose** — renaming it would
  have invented an address that does not exist, which is worse than an obviously fake one.
- The landing's `index.html` loads **Plus Jakarta Sans from Google Fonts**, so the root page sends
  visitor IPs to Google. Until July 24 the site made no third-party requests at all. It is disclosed
  in the privacy policy; self-hosting the font would remove both the disclosure and the dependency.
- ~~**Brand split: the UI says "GymFlow" everywhere, the domain and the login notice say
  "Gymassist".**~~ — **settled July 26, 2026**: everything user-facing now says **Gym Assist**. See
  "Rebrand to Gym Assist" below.
- The landing's plan tiers (Básico / Pro / Premium, with per-tier user and plan caps) do **not** match
  the backend's `SubscriptionPlan` values (`trial` / `starter` / `professional`), and none of those
  caps are enforced anywhere in the code.

## A payment renews from the day it was received (July 26, 2026)

`FinanceController.RegisterPayment` renews an expired membership as a side effect of taking the
money. It stored whatever `PaidAt` it was given but always renewed from **`today`**, so registering
a payment received two weeks earlier handed out two extra weeks of membership — free days nobody
charged for, produced by the ordinary act of catching up on paperwork.

The new period is now anchored on the payment date:

```csharp
var paidOn = DateOnly.FromDateTime(paidAt.UtcDateTime);
var renewalStart = paidOn > subscription.EndDate ? paidOn : subscription.EndDate;
```

- **Never earlier than the old end date.** A payment made *before* the membership lapsed (received on
  time, registered late) stacks on top of the period already paid for. Anchoring on the payment date
  alone would have swallowed those days.
- **The default path is unchanged.** With no `PaidAt` the endpoint still uses `DateTimeOffset.UtcNow`,
  so a payment entered the day it is received renews from today exactly as before.
- **The condition that triggers a renewal did not change** — still "suspended, or the end date is in
  the past". Only the day the new period starts from changed.
- A wildly backdated payment can now leave the new end date *still* in the past. That is correct —
  they paid for a period that has already elapsed — and `MembershipStatusService` derives "Vencida"
  from the end date, so such a member is shown as expired regardless of the stored
  `SubscriptionStatus`.

**Worth knowing about the UI:** today's renewal flow (`handleRenewMembership` in `App.jsx`) calls
`registerPayment` and then immediately `updateMembership` with dates the frontend computed, which
overwrites whatever the endpoint decided. This fix therefore bites when that second call does **not**
happen — another client, or the update failing after the payment already succeeded. Which is exactly
the case where a silent extension would go unnoticed.

Covered by `PaymentRenewalDateTests` (3 cases). **Verified to actually fail:** restoring the `today`
anchor turns 2 of them red — the late-registered payment runs 14 days long, the paid-before-expiry
case swallows 10 already-paid days — while the same-day test stays green, which is what proves the
ordinary path was not touched. All 62 integration tests pass against the local Postgres.

Files: `backend/src/API/Controllers/FinanceController.cs`,
`backend/tests/GymSaaS.IntegrationTests/PaymentRenewalDateTests.cs`.

## Rebrand to Gym Assist (July 26, 2026)

The product is called **Gym Assist**. The UI said "GymFlow", the login notice said "Gymassist" and
the backend emails said "GymAssist" — 33 occurrences across 15 files, all now "Gym Assist": both
dashboard wordmarks and the login copy, the landing's header / hero / features / plans / footer /
contact, page titles and meta descriptions, both legal pages, and the password-reset and
email-verification subjects and body.

The rename was deliberately **case-sensitive**, which is what made it safe to do in bulk. Four
lowercase `gymflow` strings were left untouched:

- `gymflow-session` (`session.js`) and `gymflow-registered-gyms` (`App.jsx`) — **localStorage keys**.
  Renaming them logs every user out and orphans locally registered gyms, for no visible gain. They
  are invisible to users; leave them alone.
- `gymflow-landing` — the landing's npm package name, internal only.
- `hola@gymflow.app` — a placeholder address (see the landing's cosmetic debt above).

The backend email templates now say Gym Assist, but no provider is wired yet, so they still only
reach the log.

## Configuracion: owner labels, and the Rol field is gone (July 26, 2026)

In "Datos del gimnasio", "Nombre del usuario" / "Correo del usuario" became **"Nombre propietario"**
and **"Correo propietario"**, and the **Rol dropdown was removed entirely**.

That dropdown was already fake. `adapters.js` hard-codes `adminRole: "Propietario"` when mapping
`GET /api/gym`, and the gym-profile DTO has no role field at all — so choosing "Administrador" or
"Recepcion" updated local state, looked saved, and reverted on the next refetch. The role now renders
as a small badge beside the owner's name in the gym summary card on the right, which is what it
actually is: a fixed fact about the owner, not a setting.

`profileForm.adminRole` is still held in state and still sent on save, because the demo (no backend)
path reads it back for that badge. Only the input is gone.

Files: `frontend/src/components/GymSetup.jsx`.

## Login screen: show/hide password (July 26, 2026)

The login password field got the same eye / eye-off toggle the registration form already had, with
the same icons and the same `Mostrar contrasena` / `Ocultar contrasena` labels, so both screens
behave identically. The button is `type="button"`, so it never submits the form.

Its spacing differs from the registration form on purpose: the `mt-1.5` sits on the wrapper `div`
rather than on the input, so the relative box matches the field exactly and
`top-1/2 -translate-y-1/2` centres the button with no correction. `GymRegistrationForm` keeps that
margin on the input itself, which is why it needs its `mt-[3px]` nudge.

The "Contrasena temporal" field in `AccessManagement.jsx` was deliberately left alone — it is
declared `type="text"` because an admin has to read it out to the new user.

Files: `frontend/src/components/AuthScreen.jsx`.

## Trainer assignment block in the Classes tab (July 29, 2026)

A new "Asignacion de entrenadores" card sits in `ClassSchedule.jsx` **between the four metric cards
and the class cards**, so Spinning/Funcional/Yoga and the "Reservar cupo" aside were pushed down. It
answers "which members belong to which trainer", which nothing in the app expressed before.

- **Left: a client table** styled like the members table (same rounded-2xl shell, emerald left
  accent, uppercase header, the name filter living *inside* the `Miembro` header cell) but reduced to
  the roster: avatar, name, email, plus a checkbox column and an `Entrenador` badge column.
- **Selection is stored by member id, not by visible row.** That is the whole point of the feature as
  asked: filter "laura", tick her, filter "silva", tick him, clear the filter and both are still
  ticked. A header checkbox selects/deselects only the currently *filtered* rows and leaves the rest
  of the selection alone; it shows the indeterminate state via a callback ref, since React has no
  `indeterminate` prop.
- **Right: six fixed `Entrenador 1..6` buttons** (`trainerSlots`, generated), each with a violet
  count pill, an `Asignar` button beside the grid, and below it a `Filtrar por entrenador` select
  whose options carry the count (`Entrenador 2 (2)`) over the list of assigned members, each with a
  `Quitar`. Assigning clears the member selection and moves the filter onto the trainer just used, so
  the result is visible without another click.

**Three things to know before building on it:**

- 🔴 **Nothing persists.** There is no entity, no column and no endpoint for a member↔trainer
  relation, so this is React state and **dies on refresh or logout**. It deliberately does *not* use
  `localStorage`: this app's real-gym data is backend-backed and shared across staff and devices, and
  a roster that silently differs per browser is worse than one that is obviously temporary. Making it
  real means a column on `Member` (or a join table if a member may have several trainers), a
  migration, and a field on the member endpoints.
- **The state lives in `App.jsx`, not in `ClassSchedule`.** `App.jsx` renders each tab with
  `{activeTab === "classes" ? <ClassSchedule .../> : null}`, so the component **unmounts on every tab
  change**. Held locally, every assignment would vanish on a trip to Finanzas. It is reset in both
  branches of the workspace switch, next to `setClassCatalog`, so one gym never inherits another's.
- **The six trainers are labels, not users.** They are not `User` rows with role `Trainer`, and they
  have nothing to do with the free-text `coach` field on a class. Wiring them to the real staff means
  feeding `trainerSlots` from `api/staff`, which is a different (and better) feature.

Gated behind `canManageClasses` (owner/admin/trainer), the same permission that already governs
"Programar clase" in this screen — reception does not see the block.

Files: `frontend/src/components/ClassSchedule.jsx` (the block, its state and handlers),
`frontend/src/App.jsx` (`trainerAssignments` state, `handleAssignMembersToTrainer`,
`handleUnassignMemberTrainer`, the two workspace resets, three new props). No backend change, no
migration.

Verified in the browser on a demo account: the filter-select-filter-select cycle keeps both
selections; assigning two members shows the badge in the table and `Entrenador 2 (2)` in the filter;
`Quitar` drops it back to (1); the assignment survives a tab switch to Finanzas and back; no console
errors; no horizontal overflow at 375px (the table scrolls inside its own container); `npm run build`
passes.

**Note on verifying dark mode in this environment:** the preview pane does not composite frames
(screenshots time out), so CSS transitions never advance and `getComputedStyle` returns the *pre-toggle*
colour — every button read as white-on-dark, including pre-existing ones nobody had touched. It is not
a bug. Setting `element.style.transition = "none"` before reading returns the real value
(`.app-content button` has a 160ms `background-color` transition, `index.css`). Worth remembering
before "fixing" a dark-mode problem that does not exist.

## Local development environment (set up July 16, 2026)

PostgreSQL 16.6 was installed locally on this machine using the **official portable binaries** (zip from `get.enterprisedb.com`, no installer, no admin rights):

| | |
|---|---|
| Binaries | `D:\pgsql` (includes pgAdmin 4) |
| Data directory | `D:\pgdata` |
| Port | `5432` (the machine also runs SQL Server Express on 1433 — no conflict) |
| Superuser | `postgres` — the password is **not written here on purpose** (this repo is public). It already lives in this machine's user-secrets. |
| Database | `GymSaaS_Dev` |

The connection string is stored machine-locally via user-secrets and is never committed:

```bash
# from backend/src/API — only needed once per machine, or if the cluster is recreated
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=GymSaaS_Dev;Username=postgres;Password=<local password>"
dotnet user-secrets list   # shows the value currently configured on this machine
```

**It is NOT registered as a Windows service**, so it does not start automatically after a reboot. Start it with:

```bash
D:\pgsql\bin\pg_ctl -D D:\pgdata -l D:\pgdata\server.log start
```

(`pg_ctl -D D:\pgdata status` to check, `stop` to stop.) Registering it as a service needs admin rights and has not been done.

Run the whole stack locally:

```bash
# backend (http://localhost:5080) — needs Postgres running first
dotnet run --project backend/src/API/GymSaaS.Api.csproj

# dashboard (http://localhost:5173/app/) — frontend/.env.local points it at the backend
cd frontend && npm run dev

# landing (http://localhost:5174) — enter here for the production-like flow
cd landing && npm run dev
```

`.claude/launch.json` has an entry for each of the three, so they can also be started by name.

🔴 **`Cors:AllowedOrigins` must list both dev ports.** The dashboard is reachable at
`localhost:5173/app/` *and*, through the landing's proxy, at `localhost:5174/app/` — and the browser
sends the origin it was loaded from. With only `5173` allowed, entering through the landing made
every API call fail the preflight, and the app reported it as **"No se pudo conectar con el
servidor."** — which reads as a dead backend even though the backend is fine and the log says
`Request origin http://localhost:5174 does not have permission to access the resource`. Both ports
are allowed in `appsettings.Development.json` since July 26, 2026. Production is unaffected: one
Nginx serves both paths from a single origin, so this cannot happen there.

`launchSettings.json` sets `ASPNETCORE_ENVIRONMENT=Development`, which is what makes user-secrets load. Without it `dotnet run` starts in Production and fails with "Connection string 'DefaultConnection' is required."

## Operator scripts

`scripts/list-users.sh` (added July 19, 2026) lists the registered staff/owner accounts grouped by gym (email, name, role, active, created), with optional `GYM=` / `EMAIL=` substring filters. Same `DATABASE_URL` (+ optional `PG_BIN`) convention as the backup script. **It does not — and cannot — show passwords:** only the one-way PBKDF2 `PasswordHash` is stored (ASP.NET Core `PasswordHasher`), so there is no plaintext to read; a locked-out user is helped via `POST /api/auth/forgot-password`, never by reading or setting their password. The file ends with a copy-paste `psql` one-liner for running it straight from the Coolify Postgres terminal (where `$POSTGRES_USER`/`$POSTGRES_DB` are already set), since the classifier blocks typing into that terminal from here.

## Backups

`scripts/backup-db.sh` (added July 16, 2026) dumps the database with `pg_dump --format=custom` (compressed, restorable with `pg_restore`), timestamps the file, and prunes to the newest `RETENTION` dumps (default 14).

```bash
# local (this machine)
PG_BIN="D:/pgsql/bin" \
DATABASE_URL="postgresql://postgres:<local password>@localhost:5432/GymSaaS_Dev" \
  ./scripts/backup-db.sh

# restore over an existing database
pg_restore --clean --if-exists --no-owner --no-privileges -d "$DATABASE_URL" backups/<file>.dump
```

`backups/` and `*.dump` are gitignored: dumps contain real gym data and this repo is public. Note `DATABASE_URL` carries the password, so pass it from the environment — never hard-code it. If the password contains `!` or other URL-reserved characters, percent-encode it (`!` -> `%21`).

**Verified July 16, 2026**: a local dump was restored into a scratch database and matched the original exactly (23 tables; same row counts for Gyms/Members/Payments/SaasSubscriptions). A backup that has never been restored is not a backup.

**Still to do for production** (needs Coolify access, not yet done):
- Prefer **Coolify's built-in scheduled backups** on the PostgreSQL resource (it supports a schedule + S3 off-site storage) over a hand-rolled cron. Set a schedule, an off-site destination, and a retention.
- Whatever the mechanism, **test a restore at least once** — otherwise you only think you have backups.
- Take a manual backup immediately **before** the first deploy of the July 16 migrations, since that deploy applies four migrations to the live database.

## Why PostgreSQL and not SQL Server (decided July 16, 2026)

The machine also has a SQL Server Express database `GymApp` (`JOHAN\SQLEXPRESS`) with an earlier, hand-made schema: `ETGimnasio`, `ETUsuarioGym`, `ETRoles`, `ETProductos`, `ETVentas`, `ETDetalleVentas`, `PMPagos`, `PMPlanesMembresia`, `Gestion_Modelo_Saas`, `Saas_Invoices`. **The decision is to stay on PostgreSQL.** Reasons, for the record:

- Production already runs Postgres on Coolify and is live at `gymassist.online`.
- The backend is Npgsql-based and uses Postgres-specific SQL (the filtered unique index on `Attendances`).
- **The project is code-first**: the C# entities + EF migrations *are* the schema; the database is generated from them. Designing tables by hand in SSMS and porting later would create two designs that diverge.
- `Program.cs` runs `dbContext.Database.Migrate()` at startup, so a hand-created schema would break the migration history and the app would fail to start.
- SQL Server Express caps at 10 GB per database.
- Those tables were checked and are **empty** (only `ETGimnasio` 2 rows, `ETRoles` 1, `ETUsuarioGym` 1) — there was nothing to migrate.

`GymApp` was left untouched as a **design reference**. Its ideas are being ported into the EF model instead (SaaS billing already was; product sales are still pending — see Known gaps).

## Known gaps (as of July 18, 2026)

- **Product sales (POS) are not implemented.** The Inventario tab says "Registra productos vendidos en la recepcion" and shows inventory value, but nothing records a sale. Needs `Sale`/`SaleItem` entities, stock decrement on sale, and the sale feeding Finanzas income. The user's SQL Server design (`ETVentas`/`ETDetalleVentas`) modelled this; it was deliberately deferred.
- **No real email provider.** `ConsoleEmailSender` only logs; password-reset and verification emails are not delivered.
- **Frontend does not consume the `?reset=` / `?verify=` links** the backend emails.
- **Production backups are NOT configured yet** on Coolify, and there is no monitoring/alerting. A backup *tool* exists and is verified (see Backups below), but nothing is scheduled against the production database. Do this before any real gym puts data in.
- `FinanceController.GetSummary` returns **all** paid payments and expenses (not truncated) because the frontend derives analytics and per-category totals from those lists; a `Take(n)` would silently skew them. This will need pagination or server-side aggregation as data grows.
- No admin/super-user surface: invite codes and SaaS invoices are inserted straight into Postgres by the operator. There is also no super-user *concept*: `User.Role` is per-tenant (Owner/Admin/Reception/Trainer), so there is no principal that legitimately spans gyms.
- **Trainer assignment does not persist** (added July 29, 2026). The "Asignacion de entrenadores" block in the Classes tab is real, working UI over React state — there is no member↔trainer column, table or endpoint, so it is lost on refresh. It is also disconnected from the real staff: the six `Entrenador N` buttons are labels, not `User` rows with role `Trainer`. See "Trainer assignment block in the Classes tab".

Found July 18, 2026 while simulating a real gym (12 clients, 27 payments, attendance, classes, inventory, operations) and then exercising every create/edit/delete path:

- ~~**"Cartera por cobrar" can never be populated.**~~ — **partly fixed July 19, 2026**: registering a client can now create a `Pending` payment (see "The client registration now charges"). What is still missing is recording a debt *after* enrolment: `FinanceController.RegisterPayment` still hard-codes `Status = PaymentStatus.Paid`, so an unpaid **renewal** has no way to be registered. Needs a flag on that endpoint.
- ~~**A backdated payment grants extra days.**~~ — **fixed July 26, 2026**, see "A payment renews from the day it was received" below.
- ~~Registering a product with an existing SKU silently overwrote that product~~ — **fixed the same day**, see below.
- The 6-month chart's "users" line counts members by `CreatedAt`, so imported or newly seeded members all land in the current month and history reads as zero. Correct for a gym that grows over time; misleading if data is ever migrated in.

Verified working correctly in that same pass (45 checks, all green once the test's own errors were corrected): check-in/check-out full cycle including re-entry after exit and 409 on double entry or exit-without-entry; expired and suspended members blocked with the right reason and the blocked attempt logged; class capacity enforced with 409 and a cancellation freeing the slot; deleting a plan that is in use hides it without breaking existing memberships; deleting a member keeps their payment history in the revenue totals.

Other notes:

- 🔴 **`Jwt:SigningKey` in the committed `appsettings.json` is the placeholder `REPLACE_WITH_A_STRONG_RANDOM_SECRET_AT_LEAST_32_CHARS_LONG`, and this repo is public.** If Coolify does not override `Jwt__SigningKey` with a real random secret, production signs tokens with a string anyone can read on GitHub — which means anyone can forge a token for any gym and every tenant-isolation guarantee becomes decorative. The app starts fine with the placeholder (it is 52 chars, so it passes validation), so there is **no visible symptom**. Verify this in Coolify before anything else.
- ~~The trial is stored but never enforced~~ — **fixed July 18, 2026, see "Subscription enforcement" below.** `ApprovalStatus` and email verification are still *not* enforced (deliberately: a pilot gym must work immediately).
- **No health-check endpoint** (`/health`), so Coolify has nothing to probe and no way to restart a wedged container.
- ~~Stale UI copy on the registration screen ("Demo local: la verificacion de correo y la aprobacion se simulan hasta conectar el backend")~~ — **removed July 18, 2026** when that form was rewritten.

Important backend note:

- `GymSaaS.Api.csproj` and `Program.cs` are committed; `dotnet build` succeeds with 0 errors after the PostgreSQL switch.
- `dotnet run --project backend/src/API/GymSaaS.Api.csproj` starts Kestrel successfully, but DB-backed endpoints (e.g. `/api/check-ins/recent`) return 500 without a reachable PostgreSQL server at the `DefaultConnection` string.
- As of July 16, 2026 **every business feature of a real gym goes through the backend** (see the two-mode note under Frontend). A missing database now blocks real gyms entirely; demo accounts still work offline.
- EF Core migrations under `backend/src/Infrastructure/Persistence/Migrations/`, in order: `InitialCreate`, `AddInviteCodes`, `AddUsersAndGymCity`, `AddBusinessEntities` (July 16 — the 11 new business tables + Member/Gym/Plan columns), `MakeMemberEmailOptional`, `AddUserTokens`, `AddSaasBilling`, `AddGymCountry` (July 18 — `Gyms.Country`, nullable, so gyms registered earlier simply have NULL), `AddAttendanceAutoClosed` (July 19 — `Attendances.AutoClosed`, boolean, defaults false), `AddUserLoginLockout` (July 23 — `Users.FailedLoginAttempts` int default 0 and `Users.LockoutEndsAt` nullable timestamptz, for the per-account login lockout). Ten total. `Program.cs` runs `dbContext.Database.Migrate()` at startup so deploys apply pending migrations automatically, no manual step needed.
- **EF tooling quirk to know about:** `dotnet ef migrations add` with `--output-dir ../Infrastructure/Persistence/Migrations --namespace GymSaaS.Infrastructure.Persistence.Migrations` writes the migration to the right place but drops an **extra `GymSaaSDbContextModelSnapshot.cs` into `backend/src/API/GymSaaS/Infrastructure/Persistence/Migrations/`**. Two snapshots = `CS0579 Duplicate 'DbContext' attribute` and the build breaks. After every `migrations add`, copy that stray snapshot over `backend/src/Infrastructure/Persistence/Migrations/GymSaaSDbContextModelSnapshot.cs` and delete the stray `backend/src/API/GymSaaS/` folder.
- **Verified end-to-end against a real PostgreSQL on July 16, 2026** (this replaces the earlier "not verified" caveat). Against the local Postgres described above: all 7 migrations applied cleanly (22 tables; the Postgres-syntax filtered unique index on `Attendances` created correctly), and a 33-check integration suite passed 33/33:
  - **Multi-tenant isolation** — two gyms (Alfa, Beta) registered through the real API. Beta sees none of Alfa's members/plans/products/revenue, and — the important part — direct **cross-tenant access by id** (edit, delete, suspend, check-in, stock update using Alfa's exact ids) all return **404**, with Alfa's data left intact. The isolation comes from the `HasQueryFilter` on every `ITenantScoped` entity plus the `tenant_id` JWT claim via `ClaimsTenantProvider`.
  - Clean workspace (a new gym starts empty), real persistence (a payment shows in that gym's revenue and not the other's), duplicate check-in blocked by the filtered unique index (409), single-use invite codes (409 on reuse), `401` without a token, and the SaaS trial subscription created at registration with the chosen plan.
  - **Browser end-to-end:** logged into the frontend as a real Postgres-backed gym, saw its data, **hard-refreshed the page, and stayed logged in with the data intact** — the exact behaviour that was broken before.
  - That test script lived in a temp scratchpad and was lost. **It has since been re-created as a permanent suite** — see "Automated tests" above.
- **Re-verified in the browser on July 18, 2026** against the real backend and local Postgres, on a freshly registered gym: invite gate rejects an invalid code and accepts a valid one; registration creates the gym in Postgres with the chosen plan (`starter`), `ApprovalStatus = Pending` and a 14-day trial; clean workspace; plan and client creation persist; **hard refresh keeps both session and data**; no console errors; logout clean; demo accounts unaffected.
- **Still not deployed.** The Coolify deployment still runs the pre-July-16 code. (The work itself *is* committed now — see Git Status Notes.)
- Deployment: a self-hosted Coolify instance ("Back-end Server") has this repo's `backend/` wired up as a Dockerfile-based application (Base Directory `/backend`, Ports Exposes `8080`), plus a separate PostgreSQL database resource, both running as of July 13, 2026. The real connection string/credentials live only in Coolify's Environment Variables for that app, never in this repo (the GitHub repo is public).
- Verified live end-to-end on July 13, 2026: the migration applied automatically on deploy (all tables + indexes created, including the Postgres-syntax filtered unique index on `Attendances`), and `/api/check-ins/recent` returns `200 []` with a tenant header.
- Domain: `https://gymassist.online` was reassigned to the frontend app (see Frontend > Deployment), so the backend now runs on Coolify's auto-generated domain, currently `http://rtd0nqdvy8gwlo6zwwrtigtr.67.207.90.99.sslip.io`. No DNS wildcard exists for `*.gymassist.online` (confirmed via `nslookup`), so a subdomain like `api.gymassist.online` would need an A record added at the registrar before it could be used here.

## Git Status Notes

This history (`bc260ce` … `2e88a8b`) is from the prior `D:\GYM` / `GymRepos.git` / `develop` workspace and predates this repo's history; it's kept here only as background on prior feature work, not as this repo's log.

This repo (`GymProyectChanges.git`) history, oldest to newest:

- `1ab8650 Create Test` (initial placeholder commit made via the GitHub UI)
- `8f6a11a Add Gym SaaS dashboard project (frontend + backend)` (imported the full project from the `D:\GYM` workspace onto `main`)
- `17e65d6 Switch backend from SQL Server to PostgreSQL`
- `cb95d15 Add initial EF Core migration and frontend Docker deployment`
- `439d5f6 Add invite-code gate for gym registration`
- `4155c8f Add real backend authentication and harden security posture` (the July 15, 2026 work — this **is** committed; an earlier version of this file wrongly said it was still pending)

- `9a99385 Persist real per-gym data in PostgreSQL` (the July 16, 2026 work — the whole persistence layer; **this is committed**, an earlier version of this file said it was still pending)
- `ebd71cd Add verified database backup script`

Current branch for ongoing feature work:

- **`main`**, at `09e0503 Add integration tests, CI, subscription enforcement and registration fields`.
  (An earlier version of this file said `feat/real-persistence-tier1-tier2` at `ebd71cd` with the
  July 18 work uncommitted — that is out of date: it **was** committed as `09e0503`.)
- Uncommitted as of July 19, 2026 — two features from that day plus this CONTEXT.md update:
  - **Charge at client registration**: `CreateMemberRequest`, `MembersController`, `ClientForm.jsx`,
    `App.jsx`, `FinancialDashboard.jsx`, `MemberRegistrationPaymentTests.cs`.
  - **Automatic close of forgotten check-outs**: `Attendance.cs`,
    `IAttendanceMaintenanceService.cs`, `Infrastructure/CheckIns/*`, `CheckInController`,
    `AttendanceLogDto`, `DependencyInjection`, `appsettings.json`, the
    `AddAttendanceAutoClosed` migration, `adapters.js`, `CheckInDashboard.jsx`,
    `AttendanceAutoCloseTests.cs`.
  - `scripts/list-users.sh`, still untracked.
- Uncommitted as of July 20, 2026 — four UI changes from that day (all frontend, no backend/schema):
  - **Login screen**: demo picker removed and the failed-login message fixed. `components/AuthScreen.jsx`,
    `apiClient.js`, `App.jsx`.
  - **Membership dates read-only in the client profile**: `components/MembershipCalendar.jsx`,
    `components/MemberDetail.jsx`, `App.jsx`.
  - **Client registration charge fixed to the plan price + optional discount**: `components/ClientForm.jsx`.
  - This CONTEXT.md update (three new "July 20, 2026" sections above, plus inline corrections).
- Uncommitted as of July 26, 2026 — the landing/`/app/` split from July 24 (see that section) is
  **still uncommitted too**, plus this day's work:
  - **A payment renews from the day it was received**: `API/Controllers/FinanceController.cs` and the
    new `tests/GymSaaS.IntegrationTests/PaymentRenewalDateTests.cs`. The only backend behaviour
    change of the day; no migration, no schema change.
  - **Rebrand to Gym Assist**: 15 files across `frontend/src`, `landing/` (including both legal
    pages) and `API/Controllers/AuthController.cs` (email subjects/body).
  - **Configuracion**: owner labels + the Rol dropdown removed. `components/GymSetup.jsx`.
  - **Login screen**: show/hide password. `components/AuthScreen.jsx`.
  - **Dev CORS**: `localhost:5174` added to `Cors:AllowedOrigins` in
    `API/appsettings.Development.json`, so entering through the landing works.
  - This CONTEXT.md update (four new "July 26, 2026" sections, the dev-run block, and the inline
    corrections marking the brand split and the backdated-payment bug as fixed).
- Uncommitted as of July 29, 2026 — frontend only, no backend/schema:
  - **Finanzas MetricCards**: neutral shadow at rest, tone colour and `shadow-xl` on hover, and the
    looping `animate-icon-nudge` replacing the one-shot `icon-pop`. `components/FinancialDashboard.jsx`,
    `index.css`.
  - **Trainer assignment block in the Classes tab** (see that section above):
    `components/ClassSchedule.jsx` and `App.jsx`.
  - This CONTEXT.md update (the new "July 29, 2026" section plus the Classes-tab bullet).
- What `09e0503` contains, for reference — all from July 18, 2026:
  - **Tests + CI**: `backend/tests/GymSaaS.IntegrationTests/` (42 tests), `.github/workflows/ci.yml`,
    and `public partial class Program;` at the end of `Program.cs` so the test host can boot it.
  - **Security**: `SubscriptionController` deleted along with the 6 files it was the only consumer
    of (`Application/Payments/*`, `Application/DTOs/Subscriptions/*`).
  - **Subscription enforcement**: `ISubscriptionAccessService`, `Infrastructure/Billing/*`,
    `SubscriptionEnforcementMiddleware`, the `Billing` section in `appsettings.json`.
  - **Duplicate-SKU fix** in `InventoryController`.
  - **Country + password**: `Gym.Country` and the `AddGymCountry` migration, `RegisterGymRequest` /
    `GymProfileDtos` / `AuthController` / `GymProfileController`; frontend `locations.js`,
    `passwordStrength.js`, `components/SearchableSelect.jsx`, a rewritten `GymRegistrationForm.jsx`,
    plus `authApi.js`, `adapters.js` and two small `App.jsx` edits to pass the country through.
  - A CONTEXT.md update.

  Run `git status --short` for the exact set. The user asked to decide when to commit — ask first.
- Nothing since `9a99385` has been deployed to Coolify yet.

July 16, 2026 session — turning the prototype into a real system:

- The starting problem: the app looked feature-complete but **almost nothing persisted**. All business data lived in React `useState` seeded from demo constants — not even in `localStorage` — so a gym could register 50 clients and lose everything on refresh. Only auth talked to the backend, and `DashboardController`/`SubscriptionController`/`CheckInController` existed but nothing called them.
- Built the whole missing persistence layer (entities, migrations, controllers) and rewired every frontend handler to it, keeping demo accounts local.
- Added Tier 2 account lifecycle: password reset, email verification, `/auth/me`, global exception + request logging middleware.
- Ported SaaS billing from the user's SQL Server design and decided to stay on PostgreSQL (see that section).
- Installed PostgreSQL 16.6 locally and verified everything, including multi-tenant isolation (33/33).
- Bugs/gaps found and fixed along the way:
  - `Member.Email` was required while the client form marks Correo optional -> made nullable.
  - The UI let you change plan when renewing, but the membership endpoint could not -> added optional `PlanName` to `UpdateMembershipRequest`.
  - The registration form collected a SaaS plan that was **never sent** to the backend -> now sent and stored.
  - Truncating finance lists to 10 would have silently skewed the frontend's analytics and category totals (they are derived from those lists) -> lists are returned in full.
  - No `launchSettings.json`, so `dotnet run` used Production and never loaded user-secrets -> added.
  - Making handlers async broke 5 component call sites that consumed their return values synchronously (`AccessManagement`, `CheckInDashboard` x2, `ClassSchedule` x2, `InventoryDashboard`) -> they now `await`. `ClassSchedule` also needed the server-assigned class id returned so it selects the right class.

Most recent frontend changes:

- July 29, 2026: added the "Asignacion de entrenadores" block to the Classes tab — a multi-select
  client table whose selection survives filtering, six `Entrenador N` buttons, `Asignar`, and a
  per-trainer filter with counts. State lives in `App.jsx` and does not persist. See "Trainer
  assignment block in the Classes tab" above.

- July 18, 2026: rewrote the gym registration form — country and city as filterable dropdowns backed
  by `locations.js` and the new `SearchableSelect.jsx`, plus live password strength, a rule checklist,
  a match indicator and a show/hide toggle (`passwordStrength.js`). See "Registration form" above.

- Added self-service gym registration and automatic owner provisioning.
- Added locally persisted tenant registration records and clean workspaces for newly registered gyms.
- Added pending approval, email verification, plan, and trial status indicators.
- Isolated user management by gym tenant and kept registered accounts out of the demo-account picker.
- Added role-aware product inventory management.
- Added product creation, editing, deletion, searching, category filtering, and low-stock alerts.
- Added quantity-only inventory controls for reception.
- Added advanced analytics for member movement, retention, churn, revenue mix, and peak attendance hours.
- Added six-month and twelve-month analytics periods with generated business insights.
- Added an analytics permission for owners and administrators.
- Added member progress tracking with measurement history, trend charts, goals, and trainer notes.
- Added a dedicated progress permission for owners, administrators, and trainers.
- New progress measurements update the member's current body metrics.
- Added frontend demo authentication with Owner, Administrator, Reception, and Trainer roles.
- Added permission-filtered navigation and protected actions.
- Added user creation and account activation/deactivation.
- Added class scheduling, capacity management, client reservations, and cancellations.
- Added Operations for expense budgets, equipment maintenance, shifts, and commissions.
- Expanded expense registration with Infrastructure, Machinery, and Services categories.
- Added expense date, payment method, and optional provider fields.
- Added expense totals grouped by category.
- Replaced the revenue-only chart with a combined income, expenses, and users chart.
- Registering an expense now updates the current month's expense bar immediately.
- CSV finance exports now include the additional expense fields.
- Expanded the `Finanzas` tab with income, expense, net-profit, and receivables metrics.
- Added a six-month revenue chart and overdue receivables panel.
- Added working quick actions for payment registration, expense registration, and CSV report download.
- Finance quick actions update the in-memory dashboard data immediately.
- Added `Check-in` tab for entrance validation and attendance logging.
- Blocked access is recorded when a member plan is expired.
- Check-in dashboard shows daily allowed entries, blocked attempts, expiring plans, and recent history.
- Added `Gimnasio` tab for gym profile and admin user data.
- Added plan registration and registered plans table.
- Client creation form now uses registered plans as its plan options.
- Tabs layout now adapts to more than three tabs.
- Added suggested next features in the gym setup screen:
  - Automatic renewal reminders.
  - Check-in and access control.
  - Payments and overdue balances.
  - Client progress tracking.
- Frontend validated with `npm run build`.
- Updated `CONTEXT.md` with the current continuation notes.
- Renamed the "Mensualidad" members-table filter column label to "Membresia".
- Redesigned the "Crear cliente" form: reordered fields into a Nombre/Genero/Edad row, then Peso/Altura, then Telefono/Correo (Correo is now optional); added a new Edad field.
- Added a "Biometria" section to the client form with Pecho, Brazo, Cintura, Cadera, and Pierna measurements (Brazo and Pierna are new fields).
- Replaced the client form's dynamic plan dropdown with a "Membresia" section offering fixed plan choices (Diario, Semanal, Mensual, Anual, VIP) plus a "Valor de la suscripcion" input.
- Uppercased all field and section titles in the client form; renamed its submit button to "Finalizar registro" and moved it under the Membresia section.
- Removed the now-unused dynamic `planOptions` wiring between `App.jsx` and `ClientForm`.
- Added plan management to the Gym Setup "Planes registrados" table: edit (pre-fills the plan form) and delete actions with minimalist custom SVG icons instead of text/emoji.
- Made plan updates match by plan `id` first, falling back to name-based dedupe only for genuinely new plans, so renaming a plan while editing no longer creates a duplicate.
- Replaced the native browser confirm dialog for plan deletion with a custom modal matching the app's card design (rounded-lg, gray borders, rose destructive button).
- Renamed the "Gimnasio" navigation tab to "Configuracion".
- Verified all changes by fetching each changed file's compiled output from the running Vite dev server (in-browser visual verification tools were unavailable this session).
- Updated `CONTEXT.md` again with this session's continuation notes.
- Redesigned the Check-in tab (July 6, 2026): replaced the search-cards-plus-side-panel layout with a members-database-style table (Miembro, Membresia, Estado, Vence, Acciones) keeping only the name filter.
- Added per-row `Validar entrada` / `Validar salida` buttons; entry records the pressed date/time and is disabled for expired or suspended plans or while the client is inside.
- Added a `Suspendida` status to check-in, connected to the Finanzas suspend/reactivate action, and blocked suspended entries with reason "Plan suspendido".
- Added a `Revisar pago` button on expired/suspended rows (finance-permission roles only) that opens Finanzas with the Registrar pago panel auto-opened and pre-filtered by the member's name (`financeIntent` state in `App.jsx`, `initialAction`/`initialPaymentQuery`/`onInitialActionConsumed` props in `FinancialDashboard`).
- Verified in the browser preview: entry/exit flows, suspension reflection, Revisar pago navigation, intent consumption (manual Finanzas visits do not auto-open the panel), and reception role hiding Revisar pago. `npm run build` passes.
- Redesigned the "Programar clase" panel (July 6, 2026): left member picker with name search (avatar, name, email, highlighted selection), vertical divider, class form on the right, and a single `Confirmar reserva` button replacing `Crear clase`.
- Creating a class now also registers the selected member's reservation in one step via `handleCreateClassWithReservation` in `App.jsx` (replaces `handleCreateClass`); member validation (missing, suspended, expired) rejects the submit without creating the class.
- Added suspended-membership blocking to `handleReserveClass` so suspended clients cannot reserve existing classes either.
- Verified in the browser preview: member filter, no-member and expired-member rejections, and the success flow (class count, active reservations, attendee list, and form reset). `npm run build` passes.
- Added a class catalog (July 6, 2026): `classCatalog` state in `App.jsx` seeded from the demo classes, reset per workspace like plans, with `handleSaveClassTemplate` / `handleDeleteClassTemplate` (id-first update, name dedupe).
- Added to Configuracion, below "Planes registrados": a "Registrar clase"/"Editar clase" form (name, trainer, duration, capacity, room) and a "Registro de clases" table with pencil/trash actions and a delete confirmation modal, mirroring the plans UX.
- "Programar clase" now takes its Clase field from the catalog as a select; selecting a class auto-fills trainer, duration, capacity, and room (editable), with an empty-catalog hint pointing to Configuracion.
- Verified in the browser preview: seeded catalog table, Pilates registration, Funcional edit (capacity 10 to 14), Spinning deletion via modal, catalog options and auto-fill in Programar clase, and a full class-plus-reservation creation from a template. `npm run build` passes.
- Added real backend authentication (July 15, 2026, see Authentication above): `handleLogin`/`handleRegisterGym` in `App.jsx` now call the real backend for registered-gym accounts via new `frontend/src/authApi.js`; demo accounts stay local-only by design. Plaintext passwords are no longer written to `localStorage`. `AuthScreen.jsx`'s login submit is now async (was a bug risk once `onLogin` became async — fixed with a loading state on the submit button). `redeemInviteCode` was removed from `inviteCodeApi.js` (dead code — redemption now happens server-side inside `register-gym`); `validateInviteCode` is unchanged. Verified in the browser preview: demo login/logout, and graceful failure of the invite-code check when the backend is unreachable. `npm run build` passes.

In the next chat, first run:

```bash
git status --short
```

Nothing has been committed since `1ccaadf`. The working tree holds the July 19 change set (the charge taken at client registration, and the automatic close of forgotten check-outs), four frontend UI changes from July 20, the landing / `/app/` split from July 24, the July 26 work (payment renewal date + its tests, the Gym Assist rebrand, the Configuracion and login-screen changes, and the dev CORS fix), and the July 29 frontend work (the Finanzas MetricCards polish and the trainer assignment block) — see Git Status Notes for the file-level breakdown. The user asked to be the one who decides when to commit, so ask first. **Note pushing to `main` deploys straight to production and runs migrations**, so a commit here is not a private checkpoint.

## Next steps, in priority order

**Before any real gym touches this:**

1. 🔴 **Set a real `Jwt__SigningKey` in Coolify.** The committed placeholder is public on GitHub; if production is still using it, anyone can forge a token for any gym. No visible symptom — you have to go and look. Changing it logs everyone out once, which is fine.
2. **Database backups on Coolify** (schedule + off-site + retention, then *test a restore*). Take a manual backup immediately before the first deploy of the July 16 migrations.
3. **Deploy pre-flight** — confirm `VITE_API_BASE_URL` is marked *Available at Buildtime* (since July 16 the whole frontend depends on it, not just the invite check), `Cors:AllowedOrigins` includes `https://gymassist.online`, `Frontend:BaseUrl` is right, and invite codes exist in the production database (there is no endpoint to mint them). Then deploy and watch the migration log — 7 migrations at once, much bigger than previous deploys.

**To be able to run a real pilot:**

4. **Pick and wire a real email provider** *and* **make the frontend read `?reset=` / `?verify=`** — these are one job, neither works without the other. Until then a customer who forgets their password is locked out permanently and you fix it by hand in the database.
5. **Monitoring/alerting + a `/health` endpoint**, so you learn about an outage before a customer calls.

**To be able to charge:**

6. ~~Enforce the trial and the subscription status~~ — **done July 18, 2026** (see Subscription enforcement). What is still missing is the *collection* side: invoices are inserted into Postgres by hand, there is no card charging and no dunning.
7. **Operator surface** for invite codes and invoices (needs a super-user concept, which does not exist yet — `User.Role` is per-tenant). Note this is the one feature that deliberately crosses tenants, so it needs its own policy and its own tests.

**Product debt:**

8. **Product sales (POS)** — the Inventario tab promises it and nothing implements it.
9. Pagination / server-side aggregation for `FinanceController.GetSummary`.
10. Delete the dead `DashboardController`, and fix the stale registration-screen copy about the backend not being connected.
11. **Persist trainer assignment** — the Classes-tab block works but lives in React state, and its six trainers are labels rather than the gym's real `Trainer` users. Needs a column on `Member` (or a join table if one member may have several trainers) plus a field on the member endpoints, and `trainerSlots` fed from `api/staff`.

## How To Continue In A New Chat

Paste this instruction:

```text
Continue from D:\Original Gym\GymProyectChanges-develop. Read CONTEXT.md first, then run git status --short. Do not restart from scratch.
```

To run the stack locally, start PostgreSQL first (`D:\pgsql\bin\pg_ctl -D D:\pgdata -l D:\pgdata\server.log start`) — it is not a Windows service and does not survive a reboot. See "Local development environment".

Two things that will otherwise waste time:

- **Stop the backend before building or running tests.** A running `dotnet run` locks
  `bin/Debug/net8.0/GymSaaS.Api.exe` and the build fails with MSB3027 "file is locked by".
- **Test data in `GymSaaS_Dev`**: `Gimnasio Alfa` and `Gimnasio Beta` (July 16),
  `Johan Gym Summit` (the user's own, Santa Marta) and `Gimnasio Cobro QA`
  (`cobro.qa@gymassist.test` / `CobroQA2026!`, created July 19 to verify the registration charge —
  it holds two throwaway members, Laura Pagada and Mario Debe) are all real rows there. Invite codes
  are single-use; free ones as of July 19 are `PRUEBA002`, `PRUEBA003`, `SMOKETEST2026`
  (`COBRO2026` was seeded and consumed by that QA gym). Seed more with
  `INSERT INTO "InviteCodes" ("Id","Code","IsUsed","CreatedAt") VALUES (gen_random_uuid(),'CODIGO',false,now());`
