import GamePage from "../pages/GamePage";

describe("Game edge cases", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.registerUser().as("user");
  });

  it("shows the no-attempts message once all 3 attempts are used", function () {
    cy.request("GET", "/api/time").then(({ body }) => {
      const { dateStr } = body;
      const userId = this.user.id;

      // Fast-forward straight to 3 used attempts
      cy.request("POST", "/api/attempts", { userId, date: dateStr });
      cy.request("POST", "/api/attempts", { userId, date: dateStr });
      cy.request("POST", "/api/attempts", { userId, date: dateStr });

      cy.loginAsUser(this.user, "/game");

      GamePage.filledHearts().should("have.length", 0);
      GamePage.emptyHearts().should("have.length", 3);
      GamePage.noAttemptsMessage().should("be.visible");
      cy.contains("Come back tomorrow for 3 more!").should("be.visible");
      GamePage.playBtn().should("not.exist");
    });
  });

  it("counts hearts down 3 -> 2 -> 1 -> 0 across three played rounds", function () {
    cy.loginAsUser(this.user, "/game");
    GamePage.filledHearts().should("have.length", 3);

    for (let remaining = 2; remaining >= 0; remaining--) {
      GamePage.playBtn().click();
      GamePage.gameOverTitle({ timeout: 15000 }).should("be.visible");
      GamePage.filledHearts().should("have.length", remaining);
      GamePage.emptyHearts().should("have.length", 3 - remaining);
    }

    // With all 3 used, the play button is replaced by the no-attempts message.
    GamePage.noAttemptsMessage().should("be.visible");
    GamePage.playBtn().should("not.exist");
  });

  it("shows an achievement toast the first time an achievement unlocks", function () {
    cy.intercept("POST", "/api/achievements/evaluate").as("evaluate");

    cy.loginAsUser(this.user, "/game");
    GamePage.startGame();

    cy.wait("@evaluate", { timeout: 15000 });

    cy.contains("Achievement Unlocked");
    cy.contains("First Game");
  });

  describe("Reward roulette threshold (via API)", () => {
    it("refuses the reward just under the 400-point threshold", function () {
      cy.request("GET", "/api/time").then(({ body }) => {
        const { dateStr } = body;
        const userId = this.user.id;

        cy.request("POST", "/api/attempts", { userId, date: dateStr });
        cy.request("POST", "/api/attempts", { userId, date: dateStr });
        cy.request("POST", "/api/attempts", { userId, date: dateStr });

        cy.request("POST", "/api/rewards", { userId, date: dateStr, finalScore: 399 }).then(
          ({ body }) => {
            expect(body.success).to.eq(false);
            expect(body.reason).to.eq("score_too_low");
          }
        );
      });
    });

    it("grants the reward right at the 400-point threshold", function () {
      cy.request("GET", "/api/time").then(({ body }) => {
        const { dateStr } = body;
        const userId = this.user.id;

        cy.request("POST", "/api/attempts", { userId, date: dateStr });
        cy.request("POST", "/api/attempts", { userId, date: dateStr });
        cy.request("POST", "/api/attempts", { userId, date: dateStr });

        cy.request("POST", "/api/rewards", { userId, date: dateStr, finalScore: 400 }).then(
          ({ body }) => {
            expect(body.success).to.eq(true);
            expect(body.rewardId).to.be.a("string");
          }
        );
      });
    });

    it("refuses the reward if fewer than 3 attempts were used today", function () {
      cy.request("GET", "/api/time").then(({ body }) => {
        const { dateStr } = body;
        const userId = this.user.id;

        cy.request("POST", "/api/attempts", { userId, date: dateStr });

        cy.request("POST", "/api/rewards", { userId, date: dateStr, finalScore: 999 }).then(
          ({ body }) => {
            expect(body.success).to.eq(false);
            expect(body.reason).to.eq("not_enough_attempts");
          }
        );
      });
    });
  });
});
