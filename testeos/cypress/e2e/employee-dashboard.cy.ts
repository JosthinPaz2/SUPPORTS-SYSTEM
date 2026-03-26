describe("Employee Dashboard E2E", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.mockDashboardApi();
    cy.visit("/login");
    cy.seedAuthSession("employee");
    cy.visit("/employee");
    cy.wait(2500);
  });

  it("renderiza estadisticas y lista de tickets del usuario", () => {
    cy.contains("My Tickets").should("be.visible");
    cy.wait(2500);
    cy.contains("Total Tickets").should("be.visible");
    cy.wait(2500);
    cy.contains("Recent Tickets").should("be.visible");
    cy.wait(2500);
    cy.contains("Laptop no enciende").should("be.visible");
    cy.wait(2500);
    cy.contains("Error en CRM").should("be.visible");
    cy.wait(2500);
  });

  it("filtra por estado in-progress", () => {
    cy.contains("button", "In Progress").click();
    cy.wait(2500);
    cy.contains("Tickets: in progress").should("be.visible");
    cy.wait(2500);
    cy.contains("Error en CRM").should("be.visible");
    cy.wait(2500);
  });

  it("navega al mapa de oficina desde empleado", () => {
    cy.contains("button", "Create Ticket").click();
    cy.wait(1500);
    cy.contains("From Office Map").click({ force: true });
    cy.wait(2500);
    cy.url().should("include", "/OfficeMap?viewOnly=true");
    cy.wait(2500);
  });

  it("visualiza detalles de un ticket existente", () => {
    // Abrimos los detalles del ticket desde su acción dedicada en la fila
    cy.contains("tr", "Laptop no enciende").within(() => {
      cy.contains("button", "View Details").click({ force: true });
    });
    cy.wait(2500);

    // Verificamos que se abrió el modal de detalles del ticket
    cy.get('[role="dialog"]').should("be.visible");
    cy.wait(2500);

    // Verificamos que el contenido del ticket es visible dentro del modal
    cy.get('[role="dialog"]').within(() => {
      cy.contains("Laptop no enciende").should("be.visible");
      cy.contains("Category").should("be.visible");
      cy.contains("Description").should("be.visible");
    });
    cy.wait(2500);
  });

  it("busca una ubicacion y piso en el mapa y crea un ticket desde un desk", () => {
    // Abrimos el menú "Create Ticket"
    cy.contains("button", "Create Ticket").click();
    cy.wait(1500);

    // Hacemos clic en "From Office Map" 
    cy.contains("From Office Map").click({ force: true });
    cy.wait(3000);

    // Verificamos que el mapa se haya cargado y contenga el filtro de ubicación
    cy.contains("Location").should("be.visible");
    cy.wait(2500);

    // Radix puede bloquear temporalmente eventos en body durante transiciones.
    cy.get("body").should(($body) => {
      const styleAttr = $body.attr("style") || "";
      expect(styleAttr).not.to.contain("pointer-events: none");
    });
    cy.wait(1000);

    // En algunos runs de Cypress, Radix deja body bloqueado; lo normalizamos.
    cy.document().then((doc) => {
      doc.body.style.pointerEvents = "auto";
      doc.body.removeAttribute("data-scroll-locked");
    });
    cy.wait(500);

    // Seleccionamos una ubicación
    cy.get("#employeeViewLocation").click({ force: true });
    cy.wait(2500);
    cy.contains("Santo Domingo").click();
    cy.wait(2500);

    // Seleccionamos un piso (Floor 1)
    cy.get("#employeeViewFloor").click({ force: true });
    cy.wait(2500);
    cy.contains("Floor 1").click({ force: true });
    cy.wait(2500);

    // Esperamos la carga del mapa de la zona seleccionada
    cy.wait("@getMapByZone");
    cy.wait(2000);

    // Validamos que haya elementos cargados en el mapa
    cy.contains("No elements placed").should("not.exist");
    cy.wait(1500);

    // Buscamos y hacemos clic en un desk (A-01)
    // El texto del desk no recibe eventos, por eso hacemos clic sobre su grupo SVG padre.
    cy.contains("text", "A-01").parent().click({ force: true });
    cy.wait(2500);

    // Verificamos que se abrió el modal del formulario de ticket
    cy.contains("Create New Ticket").should("be.visible");
    cy.wait(2500);

    // Verificamos que el desk y la ubicación están pre-rellenados
    cy.contains("Santo Domingo").should("be.visible");
    cy.wait(2500);
    cy.contains("Floor 1").should("be.visible");
    cy.wait(2500);
    cy.contains("A-01").should("be.visible");
    cy.wait(2500);

    // Completamos el formulario
    // Título
    cy.get("#title").type("Monitor not working", { delay: 50 });
    cy.wait(2500);

    // Descripción
    cy.get("#description").type("The monitor is showing a black screen and not responding to any input", { delay: 50 });
    cy.wait(2500);

    // Categoría - seleccionamos "Hardware"
    cy.get("button[role=\"combobox\"]").first().click();
    cy.wait(2500);
    cy.contains("Hardware").click();
    cy.wait(2500);

    // Enviamos el formulario
    cy.contains("button", "Create Ticket").click();
    cy.wait(2500);

    // Verificamos que el ticket se creó exitosamente
    cy.contains("Ticket created successfully").should("be.visible");
    cy.wait(2500);

    // Verificamos que el modal se cerró
    cy.contains("Create New Ticket").should("not.exist");
    cy.wait(2500);
  });

  it("cierra sesion y vuelve a login", () => {
    cy.contains("button", "Logout").click();
    cy.wait(2500);
    cy.url().should("include", "/login");
    cy.wait(2500);
  });
});


