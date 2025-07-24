describe('Food Detail Page', () => {
  beforeEach(() => {
    // Visit the home page first
    cy.visit('/')
    // Click on the first category
    cy.get('[data-testid="category-card"]').first().click()
    // Click on the first food item
    cy.get('[data-testid="food-card"]').first().click()
  })

  it('displays the food details', () => {
    cy.get('h1').should('exist')
    cy.get('[data-testid="food-nutritional-info"]').should('exist')
    cy.get('[data-testid="food-health-benefits"]').should('exist')
  })

  it('displays cooking methods', () => {
    cy.get('[data-testid="cooking-methods"]').should('exist')
    cy.get('[data-testid="cooking-method-item"]').should('have.length.at.least', 1)
  })

  it('expands cooking method details when clicked', () => {
    cy.get('[data-testid="cooking-method-item"]').first().click()
    cy.get('[data-testid="cooking-method-steps"]').should('be.visible')
  })
})