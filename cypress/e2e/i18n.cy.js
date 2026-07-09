import LandingPage from "../pages/LandingPage";
import GamePage from "../pages/GamePage";

describe("Language switching", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it("switches visible text immediately on the landing page and persists it", () => {
    LandingPage.visit();
    cy.contains("Log In").should("be.visible");

    LandingPage.switchToCzech();
    cy.contains("Přihlásit se").should("be.visible");
    cy.contains("Log In").should("not.exist");

    cy.reload();
    cy.contains("Přihlásit se").should("be.visible");

    cy.window().its("localStorage.preferred_lang").should("eq", "cs");
  });

  it("switches back to English and persists that too", () => {
    LandingPage.visit();
    LandingPage.switchToCzech();
    cy.contains("Přihlásit se").should("be.visible");

    LandingPage.switchToEnglish();
    cy.contains("Log In").should("be.visible");

    cy.reload();
    cy.contains("Log In").should("be.visible");
    cy.window().its("localStorage.preferred_lang").should("eq", "en");
  });

  it("also switches text on the game page for a logged-in user", function () {
    cy.registerUser().then((user) => {
      cy.loginAsUser(user, "/game");
      GamePage.logOutLink().should("be.visible");

      GamePage.czechFlag().click();
      cy.contains("Odhlásit se").should("be.visible");
    });
  });
});
