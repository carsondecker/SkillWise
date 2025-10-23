# SkillWise Setup Instructions

## Prerequisites

Before starting development, ensure you have the following installed:

### Required Software

- **Node.js** (v18 or later) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Docker** - [Download here](https://www.docker.com/products/docker-desktop/)
- **Docker Compose** (included with Docker Desktop)
- **Git** - [Download here](https://git-scm.com/)
- **PostgreSQL** (optional - can use Docker instead)

### Development Tools (Recommended)

- **VS Code** with extensions:
  - ES7+ React/Redux/React-Native snippets
  - Prettier - Code formatter
  - ESLint
  - Thunder Client (for API testing)
  - Docker extension
- **Postman** or **Insomnia** (for API testing)

## Project Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd skillwise
```

### 2. Environment Configuration

#### Frontend Environment

Create `frontend/.env` file:

```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_ENVIRONMENT=development
```

#### Backend Environment

Create `backend/.env` file:

```env
# Server Configuration
NODE_ENV=development
PORT=3001
API_PREFIX=/api

# Database Configuration
DATABASE_URL=postgresql://skillwise_user:skillwise_pass@localhost:5432/skillwise_db
DB_HOST=localhost
DB_PORT=5432
DB_NAME=skillwise_db
DB_USER=skillwise_user
DB_PASSWORD=skillwise_pass

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# AI Configuration
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_TOKENS=1000

# Email Configuration (for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Security
BCRYPT_ROUNDS=12
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring
SENTRY_DSN=your-sentry-dsn-url
```

### 3. Docker Setup (Recommended)

#### Create `docker-compose.yml` in root directory:

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  database:
    image: postgres:15
    environment:
      POSTGRES_DB: skillwise_db
      POSTGRES_USER: skillwise_user
      POSTGRES_PASSWORD: skillwise_pass
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/database/migrations:/docker-entrypoint-initdb.d
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U skillwise_user -d skillwise_db']
      interval: 10s
      timeout: 5s
      retries: 5

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - '3001:3001'
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://skillwise_user:skillwise_pass@database:5432/skillwise_db
    volumes:
      - ./backend:/app
      - /app/node_modules
    depends_on:
      database:
        condition: service_healthy
    command: npm run dev

  # Frontend React App
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - '3000:3000'
    environment:
      - REACT_APP_API_URL=http://localhost:3001/api
    volumes:
      - ./frontend:/app
      - /app/node_modules
    depends_on:
      - backend
    command: npm start

  # Redis (for caching and sessions)
  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

#### Start Development Environment

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### 4. Manual Setup (Alternative)

If you prefer not to use Docker:

#### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Set up database (make sure PostgreSQL is running)
createdb skillwise_db
psql skillwise_db < database/migrations/001_create_users.sql
# (run all migration files in order)

# Start development server
npm run dev
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

## Package.json Scripts

### Backend Scripts

Create `backend/package.json`:

```json
{
  "name": "skillwise-backend",
  "version": "1.0.0",
  "description": "SkillWise API Backend",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint . --ext .js",
    "lint:fix": "eslint . --ext .js --fix",
    "migrate": "node scripts/migrate.js",
    "seed": "node scripts/seed.js",
    "build": "echo 'No build step required for Node.js'"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "express-rate-limit": "^6.7.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.0",
    "pg": "^8.11.0",
    "zod": "^3.21.4",
    "axios": "^1.4.0",
    "pino": "^8.14.1",
    "pino-pretty": "^10.0.0",
    "dotenv": "^16.1.4",
    "@sentry/node": "^7.55.2"
  },
  "devDependencies": {
    "nodemon": "^2.0.22",
    "jest": "^29.5.0",
    "supertest": "^6.3.3",
    "eslint": "^8.42.0",
    "@types/jest": "^29.5.2"
  }
}
```

### Frontend Scripts

Create `frontend/package.json`:

```json
{
  "name": "skillwise-frontend",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.12.1",
    "react-hook-form": "^7.44.3",
    "zod": "^3.21.4",
    "@hookform/resolvers": "^3.1.1",
    "axios": "^1.4.0",
    "tailwindcss": "^3.3.2",
    "recharts": "^2.6.2",
    "@headlessui/react": "^1.7.15",
    "@heroicons/react": "^2.0.18"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "test:coverage": "react-scripts test --coverage --silent",
    "eject": "react-scripts eject",
    "lint": "eslint src --ext .js,.jsx",
    "lint:fix": "eslint src --ext .js,.jsx --fix",
    "cypress:open": "cypress open",
    "cypress:run": "cypress run"
  },
  "devDependencies": {
    "react-scripts": "5.0.1",
    "cypress": "^12.14.0",
    "@testing-library/react": "^13.4.0",
    "@testing-library/jest-dom": "^5.16.5",
    "@testing-library/user-event": "^14.4.3",
    "eslint": "^8.42.0",
    "prettier": "^2.8.8",
    "@axe-core/react": "^4.7.2"
  },
  "browserslist": {
    "production": [">0.2%", "not dead", "not op_mini all"],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
```

## Development Workflow

### 1. Daily Development

```bash
# Start development environment
docker-compose up -d

# Make changes to code
# Backend: http://localhost:3001
# Frontend: http://localhost:3000
# Database: localhost:5432

# Run tests
cd backend && npm test
cd frontend && npm test

# Stop environment
docker-compose down
```

### 2. Testing Setup

#### Backend Testing (Jest + Supertest)

Create `backend/tests/setup.js`:

```javascript
const { Pool } = require('pg');

// Test database setup
const testDb = new Pool({
  connectionString:
    process.env.TEST_DATABASE_URL ||
    'postgresql://skillwise_user:skillwise_pass@localhost:5432/skillwise_test_db',
});

beforeAll(async () => {
  // Set up test database
  await testDb.query('BEGIN');
});

afterAll(async () => {
  // Clean up test database
  await testDb.query('ROLLBACK');
  await testDb.end();
});
```

#### Frontend Testing (React Testing Library)

Create `frontend/src/setupTests.js`:

```javascript
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

// Configure testing library
configure({ testIdAttribute: 'data-testid' });

// Mock API calls
global.fetch = jest.fn();
```

#### E2E Testing (Cypress)

Create `frontend/cypress.config.js`:

```javascript
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 1280,
    viewportHeight: 720,
  },
});
```

### 3. Code Quality Tools

#### ESLint Configuration

Create `.eslintrc.js` in both frontend and backend:

```javascript
module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended', // Frontend only
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-unused-vars': 'warn',
    'no-console': 'warn',
    indent: ['error', 2],
    quotes: ['error', 'single'],
    semi: ['error', 'always'],
  },
};
```

#### Prettier Configuration

Create `.prettierrc`:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

### 4. Git Workflow

#### Git Hooks (Husky)

```bash
# Install husky for git hooks
npm install --save-dev husky lint-staged

# Add pre-commit hook
npx husky add .husky/pre-commit "lint-staged"
```

Create `.lintstagedrc`:

```json
{
  "*.{js,jsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md}": ["prettier --write"]
}
```

## Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Find process using port
lsof -ti:3000
lsof -ti:3001

# Kill process
kill -9 <PID>
```

#### Database Connection Issues

```bash
# Check if PostgreSQL is running
brew services list | grep postgresql
# or
sudo systemctl status postgresql

# Reset database
docker-compose down -v
docker-compose up -d database
```

#### Node Modules Issues

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Docker Issues

```bash
# Clean up Docker
docker-compose down -v
docker system prune -a

# Rebuild containers
docker-compose build --no-cache
docker-compose up -d
```

### Development Tips

1. **Hot Reloading**: Both frontend and backend support hot reloading
2. **Database Changes**: Use migration scripts for database changes
3. **API Testing**: Use Thunder Client in VS Code or Postman
4. **Debugging**: Use browser DevTools and VS Code debugger
5. **Performance**: Monitor network requests and bundle size

### Production Deployment Preparation

#### Environment Variables for Production

- Change all secret keys
- Use production database URLs
- Enable HTTPS
- Configure CORS for production domain
- Set up proper logging and monitoring

#### Build Commands

```bash
# Frontend production build
cd frontend && npm run build

# Backend production setup
cd backend && npm install --production
```

This setup guide provides everything students need to get started with SkillWise development!
