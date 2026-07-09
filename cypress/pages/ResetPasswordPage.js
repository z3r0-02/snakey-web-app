// ─── Page Object Model: Reset Password Page (/reset-password) ───────────────

class ResetPasswordPage {

  // ── Selectors ────────────────────────────────────────────────────────────

  newPasswordInput()     { return cy.get('#new-password'); }
  confirmPasswordInput() { return cy.get('#confirm-password'); }
  submitBtn()            { return cy.get('#btn-reset-password'); }
  goToLoginBtn()         { return cy.get('#btn-go-to-login'); }

  // ── Actions ──────────────────────────────────────────────────────────────

  visit(token) {
    cy.visit(`/reset-password?token=${token}`);
  }

  resetPassword(password) {
    this.newPasswordInput().type(password);
    this.confirmPasswordInput().type(password);
    this.submitBtn().click();
  }
}

const instance = new ResetPasswordPage();
export default instance;
