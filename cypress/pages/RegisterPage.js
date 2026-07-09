// ─── Page Object Model: Register Form (/?view=register) ─────────────────────

class RegisterPage {

  // ── Selectors ────────────────────────────────────────────────────────────

  firstNameInput()    { return cy.get('#firstName'); }
  lastNameInput()     { return cy.get('#lastName'); }
  emailInput()        { return cy.get('#email'); }
  genderSelect()      { return cy.get('#gender'); }
  dobInput()          { return cy.get('#dob'); }
  countryInput()      { return cy.get('#country'); }
  passwordInput()     { return cy.get('#password'); }
  confirmPasswordInput() { return cy.get('#confirmPassword'); }
  submitBtn()         { return cy.get('#btn-submit-register'); }
  termsLink()         { return cy.contains('button', 'Terms & Conditions'); }
  termsModalHeading() { return cy.contains('1. Acceptance of terms'); }
  termsCloseBtn()     { return cy.get('[aria-label="Close"]'); }
  genderOption(label) { return cy.contains('li', label); }
  countryOption(label) { return cy.contains('li', label); }

  // ── Actions ──────────────────────────────────────────────────────────────

  visit() {
    cy.visit('/?view=register');
  }

  fillRequiredFields({
    firstName = 'Cypress',
    lastName = 'Tester',
    email,
    gender = 'Female',
    dob = '01/01/2000',
    country = 'Czechia',
    password = 'GoodPass1',
    confirmPassword = password,
  } = {}) {
    this.firstNameInput().type(firstName);
    this.lastNameInput().type(lastName);
    this.emailInput().type(email);
    this.genderSelect().click();
    this.genderOption(gender).click();
    this.dobInput().type(dob);
    this.countryInput().type(country);
    this.passwordInput().type(password);
    this.confirmPasswordInput().type(confirmPassword);
  }

  submit() {
    this.submitBtn().click();
  }

  blurAllRequiredFields() {
    this.firstNameInput().focus().blur();
    this.lastNameInput().focus().blur();
    this.emailInput().focus().blur();
    this.passwordInput().focus().blur();
  }

  openTerms() {
    this.termsLink().click();
  }
}

const instance = new RegisterPage();
export default instance;
