# Project Context

Workspace path: `D:\GYM`

## Goal

Gym management SaaS with multi-tenant backend structure and a React/Tailwind admin dashboard.

## Stack

- Backend: C# ASP.NET Core Web API, Entity Framework Core, SQL Server structure.
- Frontend: React + Vite + Tailwind CSS.
- GitHub repo: `https://github.com/JohanInEd/GymRepos.git`
- Current development branch: `develop`

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

Main files:

- `frontend/src/App.jsx`
- `frontend/src/auth.js`
- `frontend/src/main.jsx`
- `frontend/src/index.css`
- `frontend/tailwind.config.js`
- `frontend/src/components/AccessManagement.jsx`
- `frontend/src/components/AnalyticsDashboard.jsx`
- `frontend/src/components/AuthScreen.jsx`
- `frontend/src/components/ClassSchedule.jsx`
- `frontend/src/components/ClientForm.jsx`
- `frontend/src/components/CheckInDashboard.jsx`
- `frontend/src/components/FinancialDashboard.jsx`
- `frontend/src/components/GymSetup.jsx`
- `frontend/src/components/MemberDetail.jsx`
- `frontend/src/components/MemberProgress.jsx`
- `frontend/src/components/MembersTable.jsx`
- `frontend/src/components/MembershipAlert.jsx`
- `frontend/src/components/MembershipCalendar.jsx`
- `frontend/src/components/OperationsDashboard.jsx`
- `frontend/src/components/Tabs.jsx`

Current UI features:

- Public gym registration from the authentication screen.
- New gym onboarding includes:
  - Gym name and city.
  - Owner name, email, phone, and password.
  - Initial SaaS plan selection.
  - Terms acceptance.
  - Automatic creation of the first user with the `Owner` role.
  - A clean tenant workspace that does not inherit demo gym data.
  - A 14-day trial with pending approval and pending email verification status.
  - Tenant registration and owner login persistence in `localStorage` under `gymflow-registered-gyms`.
  - Tenant-filtered user management so one gym cannot see another gym's users.
- Registration, approval, email verification, and password storage remain frontend-only mock behavior until backend authentication is implemented.
- Local demo authentication screen with active/inactive user validation.
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
- Demo accounts use password `Demo123!`.
- Authentication is frontend-only mock behavior until the runnable backend and secure password storage are implemented.
- Classes tab includes:
  - Class scheduling with trainer, date, time, duration, capacity, and room.
  - Client reservations.
  - Duplicate-reservation prevention.
  - Capacity enforcement.
  - Expired-membership blocking.
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
  - CSV finance report download.
  - Registering a payment updates income, payment count, recent payments, the chart, and matching receivables.
  - Registering an expense updates expenses, net profit, category totals, recent expenses, and the chart.
  - The current chart user count follows the live number of clients in the frontend state.
- Client creation form with:
  - Personal info section, ordered Nombre, Genero, Edad, Peso, Altura, Telefono, Correo (Correo is optional).
  - Biometria section: Pecho, Brazo, Cintura, Cadera, Pierna.
  - Membresia section: fixed plan choices (Diario, Semanal, Mensual, Anual, VIP) plus a subscription value field.
  - Submit button reads "Finalizar registro" and sits under the Membresia section.
  - All field and section titles render in uppercase.
- Client creation plan choices are now a fixed list (Diario, Semanal, Mensual, Anual, VIP) instead of pulling from registered gym plans.
- Gym setup tab includes:
  - Gym name
  - City
  - Admin user name
  - Admin email
  - Admin phone
  - Admin role
  - Plan registration form, reused for both creating and editing plans
  - Registered plans table with edit and delete actions (minimalist icon buttons) and a custom confirmation modal for delete
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
  - Client search by name, email, phone, or plan.
  - Selected client access validation.
  - Only one active entry is allowed per client.
  - A new `Validar salida` action closes the active visit and enables a future entry.
  - Current people inside the gym are counted on the dashboard.
  - Entry registration for active and expiring memberships.
  - Blocked access registration when the membership is expired.
  - Daily counters for allowed entries, blocked attempts, and expiring plans.
  - Recent check-in history with result and reason.
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
  - Editable start and end date inputs.
  - Previous / next month controls.
  - Full subscription range highlighted in sequence.
  - Used subscription days marked teal.
  - Pending subscription days marked sky blue.
  - Start date marked green.
  - End date marked red.
  - Today marked with dark ring.
  - Shows remaining days, total subscription length, and progress.
  - Date edits recalculate days remaining, membership status, badge color, filters, and alerts.
- Human silhouette component was removed.

## Backend

Location: `backend/src/`

Backend now has a runnable ASP.NET project (`GymSaaS.Api.csproj` and `Program.cs`); see the "Important backend note" below for current caveats.

Main backend files:

- `backend/src/API/Controllers/DashboardController.cs`
- `backend/src/API/Controllers/CheckInController.cs`
- `backend/src/API/Controllers/SubscriptionController.cs`
- `backend/src/API/GymSaaS.Api.csproj`
- `backend/src/API/Program.cs`
- `backend/src/API/appsettings.json`
- `backend/src/API/appsettings.Development.json`
- `backend/src/API/Program.example.cs`
- `backend/src/Application/Abstractions/ITenantProvider.cs`
- `backend/src/Application/DTOs/Dashboard/*`
- `backend/src/Application/DTOs/CheckIns/*`
- `backend/src/Application/DTOs/Subscriptions/*`
- `backend/src/Application/Payments/*`
- `backend/src/Application/Services/IMembershipStatusService.cs`
- `backend/src/Application/Services/MembershipStatusService.cs`
- `backend/src/Domain/Common/ITenantScoped.cs`
- `backend/src/Domain/Entities/*`
- `backend/src/Domain/Enums/*`
- `backend/src/Infrastructure/DependencyInjection.cs`
- `backend/src/Infrastructure/Persistence/GymSaaSDbContext.cs`
- `backend/src/Infrastructure/Persistence/SqlServerOptions.cs`
- `backend/src/Infrastructure/Tenancy/HeaderTenantProvider.cs`

Backend domain entities:

- `Gym`
- `Plan`
- `Member`
- `Subscription`
- `Payment`
- `Attendance`

Multi-tenant structure:

- Tenant is represented by `Gym`.
- Tenant-scoped entities use `TenantId`.
- `GymSaaSDbContext` includes global query filters using `ITenantProvider`.
- `HeaderTenantProvider` reads tenant id from header `X-Tenant-Id`.
- `Attendance` records allowed and blocked check-in attempts per tenant/member.
- `Attendance` stores entry and optional exit timestamps for allowed visits.
- `CheckInController` exposes `POST /api/check-ins`, `POST /api/check-ins/check-out`, and `GET /api/check-ins/recent`.
- The backend rejects a second active entry and has a filtered unique index per tenant/member.

SQL Server structure added:

- `appsettings.json` has `ConnectionStrings:DefaultConnection`.
- `appsettings.Development.json` has local trusted SQL Server example.
- `DependencyInjection.cs` registers:
  - `GymSaaSDbContext`
  - SQL Server provider
  - `ITenantProvider`
  - `IMembershipStatusService`
  - `IHttpContextAccessor`
- `Program.example.cs` shows how to call `AddInfrastructure(builder.Configuration)`.

Important backend note:

- `GymSaaS.Api.csproj` and `Program.cs` now exist (still untracked in git) and `dotnet build` succeeds with 0 errors.
- `dotnet run --project backend/src/API/GymSaaS.Api.csproj` starts Kestrel successfully, but DB-backed endpoints (e.g. `/api/check-ins/recent`) return 500 without a reachable SQL Server at the `DefaultConnection` string in `appsettings.Development.json`. No SQL Server is installed in this dev environment yet.
- The frontend does not call the backend yet (still frontend-only mock data), so the missing SQL Server does not block using the app.

## Git Status Notes

Relevant project commits:

- `bc260ce Initial gym SaaS dashboard`
- `c231be9 Add dismissible membership alerts and SQL Server structure`
- `aa3a51b Add role access classes and operations`
- `f7de665 Add member progress and advanced analytics`
- `2e88a8b Add role-aware product inventory`

Current branch for ongoing feature work:

- `develop`
- Local changes pending commit (not yet staged/committed): `frontend/src/App.jsx`, `frontend/src/components/ClientForm.jsx`, `frontend/src/components/GymSetup.jsx`, `frontend/src/components/MembersTable.jsx`, `frontend/package-lock.json`, plus untracked `backend/src/API/GymSaaS.Api.csproj`, `backend/src/API/Program.cs`, and `.claude/launch.json` (preview server config).

Most recent frontend changes:

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

In the next chat, first run:

```bash
git status --short
```

Then decide whether to commit and push these local changes.

If the working tree is clean, continue with the next requested feature.

## How To Continue In A New Chat

Paste this instruction:

```text
Continue from D:\GYM. Read CONTEXT.md first, then run git status --short. Do not restart from scratch.
```
