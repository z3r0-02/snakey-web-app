// ─── Page Object Model: Setup Page (/setup) ──────────────────────────────────

class SetupPage {

  // ── Selectors ────────────────────────────────────────────────────────────

  heading()        { return cy.contains('Set up your profile'); }
  avatarOption(id) { return cy.get(`#avatar-${id}`); }
  usernameInput()  { return cy.get('#username'); }
  submitBtn()      { return cy.get('#btn-complete-setup'); }

  // ── Actions ──────────────────────────────────────────────────────────────

  visit() {
    cy.visit('/setup');
  }

  completeSetup(username, avatarId = 'fox') {
    this.avatarOption(avatarId).click();
    this.usernameInput().clear().type(username);
    this.submitBtn().click();
  }
}

const instance = new SetupPage();
export default instance;
