describe('Access Control E2E Tests', () => {
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

  describe('API Access Control', () => {
    it('allows premium users to access premium API endpoints', () => {
      cy.loginAsPremiumUser();
      
      // Test favorites API access
      cy.request({
        method: 'GET',
        url: '/api/favorites',
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(200);
      });
      
      // Test nutrition calculator API access
      cy.request({
        method: 'POST',
        url: '/api/nutrition/calculate',
        body: {
          foods: [
            { foodId: 'rice', quantity: 100 },
            { foodId: 'chicken', quantity: 150 }
          ]
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(200);
      });
      
      // Test shopping list API access
      cy.request({
        method: 'GET',
        url: '/api/shopping-list',
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(200);
      });
      
      // Test PDF generation API access
      cy.request({
        method: 'POST',
        url: '/api/pdf/food',
        body: {
          foodId: 'test-food',
          notes: 'Test notes'
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(200);
      });
    });

    it('blocks free users from accessing premium API endpoints', () => {
      cy.loginAsFreeUser();
      
      // Test favorites API blocked
      cy.request({
        method: 'POST',
        url: '/api/favorites',
        body: {
          itemType: 'food',
          itemId: 'test-food',
          itemData: { name: 'Test Food' }
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(403);
        expect(response.body.error).to.include('Premium');
      });
      
      // Test nutrition calculator API blocked
      cy.request({
        method: 'POST',
        url: '/api/nutrition/calculate',
        body: {
          foods: [{ foodId: 'rice', quantity: 100 }]
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(403);
        expect(response.body.error).to.include('Premium');
      });
      
      // Test shopping list API blocked
      cy.request({
        method: 'POST',
        url: '/api/shopping-list',
        body: {
          foodName: 'Test Item',
          quantity: '1',
          unit: 'kg'
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(403);
        expect(response.body.error).to.include('Premium');
      });
      
      // Test PDF generation API blocked
      cy.request({
        method: 'POST',
        url: '/api/pdf/food',
        body: {
          foodId: 'test-food',
          notes: 'Test notes'
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(403);
        expect(response.body.error).to.include('Premium');
      });
    });

    it('blocks unauthenticated users from accessing premium API endpoints', () => {
      // Test without authentication
      cy.request({
        method: 'GET',
        url: '/api/favorites',
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(401);
      });
      
      cy.request({
        method: 'POST',
        url: '/api/nutrition/calculate',
        body: {
          foods: [{ foodId: 'rice', quantity: 100 }]
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(401);
      });
      
      cy.request({
        method: 'GET',
        url: '/api/shopping-list',
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(401);
      });
    });

    it('enforces search limits for free users via API', () => {
      cy.loginAsFreeUser();
      
      // Set search count to near limit
      cy.request({
        method: 'POST',
        url: '/api/test/set-search-count',
        body: { count: 29 }
      });
      
      // Perform one more search (should succeed)
      cy.request({
        method: 'POST',
        url: '/api/search/track',
        body: { query: 'test search' },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(200);
      });
      
      // Try to search again (should be blocked)
      cy.request({
        method: 'POST',
        url: '/api/search/track',
        body: { query: 'another search' },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(429); // Too Many Requests
        expect(response.body.error).to.include('search limit');
      });
    });

    it('does not enforce search limits for premium users via API', () => {
      cy.loginAsPremiumUser();
      
      // Perform many searches (should all succeed)
      for (let i = 0; i < 35; i++) {
        cy.request({
          method: 'POST',
          url: '/api/search/track',
          body: { query: `search ${i}` },
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.eq(200);
        });
      }
    });
  });

  describe('Page Access Control', () => {
    it('allows premium users to access premium pages', () => {
      cy.loginAsPremiumUser();
      
      // Test premium dashboard access
      cy.visit('/dashboard');
      cy.get('[data-testid="premium-dashboard"]').should('exist');
      cy.url().should('include', '/dashboard');
      
      // Test nutrition calculator page access
      cy.visit('/nutrition');
      cy.get('[data-testid="nutrition-calculator"]').should('exist');
      cy.url().should('include', '/nutrition');
      
      // Test shopping list page access
      cy.visit('/shopping-list');
      cy.get('[data-testid="shopping-list"]').should('exist');
      cy.url().should('include', '/shopping-list');
      
      // Test favorites page access
      cy.visit('/favorites');
      cy.get('[data-testid="favorites-list"]').should('exist');
      cy.url().should('include', '/favorites');
      
      // Test subscription management access
      cy.visit('/subscription/manage');
      cy.get('[data-testid="subscription-details"]').should('exist');
      cy.url().should('include', '/subscription/manage');
    });

    it('redirects free users from premium-only pages', () => {
      cy.loginAsFreeUser();
      
      // Test subscription management redirect
      cy.visit('/subscription/manage');
      cy.url().should('include', '/pricing');
    });

    it('shows upgrade prompts for free users on premium pages', () => {
      cy.loginAsFreeUser();
      
      // Test nutrition calculator page
      cy.visit('/nutrition');
      cy.get('[data-testid="nutrition-calculator-upgrade-prompt"]').should('exist');
      cy.get('[data-testid="upgrade-button"]').should('exist');
      
      // Test shopping list page
      cy.visit('/shopping-list');
      cy.get('[data-testid="shopping-list-upgrade-prompt"]').should('exist');
      cy.get('[data-testid="upgrade-button"]').should('exist');
      
      // Test favorites page
      cy.visit('/favorites');
      cy.get('[data-testid="favorites-upgrade-prompt"]').should('exist');
      cy.get('[data-testid="upgrade-button"]').should('exist');
    });

    it('redirects unauthenticated users to login for premium pages', () => {
      // Test nutrition calculator page
      cy.visit('/nutrition');
      cy.url().should('include', '/auth/signin');
      
      // Test shopping list page
      cy.visit('/shopping-list');
      cy.url().should('include', '/auth/signin');
      
      // Test favorites page
      cy.visit('/favorites');
      cy.url().should('include', '/auth/signin');
      
      // Test dashboard
      cy.visit('/dashboard');
      cy.url().should('include', '/auth/signin');
    });
  });

  describe('Component-Level Access Control', () => {
    it('shows premium features to premium users in components', () => {
      cy.loginAsPremiumUser();
      cy.visit('/');
      
      // Navigate to a food detail page
      cy.get('[data-testid="category-card"]').first().click();
      cy.get('[data-testid="food-card"]').first().click();
      
      // Check premium features are visible
      cy.get('[data-testid="favorite-button"]').should('exist');
      cy.get('[data-testid="pdf-export-button"]').should('exist');
      cy.get('[data-testid="add-to-shopping-list-button"]').should('exist');
      
      // Check no upgrade prompts
      cy.get('[data-testid="premium-upgrade-prompt"]').should('not.exist');
    });

    it('shows upgrade prompts to free users in components', () => {
      cy.loginAsFreeUser();
      cy.visit('/');
      
      // Navigate to a food detail page
      cy.get('[data-testid="category-card"]').first().click();
      cy.get('[data-testid="food-card"]').first().click();
      
      // Try to use premium features
      cy.get('[data-testid="favorite-button"]').click();
      cy.get('[data-testid="premium-upgrade-modal"]').should('be.visible');
      cy.get('[data-testid="close-modal-button"]').click();
      
      cy.get('[data-testid="pdf-export-button"]').click();
      cy.get('[data-testid="premium-upgrade-modal"]').should('be.visible');
      cy.get('[data-testid="close-modal-button"]').click();
      
      cy.get('[data-testid="add-to-shopping-list-button"]').click();
      cy.get('[data-testid="premium-upgrade-modal"]').should('be.visible');
    });

    it('shows login prompts to unauthenticated users in components', () => {
      cy.visit('/');
      
      // Navigate to a food detail page
      cy.get('[data-testid="category-card"]').first().click();
      cy.get('[data-testid="food-card"]').first().click();
      
      // Try to use premium features
      cy.get('[data-testid="favorite-button"]').click();
      cy.url().should('include', '/auth/signin');
    });
  });

  describe('Subscription Status Changes', () => {
    it('updates access when subscription expires', () => {
      cy.loginAsPremiumUser();
      
      // Verify premium access initially
      cy.visit('/nutrition');
      cy.get('[data-testid="nutrition-calculator"]').should('exist');
      
      // Simulate subscription expiration
      cy.request({
        method: 'POST',
        url: '/api/test/expire-subscription'
      });
      
      // Refresh and check access is revoked
      cy.reload();
      cy.get('[data-testid="nutrition-calculator-upgrade-prompt"]').should('exist');
      
      // Check API access is also revoked
      cy.request({
        method: 'GET',
        url: '/api/favorites',
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(403);
      });
    });

    it('grants access when user upgrades to premium', () => {
      cy.loginAsFreeUser();
      
      // Verify no premium access initially
      cy.visit('/nutrition');
      cy.get('[data-testid="nutrition-calculator-upgrade-prompt"]').should('exist');
      
      // Simulate upgrade to premium
      cy.request({
        method: 'POST',
        url: '/api/test/upgrade-to-premium'
      });
      
      // Refresh and check access is granted
      cy.reload();
      cy.get('[data-testid="nutrition-calculator"]').should('exist');
      
      // Check API access is also granted
      cy.request({
        method: 'GET',
        url: '/api/favorites',
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(200);
      });
    });

    it('handles subscription cancellation gracefully', () => {
      cy.loginAsPremiumUser();
      
      // Cancel subscription (but keep access until period end)
      cy.visit('/subscription/manage');
      cy.get('[data-testid="cancel-subscription-button"]').click();
      cy.get('[data-testid="confirm-cancel-button"]').click();
      
      // Check access is still available
      cy.visit('/nutrition');
      cy.get('[data-testid="nutrition-calculator"]').should('exist');
      
      // Check cancellation notice
      cy.get('[data-testid="subscription-cancelled-notice"]').should('exist');
      cy.get('[data-testid="subscription-cancelled-notice"]').should('contain.text', '期間終了まで');
    });
  });

  describe('Security and Edge Cases', () => {
    it('prevents privilege escalation attempts', () => {
      cy.loginAsFreeUser();
      
      // Try to manipulate session data
      cy.window().then((win) => {
        // Attempt to modify session in localStorage (should not work)
        win.localStorage.setItem('user-subscription', 'premium');
      });
      
      // Check that server-side validation prevents access
      cy.request({
        method: 'GET',
        url: '/api/favorites',
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(403);
      });
    });

    it('handles invalid subscription states gracefully', () => {
      // Simulate corrupted subscription data
      cy.request({
        method: 'POST',
        url: '/api/test/corrupt-subscription'
      });
      
      cy.loginAsFreeUser();
      cy.visit('/dashboard');
      
      // Should default to free user experience
      cy.get('[data-testid="dashboard-upgrade-prompt"]').should('exist');
    });

    it('validates subscription status on each request', () => {
      cy.loginAsPremiumUser();
      
      // Make initial request to establish session
      cy.request({
        method: 'GET',
        url: '/api/favorites'
      }).then((response) => {
        expect(response.status).to.eq(200);
      });
      
      // Simulate subscription expiration on server
      cy.request({
        method: 'POST',
        url: '/api/test/expire-subscription'
      });
      
      // Next request should be blocked
      cy.request({
        method: 'GET',
        url: '/api/favorites',
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(403);
      });
    });

    it('handles concurrent access control checks', () => {
      cy.loginAsPremiumUser();
      
      // Make multiple concurrent requests
      const requests = [];
      for (let i = 0; i < 5; i++) {
        requests.push(
          cy.request({
            method: 'GET',
            url: '/api/favorites',
            failOnStatusCode: false
          })
        );
      }
      
      // All should succeed for premium user
      requests.forEach((request) => {
        request.then((response) => {
          expect(response.status).to.eq(200);
        });
      });
    });
  });
});