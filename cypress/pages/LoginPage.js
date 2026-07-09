// ─── Page Object Model: Login Form (/?view=login) ────────────────────────────

class LoginPage {

  // ── Selectors ────────────────────────────────────────────────────────────

  usernameInput() { return cy.get('#username'); }
  passwordInput() { return cy.get('#password'); }
  submitBtn()     { return cy.get('#btn-submit-login'); }

  // ── Actions ──────────────────────────────────────────────────────────────

  visit() {
    cy.visit('/?view=login');
  }

  login(username, password) {
    this.usernameInput().type(username);
    this.passwordInput().type(password);
    this.submitBtn().click();
  }

  submitEmpty() {
    this.submitBtn().click();
  }
}

const instance = new LoginPage();
export default instance;
