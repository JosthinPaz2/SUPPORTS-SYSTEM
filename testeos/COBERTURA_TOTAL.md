# Matriz de Cobertura Total (Front + Back)

Este documento define cobertura completa operativa con Cypress para los flujos y endpoints publicos de tu sistema.

## Backend: endpoints cubiertos

Spec: `cypress/e2e/backend-api-complete.cy.ts`

- `GET /roles/`
- `POST /roles/`
- `GET /roles/{role_id}`
- `PUT /roles/{role_id}`
- `DELETE /roles/{role_id}`
- `GET /categories/`
- `POST /categories/`
- `GET /categories/{category_id}`
- `PUT /categories/{category_id}`
- `DELETE /categories/{category_id}`
- `GET /locations/`
- `POST /locations/`
- `GET /locations/{location_id}`
- `PUT /locations/{location_id}`
- `DELETE /locations/{location_id}`
- `GET /floors/`
- `POST /floors/`
- `GET /floors/{floor_id}`
- `PUT /floors/{floor_id}`
- `DELETE /floors/{floor_id}`
- `GET /stations/`
- `POST /stations/`
- `GET /stations/{station_id}`
- `PUT /stations/{station_id}`
- `DELETE /stations/{station_id}`
- `POST /users/register`
- `POST /users/login`
- `POST /users/request-recovery`
- `POST /users/verify-code`
- `POST /users/reset-password`
- `POST /users/`
- `GET /users/`
- `GET /users/{user_id}`
- `PUT /users/{user_id}`
- `DELETE /users/{user_id}`
- `POST /tickets/`
- `GET /tickets/`
- `GET /tickets/{ticket_id}`
- `PUT /tickets/{ticket_id}`
- `DELETE /tickets/{ticket_id}`
- `POST /comments/`
- `GET /comments/`
- `GET /comments/{comment_id}`
- `GET /comments/ticket/{ticket_id}`
- `PUT /comments/{comment_id}`
- `DELETE /comments/{comment_id}`
- `POST /changes/`
- `GET /changes/`
- `GET /changes/ticket/{ticket_id}`
- `GET /changes/station/{station_id}`
- `GET /changes/{change_id}`
- `PUT /changes/{change_id}`
- `DELETE /changes/{change_id}`
- `POST /notifications/`
- `GET /notifications/`
- `GET /notifications/{notification_id}`
- `GET /notifications/user/{user_id}`
- `PUT /notifications/{notification_id}`
- `DELETE /notifications/{notification_id}`
- `PUT /api/map/save`
- `PUT /api/map/decorations/save`
- `GET /api/map/{id_zone}`

## Frontend: flujos cubiertos

Specs:

- `cypress/e2e/auth.cy.ts`
- `cypress/e2e/protected-routes.cy.ts`
- `cypress/e2e/employee-dashboard.cy.ts`
- `cypress/e2e/admin-dashboard.cy.ts`

Cobertura activa:

- Login vacio y validaciones.
- Login exitoso por rol (admin y employee).
- Login fallido.
- Registro exitoso.
- Recuperacion de password (request, verify, reset).
- Proteccion de rutas y redirecciones por rol.
- Employee dashboard: metricas, filtros, crear ticket, logout.
- Admin dashboard: tabs, reportes, logout.

## Nota tecnica importante

Cypress es ideal para E2E y API black-box. Para validar literalmente "cada funcion interna" (helpers privados y ramas no expuestas por UI/API), se recomienda complementar con:

- Unit tests backend con `pytest`.
- Unit/component tests frontend con `vitest` + `testing-library`.

Este paquete `testeos` deja ya cubierta la superficie funcional completa visible del sistema.
