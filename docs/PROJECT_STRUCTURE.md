# SkillWise File Structure Template

## Complete Project Structure

```
skillwise/
├── README.md                          # Project overview and getting started
├── SETUP.md                          # Detailed setup instructions
├── .gitignore                        # Git ignore file
├── docker-compose.yml               # Docker development environment
├── package.json                     # Root package.json for scripts
│
├── frontend/                         # React frontend application
│   ├── public/
│   │   ├── index.html
│   │   ├── favicon.ico
│   │   ├── manifest.json
│   │   └── robots.txt
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Header.jsx        # Navigation header
│   │   │   │   ├── Footer.jsx        # Site footer
│   │   │   │   ├── Navigation.jsx    # Main navigation
│   │   │   │   ├── LoadingSpinner.jsx # Loading component
│   │   │   │   ├── ErrorBoundary.jsx # Error handling
│   │   │   │   ├── Modal.jsx         # Modal component
│   │   │   │   └── ConfirmDialog.jsx # Confirmation dialogs
│   │   │   ├── auth/
│   │   │   │   ├── LoginForm.jsx     # Login form component
│   │   │   │   ├── SignupForm.jsx    # Registration form
│   │   │   │   ├── ProtectedRoute.jsx # Route protection
│   │   │   │   └── PasswordReset.jsx # Password reset form
│   │   │   ├── dashboard/
│   │   │   │   ├── DashboardOverview.jsx # Main dashboard
│   │   │   │   ├── StatsCard.jsx     # Statistics display
│   │   │   │   ├── ProgressChart.jsx # Progress visualization
│   │   │   │   ├── RecentActivity.jsx # Activity timeline
│   │   │   │   └── QuickActions.jsx  # Quick action buttons
│   │   │   ├── goals/
│   │   │   │   ├── GoalCard.jsx      # Individual goal display
│   │   │   │   ├── GoalForm.jsx      # Goal creation/editing
│   │   │   │   ├── GoalList.jsx      # Goals grid/list view
│   │   │   │   ├── GoalDetails.jsx   # Detailed goal view
│   │   │   │   ├── GoalFilters.jsx   # Filtering controls
│   │   │   │   └── GoalProgress.jsx  # Progress tracking
│   │   │   ├── challenges/
│   │   │   │   ├── ChallengeCard.jsx # Individual challenge
│   │   │   │   ├── ChallengeForm.jsx # Challenge creation
│   │   │   │   ├── ChallengeList.jsx # Challenges list
│   │   │   │   ├── ChallengeSubmission.jsx # Work submission
│   │   │   │   ├── AIFeedback.jsx    # AI feedback display
│   │   │   │   ├── ChallengeFilters.jsx # Filter controls
│   │   │   │   └── ChallengeHints.jsx # Hint system
│   │   │   ├── progress/
│   │   │   │   ├── ProgressTracker.jsx # Overall progress
│   │   │   │   ├── ProgressChart.jsx # Charts and graphs
│   │   │   │   ├── MilestoneCard.jsx # Milestone display
│   │   │   │   ├── ActivityTimeline.jsx # Activity history
│   │   │   │   └── AchievementBadge.jsx # Achievement display
│   │   │   ├── leaderboard/
│   │   │   │   ├── LeaderboardTable.jsx # Rankings table
│   │   │   │   ├── UserRanking.jsx   # User rank display
│   │   │   │   ├── LeaderboardFilters.jsx # Filter options
│   │   │   │   └── PointsBreakdown.jsx # Points explanation
│   │   │   ├── peer-review/
│   │   │   │   ├── ReviewCard.jsx    # Review assignment
│   │   │   │   ├── ReviewForm.jsx    # Review submission
│   │   │   │   ├── ReviewList.jsx    # Review history
│   │   │   │   ├── ReviewFeedback.jsx # Received reviews
│   │   │   │   └── ReviewCriteria.jsx # Review guidelines
│   │   │   └── profile/
│   │   │       ├── ProfileView.jsx   # Profile display
│   │   │       ├── ProfileEdit.jsx   # Profile editing
│   │   │       ├── UserStats.jsx     # User statistics
│   │   │       ├── AchievementsList.jsx # Achievements
│   │   │       └── SettingsPanel.jsx # User settings
│   │   ├── pages/
│   │   │   ├── HomePage.jsx          # Landing page
│   │   │   ├── LoginPage.jsx         # Login page
│   │   │   ├── SignupPage.jsx        # Registration page
│   │   │   ├── DashboardPage.jsx     # Dashboard page
│   │   │   ├── GoalsPage.jsx         # Goals management
│   │   │   ├── ChallengesPage.jsx    # Challenges view
│   │   │   ├── ProgressPage.jsx      # Progress tracking
│   │   │   ├── LeaderboardPage.jsx   # Leaderboard view
│   │   │   ├── PeerReviewPage.jsx    # Peer reviews
│   │   │   ├── ProfilePage.jsx       # User profile
│   │   │   ├── NotFoundPage.jsx      # 404 error page
│   │   │   └── ErrorPage.jsx         # Error handling
│   │   ├── hooks/
│   │   │   ├── useAuth.js            # Authentication hook
│   │   │   ├── useApi.js             # API calls hook
│   │   │   ├── useLocalStorage.js    # Local storage hook
│   │   │   ├── useProgress.js        # Progress tracking
│   │   │   ├── useDebounce.js        # Debouncing hook
│   │   │   └── useAsync.js           # Async operations
│   │   ├── services/
│   │   │   ├── api.js                # Main API client
│   │   │   ├── auth.js               # Authentication API
│   │   │   ├── goals.js              # Goals API
│   │   │   ├── challenges.js         # Challenges API
│   │   │   ├── progress.js           # Progress API
│   │   │   ├── ai.js                 # AI services API
│   │   │   ├── reviews.js            # Peer review API
│   │   │   └── leaderboard.js        # Leaderboard API
│   │   ├── utils/
│   │   │   ├── validation.js         # Form validation schemas
│   │   │   ├── formatters.js         # Data formatting utilities
│   │   │   ├── constants.js          # Application constants
│   │   │   ├── helpers.js            # General utilities
│   │   │   ├── dateUtils.js          # Date manipulation
│   │   │   └── errorHandling.js      # Error utilities
│   │   ├── styles/
│   │   │   ├── globals.css           # Global styles
│   │   │   ├── components.css        # Component styles
│   │   │   ├── tailwind.css          # Tailwind imports
│   │   │   └── animations.css        # CSS animations
│   │   ├── contexts/
│   │   │   ├── AuthContext.js        # Authentication context
│   │   │   ├── ThemeContext.js       # Theme context
│   │   │   └── NotificationContext.js # Notifications
│   │   ├── App.jsx                   # Main App component
│   │   ├── App.css                   # App styles
│   │   ├── index.js                  # React entry point
│   │   └── setupTests.js             # Test configuration
│   ├── cypress/                      # E2E tests
│   │   ├── e2e/
│   │   │   ├── auth.cy.js            # Authentication tests
│   │   │   ├── goals.cy.js           # Goals functionality
│   │   │   ├── challenges.cy.js      # Challenge workflows
│   │   │   └── dashboard.cy.js       # Dashboard tests
│   │   ├── fixtures/
│   │   │   ├── users.json            # Test user data
│   │   │   └── goals.json            # Test goal data
│   │   └── support/
│   │       ├── commands.js           # Custom commands
│   │       └── e2e.js                # Support file
│   ├── package.json                  # Frontend dependencies
│   ├── package-lock.json
│   ├── tailwind.config.js            # Tailwind configuration
│   ├── cypress.config.js             # Cypress configuration
│   ├── .eslintrc.js                  # ESLint configuration
│   ├── .prettierrc                   # Prettier configuration
│   ├── .env.example                  # Environment template
│   ├── .gitignore                    # Git ignore
│   ├── Dockerfile                    # Docker configuration
│   └── README.md                     # Frontend documentation
│
├── backend/                          # Node.js backend API
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.js     # Authentication endpoints
│   │   │   ├── userController.js     # User management
│   │   │   ├── goalController.js     # Goals CRUD operations
│   │   │   ├── challengeController.js # Challenges CRUD
│   │   │   ├── progressController.js # Progress tracking
│   │   │   ├── submissionController.js # Work submissions
│   │   │   ├── aiController.js       # AI integration
│   │   │   ├── peerReviewController.js # Peer reviews
│   │   │   └── leaderboardController.js # Leaderboard
│   │   ├── middleware/
│   │   │   ├── auth.js               # JWT authentication
│   │   │   ├── validation.js         # Request validation
│   │   │   ├── errorHandler.js       # Error handling
│   │   │   ├── rateLimiter.js        # Rate limiting
│   │   │   ├── logger.js             # Request logging
│   │   │   ├── cors.js               # CORS configuration
│   │   │   └── security.js           # Security headers
│   │   ├── models/
│   │   │   ├── User.js               # User data model
│   │   │   ├── Goal.js               # Goal data model
│   │   │   ├── Challenge.js          # Challenge model
│   │   │   ├── Progress.js           # Progress model
│   │   │   ├── Submission.js         # Submission model
│   │   │   ├── AIFeedback.js         # AI feedback model
│   │   │   ├── PeerReview.js         # Peer review model
│   │   │   └── Leaderboard.js        # Leaderboard model
│   │   ├── routes/
│   │   │   ├── auth.js               # Authentication routes
│   │   │   ├── users.js              # User routes
│   │   │   ├── goals.js              # Goal routes
│   │   │   ├── challenges.js         # Challenge routes
│   │   │   ├── progress.js           # Progress routes
│   │   │   ├── submissions.js        # Submission routes
│   │   │   ├── ai.js                 # AI routes
│   │   │   ├── reviews.js            # Peer review routes
│   │   │   ├── leaderboard.js        # Leaderboard routes
│   │   │   └── index.js              # Route aggregation
│   │   ├── services/
│   │   │   ├── authService.js        # Authentication logic
│   │   │   ├── goalService.js        # Goal business logic
│   │   │   ├── challengeService.js   # Challenge logic
│   │   │   ├── progressService.js    # Progress calculations
│   │   │   ├── aiService.js          # AI integration
│   │   │   ├── emailService.js       # Email notifications
│   │   │   ├── leaderboardService.js # Leaderboard logic
│   │   │   └── notificationService.js # Notifications
│   │   ├── database/
│   │   │   ├── connection.js         # Database connection
│   │   │   ├── migrations/
│   │   │   │   ├── 001_create_users.sql
│   │   │   │   ├── 002_create_refresh_tokens.sql
│   │   │   │   ├── 003_create_goals.sql
│   │   │   │   ├── 004_create_challenges.sql
│   │   │   │   ├── 005_create_submissions.sql
│   │   │   │   ├── 006_create_ai_feedback.sql
│   │   │   │   ├── 007_create_peer_reviews.sql
│   │   │   │   ├── 008_create_progress_events.sql
│   │   │   │   ├── 009_create_user_statistics.sql
│   │   │   │   ├── 010_create_leaderboard.sql
│   │   │   │   └── 011_create_achievements.sql
│   │   │   └── seeds/
│   │   │       ├── users.js          # Sample user data
│   │   │       ├── goals.js          # Sample goals
│   │   │       ├── challenges.js     # Sample challenges
│   │   │       └── achievements.js   # Achievement definitions
│   │   ├── utils/
│   │   │   ├── jwt.js                # JWT utilities
│   │   │   ├── validators.js         # Data validation
│   │   │   ├── helpers.js            # General utilities
│   │   │   ├── constants.js          # Application constants
│   │   │   ├── errors.js             # Error definitions
│   │   │   ├── logger.js             # Logging configuration
│   │   │   └── encryption.js         # Encryption utilities
│   │   ├── config/
│   │   │   ├── database.js           # Database configuration
│   │   │   ├── auth.js               # Auth configuration
│   │   │   ├── ai.js                 # AI service config
│   │   │   ├── server.js             # Server configuration
│   │   │   └── monitoring.js         # Monitoring setup
│   │   └── app.js                    # Express app setup
│   ├── tests/
│   │   ├── unit/
│   │   │   ├── controllers/
│   │   │   │   ├── authController.test.js
│   │   │   │   ├── goalController.test.js
│   │   │   │   └── challengeController.test.js
│   │   │   ├── services/
│   │   │   │   ├── authService.test.js
│   │   │   │   ├── goalService.test.js
│   │   │   │   └── aiService.test.js
│   │   │   ├── middleware/
│   │   │   │   ├── auth.test.js
│   │   │   │   └── validation.test.js
│   │   │   └── utils/
│   │   │       ├── jwt.test.js
│   │   │       └── validators.test.js
│   │   ├── integration/
│   │   │   ├── auth.test.js          # Auth flow tests
│   │   │   ├── goals.test.js         # Goal API tests
│   │   │   ├── challenges.test.js    # Challenge API tests
│   │   │   ├── ai.test.js            # AI integration tests
│   │   │   └── reviews.test.js       # Peer review tests
│   │   ├── fixtures/
│   │   │   ├── users.json            # Test user data
│   │   │   ├── goals.json            # Test goal data
│   │   │   └── challenges.json       # Test challenge data
│   │   ├── helpers/
│   │   │   ├── testDb.js             # Test database setup
│   │   │   ├── authHelpers.js        # Auth test utilities
│   │   │   └── apiHelpers.js         # API test utilities
│   │   └── setup.js                  # Test environment setup
│   ├── scripts/
│   │   ├── migrate.js                # Database migrations
│   │   ├── seed.js                   # Database seeding
│   │   ├── deploy.js                 # Deployment script
│   │   └── backup.js                 # Database backup
│   ├── package.json                  # Backend dependencies
│   ├── package-lock.json
│   ├── .env.example                  # Environment template
│   ├── .eslintrc.js                  # ESLint configuration
│   ├── .prettierrc                   # Prettier configuration
│   ├── jest.config.js                # Jest configuration
│   ├── .gitignore                    # Git ignore
│   ├── Dockerfile                    # Docker configuration
│   ├── server.js                     # Server entry point
│   └── README.md                     # Backend documentation
│
├── docs/                             # Project documentation
│   ├── wireframes/
│   │   ├── UI_WIREFRAMES.md          # UI wireframes and designs
│   │   ├── user-flows.md             # User flow diagrams
│   │   └── design-system.md          # Design system guide
│   ├── api/
│   │   ├── API_ENDPOINTS.md          # API documentation
│   │   ├── swagger.yaml              # OpenAPI specification
│   │   └── authentication.md        # Auth documentation
│   ├── database/
│   │   ├── DATABASE_SCHEMA.md        # Database schema
│   │   ├── relationships.md          # Entity relationships
│   │   └── migrations.md             # Migration guide
│   ├── deployment/
│   │   ├── production.md             # Production deployment
│   │   ├── staging.md                # Staging environment
│   │   └── monitoring.md             # Monitoring setup
│   ├── testing/
│   │   ├── strategy.md               # Testing strategy
│   │   ├── e2e-guide.md             # E2E testing guide
│   │   └── api-testing.md           # API testing guide
│   ├── SPRINT_PLANNING.md            # Sprint planning guide
│   ├── user-stories.md               # User stories
│   ├── technical-specs.md            # Technical specifications
│   └── troubleshooting.md            # Common issues and solutions
│
├── .github/                          # GitHub workflows
│   ├── workflows/
│   │   ├── ci.yml                    # Continuous integration
│   │   ├── deploy-staging.yml        # Staging deployment
│   │   ├── deploy-production.yml     # Production deployment
│   │   └── security-scan.yml         # Security scanning
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md             # Bug report template
│   │   ├── feature_request.md        # Feature request template
│   │   └── user_story.md             # User story template
│   └── pull_request_template.md      # PR template
│
├── scripts/                          # Project scripts
│   ├── setup.sh                      # Initial setup script
│   ├── start-dev.sh                  # Development startup
│   ├── run-tests.sh                  # Test execution
│   ├── deploy.sh                     # Deployment script
│   └── backup-db.sh                  # Database backup
│
├── .husky/                           # Git hooks
│   ├── pre-commit                    # Pre-commit hook
│   └── pre-push                      # Pre-push hook
│
├── .vscode/                          # VS Code configuration
│   ├── settings.json                 # Workspace settings
│   ├── extensions.json               # Recommended extensions
│   ├── launch.json                   # Debug configuration
│   └── tasks.json                    # VS Code tasks
│
├── .gitignore                        # Git ignore file
├── .dockerignore                     # Docker ignore file
├── .eslintrc.js                      # Root ESLint config
├── .prettierrc                       # Root Prettier config
├── docker-compose.yml                # Development environment
├── docker-compose.prod.yml           # Production environment
├── package.json                      # Root package.json
└── LICENSE                           # Project license
```

## Key File Purposes

### Frontend Structure

- **Components**: Reusable UI components organized by feature
- **Pages**: Top-level page components with routing
- **Hooks**: Custom React hooks for shared logic
- **Services**: API integration and external service calls
- **Utils**: Utility functions and constants
- **Contexts**: React context for global state

### Backend Structure

- **Controllers**: HTTP request/response handling
- **Middleware**: Request processing pipeline
- **Models**: Data models and database interaction
- **Routes**: API endpoint definitions
- **Services**: Business logic and external integrations
- **Database**: Schema, migrations, and seed data
- **Utils**: Utility functions and configurations

### Documentation Structure

- **Wireframes**: UI designs and user flows
- **API**: Endpoint documentation and specifications
- **Database**: Schema and relationship documentation
- **Deployment**: Environment setup and deployment guides
- **Testing**: Testing strategies and guides

### Development Tools

- **GitHub Workflows**: CI/CD pipelines and automation
- **Scripts**: Development and deployment automation
- **VSCode**: Editor configuration and debugging
- **Docker**: Containerization and development environment

## Usage Guidelines

### For Students

1. **Start with documentation** to understand the project structure
2. **Follow the sprint planning** for organized development
3. **Use the wireframes** as UI implementation guides
4. **Reference API documentation** for backend integration
5. **Follow testing requirements** for each sprint

### For Instructors

1. **Customize sprint requirements** based on course needs
2. **Use PR review process** for assessment
3. **Reference troubleshooting guide** for common issues
4. **Adapt deployment strategy** for available infrastructure

This file structure provides a comprehensive foundation for building SkillWise while teaching modern full-stack development practices.
