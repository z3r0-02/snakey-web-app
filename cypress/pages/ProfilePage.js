// ─── Page Object Model: Profile Page (/profile) ──────────────────────────────

class ProfilePage {

  // ── Selectors ────────────────────────────────────────────────────────────

  editBtn(options)       { return cy.get('[data-cy="edit-profile-btn"]', options); }
  saveChangesBtn()       { return cy.get('[data-cy="save-changes-btn"]'); }
  cancelEditBtn()        { return cy.get('[data-cy="cancel-edit-btn"]'); }
  genderSelect()         { return cy.get('#gender'); }
  countryInput()         { return cy.get('#country'); }
  achievementsHeading()  { return cy.contains('Achievements'); }
  achievementCounter()   { return cy.get('[data-cy="achievement-counter"]'); }
  colourSectionHeading() { return cy.contains('Choose your snake colour'); }
  titleSectionHeading()  { return cy.contains('Choose your title'); }
  lockedSwatches()       { return cy.get('[data-cy="color-swatch-locked"]'); }
  activeSwatch()         { return cy.get('[data-cy="color-swatch-active"]'); }
  swatchByTitle(title)   { return cy.get(`[title="${title}"]`); }
  genderOption(label)    { return cy.contains('li', label); }
  countryOption(label)   { return cy.contains('li', label); }

  // ── Actions ──────────────────────────────────────────────────────────────

  visit() {
    cy.visit('/profile');
  }

  enterEditMode() {
    this.editBtn().click();
  }

  setGender(label) {
    this.genderSelect().click();
    this.genderOption(label).click();
  }

  setCountry(query, label) {
    this.countryInput().clear().type(query);
    this.countryOption(label).click();
  }

  save() {
    this.saveChangesBtn().click();
  }

  cancelEdit() {
    this.cancelEditBtn().click();
  }

  clickFirstLockedSwatch() {
    this.lockedSwatches().first().click({ force: true });
  }
}

const instance = new ProfilePage();
export default instance;
