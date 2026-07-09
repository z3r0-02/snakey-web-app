// ─── Page Object Model: Landing Page (/) ─────────────────────────────────────

class LandingPage {

  // ── Selectors ────────────────────────────────────────────────────────────

  heading()     { return cy.contains('h1', 'Welcome to Snakey'); }
  englishFlag() { return cy.get('[data-cy="lang-en"]'); }
  czechFlag()   { return cy.get('[data-cy="lang-cs"]'); }

  // ── Actions ──────────────────────────────────────────────────────────────

  visit() {
    cy.visit('/');
  }

  switchToEnglish() {
    this.englishFlag().click();
  }

  switchToCzech() {
    this.czechFlag().click();
  }
}

const instance = new LandingPage();
export default instance;
