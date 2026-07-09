Cypress.Commands.add("registerUser", (overrides = {}) => {
  return cy.fixture("defaultUser").then((defaultUser) => {
    const unique = Date.now() + "-" + Math.floor(Math.random() * 1e6);
    const body = {
      firstName: defaultUser.firstName,
      lastName: defaultUser.lastName,
      email: `e2e-${unique}@example.com`,
      gender: defaultUser.gender,
      dob: defaultUser.dob,
      country: defaultUser.country,
      password: defaultUser.password,
      ...overrides,
    };

    return cy
      .request("POST", "/api/auth/register", body)
      .its("body.user")
      .then((user) => {
        const username = `e2u${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
        return cy
          .request("POST", "/api/auth/setup", { email: user.email, username })
          .its("body.user")
          .then((setupUser) => ({ ...user, ...setupUser, password: body.password }));
      });
  });
});

// Registers a user via the API but stops before the /setup step
Cypress.Commands.add("registerPendingUser", (overrides = {}) => {
  return cy.fixture("defaultUser").then((defaultUser) => {
    const unique = Date.now() + "-" + Math.floor(Math.random() * 1e6);
    const body = {
      firstName: defaultUser.firstName,
      lastName: defaultUser.lastName,
      email: `e2e-${unique}@example.com`,
      gender: defaultUser.gender,
      dob: defaultUser.dob,
      country: defaultUser.country,
      password: defaultUser.password,
      ...overrides,
    };

    return cy
      .request("POST", "/api/auth/register", body)
      .its("body.user")
      .then((user) => ({ ...user, password: body.password }));
  });
});

Cypress.Commands.add("loginAsUser", (user, path = "/game") => {
  cy.visit(path, {
    onBeforeLoad(win) {
      win.localStorage.setItem("user", JSON.stringify(user));
    },
  });
});

Cypress.Commands.add("loginAsHost", () => {
  cy.visit("/game", {
    onBeforeLoad(win) {
      win.localStorage.setItem(
        "user",
        JSON.stringify({ email: "host@platform.local", name: "Host" })
      );
      win.sessionStorage.setItem("__hostSession", "true");
    },
  });
});
