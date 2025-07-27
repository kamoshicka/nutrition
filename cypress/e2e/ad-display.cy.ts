describe('Ad Display/Hide E2E Tests', () => {
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

  describe('AdSense Ads', () => {
    it('shows ads for free users', () => {
      cy.loginAsFreeUser();
      cy.visit('/');
      
      // Check that ads are visible for free users
      cy.checkAdVisibility(true);
      
      // Check specific ad placements
      cy.get('[data-testid="header-ad"]').should('exist');
      cy.get('[data-testid="sidebar-ad"]').should('exist');
      
      // Navigate to different pages and check ads persist
      cy.get('[data-testid="category-card"]').first().click();
      cy.checkAdVisibility(true);
      
      cy.get('[data-testid="food-card"]').first().click();
      cy.checkAdVisibility(true);
      cy.get('[data-testid="in-article-ad"]').should('exist');
    });

    it('hides ads for premium users', () => {
      cy.loginAsPremiumUser();
      cy.visit('/');
      
      // Check that ads are hidden for premium users
      cy.checkAdVisibility(false);
      
      // Navigate to different pages and verify ads remain hidden
      cy.get('[data-testid="category-card"]').first().click();
      cy.checkAdVisibility(false);
      
      cy.get('[data-testid="food-card"]').first().click();
      cy.checkAdVisibility(false);
    });

    it('shows ads for unauthenticated users', () => {
      cy.visit('/');
      
      // Check that ads are visible for unauthenticated users
      cy.checkAdVisibility(true);
      
      // Check ad placements
      cy.get('[data-testid="header-ad"]').should('exist');
      cy.get('[data-testid="sidebar-ad"]').should('exist');
    });

    it('shows ad blocker detection message when ads are blocked', () => {
      cy.loginAsFreeUser();
      
      // Mock ad blocker by intercepting ad requests
      cy.intercept('GET', '**/pagead/js/adsbygoogle.js', { statusCode: 404 });
      
      cy.visit('/');
      
      // Check ad blocker detection message
      cy.get('[data-testid="ad-blocker-detected"]').should('be.visible');
      cy.get('[data-testid="ad-blocker-message"]').should('contain.text', '広告ブロッカー');
      
      // Check upgrade suggestion
      cy.get('[data-testid="ad-blocker-upgrade-suggestion"]').should('exist');
    });

    it('handles ad loading errors gracefully', () => {
      cy.loginAsFreeUser();
      
      // Mock ad loading failure
      cy.intercept('GET', '**/pagead/js/adsbygoogle.js', { 
        statusCode: 500,
        body: 'Server Error'
      });
      
      cy.visit('/');
      
      // Check fallback content is shown
      cy.get('[data-testid="ad-fallback"]').should('exist');
      cy.get('[data-testid="ad-error-message"]').should('contain.text', '広告を読み込めませんでした');
    });
  });

  describe('Affiliate Ads', () => {
    it('shows affiliate products for free users', () => {
      cy.loginAsFreeUser();
      cy.visit('/');
      
      // Navigate to a food detail page
      cy.get('[data-testid="category-card"]').first().click();
      cy.get('[data-testid="food-card"]').first().click();
      
      // Check affiliate widget is visible
      cy.get('[data-testid="affiliate-widget"]').should('exist');
      cy.get('[data-testid="affiliate-products"]').should('exist');
      
      // Check product recommendations
      cy.get('[data-testid="affiliate-product"]').should('have.length.at.least', 1);
      
      // Check affiliate links
      cy.get('[data-testid="affiliate-product"]').first().within(() => {
        cy.get('[data-testid="product-link"]').should('have.attr', 'href');
        cy.get('[data-testid="product-link"]').should('have.attr', 'target', '_blank');
      });
      
      // Check affiliate disclosure
      cy.get('[data-testid="affiliate-disclosure"]').should('exist');
      cy.get('[data-testid="affiliate-disclosure"]').should('contain.text', 'アフィリエイト');
    });

    it('hides affiliate products for premium users', () => {
      cy.loginAsPremiumUser();
      cy.visit('/');
      
      // Navigate to a food detail page
      cy.get('[data-testid="category-card"]').first().click();
      cy.get('[data-testid="food-card"]').first().click();
      
      // Check affiliate widget is hidden
      cy.get('[data-testid="affiliate-widget"]').should('not.exist');
      cy.get('[data-testid="affiliate-products"]').should('not.exist');
    });

    it('tracks affiliate clicks for analytics', () => {
      cy.loginAsFreeUser();
      cy.visit('/');
      
      // Navigate to a food detail page
      cy.get('[data-testid="category-card"]').first().click();
      cy.get('[data-testid="food-card"]').first().click();
      
      // Intercept analytics tracking
      cy.intercept('POST', '/api/analytics/affiliate-click', { statusCode: 200 });
      
      // Click on affiliate product
      cy.get('[data-testid="affiliate-product"]').first().within(() => {
        cy.get('[data-testid="product-link"]').click();
      });
      
      // Verify tracking was called
      cy.get('@affiliate-click').should('have.been.called');
    });

    it('shows different affiliate products based on food category', () => {
      cy.loginAsFreeUser();
      
      // Visit different food categories
      const categories = ['vegetables', 'meat', 'dairy'];
      
      categories.forEach((category) => {
        cy.visit(`/categories/${category}`);
        cy.get('[data-testid="food-card"]').first().click();
        
        // Check that affiliate products are relevant to category
        cy.get('[data-testid="affiliate-widget"]').should('exist');
        cy.get('[data-testid="affiliate-products"]').should('exist');
        
        // Go back to continue testing
        cy.go('back');
        cy.go('back');
      });
    });

    it('handles affiliate API errors gracefully', () => {
      cy.loginAsFreeUser();
      
      // Mock affiliate API failure
      cy.intercept('GET', '/api/affiliate/recommendations', { 
        statusCode: 500,
        body: { error: 'Service unavailable' }
      });
      
      cy.visit('/');
      cy.get('[data-testid="category-card"]').first().click();
      cy.get('[data-testid="food-card"]').first().click();
      
      // Check that affiliate widget handles error gracefully
      cy.get('[data-testid="affiliate-widget"]').should('not.exist');
      // Or shows error state
      cy.get('[data-testid="affiliate-error"]').should('exist');
    });
  });

  describe('Mobile Ad Experience', () => {
    it('shows mobile-optimized ads on mobile devices', () => {
      cy.loginAsFreeUser();
      
      // Set mobile viewport
      cy.viewport('iphone-x');
      cy.visit('/');
      
      // Check mobile-specific ad placements
      cy.get('[data-testid="mobile-banner-ad"]').should('exist');
      cy.get('[data-testid="mobile-sticky-ad"]').should('exist');
      
      // Check that desktop ads are hidden on mobile
      cy.get('[data-testid="sidebar-ad"]').should('not.exist');
    });

    it('maintains ad-free experience for premium users on mobile', () => {
      cy.loginAsPremiumUser();
      
      // Set mobile viewport
      cy.viewport('iphone-x');
      cy.visit('/');
      
      // Check no mobile ads for premium users
      cy.get('[data-testid="mobile-banner-ad"]').should('not.exist');
      cy.get('[data-testid="mobile-sticky-ad"]').should('not.exist');
    });
  });

  describe('Ad Performance and Loading', () => {
    it('loads ads asynchronously without blocking page content', () => {
      cy.loginAsFreeUser();
      cy.visit('/');
      
      // Check that main content loads before ads
      cy.get('[data-testid="category-card"]').should('exist');
      cy.get('h1').should('be.visible');
      
      // Check ad loading states
      cy.get('[data-testid="ad-loading"]').should('exist');
      
      // Wait for ads to load
      cy.get('[data-testid="ad-container"]', { timeout: 10000 }).should('exist');
    });

    it('shows ad loading placeholders', () => {
      cy.loginAsFreeUser();
      
      // Slow down network to see loading states
      cy.intercept('GET', '**/pagead/js/adsbygoogle.js', (req) => {
        req.reply((res) => {
          res.delay(2000);
          res.send();
        });
      });
      
      cy.visit('/');
      
      // Check loading placeholders
      cy.get('[data-testid="ad-loading-placeholder"]').should('exist');
      cy.get('[data-testid="ad-loading-spinner"]').should('be.visible');
    });

    it('respects user ad preferences and consent', () => {
      // Set ad consent in localStorage
      cy.window().then((win) => {
        win.localStorage.setItem('ad-consent', 'granted');
      });
      
      cy.loginAsFreeUser();
      cy.visit('/');
      
      // Check that ads load with consent
      cy.get('[data-testid="ad-container"]').should('exist');
      
      // Test without consent
      cy.window().then((win) => {
        win.localStorage.setItem('ad-consent', 'denied');
      });
      
      cy.reload();
      
      // Check that personalized ads are disabled
      cy.get('[data-testid="non-personalized-ad"]').should('exist');
    });
  });

  describe('Ad Revenue Optimization', () => {
    it('shows appropriate ad sizes for different screen sizes', () => {
      cy.loginAsFreeUser();
      
      // Test desktop
      cy.viewport(1200, 800);
      cy.visit('/');
      cy.get('[data-testid="leaderboard-ad"]').should('exist');
      
      // Test tablet
      cy.viewport('ipad-2');
      cy.visit('/');
      cy.get('[data-testid="medium-rectangle-ad"]').should('exist');
      
      // Test mobile
      cy.viewport('iphone-x');
      cy.visit('/');
      cy.get('[data-testid="mobile-banner-ad"]').should('exist');
    });

    it('implements lazy loading for below-the-fold ads', () => {
      cy.loginAsFreeUser();
      cy.visit('/');
      
      // Check that footer ads are not loaded initially
      cy.get('[data-testid="footer-ad"]').should('not.exist');
      
      // Scroll to bottom
      cy.scrollTo('bottom');
      
      // Check that footer ads load after scrolling
      cy.get('[data-testid="footer-ad"]', { timeout: 5000 }).should('exist');
    });
  });

  describe('Premium Upgrade Flow from Ads', () => {
    it('allows users to upgrade to premium from ad blocker message', () => {
      cy.loginAsFreeUser();
      
      // Mock ad blocker
      cy.intercept('GET', '**/pagead/js/adsbygoogle.js', { statusCode: 404 });
      
      cy.visit('/');
      
      // Click upgrade from ad blocker message
      cy.get('[data-testid="ad-blocker-upgrade-button"]').click();
      cy.url().should('include', '/pricing');
      
      // Check that premium benefits are highlighted
      cy.get('[data-testid="ad-free-benefit"]').should('be.visible');
    });

    it('shows premium upgrade CTA in ad spaces occasionally', () => {
      cy.loginAsFreeUser();
      
      // Mock showing upgrade CTA instead of ad
      cy.intercept('GET', '/api/ads/should-show-upgrade-cta', { 
        body: { showUpgrade: true }
      });
      
      cy.visit('/');
      
      // Check upgrade CTA in ad space
      cy.get('[data-testid="ad-space-upgrade-cta"]').should('exist');
      cy.get('[data-testid="upgrade-to-remove-ads"]').should('be.visible');
      
      // Click upgrade CTA
      cy.get('[data-testid="upgrade-to-remove-ads"]').click();
      cy.url().should('include', '/pricing');
    });
  });
});