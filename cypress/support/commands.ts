/// <reference types="cypress" />

// Custom commands for premium feature testing
Cypress.Commands.add('loginAsUser', (email: string, password: string) => {
  cy.session([email, password], () => {
    cy.visit('/auth/signin');
    cy.get('[data-testid="email-input"]').type(email);
    cy.get('[data-testid="password-input"]').type(password);
    cy.get('[data-testid="login-button"]').click();
    cy.url().should('not.include', '/auth/signin');
  });
});

Cypress.Commands.add('loginAsPremiumUser', () => {
  cy.loginAsUser('premium@test.com', 'testpassword123');
});

Cypress.Commands.add('loginAsFreeUser', () => {
  cy.loginAsUser('free@test.com', 'testpassword123');
});

Cypress.Commands.add('createTestUser', (email: string, password: string, isPremium: boolean = false) => {
  cy.request({
    method: 'POST',
    url: '/api/test/create-user',
    body: {
      email,
      password,
      isPremium
    }
  });
});

Cypress.Commands.add('cleanupTestUsers', () => {
  cy.request({
    method: 'DELETE',
    url: '/api/test/cleanup-users'
  });
});

Cypress.Commands.add('checkAdVisibility', (shouldBeVisible: boolean) => {
  if (shouldBeVisible) {
    cy.get('[data-testid="ad-container"]').should('exist');
    cy.get('[data-testid="affiliate-widget"]').should('exist');
  } else {
    cy.get('[data-testid="ad-container"]').should('not.exist');
    cy.get('[data-testid="affiliate-widget"]').should('not.exist');
  }
});

Cypress.Commands.add('checkPremiumFeatureAccess', (featureName: string, shouldHaveAccess: boolean) => {
  if (shouldHaveAccess) {
    cy.get(`[data-testid="${featureName}-feature"]`).should('exist');
    cy.get(`[data-testid="${featureName}-upgrade-prompt"]`).should('not.exist');
  } else {
    cy.get(`[data-testid="${featureName}-upgrade-prompt"]`).should('exist');
    cy.get(`[data-testid="${featureName}-feature"]`).should('not.exist');
  }
});

declare global {
  namespace Cypress {
    interface Chainable {
      loginAsUser(email: string, password: string): Chainable<void>
      loginAsPremiumUser(): Chainable<void>
      loginAsFreeUser(): Chainable<void>
      createTestUser(email: string, password: string, isPremium?: boolean): Chainable<void>
      cleanupTestUsers(): Chainable<void>
      checkAdVisibility(shouldBeVisible: boolean): Chainable<void>
      checkPremiumFeatureAccess(featureName: string, shouldHaveAccess: boolean): Chainable<void>
    }
  }
}

import '@testing-library/cypress/add-commands'