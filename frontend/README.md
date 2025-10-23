# Frontend Structure Guidelines

## Technology Stack

- **React 18** with JavaScript (not TypeScript for simplicity)
- **React Router** for navigation
- **Tailwind CSS** for styling (or MUI as alternative)
- **React Hook Form + Zod** for form validation
- **Axios** for HTTP requests
- **Recharts** for data visualization

## Folder Structure

```
frontend/
├── public/
│   ├── index.html
│   ├── favicon.ico
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Navigation.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   └── ErrorBoundary.jsx
│   │   ├── auth/
│   │   │   ├── LoginForm.jsx
│   │   │   ├── SignupForm.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── dashboard/
│   │   │   ├── DashboardOverview.jsx
│   │   │   ├── ProgressChart.jsx
│   │   │   └── RecentActivity.jsx
│   │   ├── goals/
│   │   │   ├── GoalCard.jsx
│   │   │   ├── GoalForm.jsx
│   │   │   ├── GoalList.jsx
│   │   │   └── GoalDetails.jsx
│   │   ├── challenges/
│   │   │   ├── ChallengeCard.jsx
│   │   │   ├── ChallengeForm.jsx
│   │   │   ├── ChallengeList.jsx
│   │   │   ├── ChallengeSubmission.jsx
│   │   │   └── AIFeedback.jsx
│   │   ├── progress/
│   │   │   ├── ProgressTracker.jsx
│   │   │   ├── ProgressChart.jsx
│   │   │   └── MilestoneCard.jsx
│   │   ├── leaderboard/
│   │   │   ├── LeaderboardTable.jsx
│   │   │   ├── UserRanking.jsx
│   │   │   └── LeaderboardFilters.jsx
│   │   └── peer-review/
│   │       ├── ReviewCard.jsx
│   │       ├── ReviewForm.jsx
│   │       └── ReviewList.jsx
│   ├── pages/
│   │   ├── HomePage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── SignupPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── GoalsPage.jsx
│   │   ├── ChallengesPage.jsx
│   │   ├── ProgressPage.jsx
│   │   ├── LeaderboardPage.jsx
│   │   ├── PeerReviewPage.jsx
│   │   └── ProfilePage.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useApi.js
│   │   ├── useLocalStorage.js
│   │   └── useProgress.js
│   ├── services/
│   │   ├── api.js
│   │   ├── auth.js
│   │   ├── goals.js
│   │   ├── challenges.js
│   │   └── ai.js
│   ├── utils/
│   │   ├── validation.js
│   │   ├── formatters.js
│   │   ├── constants.js
│   │   └── helpers.js
│   ├── styles/
│   │   ├── globals.css
│   │   ├── components.css
│   │   └── tailwind.css
│   ├── App.jsx
│   ├── App.css
│   └── index.js
├── package.json
├── package-lock.json
├── tailwind.config.js
├── .gitignore
└── README.md
```

## Key Components to Implement

### Authentication Components

- **LoginForm**: Email/password login with validation
- **SignupForm**: User registration with form validation
- **ProtectedRoute**: Route guard for authenticated users

### Dashboard Components

- **DashboardOverview**: Summary cards and quick actions
- **ProgressChart**: Visual progress tracking
- **RecentActivity**: Timeline of recent submissions

### Goal Management

- **GoalCard**: Display individual goal information
- **GoalForm**: Create/edit learning goals
- **GoalList**: Grid/list view of all goals

### Challenge System

- **ChallengeCard**: Individual challenge display
- **ChallengeForm**: Create custom challenges
- **ChallengeSubmission**: Submit work for review
- **AIFeedback**: Display AI-generated feedback

### Progress Tracking

- **ProgressTracker**: Overall progress visualization
- **MilestoneCard**: Individual milestone display

### Social Features

- **LeaderboardTable**: Ranking display
- **ReviewCard**: Peer review interface
- **ReviewForm**: Submit peer reviews

## Styling Guidelines

- Use Tailwind CSS utility classes
- Maintain consistent color scheme
- Responsive design for mobile/desktop
- Accessibility considerations (ARIA labels, keyboard navigation)

## State Management

- Use React hooks for local state
- Consider React Query for server state
- Auth context for user authentication state

## Form Validation

- React Hook Form for form handling
- Zod schemas for validation rules
- Consistent error messaging

## API Integration

- Axios for HTTP requests
- Environment variables for API endpoints
- Error handling and loading states
- Request/response interceptors for auth tokens
