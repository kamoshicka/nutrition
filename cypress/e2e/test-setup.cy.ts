describe('Test Setup Verification', () => {
  it('can access the application', () => {
    cy.visit('/');
    cy.get('h1').should('exist');
  });

  it('can create and cleanup test users', () => {
    // Set environment variable for test mode
    cy.window().then((win) => {
      win.localStorage.setItem('CYPRESS_TEST', 'true');
    });

    // Create a test user
    cy.request({
      method: 'POST',
      url: '/api/test/create-user',
      body: {
        email: 'test@example.com',
        password: 'testpassword123',
        isPremium: false
      },
      headers: {
        'x-cypress-test': 'true'
      }
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.success).to.be.true;
    });

    // Cleanup test users
    cy.request({
      method: 'DELETE',
      url: '/api/test/cleanup-users',
      headers: {
        'x-cypress-test': 'true'
      }
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.success).to.be.true;
    });
  });
});