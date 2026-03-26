# Testeos E2E con Cypress

Esta carpeta contiene pruebas E2E completas para el frontend ubicado en `../Frontend`.

## Cobertura actual

- Autenticacion:
  - Login exitoso admin y employee.
  - Login con error.
  - Registro exitoso.
  - Flujo de recuperacion y reseteo de password.
- Rutas protegidas:
  - Redireccion cuando no existe sesion.
  - Redireccion por mismatch de roles.
- Dashboard Employee:
  - Render de metricas y tickets.
  - Filtro por estado.
  - Flujo de apertura de creacion de ticket.
  - Logout.
- Dashboard Admin:
  - Render de panel/Kanban.
  - Navegacion a tab de reportes.
  - Logout.
- Backend API:
  - Cobertura integral de endpoints CRUD y autenticacion.
  - Cobertura de endpoints de mapa y notificaciones.

## Estructura

- `cypress/e2e/*.cy.ts`: specs E2E.
- `cypress/fixtures/*.json`: datos mock para API.
- `cypress/support/commands.ts`: comandos custom y mocks reutilizables.

## Instalacion

Desde `testeos/`:

```bash
npm install
```

## Ejecucion

1. Modo interactivo:

```bash
npm run cy:open
```

2. Modo headless (asumiendo frontend ya levantado en `http://127.0.0.1:5173`):

```bash
npm run cy:run
```

3. Solo frontend (E2E UI):

```bash
npm run cy:run:front
```

4. Solo backend (API completa):

```bash
npm run cy:run:api
```

5. Correr todo automatico (levanta frontend + ejecuta Cypress):

```bash
npm run test:e2e
```

## Variables opcionales

- `CYPRESS_FRONTEND_URL` para cambiar URL del frontend.
- `CYPRESS_BACKEND_URL` para cambiar URL del backend.

Ejemplo:

```bash
$env:CYPRESS_BACKEND_URL="http://127.0.0.1:8000"
npm run cy:run:api
```

## Nota

Las pruebas usan `cy.intercept` para mockear el backend, asi que son estables y no dependen de disponibilidad de API externa.
