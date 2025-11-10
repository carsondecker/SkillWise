describe('Frontend E2E — register → create goal → create challenge → mark complete', () => {
  it('creates a goal and linked challenge, marks it complete and shows 100% progress', () => {
    const api = Cypress.env('apiUrl') || 'http://localhost:3001';
    const timestamp = Date.now();
    const email = `cypress+${timestamp}@example.com`;
    const password = 'Cypress123!';

    // 1) Register via API
    cy.request('POST', `${api}/api/auth/register`, {
      firstName: 'Cypress',
      lastName: 'Runner',
      email,
      password,
      confirmPassword: password,
    }).then((reg) => {
      expect(reg.status).to.eq(201);

      // 2) Login to get access token (returned in body.tokens.accessToken)
      cy.request('POST', `${api}/api/auth/login`, {
        email,
        password,
      }).then((login) => {
        expect(login.status).to.eq(200);
        const access = login.body?.tokens?.accessToken;
        expect(access).to.be.a('string');

        // Helper to call API with Authorization header
        const authRequest = (method, url, body) =>
          cy.request({
            method,
            url: `${api}${url}`,
            headers: { Authorization: `Bearer ${access}` },
            body,
            failOnStatusCode: true,
          });

        // 3) Create a goal
        authRequest('POST', '/api/goals', {
          title: `Cypress Goal ${timestamp}`,
          description: 'Goal created by Cypress test',
        }).then((goalRes) => {
          expect(goalRes.status).to.eq(201);
          const goal = goalRes.body.goal;
          expect(goal).to.have.property('id');

          // 4) Create a challenge linked to the goal
          authRequest('POST', '/api/challenges', {
            title: `Cypress Challenge ${timestamp}`,
            description: 'A challenge for the goal',
            instructions: 'Do the thing',
            category: 'testing',
            difficulty_level: 'easy',
            relatedGoalId: goal.id,
          }).then((chRes) => {
            expect(chRes.status).to.eq(201);
            const challenge = chRes.body.challenge;
            expect(challenge).to.have.property('id');

            // 5) Mark challenge complete via API
            authRequest(
              'POST',
              `/api/submissions/challenge/${challenge.id}/complete`,
              {}
            ).then((completeRes) => {
              expect(completeRes.status).to.eq(201);

              // 6) Visit goals page with access token set in localStorage so frontend will render as authenticated
              cy.visit('/goals', {
                onBeforeLoad(win) {
                  win.localStorage.setItem('access_token', access);
                },
              });

              // Wait a short moment for frontend to fetch goals and compute progress
              cy.contains('My Learning Goals', { timeout: 10000 });

              // Find the created goal card and assert progress is 100%
              cy.contains('.goal-card h3', goal.title)
                .parents('.goal-card')
                .within(() => {
                  cy.get('.progress-number', { timeout: 10000 }).should(
                    'contain.text',
                    '100%'
                  );
                });
            });
          });
        });
      });
    });
  });
});
