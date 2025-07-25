const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    specPattern: "cypress/e2e/critical/**/*.cy.{js,jsx,ts,tsx}",
    supportFile: "cypress/support/e2e.ts",
    videosFolder: "cypress/videos/critical",
    screenshotsFolder: "cypress/screenshots/critical",
    video: false,
    screenshotOnRunFailure: true,
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 15000,
    requestTimeout: 15000,
    responseTimeout: 15000,
    pageLoadTimeout: 45000,
    retries: {
      runMode: 2,
      openMode: 0
    },

    env: {
      API_BASE_URL: "http://localhost:3001",
      TEST_TYPE: "critical"
    },

    setupNodeEvents(on, config) {
      on("task", {
        log(message) {
          console.log(`[CRITICAL] ${message}`);
          return null;
        },
      });

      // Optimisations pour les tests critiques (CI/CD)
      config.numTestsKeptInMemory = 0;
      config.watchForFileChanges = false;
      
      return config;
    },
  },

  component: {
    devServer: {
      framework: "react",
      bundler: "vite",
    },
  },
});