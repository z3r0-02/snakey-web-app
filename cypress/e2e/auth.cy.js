import RegisterPage from "../pages/RegisterPage";
import LoginPage from "../pages/LoginPage";
import GamePage from "../pages/GamePage";

describe("Auth", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  describe("Register form", () => {
    beforeEach(() => {
      RegisterPage.visit();
    });

    it("shows validation errors for empty required fields", () => {
      RegisterPage.blurAllRequiredFields();

      cy.contains("First name is required.").should("be.visible");
      cy.contains("Last name is required.").should("be.visible");
      cy.contains("Email is required.").should("be.visible");
      cy.contains("Password is required.").should("be.visible");
    });

    it("rejects an invalid email", () => {
      RegisterPage.emailInput().type("not-an-email").blur();
      cy.contains("Enter a valid email address.").should("be.visible");
    });

    it("enforces the password policy", () => {
      RegisterPage.passwordInput().type("short").blur();
      cy.contains("Use at least 8 characters.").should("be.visible");

      RegisterPage.passwordInput().clear().type("longenough").blur();
      cy.contains("Add an uppercase letter.").should("be.visible");

      RegisterPage.passwordInput().clear().type("Longenough").blur();
      cy.contains("Add a number.").should("be.visible");
    });

    it("registers a new account and lands on the username setup page", () => {
      cy.intercept("POST", "/api/auth/register").as("register");

      const unique = Date.now();
      RegisterPage.fillRequiredFields({ email: `e2e-register-${unique}@example.com` });
      RegisterPage.submit();

      cy.wait("@register").its("response.statusCode").should("be.lessThan", 400);
      // New registrations land on /setup (choose a username/avatar) before reaching /game.
      cy.url().should("include", "/setup");
    });

    it("opens the Terms & Conditions modal and closes it", () => {
      RegisterPage.openTerms();
      RegisterPage.termsModalHeading().should("be.visible");

      RegisterPage.termsCloseBtn().click();
      // The close is animated (~400ms) before the modal unmounts.
      RegisterPage.termsModalHeading().should("not.exist");
    });
  });

  describe("Login form", () => {
    it("shows validation errors for empty fields", () => {
      LoginPage.visit();
      LoginPage.submitEmpty();
      cy.contains("Username is required.").should("be.visible");
      cy.contains("Password is required.").should("be.visible");
    });

    it("rejects invalid credentials", () => {
      cy.intercept("POST", "/api/auth/login").as("login");

      LoginPage.visit();
      LoginPage.login("no-such-user-e2e", "wrongpassword");

      cy.wait("@login").its("response.statusCode").should("be.gte", 400);
      cy.contains("Invalid username or password.").should("be.visible");
    });
  });

  describe("Logout", () => {
    it("logs out from the game page and returns to the landing page", () => {
      cy.registerUser().then((user) => {
        cy.loginAsUser(user, "/game");
        GamePage.logOutLink().click();
        cy.url().should("eq", Cypress.config().baseUrl + "/");
        cy.window().its("localStorage.user").should("not.exist");
      });
    });
  });
});
