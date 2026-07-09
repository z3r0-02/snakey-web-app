import "./commands";

const cleanup = () => {
  cy.task("dbBatch", [
    { sql: "DELETE FROM user_achievements WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'e2e-%@example.com')" },
    { sql: "DELETE FROM attempts WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'e2e-%@example.com')" },
    { sql: "DELETE FROM scores WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'e2e-%@example.com')" },
    { sql: "DELETE FROM password_reset_tokens WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'e2e-%@example.com')" },
    { sql: "DELETE FROM users WHERE email LIKE 'e2e-%@example.com'" },
  ]);
};

before(cleanup);
after(cleanup);
