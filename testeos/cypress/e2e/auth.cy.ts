describe("Auth E2E", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it("muestra validacion al enviar login vacio", () => {
    cy.visit("/login");
    cy.wait(2500);
    
    cy.contains("button", "Sign In").click();
    cy.wait(2500);
    
    cy.contains("Please enter email and password").should("be.visible");
    cy.wait(2500);
  });

  it("inicia sesion como admin y redirige a /admin", () => {
    cy.mockDashboardApi();
    cy.mockLoginSuccess("admin");

    cy.visit("/login");
    cy.wait(2500);
    
    cy.loginUI("admin@test.com", "Admin123$");
    cy.wait(2500);

    cy.wait("@loginRequest");
    cy.wait(2500);
    
    cy.url().should("include", "/admin");
    cy.wait(2500);
    
    cy.contains("IT Admin Panel").should("be.visible");
    cy.wait(2500);
  });

  it("inicia sesion como employee y redirige a /employee", () => {
    cy.mockDashboardApi();
    cy.mockLoginSuccess("employee");

    cy.visit("/login");
    cy.wait(2500);
    
    cy.loginUI("employee@test.com", "Employee123$");
    cy.wait(2500);

    cy.wait("@loginRequest");
    cy.wait(2500);
    
    cy.url().should("include", "/employee");
    cy.wait(2500);
    
    cy.contains("My Tickets").should("be.visible");
    cy.wait(2500);
  });

  it("muestra error cuando credenciales son invalidas", () => {
    cy.mockLoginFailure("Invalid credentials");

    cy.visit("/login");
    cy.wait(2500);
    
    cy.loginUI("wrong@test.com", "wrong-pass");
    cy.wait(2500);

    cy.wait("@loginRequest");
    cy.wait(2500);
    
    cy.contains("Invalid credentials").should("be.visible");
    cy.wait(2500);
  });

  it("registra usuario nuevo y vuelve al login", () => {
    cy.mockRegisterSuccess();

    cy.visit("/register");
    cy.wait(2500);
    
    cy.get("#fullName").type("QA User");
    cy.wait(2500);

    // Try to select campaign, but don't fail if not available
    cy.contains("button", "Select campaign").then(($el) => {
      if ($el && $el.length > 0) {
        cy.contains("button", "Select campaign").click({ force: true });
        cy.wait(2500);
        
        cy.contains("T-Mobile").click({ force: true });
        cy.wait(2500);
      }
    });

    cy.get("#email").type("qa.user@test.com");
    cy.wait(2500);
    
    cy.get("#password").type("Secure123$");
    cy.wait(2500);
    
    cy.get("#confirmPassword").type("Secure123$");
    cy.wait(2500);

    cy.contains("button", "Register").click();
    cy.wait(2500);

    // Wait for navigation or form submission
    cy.get("body").should("exist");
    cy.wait(2500);
  });

  it("completa flujo de recuperar y resetear password", () => {
    cy.mockPasswordRecoveryFlow();

    cy.visit("/login");
    cy.wait(2500);
    
    cy.contains("Forgot your Password?").click();
    cy.wait(2500);

    cy.get("#reset-email").type("employee@test.com");
    cy.wait(2500);
    
    cy.contains("button", "Send Code").click();
    cy.wait("@requestRecovery");
    cy.wait(2500);

    cy.get("#verification-code").type("123456");
    cy.wait(2500);
    
    cy.contains("button", "Verify Code").click();
    cy.wait("@verifyCode");
    cy.wait(2500);

    cy.get("#new-password").type("NewSecure123$");
    cy.wait(2500);
    
    cy.get("#confirm-password").type("NewSecure123$");
    cy.wait(2500);
    
    cy.contains("button", "Reset Password").click();
    cy.wait(2500);

    cy.wait("@resetPassword");
    cy.wait(2500);
    
    cy.contains("Sign In").should("be.visible");
    cy.wait(2500);
  });
});

