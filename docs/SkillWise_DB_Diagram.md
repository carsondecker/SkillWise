# SkillWise Database Diagram (PostgreSQL)

> This is a **database diagram + column catalog** students can use to implement their own Postgres schema.  
> It includes three handy formats:
>
> 1. **Mermaid ER diagram** (renders on GitHub/VS Code extensions)
> 2. **DBML** (paste into https://dbdiagram.io)
> 3. **Readable column tables** (source of truth)

---

## 1) Mermaid ER Diagram

```mermaid
erDiagram
  USERS ||--o{ GOALS : "has"
  USERS ||--o{ CHALLENGES : "created"
  USERS ||--o{ PROGRESS : "tracks"
  USERS ||--o{ SUBMISSIONS : "makes"
  USERS ||--o{ EXPLANATIONS : "asks"
  USERS ||--|{ TEAM_MEMBERS : "joins"
  USERS ||--o| LEADERBOARD : "has 1 row"
  USERS ||--o{ REFRESH_TOKENS : "owns"
  USERS ||--o{ PEER_REVIEWS : "writes"

  GOALS ||--o{ CHALLENGES : "has"

  CHALLENGES ||--o{ PROGRESS : "has per user"
  CHALLENGES ||--o{ SUBMISSIONS : "receives"
  CHALLENGES ||--o{ EXPLANATIONS : "optional"

  SUBMISSIONS ||--o{ AI_FEEDBACK : "produces"
  SUBMISSIONS ||--o{ PEER_REVIEWS : "gets"

  TEAMS ||--o{ TEAM_MEMBERS : "has"

  USERS {
    uuid id PK
    citext email UNIQUE
    text password_hash
    text display_name
    text bio
    text avatar_url
    text role
    timestamptz created_at
    timestamptz updated_at
    timestamptz deleted_at
  }

  REFRESH_TOKENS {
    uuid id PK
    uuid user_id FK -> USERS.id
    text token_hash UNIQUE (user_id, token_hash)
    timestamptz issued_at
    timestamptz expires_at
    timestamptz revoked_at
  }

  GOALS {
    uuid id PK
    uuid user_id FK -> USERS.id
    text title
    text description
    date target_date
    enum visibility  -- PRIVATE | TEAM | PUBLIC
    timestamptz created_at
    timestamptz updated_at
    timestamptz deleted_at
  }

  CHALLENGES {
    uuid id PK
    uuid goal_id FK -> GOALS.id
    uuid created_by FK -> USERS.id
    text title
    text instructions
    enum status      -- PENDING | IN_PROGRESS | COMPLETED | ARCHIVED
    int points
    bool is_ai_generated
    text ai_model
    timestamptz created_at
    timestamptz updated_at
    timestamptz deleted_at
  }

  PROGRESS {
    uuid id PK
    uuid user_id FK -> USERS.id
    uuid challenge_id FK -> CHALLENGES.id
    int percent_complete
    timestamptz last_checked_at
    unique user_challenge (user_id, challenge_id)
  }

  SUBMISSIONS {
    uuid id PK
    uuid user_id FK -> USERS.id
    uuid challenge_id FK -> CHALLENGES.id
    text content_text
    text content_url
    text language_hint
    int  content_bytes (generated)
    timestamptz created_at
  }

  AI_FEEDBACK {
    uuid id PK
    uuid submission_id FK -> SUBMISSIONS.id
    text model
    text prompt
    text response
    int  score
    jsonb rubric
    timestamptz created_at
  }

  EXPLANATIONS {
    uuid id PK
    uuid user_id FK -> USERS.id
    uuid challenge_id FK -> CHALLENGES.id (nullable)
    text question
    text model
    text prompt
    text response
    timestamptz created_at
  }

  PEER_REVIEWS {
    uuid id PK
    uuid reviewer_id FK -> USERS.id
    uuid submission_id FK -> SUBMISSIONS.id
    text comments
    enum outcome     -- APPROVED | CHANGES_REQUESTED | REJECTED
    int  score
    timestamptz created_at
    unique reviewer_submission (reviewer_id, submission_id)
  }

  LEADERBOARD {
    uuid id PK
    uuid user_id UNIQUE FK -> USERS.id
    int  total_points
    timestamptz updated_at
  }

  TEAMS {
    uuid id PK
    text name
    uuid owner_id FK -> USERS.id
    timestamptz created_at
    timestamptz updated_at
  }

  TEAM_MEMBERS {
    uuid id PK
    uuid team_id FK -> TEAMS.id
    uuid user_id FK -> USERS.id
    text role
    timestamptz joined_at
    unique team_user (team_id, user_id)
  }
```

---

## 2) DBML (dbdiagram.io import)

> Copy/paste into https://dbdiagram.io/new and choose **PostgreSQL**.

```dbml
Table users {
  id uuid [pk]
  email citext [unique, not null]
  password_hash text [not null]
  display_name text [not null]
  bio text
  avatar_url text
  role text [default: 'user']
  created_at timestamptz [not null, default: `now()`]
  updated_at timestamptz [not null, default: `now()`]
  deleted_at timestamptz
}

Table refresh_tokens {
  id uuid [pk]
  user_id uuid [not null, ref: > users.id]
  token_hash text [not null]
  issued_at timestamptz [not null, default: `now()`]
  expires_at timestamptz [not null]
  revoked_at timestamptz
  Indexes {
    (user_id, token_hash) [unique]
  }
}

Enum challenge_status { PENDING, IN_PROGRESS, COMPLETED, ARCHIVED }
Enum visibility_level { PRIVATE, TEAM, PUBLIC }
Enum review_outcome { APPROVED, CHANGES_REQUESTED, REJECTED }

Table goals {
  id uuid [pk]
  user_id uuid [not null, ref: > users.id]
  title text [not null]
  description text
  target_date date
  visibility visibility_level [not null, default: 'PRIVATE']
  created_at timestamptz [not null, default: `now()`]
  updated_at timestamptz [not null, default: `now()`]
  deleted_at timestamptz
  Indexes {
    (user_id)
    (user_id, title) [unique, note: "where deleted_at is null (add in SQL)"]
  }
}

Table challenges {
  id uuid [pk]
  goal_id uuid [not null, ref: > goals.id]
  created_by uuid [not null, ref: > users.id]
  title text [not null]
  instructions text [not null]
  status challenge_status [not null, default: 'PENDING']
  points int [not null, default: 10]
  is_ai_generated bool [not null, default: false]
  ai_model text
  created_at timestamptz [not null, default: `now()`]
  updated_at timestamptz [not null, default: `now()`]
  deleted_at timestamptz
  Indexes {
    (goal_id)
    (status)
    (goal_id, created_at)
  }
}

Table progress {
  id uuid [pk]
  user_id uuid [not null, ref: > users.id]
  challenge_id uuid [not null, ref: > challenges.id]
  percent_complete int [not null, default: 0]
  last_checked_at timestamptz [not null, default: `now()`]
  Indexes {
    (user_id, challenge_id) [unique]
  }
}

Table submissions {
  id uuid [pk]
  user_id uuid [not null, ref: > users.id]
  challenge_id uuid [not null, ref: > challenges.id]
  content_text text
  content_url text
  language_hint text
  content_bytes int // generated in SQL
  created_at timestamptz [not null, default: `now()`]
  Indexes {
    (user_id)
    (challenge_id)
  }
}

Table ai_feedback {
  id uuid [pk]
  submission_id uuid [not null, ref: > submissions.id]
  model text [not null]
  prompt text [not null]
  response text [not null]
  score int
  rubric jsonb
  created_at timestamptz [not null, default: `now()`]
  Indexes {
    (submission_id)
  }
}

Table explanations {
  id uuid [pk]
  user_id uuid [not null, ref: > users.id]
  challenge_id uuid [ref: > challenges.id]
  question text [not null]
  model text [not null]
  prompt text [not null]
  response text [not null]
  created_at timestamptz [not null, default: `now()`]
  Indexes {
    (user_id)
  }
}

Table peer_reviews {
  id uuid [pk]
  reviewer_id uuid [not null, ref: > users.id]
  submission_id uuid [not null, ref: > submissions.id]
  comments text
  outcome review_outcome
  score int
  created_at timestamptz [not null, default: `now()`]
  Indexes {
    (reviewer_id)
    (submission_id)
    (reviewer_id, submission_id) [unique]
  }
}

Table leaderboard {
  id uuid [pk]
  user_id uuid [not null, unique, ref: > users.id]
  total_points int [not null, default: 0]
  updated_at timestamptz [not null, default: `now()`]
}

Table teams {
  id uuid [pk]
  name text [not null]
  owner_id uuid [not null, ref: > users.id]
  created_at timestamptz [not null, default: `now()`]
  updated_at timestamptz [not null, default: `now()`]
  Indexes {
    (owner_id)
  }
}

Table team_members {
  id uuid [pk]
  team_id uuid [not null, ref: > teams.id]
  user_id uuid [not null, ref: > users.id]
  role text [not null, default: 'member']
  joined_at timestamptz [not null, default: `now()`]
  Indexes {
    (team_id)
    (user_id)
    (team_id, user_id) [unique]
  }
}
```

---

## 4) How to use

- **Option A (Mermaid):** Paste the Mermaid block into a Markdown file in your repo; many IDEs render it.
- **Option B (DBML):** Paste the DBML into dbdiagram.io to export PNG/SVG/PDF.
- **Option C (Tables below):** Build your own CREATE TABLE statements from the column catalog.
