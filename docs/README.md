# SkillWise - Personal Learning Challenge Platform

## Project Overview

SkillWise is a web application that transforms personal learning goals into actionable challenges with AI-powered feedback and peer collaboration.

## Problem Statement

Young adults learning new skills (coding, design, languages, public speaking) often lack mentors and structured paths. They waste time figuring out what to practice, how to practice, and whether they're improving.

## Solution

A platform where students can:

- Create specific learning goals with timelines
- Generate or write challenges aligned to goals
- Submit work and receive AI feedback
- Track progress and compete on leaderboards
- Participate in peer reviews

## Tech Stack

- **Frontend**: React 18, React Router, Tailwind CSS/MUI, React Hook Form + Zod
- **Backend**: Node.js + Express, JWT auth, PostgreSQL
- **AI Integration**: OpenAI API for challenge generation and feedback
- **Testing**: Jest, Cypress, axe-core
- **DevOps**: Docker, GitHub Actions, Vercel/Render deployment

## Development Approach

- 4 Sprint development cycle
- Each student builds full vertical slice
- PR reviews and voting for best implementations
- Solo development with team collaboration

## Project Structure

See the file structure below for organization guidelines.

## Sprint Milestones

- **Sprint 1**: Auth + Dashboard shell, Docker setup, auth tests
- **Sprint 2**: Goals/Challenges/Progress CRUD, Cypress tests, CI pipeline
- **Sprint 3**: AI integration, snapshot tests, error monitoring
- **Sprint 4**: Leaderboard, peer review, accessibility, deployment

## Getting Started

1. Follow the setup instructions in each service directory
2. Use Docker Compose for local development
3. Refer to wireframes in `/docs/wireframes/` for UI guidance
4. Check API documentation in `/docs/api/`

## Architecture Diagram

```
Frontend (React) ←→ Backend API (Express) ←→ Database (PostgreSQL)
                           ↓
                    AI Service (OpenAI)
```
