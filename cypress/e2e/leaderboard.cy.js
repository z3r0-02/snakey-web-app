import GamePage from "../pages/GamePage";

describe("Leaderboard data", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    // force every leaderboard response to be uncached so each `/game` load reflects the latest data.
    cy.intercept("GET", "/api/leaderboard", (req) => {
      req.on("response", (res) => {
        res.headers["cache-control"] = "no-store";
      });
    }).as("leaderboard");
  });

  it("shows a submitted score with the player's name on the game page", function () {
    cy.registerUser().then((user) => {
      const score = 99999;

      cy.request("POST", "/api/leaderboard", {
        userId: user.id,
        username: user.username,
        avatar: user.avatar,
        score,
      })
        .its("status")
        .should("be.lessThan", 400);

      cy.loginAsUser(user, "/game");
      cy.wait("@leaderboard");

      // The score and the player's name both render in the leaderboard.
      GamePage.leaderboardNames().should("contain", user.username);
      GamePage.leaderboardScores().should("contain", String(score));
    });
  });

  it("renders the player's equipped title next to their name in the leaderboard", function () {
    cy.registerUser().then((user) => {
      // Equip a title on the account
      cy.task("dbBatch", [
        {
          sql: "UPDATE users SET active_title = ? WHERE id = ?",
          args: ["confused_potato", user.id],
        },
      ]);

      // Put the player on the leaderboard with a top score.
      cy.request("POST", "/api/leaderboard", {
        userId: user.id,
        username: user.username,
        avatar: user.avatar,
        score: 99999,
      })
        .its("status")
        .should("be.lessThan", 400);

      cy.loginAsUser(user, "/game");
      cy.wait("@leaderboard");

      // The row carrying this player's name also carries the localised title
      GamePage.leaderboardRowFor(user.username)
        .should("contain", user.username)
        .and("contain", "the Confused Potato");
    });
  });

  it("shows no title next to a player who has not equipped one", function () {
    cy.registerUser().then((user) => {
      // A freshly registered account has no active_title.
      cy.request("POST", "/api/leaderboard", {
        userId: user.id,
        username: user.username,
        avatar: user.avatar,
        score: 99999,
      })
        .its("status")
        .should("be.lessThan", 400);

      cy.loginAsUser(user, "/game");
      cy.wait("@leaderboard");

      // Their name shows, but the row renders no title element.
      GamePage.leaderboardRowFor(user.username)
        .should("contain", user.username)
        .find('[data-cy="lb-entry-title"]')
        .should("not.exist");
    });
  });
});
