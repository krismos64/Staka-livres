const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    specPattern: "cypress/e2e/smoke/**/*.cy.{js,jsx,ts,tsx}",
    supportFile: "cypress/support/e2e.ts",
    videosFolder: "cypress/videos/smoke",
    screenshotsFolder: "cypress/screenshots/smoke",
    video: false,
    screenshotOnRunFailure: false, // Désactivé pour les smoke tests
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,
    retries: {
      runMode: 1,
      openMode: 0
    },

    env: {
      API_BASE_URL: "http://localhost:3001",
      TEST_TYPE: "smoke"
    },

    setupNodeEvents(on, config) {
      on("task", {
        log(message) {
          console.log(`[SMOKE] ${message}`);
          return null;
        },
      });

      // Configuration ultra-rapide pour smoke tests
      config.numTestsKeptInMemory = 0;
      config.watchForFileChanges = false;
      config.video = false;
      config.screenshotOnRunFailure = false;
      
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