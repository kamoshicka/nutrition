describe('Search Functionality', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('allows global search from header', () => {
    cy.get('[data-testid="global-search"]').should('exist')
    cy.get('[data-testid="global-search"]').click()
    cy.get('[data-testid="search-input"]').type('野菜{enter}')
    cy.url().should('include', '/search')
    cy.get('[data-testid="search-results"]').should('exist')
  })

  it('displays search results for categories and foods', () => {
    cy.visit('/search?q=野菜')
    cy.get('[data-testid="category-results"]').should('exist')
    cy.get('[data-testid="food-results"]').should('exist')
  })

  it('shows search history', () => {
    // First search
    cy.get('[data-testid="global-search"]').click()
    cy.get('[data-testid="search-input"]').type('野菜{enter}')
    
    // Go back to home
    cy.visit('/')
    
    // Open search again and check history
    cy.get('[data-testid="global-search"]').click()
    cy.get('[data-testid="search-history-item"]').should('contain', '野菜')
  })

  it('allows clicking on search suggestions', () => {
    cy.get('[data-testid="global-search"]').click()
    cy.get('[data-testid="search-input"]').type('野')
    cy.get('[data-testid="search-suggestion"]').first().click()
    cy.url().should('include', '/search')
  })
})