describe("Protected Routes", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.mockDashboardApi();
  });

  it("redirecciona a /login cuando no hay sesion", () => {
    cy.visit("/admin");
    cy.wait(2500); // Esperar a la redirecciÃ³n
    
    cy.url().should("include", "/login");
    cy.wait(2500);
  });

  it("redirecciona a employee cuando role no coincide", () => {
    cy.visit("/login");
    cy.wait(2500);
    
    cy.seedAuthSession("employee");
    cy.wait(2500);
    
    cy.visit("/admin");
    cy.wait(2500); // Esperar a la redirecciÃ³n

    cy.url().should("include", "/employee");
    cy.wait(2500);
    
    cy.contains("My Tickets").should("be.visible");
    cy.wait(2500);
  });

  it("redirecciona a admin cuando role no coincide", () => {
    cy.visit("/login");
    cy.wait(2500);
    
    cy.seedAuthSession("admin");
    cy.wait(2500);
    
    cy.visit("/employee");
    cy.wait(2500); // Esperar a la redirecciÃ³n

    cy.url().should("include", "/admin");
    cy.wait(2500);
    
    cy.contains("IT Admin Panel").should("be.visible");
    cy.wait(2500);
  });
});

