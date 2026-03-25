import "./commands";

// Ignorar errores de React que no podemos controlar
beforeEach(() => {
  cy.ignoreAppErrors();

  const shouldBlockExternalApi = Boolean(Cypress.env("blockExternalApi"));
  const backendUrl = String(Cypress.env("backendUrl") ?? "http://127.0.0.1:8000");

  if (shouldBlockExternalApi) {
    // Bloquea solo llamadas a backends externos (no locales), evitando que datos
    // de pruebas lleguen a APIs/BD remotas. Permite todos los assets de Vite.
    cy.intercept({ url: new RegExp(`${backendUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*`) }, (req) => {
      // Solo si es una llamada HTTP(S), verificar si es externa
      const target = new URL(req.url, Cypress.config("baseUrl"));
      const isLocalHost = target.hostname === "127.0.0.1" || target.hostname === "localhost";

      if (!isLocalHost) {
        req.reply({
          statusCode: 503,
          body: {
            detail: `Blocked external API call in local E2E mode: ${req.method} ${req.url}`,
          },
        }).as("blockedExternalApi");
      } else {
        req.continue();
      }
    });
  }

  const suiteDelay = Number(Cypress.env("slowSuiteStartMs") ?? 3000);
  if (Boolean(Cypress.env("slowMode"))) {
    cy.wait(suiteDelay);
  }
});

afterEach(() => {
  const stepDelay = Number(Cypress.env("slowMs") ?? 2500);
  if (Boolean(Cypress.env("slowMode"))) {
    cy.wait(stepDelay);
  }
});
