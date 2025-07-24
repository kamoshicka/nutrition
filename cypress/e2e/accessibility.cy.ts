describe('Accessibility Tests', () => {
  it('home page passes basic accessibility tests', () => {
    cy.visit('/')
    cy.injectAxe()
    cy.checkA11y()
  })

  it('category detail page passes basic accessibility tests', () => {
    cy.visit('/')
    cy.get('[data-testid="category-card"]').first().click()
    cy.injectAxe()
    cy.checkA11y()
  })

  it('food detail page passes basic accessibility tests', () => {
    cy.visit('/')
    cy.get('[data-testid="category-card"]').first().click()
    cy.get('[data-testid="food-card"]').first().click()
    cy.injectAxe()
    cy.checkA11y()
  })

  it('search results page passes basic accessibility tests', () => {
    cy.visit('/search?q=野菜')
    cy.injectAxe()
    cy.checkA11y()
  })
})