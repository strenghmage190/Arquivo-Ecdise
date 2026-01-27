describe('Investigation Board Dragging', () => {
  beforeEach(() => {
    cy.viewport('macbook-15');
    cy.visit('/investigation-board');
  });

  it('should allow dragging the board', () => {
    cy.get('.investigation-board')
      .trigger('mousedown', { clientX: 100, clientY: 100 })
      .trigger('mousemove', { clientX: 200, clientY: 200 })
      .trigger('mouseup');

    cy.get('.investigation-board').should('have.css', 'left', '100px');
    cy.get('.investigation-board').should('have.css', 'top', '100px');
  });
});