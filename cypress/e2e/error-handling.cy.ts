describe('Error Handling', () => {
  it('displays 404 page for non-existent category', () => {
    cy.visit('/categories/non-existent-category', { failOnStatusCode: false })
    cy.get('[data-testid="not-found"]').should('exist')
  })

  it('displays 404 page for non-existent food', () => {
    cy.visit('/foods/non-existent-food', { failOnStatusCode: false })
    cy.get('[data-testid="not-found"]').should('exist')
  })

  it('handles API errors gracefully', () => {
    // Mock a failed API response
    cy.intercept('GET', '/api/categories', {
      statusCode: 500,
      body: { error: 'Internal Server Error' }
    })
    cy.visit('/')
    cy.get('[data-testid="error-message"]').should('exist')
  })
})