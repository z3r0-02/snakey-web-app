import GamePage from "../pages/GamePage";

describe("Mobile controls and layout", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.viewport(390, 844);
  });

  it("keeps the login dropdown fully on-screen from the game page as a guest", () => {
    cy.loginAsHost();
    GamePage.openLoginDropdown();

    GamePage.authDropdown().should("be.visible").then(($el) => {
      const rect = $el[0].getBoundingClientRect();
      expect(rect.left).to.be.at.least(0);
      expect(rect.right).to.be.at.most(390);
    });
  });

  it("accepts D-pad input and the game loop keeps running to Game Over", function () {
    cy.registerUser().then((user) => {
      cy.loginAsUser(user, "/game");
      GamePage.startGame();

      GamePage.waitUntilPlaying();
      GamePage.tapDpad("up");

      GamePage.gameOverTitle({ timeout: 15000 }).should("be.visible");
    });
  });

  it("accepts a swipe gesture and the game loop keeps running to Game Over", function () {
    cy.registerUser().then((user) => {
      cy.loginAsUser(user, "/game");
      GamePage.startGame();
      GamePage.waitUntilPlaying();

      GamePage.swipeCanvas([100, 100], [100, 160]);

      GamePage.gameOverTitle({ timeout: 15000 }).should("be.visible");
    });
  });
});
