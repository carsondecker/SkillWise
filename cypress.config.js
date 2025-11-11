const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 800,
    defaultCommandTimeout: 10000,
    video: false,
    screenshotOnRunFailure: true,
    supportFile: false,
    env: {
      NODE_ENV: 'test', // ✅ Cypress-level environment variable
    },
    setupNodeEvents(on, config) {
      process.env.NODE_ENV = 'test'; // ✅ ensures process.env is also set
      return config;
    },
  },
});
