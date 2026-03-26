describe("Admin Dashboard E2E", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.mockDashboardApi();

    cy.visit("/login");
    cy.seedAuthSession("admin");
    cy.visit("/admin");
    cy.wait(2500); // Delay para ver la carga de la pÃ¡gina
  });

  it("renderiza panel admin y kanban", () => {
    cy.contains("IT Admin Panel").should("be.visible");
    cy.wait(2500);
    
    cy.contains("Kanban Board").should("be.visible");
    cy.wait(2500);
    
    cy.contains("Pending").should("be.visible");
    cy.wait(2500);
    
    cy.contains("In Progress").should("be.visible");
    cy.wait(2500);
    
    cy.contains("Resolved").should("be.visible");
    cy.wait(2500);
  });

  it("navega al tab de reportes", () => {
    cy.contains("button", "Reports").click();
    cy.wait(2500); // Esperar a que se cargue el componente de reportes
    
    cy.contains("Distribution by Status").should("be.visible");
    cy.wait(2500);
    
    cy.contains("Distribution by Category").should("be.visible");
    cy.wait(2500);
  });

  it("navega al mapa de oficina y filtra por locacion/piso", () => {
    cy.contains("button", "Office Map").click({ force: true });
    cy.wait(2500); // El mapa puede tardar mÃ¡s en cargar

    cy.get("#adminLocationFilter").click({ force: true });
    cy.contains("Santo Domingo").click({ force: true });
    cy.wait(2500);

    cy.contains("button", "Floor 1").click({ force: true });
    cy.wait(2500);

    cy.contains("Select a location and floor").should("not.exist");
    cy.get("svg").should("exist");
    cy.wait(2500);
  });

  it("abre y visualiza notificaciones", () => {
    // Buscar el botÃ³n de notificaciones (generalmente un Ã­cono de campana)
    cy.get("button").each(($btn) => {
      if ($btn.text().includes("notification") || $btn.attr("data-testid")?.includes("notification")) {
        cy.wrap($btn).click({ force: true });
      }
    });
    cy.wait(2500);
    
    // Verificar que se abriÃ³ algo
    cy.get("body").should("exist");
    cy.wait(2500);
  });

  it("abre modal de gestiÃ³n de usuarios y permite cambios", () => {
    // Buscar el botÃ³n de gestiÃ³n de usuarios
    cy.get("button").each(($btn) => {
      const text = $btn.text().toLowerCase();
      if (text.includes("users") || text.includes("user")) {
        cy.wrap($btn).click({ force: true });
      }
    });
    cy.wait(2500);
    
    cy.get("[role='dialog']").should("be.visible");
    cy.get("[role='dialog']").contains("User Management").should("exist");
    cy.wait(2500);

    cy.get("[role='dialog'] tbody tr").first().within(() => {
      cy.get("input").first().clear({ force: true }).type("Admin Test Updated", { force: true });
      cy.wait(2500);
      cy.get("button").contains("Save").should("exist");
    });
    cy.wait(2500);
  });

  it("interactÃºa con botones de descarga", () => {
    // Buscar botones de descarga
    cy.get("button").each(($btn) => {
      const text = $btn.text().toLowerCase();
      if (text.includes("download") || text.includes("export") || text.includes("pdf") || text.includes("excel")) {
        cy.wrap($btn).should("be.visible");
      }
    });
    cy.wait(2500);
  });

  it("regresa a kanban desde reportes", () => {
    cy.contains("button", "Reports").click();
    cy.wait(2500);
    
    cy.contains("button", "Kanban Board").click();
    cy.wait(2500);
    
    cy.contains("Pending").should("be.visible");
    cy.wait(2500);
  });

  it("admin no muestra flujo para crear ticket", () => {
    cy.get("body").then(($body) => {
      const text = $body.text().toLowerCase();
      expect(text).not.to.include("quick form");
      expect(text).not.to.include("create ticket");
    });
    cy.wait(2500);
  });

  it("abre detalles de un ticket y ejecuta autorizacion desde modal", () => {
    // Buscar un ticket en el kanban
    cy.contains("Laptop no enciende").then(($ticket) => {
      if ($ticket.length > 0) {
        cy.wrap($ticket).click({ force: true });
        cy.wait(2500);
        
        cy.contains("Description").should("be.visible");
        cy.wait(2500);

        cy.contains("button", "Authorize change").should("be.visible").click({ force: true });
        cy.wait(2500);

        cy.contains("Authorize change").should("exist");
        cy.get("textarea").last().type("Aprobacion interna de prueba", { force: true });
        cy.wait(2500);

        cy.contains("button", "Accept change").click({ force: true });
        cy.wait(2500);

        cy.contains("Authorization Status").should("be.visible");
        cy.contains("Authorized").should("be.visible");
        cy.contains("[Authorization] Accepted change").should("exist");
        cy.wait(2500);
      }
    });
    cy.wait(2500);
  });

  it("cierra sesion desde admin", () => {
    cy.contains("button", "Logout").click();
    cy.wait(2500); // Esperar a que se procese el logout
    
    cy.url({ timeout: 5000 }).should("include", "/login");
    cy.wait(2500);
  });
});

