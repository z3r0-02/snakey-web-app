const { defineConfig } = require("cypress");
const { createClient } = require("@libsql/client");

module.exports = defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    supportFile: "cypress/support/e2e.js",
    viewportWidth: 1600,
    viewportHeight: 1000,
    retries: { runMode: 1, openMode: 0 },
    setupNodeEvents(on, config) {
      // Direct access to the same local SQLite file the dev:test server
      const db = createClient({ url: "file:data/local.db" });

      on("task", {
        async dbQuery({ sql, args = [] }) {
          const result = await db.execute({ sql, args });
          return result.rows;
        },
        async dbBatch(statements) {
          await db.batch(
            statements.map(({ sql, args = [] }) => ({ sql, args }))
          );
          return null;
        },
      });

      return config;
    },
  },
});
