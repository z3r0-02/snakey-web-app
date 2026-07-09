import ProfilePage from "../pages/ProfilePage";

describe("Profile page", () => {
  describe("read-only checks", () => {
    beforeEach(function () {
      cy.session("profileSpec", () => {
        cy.registerUser().then((user) => {
          cy.loginAsUser(user, "/profile");
        });
      });
      cy.visit("/profile");
      cy.window().then((win) => {
        cy.wrap(JSON.parse(win.localStorage.getItem("user"))).as("user");
      });
    });

    it("shows the account's name and email", function () {
      cy.contains(`${this.user.firstName} ${this.user.lastName}`).should("be.visible");
      cy.contains(this.user.email).should("be.visible");
    });

    it("shows an empty achievements list for a fresh account", function () {
      ProfilePage.achievementsHeading().should("be.visible");
      // 0 unlocked, out of whatever the total is.
      ProfilePage.achievementCounter()
        .should("be.visible")
        .invoke("text")
        .should("match", /^0\/\d+$/);
    });

    it("shows the snake colour and title sections", function () {
      ProfilePage.colourSectionHeading().should("be.visible");
      ProfilePage.titleSectionHeading().should("be.visible");
      cy.contains("No titles unlocked yet.").should("be.visible");
    });
  });

  describe("mutations", () => {
    beforeEach(function () {
      cy.clearLocalStorage();
      cy.registerUser().as("user");
    });

    it("edits gender and persists the change", function () {
      cy.loginAsUser(this.user, "/profile");

      cy.contains("span", "Male").should("be.visible");

      cy.intercept("PUT", "/api/profile").as("saveProfile");

      ProfilePage.enterEditMode();
      ProfilePage.setGender("Female");
      ProfilePage.save();

      cy.wait("@saveProfile").its("response.statusCode").should("be.lessThan", 400);
      cy.contains("span", "Female").should("be.visible");

      cy.reload();
      cy.contains("span", "Female").should("be.visible");
    });
  });
});
