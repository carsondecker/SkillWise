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
    cy.visit('/signup'); // ✅ Adjust to your actual signup route
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

  // ---------------------------
  // 2️⃣ Log In
  // ---------------------------
// cypress/e2e/smoke_login.cy.js
    it('logs into the app', () => {
      cy.visit('/login');

      cy.get('#email').should('be.visible').clear().type(testUser.email);
      cy.get('#password').should('be.visible').clear().type(testUser.password);

      // click by type or text
      cy.get('button[type="submit"]').click();
      // cy.contains('button', 'Login').click();

      cy.url().should('include', '/dashboard');
      cy.contains('Welcome Back').should('exist'); // adjust to your dashboard text
    });

  // ---------------------------
  // 3️⃣ Create a New Goal
  // ---------------------------
  it('Creates a new goal successfully', () => {
    // 🧭 Step 1: Login
    cy.visit('/login');
    cy.get('#email').should('be.visible').type(testUser.email);
    cy.get('#password').should('be.visible').type(testUser.password);
    cy.get('button[type="submit"]').click();

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

    // Add points reward
    cy.get('#goal-points')
      .should('be.visible')
      .clear()
      .type('50');

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
  // // ---------------------------
  // // 4️⃣ Creates a challenge from a goal
  // // ---------------------------
  // it('Creates a challenge from a goal', () => {
  //   cy.visit('/login');
  //   cy.get('#email').type(testUser.email);
  //   cy.get('#password').type(testUser.password);
  //   cy.get('button[type="submit"]').click();
  //
  //   cy.url({ timeout: 15000 }).should('include', '/dashboard');
  //   cy.visit('/goals');
  //
  //   // Wait for goals to load
  //   cy.get('#goals-grid', { timeout: 15000 }).should('exist');
  //
  //   // Locate the created goal
  //   cy.contains('Learn Cypress E2E Testing', { timeout: 10000 })
  //     .should('be.visible')
  //     .then(($el) => {
  //       const goalCard = $el.closest('.goal-card-container');
  //       cy.wrap(goalCard).as('targetGoal');
  //     });
  //
  //   // Flip the card to see back side
  //   cy.get('@targetGoal').click();
  //   cy.wait(600); // Allow flip animation
  //
  //   // Click ➕ Create Challenge button
  //   cy.get('@targetGoal')
  //     .find('[id^="goal-create-challenge-btn-"]')
  //     .should('exist')
  //     .and('be.visible')
  //     .click({ force: true });
  //
  //   // Wait for Challenge Modal
  //   cy.get('.modal', { timeout: 10000 }).should('be.visible');
  //
  //   // Fill out challenge form
  //   cy.get('input[name="title"]').type('Cypress Challenge');
  //   cy.get('textarea[name="description"]').type('Automate Cypress test creation.');
  //   cy.get('textarea[name="instructions"]').type('Follow all test steps carefully.');
  //   cy.get('select[name="category"]').select('programming');
  //   cy.get('select[name="difficulty_level"]').select('medium');
  //   cy.get('input[name="points_reward"]').clear().type('30');
  //   cy.get('input[name="estimated_time_minutes"]').clear().type('45');
  //   cy.get('input[name="max_attempts"]').clear().type('2');
  //
  //   // Submit challenge creation
  //   cy.get('button[type="submit"]').contains('Create Challenge').click();
  //
  //   // ✅ Verify success
  //   cy.contains('Challenge created successfully', { timeout: 10000 }).should('exist');
  //
  //   // Close modal (if not auto-closing)
  //   cy.get('.modal').should('not.exist');
  //
  //   // Re-visit or refresh to confirm challenge created successfully
  //   cy.visit('/challenges');
  //   cy.contains('Cypress Challenge', { timeout: 15000 }).should('be.visible');
  // });
});
