describe('Premium Features E2E Tests', () => {
  beforeEach(() => {
    // Clean up any existing test users
    cy.cleanupTestUsers();
    
    // Create test users
    cy.createTestUser('premium@test.com', 'testpassword123', true);
    cy.createTestUser('free@test.com', 'testpassword123', false);
  });

  afterEach(() => {
    // Clean up test users after each test
    cy.cleanupTestUsers();
  });

  describe('Favorites Feature', () => {
    it('allows premium users to add and remove favorites', () => {
      cy.loginAsPremiumUser();
      cy.visit('/');
      
      // Navigate to a food detail page
      cy.get('[data-testid="category-card"]').first().click();
      cy.get('[data-testid="food-card"]').first().click();
      
      // Check that favorite button is available for premium users
      cy.get('[data-testid="favorite-button"]').should('exist');
      cy.get('[data-testid="favorite-button"]').should('not.be.disabled');
      
      // Add to favorites
      cy.get('[data-testid="favorite-button"]').click();
      cy.get('[data-testid="favorite-button"]').should('have.class', 'favorited');
      
      // Navigate to favorites page
      cy.visit('/favorites');
      cy.get('[data-testid="favorites-list"]').should('exist');
      cy.get('[data-testid="favorite-item"]').should('have.length.at.least', 1);
      
      // Remove from favorites
      cy.get('[data-testid="favorite-item"]').first().within(() => {
        cy.get('[data-testid="remove-favorite-button"]').click();
      });
      
      // Confirm removal
      cy.get('[data-testid="confirm-remove-button"]').click();
      cy.get('[data-testid="favorite-item"]').should('have.length', 0);
    });

    it('shows upgrade prompt for free users trying to use favorites', () => {
      cy.loginAsFreeUser();
      cy.visit('/');
      
      // Navigate to a food detail page
      cy.get('[data-testid="category-card"]').first().click();
      cy.get('[data-testid="food-card"]').first().click();
      
      // Check that favorite button shows upgrade prompt
      cy.get('[data-testid="favorite-button"]').click();
      cy.get('[data-testid="premium-upgrade-modal"]').should('be.visible');
      cy.get('[data-testid="upgrade-to-premium-button"]').should('exist');
      
      // Close modal
      cy.get('[data-testid="close-modal-button"]').click();
      cy.get('[data-testid="premium-upgrade-modal"]').should('not.be.visible');
    });

    it('redirects unauthenticated users to login when trying to use favorites', () => {
      cy.visit('/');
      
      // Navigate to a food detail page
      cy.get('[data-testid="category-card"]').first().click();
      cy.get('[data-testid="food-card"]').first().click();
      
      // Check that favorite button redirects to login
      cy.get('[data-testid="favorite-button"]').click();
      cy.url().should('include', '/auth/signin');
    });
  });

  describe('Nutrition Calculator Feature', () => {
    it('allows premium users to access nutrition calculator', () => {
      cy.loginAsPremiumUser();
      cy.visit('/nutrition');
      
      // Check that nutrition calculator is accessible
      cy.checkPremiumFeatureAccess('nutrition-calculator', true);
      
      // Add foods to calculator
      cy.get('[data-testid="add-food-button"]').click();
      cy.get('[data-testid="food-search-input"]').type('米');
      cy.get('[data-testid="food-search-result"]').first().click();
      
      // Set quantity
      cy.get('[data-testid="food-quantity-input"]').clear().type('150');
      
      // Add another food
      cy.get('[data-testid="add-food-button"]').click();
      cy.get('[data-testid="food-search-input"]').type('鶏肉');
      cy.get('[data-testid="food-search-result"]').first().click();
      
      // Check nutrition totals are calculated
      cy.get('[data-testid="nutrition-totals"]').should('be.visible');
      cy.get('[data-testid="total-calories"]').should('contain.text', 'kcal');
      cy.get('[data-testid="total-protein"]').should('contain.text', 'g');
      
      // Compare with recommended intake
      cy.get('[data-testid="compare-button"]').click();
      cy.get('[data-testid="nutrition-comparison"]').should('be.visible');
      
      // Save calculation
      cy.get('[data-testid="calculation-name-input"]').type('テスト計算');
      cy.get('[data-testid="save-calculation-button"]').click();
      cy.get('[data-testid="success-message"]').should('be.visible');
    });

    it('shows upgrade prompt for free users trying to access nutrition calculator', () => {
      cy.loginAsFreeUser();
      cy.visit('/nutrition');
      
      // Check that upgrade prompt is shown
      cy.checkPremiumFeatureAccess('nutrition-calculator', false);
      
      // Click upgrade button
      cy.get('[data-testid="nutrition-calculator-upgrade-prompt"]').within(() => {
        cy.get('[data-testid="upgrade-button"]').click();
      });
      
      cy.url().should('include', '/pricing');
    });
  });

  describe('PDF Export Feature', () => {
    it('allows premium users to export PDFs', () => {
      cy.loginAsPremiumUser();
      cy.visit('/');
      
      // Navigate to a food detail page
      cy.get('[data-testid="category-card"]').first().click();
      cy.get('[data-testid="food-card"]').first().click();
      
      // Check PDF export button is available
      cy.get('[data-testid="pdf-export-button"]').should('exist');
      cy.get('[data-testid="pdf-export-button"]').should('not.be.disabled');
      
      // Click PDF export
      cy.get('[data-testid="pdf-export-button"]').click();
      
      // Check PDF dialog opens
      cy.get('[data-testid="pdf-save-dialog"]').should('be.visible');
      
      // Add notes
      cy.get('[data-testid="pdf-notes-input"]').type('テスト用のメモです');
      
      // Generate PDF (we'll mock the actual PDF generation)
      cy.get('[data-testid="generate-pdf-button"]').click();
      
      // Check success message
      cy.get('[data-testid="pdf-success-message"]').should('be.visible');
    });

    it('shows upgrade prompt for free users trying to export PDFs', () => {
      cy.loginAsFreeUser();
      cy.visit('/');
      
      // Navigate to a food detail page
      cy.get('[data-testid="category-card"]').first().click();
      cy.get('[data-testid="food-card"]').first().click();
      
      // Check PDF export shows upgrade prompt
      cy.get('[data-testid="pdf-export-button"]').click();
      cy.get('[data-testid="premium-upgrade-modal"]').should('be.visible');
      
      // Check upgrade button
      cy.get('[data-testid="upgrade-to-premium-button"]').should('exist');
    });
  });

  describe('Shopping List Feature', () => {
    it('allows premium users to manage shopping lists', () => {
      cy.loginAsPremiumUser();
      cy.visit('/shopping-list');
      
      // Check shopping list is accessible
      cy.checkPremiumFeatureAccess('shopping-list', true);
      
      // Add item to shopping list
      cy.get('[data-testid="add-item-input"]').type('トマト');
      cy.get('[data-testid="add-item-quantity"]').type('3');
      cy.get('[data-testid="add-item-unit"]').select('個');
      cy.get('[data-testid="add-item-button"]').click();
      
      // Check item appears in list
      cy.get('[data-testid="shopping-list-item"]').should('have.length', 1);
      cy.get('[data-testid="shopping-list-item"]').first().should('contain.text', 'トマト');
      
      // Check item
      cy.get('[data-testid="shopping-list-item"]').first().within(() => {
        cy.get('[data-testid="item-checkbox"]').click();
        cy.get('[data-testid="item-checkbox"]').should('be.checked');
      });
      
      // Edit item
      cy.get('[data-testid="shopping-list-item"]').first().within(() => {
        cy.get('[data-testid="edit-item-button"]').click();
      });
      
      cy.get('[data-testid="edit-item-name"]').clear().type('大きなトマト');
      cy.get('[data-testid="save-edit-button"]').click();
      
      // Check item was updated
      cy.get('[data-testid="shopping-list-item"]').first().should('contain.text', '大きなトマト');
      
      // Remove item
      cy.get('[data-testid="shopping-list-item"]').first().within(() => {
        cy.get('[data-testid="remove-item-button"]').click();
      });
      
      cy.get('[data-testid="confirm-remove-button"]').click();
      cy.get('[data-testid="shopping-list-item"]').should('have.length', 0);
    });

    it('allows premium users to add recipe ingredients to shopping list', () => {
      cy.loginAsPremiumUser();
      cy.visit('/');
      
      // Navigate to a food detail page with recipes
      cy.get('[data-testid="category-card"]').first().click();
      cy.get('[data-testid="food-card"]').first().click();
      
      // Check if recipes are available
      cy.get('[data-testid="recipe-card"]').first().click();
      
      // Add recipe ingredients to shopping list
      cy.get('[data-testid="add-to-shopping-list-button"]').click();
      cy.get('[data-testid="success-message"]').should('be.visible');
      
      // Navigate to shopping list
      cy.visit('/shopping-list');
      
      // Check ingredients were added
      cy.get('[data-testid="shopping-list-item"]').should('have.length.at.least', 1);
    });

    it('shows upgrade prompt for free users trying to access shopping list', () => {
      cy.loginAsFreeUser();
      cy.visit('/shopping-list');
      
      // Check that upgrade prompt is shown
      cy.checkPremiumFeatureAccess('shopping-list', false);
      
      // Click upgrade button
      cy.get('[data-testid="shopping-list-upgrade-prompt"]').within(() => {
        cy.get('[data-testid="upgrade-button"]').click();
      });
      
      cy.url().should('include', '/pricing');
    });
  });

  describe('Search Limits', () => {
    it('tracks search usage for free users', () => {
      cy.loginAsFreeUser();
      cy.visit('/');
      
      // Check search usage indicator
      cy.get('[data-testid="search-usage-indicator"]').should('be.visible');
      cy.get('[data-testid="search-usage-indicator"]').should('contain.text', '30');
      
      // Perform a search
      cy.get('[data-testid="global-search"]').click();
      cy.get('[data-testid="search-input"]').type('野菜{enter}');
      
      // Check usage was decremented
      cy.get('[data-testid="search-usage-indicator"]').should('contain.text', '29');
    });

    it('shows search limit reached message for free users', () => {
      cy.loginAsFreeUser();
      
      // Simulate reaching search limit
      cy.request({
        method: 'POST',
        url: '/api/test/set-search-count',
        body: { count: 30 }
      });
      
      cy.visit('/');
      
      // Try to search
      cy.get('[data-testid="global-search"]').click();
      cy.get('[data-testid="search-input"]').type('野菜{enter}');
      
      // Check limit reached message
      cy.get('[data-testid="search-limit-reached"]').should('be.visible');
      cy.get('[data-testid="upgrade-for-unlimited-search"]').should('exist');
    });

    it('does not show search limits for premium users', () => {
      cy.loginAsPremiumUser();
      cy.visit('/');
      
      // Check no search usage indicator for premium users
      cy.get('[data-testid="search-usage-indicator"]').should('not.exist');
      
      // Perform multiple searches without limits
      for (let i = 0; i < 5; i++) {
        cy.get('[data-testid="global-search"]').click();
        cy.get('[data-testid="search-input"]').clear().type(`search${i}{enter}`);
        cy.get('[data-testid="search-results"]').should('exist');
        cy.visit('/');
      }
      
      // Should still be able to search
      cy.get('[data-testid="global-search"]').click();
      cy.get('[data-testid="search-input"]').type('final search{enter}');
      cy.get('[data-testid="search-results"]').should('exist');
    });
  });

  describe('Premium Dashboard', () => {
    it('shows premium dashboard for premium users', () => {
      cy.loginAsPremiumUser();
      cy.visit('/dashboard');
      
      // Check premium dashboard elements
      cy.get('[data-testid="premium-dashboard"]').should('exist');
      cy.get('[data-testid="subscription-status"]').should('contain.text', 'プレミアム');
      
      // Check premium features are accessible
      cy.get('[data-testid="favorites-widget"]').should('exist');
      cy.get('[data-testid="nutrition-calculator-widget"]').should('exist');
      cy.get('[data-testid="shopping-list-widget"]').should('exist');
      
      // Check subscription management
      cy.get('[data-testid="manage-subscription-button"]').should('exist');
    });

    it('shows upgrade prompt in dashboard for free users', () => {
      cy.loginAsFreeUser();
      cy.visit('/dashboard');
      
      // Check upgrade prompt in dashboard
      cy.get('[data-testid="dashboard-upgrade-prompt"]').should('exist');
      cy.get('[data-testid="premium-features-preview"]').should('exist');
      
      // Click upgrade button
      cy.get('[data-testid="dashboard-upgrade-button"]').click();
      cy.url().should('include', '/pricing');
    });
  });

  describe('Subscription Management', () => {
    it('allows premium users to manage their subscription', () => {
      cy.loginAsPremiumUser();
      cy.visit('/subscription/manage');
      
      // Check subscription details
      cy.get('[data-testid="subscription-details"]').should('exist');
      cy.get('[data-testid="subscription-status"]').should('contain.text', 'アクティブ');
      
      // Check cancel subscription option
      cy.get('[data-testid="cancel-subscription-button"]').should('exist');
      
      // Test cancel subscription flow
      cy.get('[data-testid="cancel-subscription-button"]').click();
      cy.get('[data-testid="cancel-confirmation-dialog"]').should('be.visible');
      
      // Cancel the cancellation
      cy.get('[data-testid="keep-subscription-button"]').click();
      cy.get('[data-testid="cancel-confirmation-dialog"]').should('not.be.visible');
    });

    it('redirects free users from subscription management to pricing', () => {
      cy.loginAsFreeUser();
      cy.visit('/subscription/manage');
      
      // Should redirect to pricing page
      cy.url().should('include', '/pricing');
    });
  });
});