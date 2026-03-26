export {};

declare global {
  namespace Cypress {
    interface Chainable {
      mockDashboardApi(): Chainable<void>;
      mockLoginSuccess(role: "admin" | "employee"): Chainable<void>;
      mockLoginFailure(message: string): Chainable<void>;
      mockRegisterSuccess(): Chainable<void>;
      mockPasswordRecoveryFlow(): Chainable<void>;
      loginUI(email: string, password: string): Chainable<void>;
      seedAuthSession(role: "admin" | "employee"): Chainable<void>;
      ignoreAppErrors(): Chainable<void>;
    }
  }
}
