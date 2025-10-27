# SkillWise Wireframes

## Overview

These wireframes provide a visual guide for the user interface of SkillWise. Each wireframe includes layout, component placement, and user interaction flows.

## Design Principles

- **Mobile-First**: Responsive design starting with mobile layout
- **Accessibility**: Clear contrast, keyboard navigation, screen reader support
- **User-Centered**: Intuitive navigation and clear call-to-actions
- **Consistent**: Unified design language across all pages

## Color Scheme Suggestions

- **Primary**: Blue (#3B82F6) - trust, learning, progress
- **Secondary**: Green (#10B981) - success, achievement, growth
- **Accent**: Purple (#8B5CF6) - creativity, innovation
- **Neutral**: Gray (#6B7280) - text, borders, backgrounds
- **Warning**: Yellow (#F59E0B) - attention, pending actions
- **Error**: Red (#EF4444) - errors, validation issues

## Typography

- **Headers**: Bold, sans-serif (e.g., Inter, Roboto)
- **Body**: Regular, readable (16px base size)
- **Code**: Monospace font for code submissions

## Wireframe Index

1. [Landing Page](#1-landing-page)
2. [Authentication Pages](#2-authentication-pages)
3. [Dashboard](#3-dashboard)
4. [Goals Management](#4-goals-management)
5. [Challenges](#5-challenges)
6. [Progress Tracking](#6-progress-tracking)
7. [Leaderboard](#7-leaderboard)
8. [Peer Review](#8-peer-review)
9. [Profile](#9-profile)

---

## 1. Landing Page

```
┌─────────────────────────────────────────────────────────────┐
│                     SkillWise Header                        │
├─────────────────────────────────────────────────────────────┤
│ [Logo] SkillWise          [Home] [About] [Login] [Sign Up] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│           Transform Your Learning into Action                │
│                                                             │
│        Turn personal goals into actionable challenges       │
│         Get AI feedback and track your progress            │
│                                                             │
│              [Get Started] [Learn More]                     │
│                                                             │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│
│  │   Set Goals     │ │  Take Challenges│ │  Track Progress ││
│  │                 │ │                 │ │                 ││
│  │ [Goal Icon]     │ │ [Challenge Icon]│ │ [Progress Icon] ││
│  │ Define what you │ │ Practice with   │ │ See your growth ││
│  │ want to learn   │ │ AI-generated    │ │ and achievements││
│  │                 │ │ challenges      │ │                 ││
│  └─────────────────┘ └─────────────────┘ └─────────────────┘│
│                                                             │
│              "Start your learning journey today"            │
│                        [Sign Up Now]                       │
└─────────────────────────────────────────────────────────────┘
```

### Key Elements:

- Clear value proposition
- Three-step process visualization
- Call-to-action buttons
- Social proof (testimonials)
- Feature highlights

---

## 2. Authentication Pages

### Login Page

```
┌─────────────────────────────────────────────────────────────┐
│                     SkillWise Header                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    Welcome Back!                            │
│                                                             │
│               ┌─────────────────────────┐                   │
│               │     Login Form          │                   │
│               │                         │                   │
│               │ Email: [_____________]  │                   │
│               │                         │                   │
│               │ Password: [___________] │                   │
│               │           [👁]           │                   │
│               │                         │                   │
│               │ □ Remember me           │                   │
│               │                         │                   │
│               │       [Login]           │                   │
│               │                         │                   │
│               │   Forgot password?      │                   │
│               │                         │                   │
│               │ Don't have an account?  │                   │
│               │     [Sign Up]           │                   │
│               └─────────────────────────┘                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Sign Up Page

```
┌─────────────────────────────────────────────────────────────┐
│                     SkillWise Header                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                  Create Your Account                        │
│                                                             │
│               ┌─────────────────────────┐                   │
│               │     Sign Up Form        │                   │
│               │                         │                   │
│               │ Full Name: [__________] │                   │
│               │                         │                   │
│               │ Email: [_____________]  │                   │
│               │                         │                   │
│               │ Password: [___________] │                   │
│               │           [👁]           │                   │
│               │                         │                   │
│               │ Confirm: [____________] │                   │
│               │          [👁]           │                   │
│               │                         │                   │
│               │ □ I agree to Terms      │                   │
│               │                         │                   │
│               │      [Sign Up]          │                   │
│               │                         │                   │
│               │ Already have account?   │                   │
│               │       [Login]           │                   │
│               └─────────────────────────┘                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Key Elements:

- Form validation with real-time feedback
- Password strength indicator
- Social login options (optional)
- Clear error messages
- Accessibility features

---

## 3. Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│ [☰] SkillWise      [🔍] Search...         [👤] Profile [🔔] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Welcome back, [User Name]! 👋                             │
│                                                             │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│
│  │ Active Goals    │ │ Challenges      │ │ Weekly Progress ││
│  │      5          │ │ Completed       │ │      75%        ││
│  │                 │ │      12/20      │ │                 ││
│  │   [View All]    │ │   [View All]    │ │  [View Details] ││
│  └─────────────────┘ └─────────────────┘ └─────────────────┘│
│                                                             │
│  Recent Activity                          Quick Actions     │
│  ┌─────────────────────────────────────┐ ┌─────────────────┐│
│  │ • Completed "Variables in JS"       │ │ [+ New Goal]    ││
│  │   2 hours ago                       │ │                 ││
│  │                                     │ │ [+ Challenge]   ││
│  │ • AI Feedback received              │ │                 ││
│  │   5 hours ago                       │ │ [View Progress] ││
│  │                                     │ │                 ││
│  │ • New challenge unlocked            │ │ [Browse Feed]   ││
│  │   1 day ago                         │ │                 ││
│  │                                     │ │                 ││
│  │         [View All Activity]         │ └─────────────────┘│
│  └─────────────────────────────────────┘                   │
│                                                             │
│  Current Goals                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────┐ ││
│  │ │ Learn JavaScript│ │ Master CSS Grid │ │ Public      │ ││
│  │ │                 │ │                 │ │ Speaking    │ ││
│  │ │ Progress: 65%   │ │ Progress: 30%   │ │ Progress: 15│ ││
│  │ │ ████████░░      │ │ ███░░░░░░░      │ │ ██░░░░░░░░  │ ││
│  │ │                 │ │                 │ │             │ ││
│  │ │ 5 days left     │ │ 12 days left    │ │ 25 days left│ ││
│  │ │ [Continue]      │ │ [Continue]      │ │ [Continue]  │ ││
│  │ └─────────────────┘ └─────────────────┘ └─────────────┘ ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Key Elements:

- Summary statistics cards
- Recent activity feed
- Current goals with progress bars
- Quick action buttons
- Navigation breadcrumbs

---

## 4. Goals Management

### Goals List Page

```
┌─────────────────────────────────────────────────────────────┐
│ [☰] SkillWise > Goals                     [👤] Profile [🔔] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  My Learning Goals                           [+ New Goal]   │
│                                                             │
│  [All] [Active] [Completed] [Paused]        [🔍] Search...  │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────┐ ││
│  │ │ Learn JavaScript│ │ Master CSS Grid │ │ Public      │ ││
│  │ │ 🎯 ACTIVE       │ │ 🎯 ACTIVE       │ │ Speaking    │ ││
│  │ │                 │ │                 │ │ 🎯 ACTIVE   │ ││
│  │ │ Target: 3 weeks │ │ Target: 2 weeks │ │ Target: 1 mo│ ││
│  │ │ Progress: 65%   │ │ Progress: 30%   │ │ Progress: 15│ ││
│  │ │ ████████░░      │ │ ███░░░░░░░      │ │ ██░░░░░░░░  │ ││
│  │ │                 │ │                 │ │             │ ││
│  │ │ 12 challenges   │ │ 8 challenges    │ │ 15 challeng │ ││
│  │ │ 8 completed     │ │ 3 completed     │ │ 2 completed │ ││
│  │ │                 │ │                 │ │             │ ││
│  │ │ [View] [Edit]   │ │ [View] [Edit]   │ │ [View] [Edit│ ││
│  │ └─────────────────┘ └─────────────────┘ └─────────────┘ ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ┌─────────────────┐ ┌─────────────────┐                ││
│  │ │ Python Basics   │ │ Git & GitHub    │                ││
│  │ │ ✅ COMPLETED    │ │ ⏸️ PAUSED       │                ││
│  │ │                 │ │                 │                ││
│  │ │ Completed in    │ │ Paused 3 days   │                ││
│  │ │ 2 weeks         │ │ ago             │                ││
│  │ │ Progress: 100%  │ │ Progress: 45%   │                ││
│  │ │ ██████████      │ │ ████░░░░░░      │                ││
│  │ │                 │ │                 │                ││
│  │ │ [View Details]  │ │ [Resume] [Edit] │                ││
│  │ └─────────────────┘ └─────────────────┘                ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### New Goal Form

```
┌─────────────────────────────────────────────────────────────┐
│ [☰] SkillWise > Goals > New                [👤] Profile     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Create New Learning Goal                                   │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    Goal Details                         ││
│  │                                                         ││
│  │  Goal Title *                                           ││
│  │  [____________________________________]                ││
│  │                                                         ││
│  │  Description                                            ││
│  │  [____________________________________]                ││
│  │  [____________________________________]                ││
│  │  [____________________________________]                ││
│  │                                                         ││
│  │  Category                                               ││
│  │  [Programming ▼]                                        ││
│  │                                                         ││
│  │  Target Completion Date *                               ││
│  │  [📅 Select Date]                                       ││
│  │                                                         ││
│  │  Difficulty Level                                       ││
│  │  ○ Beginner  ●  Intermediate  ○ Advanced               ││
│  │                                                         ││
│  │  Learning Style Preferences                             ││
│  │  ☑ Hands-on Projects                                   ││
│  │  ☑ Theory and Concepts                                 ││
│  │  ☐ Video Tutorials                                     ││
│  │  ☐ Reading Materials                                   ││
│  │                                                         ││
│  │  Auto-generate initial challenges?                     ││
│  │  ○ Yes, use AI to create challenges                    ││
│  │  ● No, I'll create my own                              ││
│  │                                                         ││
│  │          [Cancel]        [Create Goal]                 ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Key Elements:

- Goal status indicators
- Progress visualization
- Filtering and search options
- Goal creation wizard
- Category organization

---

## 5. Challenges

### Challenges List

```
┌─────────────────────────────────────────────────────────────┐
│ [☰] SkillWise > Learn JavaScript > Challenges [👤] Profile  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  JavaScript Basics Challenges              [+ New Challenge]│
│                                                             │
│  Goal Progress: 65% ████████░░              5 days left    │
│                                                             │
│  [All] [Todo] [In Progress] [Completed]    [🔍] Search...   │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Challenge 1: Variables and Data Types                   ││
│  │ ✅ COMPLETED        Difficulty: ⭐⭐☆                   ││
│  │                                                         ││
│  │ Learn about JavaScript variables, strings, numbers...   ││
│  │                                                         ││
│  │ Completed: 2 days ago     Score: 85/100               ││
│  │ AI Feedback: "Great work! Consider edge cases..."      ││
│  │                                                         ││
│  │ [View Submission] [Retry] [Peer Reviews]               ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Challenge 2: Functions and Scope                        ││
│  │ 🔄 IN PROGRESS      Difficulty: ⭐⭐⭐                   ││
│  │                                                         ││
│  │ Create functions with different scopes and understand.. ││
│  │                                                         ││
│  │ Started: 1 day ago        Due: 2 days                  ││
│  │ Progress: 60%  ██████░░░░                              ││
│  │                                                         ││
│  │ [Continue] [Submit Work] [Get Hint]                    ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Challenge 3: DOM Manipulation                           ││
│  │ ⏳ TODO             Difficulty: ⭐⭐⭐                   ││
│  │                                                         ││
│  │ Learn to interact with HTML elements using JavaScript. ││
│  │                                                         ││
│  │ Prerequisites: Complete Functions challenge             ││
│  │ Estimated time: 3-4 hours                              ││
│  │                                                         ││
│  │ [🔒 Locked] [Preview]                                  ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 🤖 AI-Generated Challenge Suggestions                   ││
│  │                                                         ││
│  │ • Arrays and Loops Practice                            ││
│  │ • Async/Await Concepts                                 ││
│  │ • Error Handling Patterns                              ││
│  │                                                         ││
│  │ [Generate More] [Add Selected]                         ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Challenge Detail/Work Page

```
┌─────────────────────────────────────────────────────────────┐
│ [☰] Challenge: Functions and Scope             [👤] Profile │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ⏰ 2 days left    Difficulty: ⭐⭐⭐     Progress: 60%     │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    Challenge Description                ││
│  │                                                         ││
│  │  Create functions with different scopes and understand  ││
│  │  how variable visibility works in JavaScript.           ││
│  │                                                         ││
│  │  Requirements:                                          ││
│  │  • Create a global variable                             ││
│  │  • Create a function with local variables              ││
│  │  • Demonstrate scope chain                             ││
│  │  • Include comments explaining behavior                ││
│  │                                                         ││
│  │  Resources:                                             ││
│  │  • [MDN: Function Scope](link)                         ││
│  │  • [Scope Chain Tutorial](link)                        ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    Your Submission                      ││
│  │                                                         ││
│  │  Submission Type: ○ Code ● Text ○ Link ○ File          ││
│  │                                                         ││
│  │  [______________________________________]              ││
│  │  |// Global variable                     |              ││
│  │  |let globalVar = 'I am global';         |              ││
│  │  |                                       |              ││
│  │  |function outerFunction() {             |              ││
│  │  |  let outerVar = 'I am outer';         |              ││
│  │  |                                       |              ││
│  │  |  function innerFunction() {           |              ││
│  │  |    let innerVar = 'I am inner';       |              ││
│  │  |    console.log(globalVar);            |              ││
│  │  |    console.log(outerVar);             |              ││
│  │  |    console.log(innerVar);             |              ││
│  │  |  }                                    |              ││
│  │  |                                       |              ││
│  │  |  return innerFunction;                |              ││
│  │  |}                                      |              ││
│  │  [______________________________________]              ││
│  │                                                         ││
│  │  Comments/Explanation:                                  ││
│  │  [______________________________________]              ││
│  │  |This demonstrates the scope chain...   |              ││
│  │  [______________________________________]              ││
│  │                                                         ││
│  │  [💾 Save Draft] [🤖 Get AI Hint] [📤 Submit]          ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    AI Feedback History                  ││
│  │                                                         ││
│  │  Previous submission (2 hours ago):                    ││
│  │  ✅ Good: Clear variable naming                         ││
│  │  ⚠️  Consider: Add more detailed comments               ││
│  │  💡 Suggestion: Try implementing closure example       ││
│  │                                                         ││
│  │  [View Full Feedback] [Ask Follow-up Question]         ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Key Elements:

- Challenge status and progress tracking
- Multiple submission types (code, text, links, files)
- AI feedback integration
- Resource links and hints
- Prerequisites and difficulty indicators

---

## 6. Progress Tracking

```
┌─────────────────────────────────────────────────────────────┐
│ [☰] SkillWise > Progress                     [👤] Profile   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Your Learning Progress                                     │
│                                                             │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│
│  │ Total Challenges│ │ Avg Score       │ │ Streak          ││
│  │       47        │ │      87%        │ │    12 days      ││
│  │ 32 completed    │ │                 │ │                 ││
│  └─────────────────┘ └─────────────────┘ └─────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    Progress Overview                    ││
│  │                                                         ││
│  │  📊 Weekly Activity                                     ││
│  │     ┌─┐     ┌─┐                 ┌─┐                     ││
│  │  5  │ │  4  │ │              3  │ │                     ││
│  │     │ │     │ │     ┌─┐        │ │     ┌─┐             ││
│  │     │ │     │ │  2  │ │        │ │  1  │ │             ││
│  │     │ │     │ │     │ │        │ │     │ │             ││
│  │     └─┘     └─┘     └─┘        └─┘     └─┘             ││
│  │    Mon     Tue     Wed        Thu     Fri             ││
│  │                                                         ││
│  │  🎯 Goal Completion Rates                               ││
│  │  JavaScript: ████████░░ 80%                            ││
│  │  CSS Grid:   ███░░░░░░░ 30%                            ││
│  │  Speaking:   ██░░░░░░░░ 20%                            ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    Recent Achievements                  ││
│  │                                                         ││
│  │  🏆 JavaScript Fundamentals Master (2 days ago)        ││
│  │     Completed all basic JavaScript challenges          ││
│  │                                                         ││
│  │  🔥 Week Warrior (5 days ago)                          ││
│  │     Submitted challenges 7 days in a row               ││
│  │                                                         ││
│  │  💡 Problem Solver (1 week ago)                        ││
│  │     Solved 10 challenges with 90%+ score               ││
│  │                                                         ││
│  │  [View All Achievements]                               ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    Challenge History                    ││
│  │                                                         ││
│  │  📅 This Week                                           ││
│  │  ✅ DOM Manipulation - Score: 92% (Today)              ││
│  │  ✅ Event Handling - Score: 88% (Yesterday)            ││
│  │  ✅ Arrays Methods - Score: 95% (2 days ago)           ││
│  │                                                         ││
│  │  📅 Last Week                                           ││
│  │  ✅ Functions Advanced - Score: 78% (5 days ago)       ││
│  │  ✅ Object Oriented - Score: 85% (6 days ago)          ││
│  │                                                         ││
│  │  [View Full History] [Export Progress]                 ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Key Elements:

- Visual progress charts and graphs
- Achievement badges and milestones
- Activity streaks and statistics
- Historical challenge completion
- Goal completion rates

---

## 7. Leaderboard

```
┌─────────────────────────────────────────────────────────────┐
│ [☰] SkillWise > Leaderboard                  [👤] Profile   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🏆 Leaderboard                                             │
│                                                             │
│  [Global] [Friends] [JavaScript] [This Week]               │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Your Rank: #15      Points: 2,450      Percentile: 78th ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Rank │ User                │ Points │ Challenges │ Avg   ││
│  │      │                     │        │ Completed  │ Score ││
│  ├──────┼─────────────────────┼────────┼────────────┼───────┤│
│  │ 🥇 1  │ 👤 Sarah Chen      │ 4,250  │     85     │  94%  ││
│  │      │ "JavaScript Master" │        │            │       ││
│  ├──────┼─────────────────────┼────────┼────────────┼───────┤│
│  │ 🥈 2  │ 👤 Alex Rodriguez  │ 3,890  │     78     │  91%  ││
│  │      │ "Code Ninja"        │        │            │       ││
│  ├──────┼─────────────────────┼────────┼────────────┼───────┤│
│  │ 🥉 3  │ 👤 Jamie Park      │ 3,650  │     72     │  89%  ││
│  │      │ "Problem Solver"    │        │            │       ││
│  ├──────┼─────────────────────┼────────┼────────────┼───────┤│
│  │  4   │ 👤 Morgan Kim      │ 3,420  │     69     │  88%  ││
│  ├──────┼─────────────────────┼────────┼────────────┼───────┤│
│  │  5   │ 👤 Taylor Swift    │ 3,200  │     65     │  87%  ││
│  ├──────┼─────────────────────┼────────┼────────────┼───────┤│
│  │ ...  │ ...                 │ ...    │    ...     │ ...   ││
│  ├──────┼─────────────────────┼────────┼────────────┼───────┤│
│  │ 14   │ 👤 Jordan Lee      │ 2,500  │     48     │  82%  ││
│  ├──────┼─────────────────────┼────────┼────────────┼───────┤│
│  │ ➤ 15 │ 👤 You (John)      │ 2,450  │     47     │  81%  ││
│  ├──────┼─────────────────────┼────────┼────────────┼───────┤│
│  │ 16   │ 👤 Casey Johnson   │ 2,400  │     46     │  80%  ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    Point System                         ││
│  │                                                         ││
│  │  🎯 Challenge Completion:                               ││
│  │     • Basic (⭐): 10 points                             ││
│  │     • Intermediate (⭐⭐): 25 points                    ││
│  │     • Advanced (⭐⭐⭐): 50 points                      ││
│  │                                                         ││
│  │  📝 Peer Reviews:                                       ││
│  │     • Give helpful review: 5 points                    ││
│  │     • Receive 5-star review: 3 points                  ││
│  │                                                         ││
│  │  🔥 Streaks:                                            ││
│  │     • 7-day streak: 50 bonus points                    ││
│  │     • 30-day streak: 200 bonus points                  ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Key Elements:

- Ranking system with user positioning
- Point system explanation
- Filtering options (global, friends, categories)
- User profiles and achievements
- Competitive motivation elements

---

## 8. Peer Review

### Peer Review List

```
┌─────────────────────────────────────────────────────────────┐
│ [☰] SkillWise > Peer Reviews                 [👤] Profile   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🤝 Peer Reviews                                            │
│                                                             │
│  [To Review] [My Reviews] [Received]                        │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                   Pending Reviews (3)                   ││
│  │                                                         ││
│  │  ┌─────────────────────────────────────────────────────┐ ││
│  │  │ 📝 JavaScript Functions - Anonymous User            │ ││
│  │  │    Challenge: Functions and Scope                   │ ││
│  │  │    Submitted: 2 hours ago                           │ ││
│  │  │    Deadline: 22 hours                               │ ││
│  │  │                                                     │ ││
│  │  │    [Review Now] [Skip]                              │ ││
│  │  └─────────────────────────────────────────────────────┘ ││
│  │                                                         ││
│  │  ┌─────────────────────────────────────────────────────┐ ││
│  │  │ 📝 CSS Grid Layout - Anonymous User                 │ ││
│  │  │    Challenge: Responsive Grid                       │ ││
│  │  │    Submitted: 5 hours ago                           │ ││
│  │  │    Deadline: 19 hours                               │ ││
│  │  │                                                     │ ││
│  │  │    [Review Now] [Skip]                              │ ││
│  │  └─────────────────────────────────────────────────────┘ ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                Reviews You've Given (8)                 ││
│  │                                                         ││
│  │  • JavaScript Arrays - ⭐⭐⭐⭐⭐ (Yesterday)          ││
│  │    "Excellent solution with clear comments"             ││
│  │                                                         ││
│  │  • DOM Manipulation - ⭐⭐⭐⭐☆ (2 days ago)           ││
│  │    "Good approach, consider error handling"             ││
│  │                                                         ││
│  │  • CSS Flexbox - ⭐⭐⭐☆☆ (3 days ago)                ││
│  │    "Basic solution works, could be more semantic"       ││
│  │                                                         ││
│  │  [View All Reviews]                                     ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                Reviews You've Received (12)             ││
│  │                                                         ││
│  │  📝 Functions and Scope - ⭐⭐⭐⭐⭐ (Today)            ││
│  │     "Great understanding of scope chain concepts!"      ││
│  │                                                         ││
│  │  📝 Event Handling - ⭐⭐⭐⭐☆ (Yesterday)              ││
│  │     "Good implementation, add error handling"           ││
│  │                                                         ││
│  │  📝 Array Methods - ⭐⭐⭐⭐⭐ (2 days ago)             ││
│  │     "Perfect use of higher-order functions!"            ││
│  │                                                         ││
│  │  [View All Feedback]                                    ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Review Interface

```
┌─────────────────────────────────────────────────────────────┐
│ [☰] Reviewing: JavaScript Functions         [👤] Profile    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📝 Peer Review                             ⏰ 22 hrs left │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    Challenge Details                    ││
│  │                                                         ││
│  │  Challenge: Functions and Scope                         ││
│  │  Difficulty: ⭐⭐⭐                                      ││
│  │  Requirements: Create functions demonstrating scope     ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                Student's Submission                     ││
│  │                                                         ││
│  │  Code:                                                  ││
│  │  [______________________________________]              ││
│  │  |// Global variable                     |              ││
│  │  |let globalVar = 'I am global';         |              ││
│  │  |                                       |              ││
│  │  |function outerFunction() {             |              ││
│  │  |  let outerVar = 'I am outer';         |              ││
│  │  |                                       |              ││
│  │  |  function innerFunction() {           |              ││
│  │  |    let innerVar = 'I am inner';       |              ││
│  │  |    console.log(globalVar);            |              ││
│  │  |    console.log(outerVar);             |              ││
│  │  |    console.log(innerVar);             |              ││
│  │  |  }                                    |              ││
│  │  |                                       |              ││
│  │  |  return innerFunction;                |              ││
│  │  |}                                      |              ││
│  │  [______________________________________]              ││
│  │                                                         ││
│  │  Explanation:                                           ││
│  │  "This code demonstrates how JavaScript scope works..."  ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    Your Review                          ││
│  │                                                         ││
│  │  Overall Rating:                                        ││
│  │  ☆ ☆ ☆ ☆ ☆ (Click to rate)                            ││
│  │                                                         ││
│  │  What did they do well?                                 ││
│  │  [____________________________________]                ││
│  │  [____________________________________]                ││
│  │                                                         ││
│  │  Areas for improvement:                                 ││
│  │  [____________________________________]                ││
│  │  [____________________________________]                ││
│  │                                                         ││
│  │  Specific feedback:                                     ││
│  │  [____________________________________]                ││
│  │  [____________________________________]                ││
│  │  [____________________________________]                ││
│  │                                                         ││
│  │  ☑ Code meets requirements                              ││
│  │  ☑ Code is well-commented                              ││
│  │  ☐ Could use better variable names                     ││
│  │  ☐ Consider edge cases                                 ││
│  │                                                         ││
│  │     [Cancel]        [Submit Review]                    ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Key Elements:

- Anonymous review system
- Structured feedback forms
- Rating system with criteria
- Review history and statistics
- Time limits for reviews

---

## 9. Profile

```
┌─────────────────────────────────────────────────────────────┐
│ [☰] SkillWise > Profile                      [👤] Profile   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  👤 User Profile                                            │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ┌─────────────┐                                         ││
│  │ │    📷       │  John Smith                             ││
│  │ │ [Avatar]    │  @johnsmith                             ││
│  │ │             │  📧 john@email.com                      ││
│  │ └─────────────┘  📅 Joined March 2024                   ││
│  │                                                         ││
│  │  Bio: "Learning JavaScript and loving every challenge!" ││
│  │                                                         ││
│  │  [Edit Profile]                                         ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    Learning Stats                       ││
│  │                                                         ││
│  │  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────┐ ││
│  │  │ Total Points    │ │ Challenges      │ │ Current     │ ││
│  │  │     2,450       │ │ Completed       │ │ Streak      │ ││
│  │  │                 │ │      47         │ │  12 days    │ ││
│  │  └─────────────────┘ └─────────────────┘ └─────────────┘ ││
│  │                                                         ││
│  │  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────┐ ││
│  │  │ Peer Reviews    │ │ Average Score   │ │ Rank        │ ││
│  │  │ Given: 8        │ │      87%        │ │    #15      │ ││
│  │  │ Received: 12    │ │                 │ │             │ ││
│  │  └─────────────────┘ └─────────────────┘ └─────────────┘ ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                     Achievements                        ││
│  │                                                         ││
│  │  🏆 JavaScript Master     🔥 Week Warrior               ││
│  │     (2 days ago)             (5 days ago)               ││
│  │                                                         ││
│  │  💡 Problem Solver        🎯 First Goal                 ││
│  │     (1 week ago)             (2 weeks ago)              ││
│  │                                                         ││
│  │  👥 Helpful Reviewer      ⭐ Rising Star                ││
│  │     (1 week ago)             (3 weeks ago)              ││
│  │                                                         ││
│  │  [View All Achievements]                                ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                   Current Goals                         ││
│  │                                                         ││
│  │  🎯 Learn JavaScript     Progress: 65%  ████████░░     ││
│  │     5 days left                                         ││
│  │                                                         ││
│  │  🎯 Master CSS Grid      Progress: 30%  ███░░░░░░░     ││
│  │     12 days left                                        ││
│  │                                                         ││
│  │  🎯 Public Speaking      Progress: 15%  ██░░░░░░░░     ││
│  │     25 days left                                        ││
│  │                                                         ││
│  │  [View All Goals] [Create New Goal]                    ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                      Settings                           ││
│  │                                                         ││
│  │  📧 Email Notifications                                 ││
│  │     ☑ Challenge reminders                              ││
│  │     ☑ Peer review requests                             ││
│  │     ☐ Leaderboard updates                              ││
│  │     ☑ Achievement unlocks                              ││
│  │                                                         ││
│  │  🔒 Privacy                                             ││
│  │     ☑ Show profile to other users                      ││
│  │     ☐ Include in public leaderboard                    ││
│  │     ☑ Allow peer review assignments                    ││
│  │                                                         ││
│  │  [Change Password] [Export Data] [Delete Account]      ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Key Elements:

- User information and avatar
- Comprehensive statistics dashboard
- Achievement showcase
- Goal progress summary
- Privacy and notification settings

---

## Navigation Structure

### Main Navigation (always visible)

- **Dashboard** - Overview and quick actions
- **Goals** - Create and manage learning goals
- **Challenges** - Work on and submit challenges
- **Progress** - Track learning journey
- **Leaderboard** - Community rankings
- **Reviews** - Peer review system
- **Profile** - User settings and stats

### Mobile Navigation

- Hamburger menu with collapsed navigation
- Bottom tab bar for main sections
- Swipe gestures for common actions

## Responsive Design Considerations

### Mobile (320px - 768px)

- Single column layouts
- Collapsible navigation
- Touch-friendly buttons (44px minimum)
- Simplified data tables
- Modal forms instead of inline editing

### Tablet (768px - 1024px)

- Two-column layouts where appropriate
- Expanded navigation sidebar
- Larger touch targets
- Grid layouts for cards

### Desktop (1024px+)

- Multi-column layouts
- Fixed navigation sidebar
- Hover states and tooltips
- Keyboard navigation support
- Advanced filtering and sorting

## Accessibility Features

### Visual

- High contrast color scheme
- Clear typography hierarchy
- Focus indicators
- Error state styling
- Loading state indicators

### Interactive

- Keyboard navigation
- Screen reader support
- ARIA labels and roles
- Skip navigation links
- Descriptive button text

### Form Accessibility

- Clear labels and instructions
- Error message association
- Required field indicators
- Validation feedback
- Progress indicators

This wireframe provides a comprehensive foundation for your students to build the SkillWise application while maintaining consistency and usability across all features.
