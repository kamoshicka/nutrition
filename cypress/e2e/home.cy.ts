describe('Home Page', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('displays the category list', () => {
    cy.get('h1').should('contain', 'カテゴリ一覧')
    cy.get('[data-testid="category-card"]').should('have.length.at.least', 1)
  })

  it('allows searching for categories', () => {
    cy.get('[data-testid="search-input"]').type('糖尿')
    cy.get('[data-testid="category-card"]').should('have.length.at.least', 1)
    cy.get('[data-testid="category-card"]').first().should('contain', '糖尿')
  })

  it('navigates to category detail page when clicking a category', () => {
    cy.get('[data-testid="category-card"]').first().click()
    cy.url().should('include', '/categories/')
    cy.get('h1').should('exist')
  })
})