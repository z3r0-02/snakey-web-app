// ─── Page Object Model: Game Page (/game) ────────────────────────────────────

class GamePage {

  // ── Selectors ────────────────────────────────────────────────────────────

  playBtn()              { return cy.get('#btn-play'); }
  canvas()               { return cy.get('canvas'); }
  filledHearts(options)  { return cy.get('[data-cy="heart-filled"]', options); }
  emptyHearts(options)   { return cy.get('[data-cy="heart-empty"]', options); }
  gameOverTitle(options) { return cy.contains('Game Over', options); }
  noAttemptsMessage()    { return cy.contains('No attempts remaining today.'); }
  achievementsHeading()  { return cy.contains('Achievements'); }
  leaderboardHeading()   { return cy.contains('Leaderboard'); }
  leaderboardNames()     { return cy.get('[class*="lbName"]'); }
  leaderboardScores()    { return cy.get('[class*="lbScore"]'); }
  leaderboardTitles()    { return cy.get('[data-cy="lb-entry-title"]'); }
  // A leaderboard name+title row containing the given player name.
  leaderboardRowFor(name, options) { return cy.contains('[data-cy="lb-name-row"]', name, options); }
  loginToggle()          { return cy.get('[data-cy="nav-login-toggle"]'); }
  authDropdown()         { return cy.get('[data-cy="auth-dropdown"]'); }
  authDropdownUsername() { return cy.get('[data-cy="auth-dropdown"] input[type="text"]'); }
  authDropdownPassword() { return cy.get('[data-cy="auth-dropdown"] input[type="password"]'); }
  authDropdownSubmit()   { return cy.get('[data-cy="auth-dropdown"] button[type="submit"]'); }
  englishFlag()          { return cy.get('[data-cy="lang-en"]'); }
  czechFlag()            { return cy.get('[data-cy="lang-cs"]'); }
  logOutLink(options)    { return cy.get('[data-cy="nav-logout"]', options); }
  dpadUp(options)        { return cy.get('[data-cy="dpad-up"]', options); }
  dpadDown()             { return cy.get('[data-cy="dpad-down"]'); }
  dpadLeft()             { return cy.get('[data-cy="dpad-left"]'); }
  dpadRight()            { return cy.get('[data-cy="dpad-right"]'); }

  // ── Actions ──────────────────────────────────────────────────────────────

  visit() {
    cy.visit('/game');
  }

  startGame() {
    this.playBtn().click();
  }

  waitUntilPlaying(timeout = 10000) {
    this.dpadUp({ timeout }).should('be.visible');
  }

  tapDpad(direction) {
    const target = {
      up: this.dpadUp(),
      down: this.dpadDown(),
      left: this.dpadLeft(),
      right: this.dpadRight(),
    }[direction];
    target.trigger('touchstart', { touches: [{ clientX: 1, clientY: 1 }] });
  }

  swipeCanvas(fromXY, toXY) {
    this.canvas()
      .trigger('touchstart', { touches: [{ clientX: fromXY[0], clientY: fromXY[1] }] })
      .trigger('touchend', { changedTouches: [{ clientX: toXY[0], clientY: toXY[1] }] });
  }

  openLoginDropdown() {
    this.loginToggle().click();
  }

  loginViaDropdown(username, password) {
    this.openLoginDropdown();
    this.authDropdownUsername().type(username);
    this.authDropdownPassword().type(password);
    this.authDropdownSubmit().click();
  }
}

const instance = new GamePage();
export default instance;
