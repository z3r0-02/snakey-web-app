import GamePage from "../pages/GamePage";

describe("Game page (logged-in)", () => {
  describe("initial state", () => {
    beforeEach(() => {
      cy.session("gameLoggedInSpec", () => {
        cy.registerUser().then((user) => {
          cy.loginAsUser(user, "/game");
        });
      });
      cy.visit("/game");
    });

    it("shows 3 full attempt hearts for a fresh account", () => {
      GamePage.filledHearts().should("have.length", 3);
      GamePage.emptyHearts().should("have.length", 0);
    });

    it("shows the achievements panel with locked achievements", () => {
      GamePage.achievementsHeading().should("be.visible");
      cy.contains("First Game").should("be.visible");
      cy.contains("Play your first game").should("be.visible");
    });
  });

  describe("gameplay", () => {
    beforeEach(function () {
      cy.clearLocalStorage();
      cy.registerUser().as("user");
    });

    it("playing a round to a crash uses an attempt and unlocks First Game", function () {
      cy.loginAsUser(this.user, "/game");

      GamePage.startGame();

      // Countdown + travel time timeout.
      GamePage.gameOverTitle({ timeout: 15000 }).should("be.visible");
      cy.contains(/^Score:/).should("be.visible");

      // One attempt should now be used.
      GamePage.filledHearts().should("have.length", 2);
      GamePage.emptyHearts().should("have.length", 1);

      // First Game is unlocked on any first play, regardless of score.
      cy.contains("First Game").should("not.exist");
    });
  });
});
