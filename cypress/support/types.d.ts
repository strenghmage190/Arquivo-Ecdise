// Augment Cypress Chainable with cypress-real-events helpers used in tests
declare namespace Cypress {
  interface Chainable<Subject = any> {
    realTouch(options?: any): Chainable<any>;
    realSwipe(direction: string, options?: any): Chainable<any>;
  }
}