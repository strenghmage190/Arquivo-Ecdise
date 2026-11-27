describe('application smoke test', () => {
  it('renders the application entry point', () => {
    cy.visit('/');
    cy.get('#root').should('not.be.empty');
  });
});
