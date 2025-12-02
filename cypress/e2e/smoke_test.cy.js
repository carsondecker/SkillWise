/// <reference types="cypress" />

describe('SkillWise E2E Smoke Test', () => {
  const uniqueId = Date.now();
  const testUser = {
    firstName: 'Test',
    lastName: 'User',
    email: `testuser_${uniqueId}@example.com`,
    password: 'Password123!',
  };

  before(() => {
    cy.log('🚀 Starting Smoke Test: Sign Up → Login → Create Goal → Complete Goal');
  });

  // ---------------------------
  // 1️⃣ Sign Up
  // ---------------------------
  it('Signs up a new user successfully', () => {
    cy.visit('/signup'); // ✅ Adjust to your actual signup route]
    cy.get('input[name="firstName"]').type(testUser.firstName);
    cy.get('input[name="lastName"]').type(testUser.lastName);
    cy.get('input[name="email"]').type(testUser.email);
    cy.get('input[name="password"]').type(testUser.password);
    cy.get('input[name="confirmPassword"]').type(testUser.password);
    cy.get('button[type="submit"]').click();

    // Expect redirect or confirmation
    cy.url().should('include', '/dashboard');
    cy.contains('Welcome', { matchCase: false }).should('exist');
  });

  const login = () => {
    cy.visit('/login');
    cy.get('#email').should('be.visible').clear().type(testUser.email);
    cy.get('#password').should('be.visible').clear().type(testUser.password);
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
  };

  // ---------------------------
  // 2️⃣ Log In
  // ---------------------------
  it('logs into the app', () => {
    login();
    cy.contains(/dashboard|goals/i, { timeout: 10000 }).should('exist');
  });

  // ---------------------------
  // 3️⃣ Create a New Goal
  // ---------------------------
  it('Creates a new goal successfully', () => {
    // 🧭 Step 1: Login
    login();

    // 🏠 Step 2: Navigate to dashboard, then goals
    cy.url({ timeout: 15000 }).should('include', '/dashboard');
    cy.visit('/goals');

    // ⏳ Wait for authentication to finish
    cy.contains('Checking authentication...', { timeout: 15000 }).should('not.exist');

    // 🎯 Step 3: Open "Create Goal" modal
    cy.get('#create-goal-btn', { timeout: 20000 })
      .should('be.visible')
      .click();

    // Wait for modal animation
    cy.get('#goal-modal', { timeout: 10000 })
      .should('be.visible')
      .and('not.have.css', 'opacity', '0');

    // 📝 Step 4: Fill in goal form
    cy.get('#goal-title')
      .should('be.visible')
      .and('not.be.disabled')
      .type('Learn Cypress E2E Testing');

    cy.get('#goal-description')
      .should('be.visible')
      .and('not.be.disabled')
      .type('Practice end-to-end tests for app workflows.');

    // Select category and difficulty
    cy.get('#goal-category').should('be.visible').select('programming');
    cy.get('#goal-difficulty').should('be.visible').select('medium');

    // Set target date (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const formattedDate = tomorrow.toISOString().split('T')[0];
    cy.get('#goal-target-date').should('be.visible').type(formattedDate);


    // 🧩 Step 5: Submit form
    cy.get('#submit-goal')
      .should('be.visible')
      .and('not.be.disabled')
      .click();

    // ✅ Step 6: Verify new goal appears
    cy.get('#goals-grid', { timeout: 15000 })
      .should('be.visible')
      .within(() => {
        cy.contains('Learn Cypress E2E Testing', { timeout: 10000 }).should('be.visible');
      });
  });
  // ---------------------------
  // 4️⃣ Creates a challenge from a goal
  // ---------------------------
  it('Creates a challenge from a goal', () => {
    login();

    cy.url({ timeout: 15000 }).should('include', '/dashboard');
    cy.visit('/goals');

    // Wait for goals grid
    cy.get('#goals-grid', { timeout: 15000 }).should('exist');

    // ensure API alias for challenge creation
    cy.intercept('POST', '/api/goals/*/challenges').as('createChallenge');

    // Find specific goal
    cy.contains('.goal-card-container h3', 'Learn Cypress E2E Testing', { timeout: 15000 })
      .should('be.visible')
      .parents('.goal-card-container')
      .as('targetGoal');

    // Flip card to reveal actions
    cy.get('@targetGoal')
      .click()
      .should('have.class', 'flipped');

    cy.wait(400); // allow flip animation to complete

    // Open Challenge Modal
    cy.get('@targetGoal')
      .find('[id^="goal-create-challenge-btn-"]')
      .should('exist')
      .click({ force: true });

    // Modal should open
    cy.get('.modal', { timeout: 10000 }).should('exist');

    // 🔵 Step chooser: pick manual creation
    cy.get('.challenge-modal__btn-manual', { timeout: 10000 })
      .should('be.visible')
      .click();

    // Now manual form should be visible
    cy.get('input[name="title"]', { timeout: 10000 })
      .should('be.visible')
      .type('Cypress Challenge');

    cy.get('textarea[name="description"]').type(
      'Automate Cypress test creation.'
    );

    cy.get('textarea[name="instructions"]').type(
      'Follow all test steps carefully.'
    );

    cy.get('select[name="category"]').select('programming');
    cy.get('select[name="difficulty_level"]').select('medium');

    cy.get('input[name="points_reward"]').clear().type('30');
    cy.get('input[name="estimated_time_minutes"]').clear().type('45');
    cy.get('input[name="max_attempts"]').clear().type('2');

    cy.get('select[name="requires_peer_review"]').select('false');
    cy.get('select[name="is_active"]').select('true');

    cy.get('input[name="prerequisites"]').type('HTML Basics, JS Arrays');
    cy.get('input[name="tags"]').type('cypress,testing,automation');
    cy.get('input[name="learning_objectives"]').type('automation,confidence');

    // Submit
    cy.window().then((win) => cy.stub(win, 'alert').as('alert')); // capture success alert
    cy.get('#challengeModalSubmission')
      .should('be.visible')
      .click({ force: true });

    // Wait for API to finish
    cy.wait('@createChallenge').its('response.statusCode').should('be.oneOf', [200, 201]);

    // Modal disappears
    cy.get('.modal', { timeout: 10000 }).should('not.exist');
    cy.get('@alert').should('have.been.called');

    // Check challenge page
    cy.visit('/challenges');
    cy.contains('Challenges', { timeout: 10000 }).should('be.visible');

    // Verify new challenge exists
    cy.contains('Cypress Challenge', { timeout: 15000 })
      .scrollIntoView()
      .should('be.visible');
  });
});
