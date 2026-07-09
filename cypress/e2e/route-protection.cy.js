describe("Route protection", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it("redirects an unauthenticated visitor away from /profile to the login view", () => {
    cy.visit("/profile");
    cy.url().should("include", "view=login");
  });

  it("redirects an unauthenticated visitor away from /game to the login view", () => {
    cy.visit("/game");
    cy.url().should("include", "view=login");
  });

  it("redirects a guest away from /profile (guests have no account)", () => {
    // A host/guest session can reach /game but has no real profile.
    cy.visit("/profile", {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          "user",
          JSON.stringify({ email: "host@platform.local", name: "Host" })
        );
        win.sessionStorage.setItem("__hostSession", "true");
      },
    });
    cy.url().should("include", "/game");
  });
});
