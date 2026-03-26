type Role = "admin" | "employee";

const jwtForTests =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjQxMDA0ODAwMDB9.signature";

const usersByRole = {
  admin: {
    id: 1,
    name: "Admin Test",
    email: "admin@test.com",
    role: "admin",
    id_role: 1,
    campaign: "IT",
  },
  employee: {
    id: 2,
    name: "Employee Test",
    email: "employee@test.com",
    role: "employee",
    id_role: 2,
    campaign: "T-Mobile",
  },
} as const;

Cypress.Commands.add("mockDashboardApi", () => {
  cy.fixture("tickets.json").then((data) => {
    cy.intercept("GET", "**/tickets/", data.ticketRows).as("getTickets");
    cy.intercept("GET", "**/categories/", data.categories).as("getCategories");
    cy.intercept("GET", "**/users/", data.users).as("getUsers");
    cy.intercept("GET", "**/locations/", data.locations).as("getLocations");
    cy.intercept("GET", "**/floors/", data.floors).as("getFloors");
    cy.intercept("GET", "**/stations/", data.stations).as("getStations");
    cy.intercept("GET", "**/api/map/**", (req) => {
      const zoneId = Number(String(req.url).split('/').pop()) || 10;
      req.reply({
        statusCode: 200,
        body: {
          id_zone: zoneId,
          stations: [
            {
              id_station: "A-01",
              id_zone: zoneId,
              current_status: "available",
              pos_x: 20,
              pos_y: 20,
              rotation: 0,
              width: 5.5,
              height: 4.5,
              has_active_reports: false,
            },
            {
              id_station: "A-02",
              id_zone: zoneId,
              current_status: "available",
              pos_x: 32,
              pos_y: 20,
              rotation: 0,
              width: 5.5,
              height: 4.5,
              has_active_reports: false,
            },
          ],
          decorations: [],
        },
      });
    }).as("getMapByZone");
    cy.intercept("GET", "**/notifications/user/*", data.notifications).as("getNotifications");

    cy.intercept("PUT", "**/notifications/*", {
      statusCode: 200,
      body: { message: "ok" },
    }).as("updateNotification");

    cy.intercept("DELETE", "**/notifications/*", {
      statusCode: 200,
      body: { message: "deleted" },
    }).as("deleteNotification");

    cy.intercept("PUT", "**/users/*", (req) => {
      const userId = Number(String(req.url).split('/').pop());
      const original = data.users.find((u: any) => Number(u.id_user) === userId);
      req.reply({
        statusCode: 200,
        body: {
          ...(original || data.users[0]),
          ...(req.body || {}),
          id_user: userId,
        },
      });
    }).as("updateUser");

    cy.intercept("PUT", "**/tickets/*", (req) => {
      const ticketId = Number(String(req.url).split('/').pop());
      const original = data.ticketRows.find((t: any) => Number(t.id_ticket) === ticketId);
      req.reply({
        statusCode: 200,
        body: {
          ...(original || data.ticketRows[0]),
          ...(req.body || {}),
          id_ticket: ticketId,
        },
      });
    }).as("updateTicket");

    cy.intercept("POST", "**/comments/", (req) => {
      const body = (req.body || {}) as {
        id_ticket?: number;
        id_user?: number;
        content?: string;
        internal_note?: boolean;
      };

      req.reply({
        statusCode: 201,
        body: {
          id_comment: Math.floor(Math.random() * 100000) + 1,
          id_ticket: body.id_ticket ?? 101,
          id_user: body.id_user ?? 1,
          content: body.content ?? "Comentario de prueba",
          internal_note: Boolean(body.internal_note),
          created_at: new Date().toISOString(),
        },
      });
    }).as("createComment");

    cy.intercept("POST", "**/tickets/", (req) => {
      const body = (req.body || {}) as {
        title?: string;
        description?: string;
        id_category?: number;
        created_by?: number;
        id_station?: string;
        priority?: string;
        category_detail?: string;
      };

      req.reply({
        statusCode: 201,
        body: {
          id_ticket: Math.floor(Math.random() * 100000) + 1000,
          title: body.title ?? "Test Ticket",
          description: body.description ?? "Test Description",
          status: "Pending",
          priority: body.priority ?? "Medium",
          id_category: body.id_category ?? 1,
          created_by: body.created_by ?? 2,
          primary_technician: null,
          secondary_technician: null,
          id_station: body.id_station ?? null,
          created_at: new Date().toISOString(),
          resolved_at: null,
          category_detail: body.category_detail ?? null,
          moved_by: null,
        },
      });
    }).as("createTicket");
  });
});

Cypress.Commands.add("mockLoginSuccess", (role: Role) => {
  cy.fixture("auth.json").then((auth) => {
    const body = role === "admin" ? auth.admin : auth.employee;
    cy.intercept("POST", "**/users/login", {
      statusCode: 200,
      body,
    }).as("loginRequest");
  });
});

Cypress.Commands.add("mockLoginFailure", (message: string) => {
  cy.intercept("POST", "**/users/login", {
    statusCode: 401,
    body: { detail: message },
  }).as("loginRequest");
});

Cypress.Commands.add("mockRegisterSuccess", () => {
  cy.intercept("POST", "**/users/register", {
    statusCode: 200,
    body: {
      id_user: 55,
      full_name: "New User",
      institutional_email: "new.user@test.com",
      role_name: "Employee",
      id_role: 2,
      campaign: "T-Mobile",
      access_token: "register-token",
      token_type: "bearer",
    },
  }).as("registerRequest");
});

Cypress.Commands.add("mockPasswordRecoveryFlow", () => {
  cy.intercept("POST", "**/users/request-recovery", {
    statusCode: 200,
    body: { message: "Code sent" },
  }).as("requestRecovery");

  cy.intercept("POST", "**/users/verify-code", {
    statusCode: 200,
    body: { message: "Code verified" },
  }).as("verifyCode");

  cy.intercept("POST", "**/users/reset-password", {
    statusCode: 200,
    body: { message: "Password reset successfully" },
  }).as("resetPassword");
});

Cypress.Commands.add("loginUI", (email: string, password: string) => {
  cy.get("#email").clear().type(email);
  cy.get("#password").clear().type(password, { log: false });
  cy.contains("button", "Sign In").click();
});

Cypress.Commands.add("seedAuthSession", (role: Role) => {
  const user = usersByRole[role];
  cy.window().then((win) => {
    win.localStorage.setItem("access_token", jwtForTests);
    win.localStorage.setItem(
      "user_data",
      JSON.stringify({
        ...user,
        access_token: jwtForTests,
      }),
    );
  });
});

Cypress.Commands.add("ignoreAppErrors", () => {
  cy.on("uncaught:exception", (err) => {
    // Ignorar errores de React relacionados con hooks y rendering
    // que provienen de código de la aplicación que no podemos modificar
    if (
      err.message?.includes("Rendered fewer hooks than expected") ||
      err.message?.includes("concurrent rendering") ||
      err.message?.includes("There was an error during concurrent rendering")
    ) {
      return false; // Continuar sin fallar el test
    }
    // Dejar pasar otros errores
    return true;
  });
});
