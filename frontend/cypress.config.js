const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    // Frontend dev server expected at http://localhost:3000
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: false,
    env: {
      // Backend API used for direct requests/setup. Adjust if your backend runs on a different port.
      apiUrl: 'http://localhost:3001',
    },
    setupNodeEvents(on, config) {
      // implement node event listeners here if needed
      return config;
    },
  },
});
