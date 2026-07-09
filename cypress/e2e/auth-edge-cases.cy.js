import RegisterPage from "../pages/RegisterPage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import ResetPasswordPage from "../pages/ResetPasswordPage";
import LoginPage from "../pages/LoginPage";

describe("Auth edge cases", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it("rejects registering with an email that's already taken", () => {
    cy.registerUser().then((user) => {
      cy.intercept("POST", "/api/auth/register").as("register");

      RegisterPage.visit();
      RegisterPage.fillRequiredFields({ email: user.email });
      RegisterPage.submit();

      cy.wait("@register").its("response.statusCode").should("be.gte", 400);
      cy.contains("An account with this email already exists.").should("be.visible");
      cy.url().should("include", "view=register");
    });
  });

  it("completes a full forgot-password -> reset -> login cycle", () => {
    cy.registerUser().then((user) => {
      cy.intercept("POST", "/api/auth/forgot-password").as("forgotPassword");

      ForgotPasswordPage.visit();
      ForgotPasswordPage.requestReset(user.email);

      cy.wait("@forgotPassword").its("response.statusCode").should("be.lessThan", 400);
      cy.contains("Check your inbox").should("be.visible");

      cy.task("dbQuery", {
        sql: "SELECT token FROM password_reset_tokens WHERE user_id = ? ORDER BY id DESC LIMIT 1",
        args: [user.id],
      }).then((rows) => {
        expect(rows).to.have.length(1);
        const token = rows[0].token;

        cy.intercept("POST", "/api/auth/reset-password").as("resetPassword");

        ResetPasswordPage.visit(token);
        ResetPasswordPage.resetPassword("BrandNewPass1");

        cy.wait("@resetPassword").its("response.statusCode").should("be.lessThan", 400);
        cy.contains("Password updated!").should("be.visible");

        cy.intercept("POST", "/api/auth/login").as("login");

        LoginPage.visit();
        LoginPage.login(user.username, "BrandNewPass1");

        cy.wait("@login").its("response.statusCode").should("be.lessThan", 400);
        cy.url().should("include", "/game");
      });
    });
  });

  it("rejects an expired reset token", () => {
    cy.registerUser().then((user) => {
      const expiredToken = `expired-token-${Date.now()}`;
      const pastDate = new Date(Date.now() - 60 * 60 * 1000).toISOString();

      cy.task("dbQuery", {
        sql: "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
        args: [user.id, expiredToken, pastDate],
      }).then(() => {
        cy.intercept("POST", "/api/auth/reset-password").as("resetPassword");

        ResetPasswordPage.visit(expiredToken);
        ResetPasswordPage.resetPassword("BrandNewPass1");

        cy.wait("@resetPassword").its("response.statusCode").should("be.gte", 400);
        cy.contains("This reset link has expired. Please request a new one.").should(
          "be.visible"
        );
      });
    });
  });

  it("rejects a nonexistent reset token", () => {
    cy.intercept("POST", "/api/auth/reset-password").as("resetPassword");

    ResetPasswordPage.visit("this-token-does-not-exist");
    ResetPasswordPage.resetPassword("BrandNewPass1");

    cy.wait("@resetPassword").its("response.statusCode").should("be.gte", 400);
    cy.contains("This reset link is invalid or has already been used.").should("be.visible");
  });

  it("shows no known view/form for an unrecognized ?view= value", () => {
    cy.visit("/?view=bogus-value-xyz");

    cy.contains("Welcome to Snakey").should("not.exist");
    cy.contains("Sign in to your account to continue").should("not.exist");
    cy.contains("Create your account").should("not.exist");
    cy.contains("Forgot your password?").should("not.exist");
  });
});
