# Gym Assist — Landing Page

Landing page de **Gym Assist Management Suite**, sistema de gestión integral para gimnasios
(finanzas, inventario y miembros en un solo lugar).

En producción esta app se sirve en la **raíz** de `gymassist.online`; el dashboard
(`../frontend`) se sirve bajo **`/app/`**. Un solo Nginx sirve las dos, desde el
`Dockerfile` y el `nginx.conf` de la raíz del repositorio.

## Stack

Deliberadamente distinto al del dashboard: dos versiones mayores de Tailwind no pueden
convivir en un mismo build, así que son dos proyectos `npm` independientes que solo se
juntan en la capa de Nginx.

| | Landing (esta app) | Dashboard (`../frontend`) |
|---|---|---|
| React | 19 | 18 |
| Vite | 8 | 6 |
| Tailwind | 4 (`@theme` en `src/index.css`) | 3 (`tailwind.config.js`) |
| Extras | framer-motion, lucide-react | — |

## Desarrollo

```bash
npm install
npm run dev
```

Abre http://localhost:5174 (el 5173 lo ocupa el dashboard).

El servidor de desarrollo hace de proxy de `/app` hacia `localhost:5173`, así que el botón
**Admin** funciona igual que en producción si el dashboard también está levantado.

> **Si "Admin" no hace nada, levanta también el dashboard.** Sin nada escuchando en el 5173,
> `/app/` devuelve `502 Bad Gateway` (`http proxy error: /app/` en esta terminal) y el
> navegador se queda quieto. En producción esto no puede pasar: un solo Nginx sirve las dos
> apps desde la misma imagen.
>
> ```bash
> cd ../frontend && npm run dev
> ```

## Build de producción

```bash
npm run build
npm run preview
```

## Estructura

```
public/
├── privacidad.html        # Política de privacidad (BORRADOR, sin revisar por abogado)
├── terminos.html          # Términos de uso (BORRADOR)
├── _legal.css             # Estilos compartidos de las páginas legales
└── favicon.svg

src/
├── App.jsx                # Composición de la página + fondo global
├── index.css              # Tailwind, paleta de marca y keyframes
├── main.jsx
└── components/
    ├── Header.jsx         # Barra sticky con logo y botón Admin (glass)
    ├── Hero.jsx           # Título, CTAs y mockup del dashboard
    ├── Features.jsx       # Grid de 6 módulos del sistema
    ├── Plans.jsx          # Planes Básico / Pro / Premium
    ├── Contact.jsx        # Formulario + datos de contacto
    ├── Footer.jsx         # Enlaces de sección + barra legal (Privacidad / Términos)
    └── Reveal.jsx         # Utilidades compartidas (scroll-reveal, eyebrow)
```

Las páginas legales son HTML estático: ninguna de las dos apps tiene router, y un documento
legal no gana nada por ser un componente de React. Nginx las sirve sin extensión
(`/privacidad`) gracias a `try_files $uri $uri.html`; en desarrollo lo replica un plugin
mínimo en `vite.config.js`.

> **Ábrelas por el servidor, no desde el disco.** Con doble clic en el Explorador se abren
> como `file://` y los enlaces de navegación apuntan a la raíz de `D:\`. Los estilos sí
> cargan (las rutas de `_legal.css` y del favicon son relativas justo por eso) y aparece un
> aviso explicándolo, pero la navegación solo funciona servida:
> http://localhost:5174/privacidad

## Pendientes conocidos

- El **formulario de contacto no envía nada**: `Contact.jsx` solo muestra "¡Mensaje enviado!"
  y descarta el mensaje. Hay que conectarlo a un endpoint real o quitarlo.
- Correo y teléfono son de relleno (`hola@gymflow.app`, `+52 (55) 1234 5678`).
- `index.html` carga la tipografía desde Google Fonts, lo que envía la IP del visitante a
  Google. Está declarado en la política de privacidad; alojarla aquí lo evitaría.
- Los planes mostrados (Básico / Pro / Premium) no coinciden con los del backend
  (`trial` / `starter` / `professional`) y sus límites no se aplican en ningún sitio.
