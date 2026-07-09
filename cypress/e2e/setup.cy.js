import SetupPage from "../pages/SetupPage";

describe("Setup flow (/setup)", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it("completes setup after registration and reaches /game", () => {
    cy.registerPendingUser().then((user) => {
      const username = `e2u${Date.now().toString(36)}`;
      cy.intercept("POST", "/api/auth/setup").as("setup");

      // A just-registered user is seeded in localStorage with _pendingSetup;
      // that's the only state from which /setup is accessible.
      cy.visit("/setup", {
        onBeforeLoad(win) {
          win.localStorage.setItem(
            "user",
            JSON.stringify({ ...user, _pendingSetup: true })
          );
        },
      });

      SetupPage.heading().should("be.visible");
      SetupPage.completeSetup(username, "fox");

      cy.wait("@setup").its("response.statusCode").should("be.lessThan", 400);
      cy.url().should("include", "/game");

      // The stored user should now carry the chosen username + avatar and no longer be pending setup.
      cy.window().then((win) => {
        const stored = JSON.parse(win.localStorage.getItem("user"));
        expect(stored.username).to.eq(username);
        expect(stored.avatar).to.eq("/avatars/fox.png");
        expect(stored._pendingSetup).to.not.be.ok;
      });
    });
  });

  it("shows validation errors for a missing avatar and a too-short username", () => {
    cy.registerPendingUser().then((user) => {
      cy.visit("/setup", {
        onBeforeLoad(win) {
          win.localStorage.setItem(
            "user",
            JSON.stringify({ ...user, _pendingSetup: true })
          );
        },
      });

      // No avatar picked yet.
      SetupPage.usernameInput().type("validname");
      SetupPage.submitBtn().click();
      cy.contains("Please pick a profile picture.").should("be.visible");

      // Avatar picked, but username too short.
      SetupPage.avatarOption("owl").click();
      SetupPage.usernameInput().clear().type("ab");
      SetupPage.submitBtn().click();
      cy.contains("Username must be at least 3 characters.").should("be.visible");

      cy.url().should("include", "/setup");
    });
  });

  it("redirects a fully set-up user away from /setup to /game", () => {
    cy.registerUser().then((user) => {
      cy.visit("/setup", {
        onBeforeLoad(win) {
          win.localStorage.setItem("user", JSON.stringify(user));
        },
      });
      cy.url().should("include", "/game");
    });
  });

  it("redirects to registration when no user is present", () => {
    cy.visit("/setup");
    cy.url().should("include", "view=register");
  });
});
