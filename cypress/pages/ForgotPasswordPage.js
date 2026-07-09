// ─── Page Object Model: Forgot Password Form (/?view=forgotPassword) ────────

class ForgotPasswordPage {

  // ── Selectors ────────────────────────────────────────────────────────────

  emailInput()    { return cy.get('#reset-email'); }
  sendLinkBtn()   { return cy.get('#btn-send-reset-link'); }
  backToLoginBtn() { return cy.get('#btn-back-to-login'); }

  // ── Actions ──────────────────────────────────────────────────────────────

  visit() {
    cy.visit('/?view=forgotPassword');
  }

  requestReset(email) {
    this.emailInput().type(email);
    this.sendLinkBtn().click();
  }
}

const instance = new ForgotPasswordPage();
export default instance;
