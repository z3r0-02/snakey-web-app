import ProfilePage from "../pages/ProfilePage";

describe("Profile edge cases", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.registerUser().as("user");
  });

  it("does not let a locked colour be equipped from the UI", function () {
    cy.loginAsUser(this.user, "/profile");

    ProfilePage.lockedSwatches().should("have.length.greaterThan", 0);
    ProfilePage.clickFirstLockedSwatch();

    ProfilePage.activeSwatch().should("not.exist");
    ProfilePage.lockedSwatches().should("have.length.greaterThan", 0);

    cy.reload();
    ProfilePage.activeSwatch().should("not.exist");
  });

  it("edits the country and persists the change", function () {
    cy.loginAsUser(this.user, "/profile");

    ProfilePage.enterEditMode();
    ProfilePage.countryInput().should("have.value", "Czechia");

    cy.intercept("PUT", "/api/profile").as("saveProfile");

    ProfilePage.setCountry("Slov", "Slovakia");
    ProfilePage.save();

    cy.wait("@saveProfile").its("response.statusCode").should("be.lessThan", 400);
    ProfilePage.editBtn().click();
    ProfilePage.countryInput().should("have.value", "Slovakia");

    cy.reload();
    ProfilePage.enterEditMode();
    ProfilePage.countryInput().should("have.value", "Slovakia");
  });

  it("discards changes when the edit is cancelled", function () {
    cy.loginAsUser(this.user, "/profile");

    cy.contains("span", "Male").should("be.visible");

    ProfilePage.enterEditMode();
    ProfilePage.setGender("Female");
    ProfilePage.cancelEdit();

    cy.contains("span", "Male").should("be.visible");
    cy.contains("span", "Female").should("not.exist");

    cy.reload();
    cy.contains("span", "Male").should("be.visible");
  });

  it("lets an unlocked colour be equipped and persists it", function () {
    cy.task("dbBatch", [
      {
        sql: "INSERT INTO user_achievements (user_id, achievement_id) VALUES (?, ?)",
        args: [this.user.id, "baby_steps"],
      },
    ]);

    cy.intercept("PUT", "/api/profile/equip").as("equip");
    cy.loginAsUser(this.user, "/profile");

    ProfilePage.swatchByTitle("Light Blue").click();
    cy.wait("@equip").its("response.statusCode").should("be.lessThan", 400);
    ProfilePage.swatchByTitle("Light Blue").should(
      "have.attr",
      "data-cy",
      "color-swatch-active"
    );

    cy.reload();
    ProfilePage.swatchByTitle("Light Blue").should(
      "have.attr",
      "data-cy",
      "color-swatch-active"
    );
  });
});
