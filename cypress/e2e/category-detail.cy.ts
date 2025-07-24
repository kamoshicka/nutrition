describe('Category Detail Page', () => {
  beforeEach(() => {
    // Visit the home page first
    cy.visit('/')
    // Click on the first category to navigate to its detail page
    cy.get('[data-testid="category-card"]').first().click()
  })

  it('displays the food list for the selected category', () => {
    cy.get('h1').should('exist')
    cy.get('[data-testid="food-card"]').should('have.length.at.least', 1)
  })

  it('allows searching for foods within the category', () => {
    cy.get('[data-testid="search-input"]').should('exist')
    cy.get('[data-testid="search-input"]').type('野菜')
    cy.get('[data-testid="food-card"]').should('have.length.at.least', 0)
  })

  it('navigates to food detail page when clicking a food item', () => {
    cy.get('[data-testid="food-card"]').first().click()
    cy.url().should('include', '/foods/')
    cy.get('h1').should('exist')
  })
})