import { defineConfig } from "cypress";

export default defineConfig({
  projectId: 'a9ondg',
  e2e: {
    // Ensure screenshots are taken on run failures (helpful for mobile debugging)
    screenshotOnRunFailure: true,
    screenshotsFolder: 'cypress/screenshots',

    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
