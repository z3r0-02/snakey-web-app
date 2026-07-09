import GamePage from "../pages/GamePage";

describe("Host (guest) flow", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it("enters the game as a guest without registering", () => {
    cy.loginAsHost();
    cy.contains("Game Guide").should("be.visible");
    cy.contains("Start Game").should("be.visible");
  });

  it("does not show the achievements panel for a guest", () => {
    cy.loginAsHost();
    GamePage.achievementsHeading().should("not.exist");
  });

  it("shows the leaderboard for a guest", () => {
    cy.loginAsHost();
    GamePage.leaderboardHeading().should("be.visible");
    cy.contains("Today").should("be.visible");
    cy.contains("Weekly").should("be.visible");
    cy.contains("All Time").should("be.visible");
  });

  it("shows a Log In option instead of Profile/Log out", () => {
    cy.loginAsHost();
    GamePage.loginToggle().should("be.visible");
    cy.contains("Profile").should("not.exist");
    GamePage.logOutLink().should("not.exist");
  });

//   it("bounces a host back to the landing page on a full reload", () => {
//     cy.loginAsHost();
//     cy.reload();
//     cy.url().should("eq", Cypress.config().baseUrl + "/");
//   });

  it("lets a guest actually play a round and see an attempt used", () => {
    cy.loginAsHost();

    GamePage.filledHearts().should("have.length", 3);
    GamePage.startGame();

    GamePage.gameOverTitle({ timeout: 15000 }).should("be.visible");

    // Guest attempts are session-only (no /api/attempts), but the hearts still decrement locally.
    GamePage.filledHearts().should("have.length", 2);
    GamePage.emptyHearts().should("have.length", 1);
  });

  it("lets a guest log in from the game page's login dropdown", () => {
    cy.registerUser().then((user) => {
      cy.loginAsHost();
      cy.intercept("POST", "/api/auth/login").as("login");

      GamePage.loginViaDropdown(user.username, user.password);

      cy.wait("@login").its("response.statusCode").should("be.lessThan", 400);

      cy.url().should("include", "/game");
      GamePage.logOutLink().should("be.visible");
      cy.contains("Profile").should("be.visible");
      GamePage.loginToggle().should("not.exist");
    });
  });
});
