<!-- /Users/ze/work/go/docs/DATABASE_SCHEMA.md -->
# Schema

This document provides a high-level overview of the database schema. 

The primary sources of truth for data structures are:
1.  **Database Migrations:** The SQL files in `/internal/migrations` define the exact database schema.
2.  **Swagger Documentation:** The live, interactive API documentation at the `/swagger/index.html` endpoint defines all API request/response schemas.

---

## Database Schema

### `users` Table

Stores user credentials and role information.

| Column         | Type        | Constraints                        | Description                               |
|----------------|-------------|------------------------------------|-------------------------------------------|
| `username`     | `VARCHAR(255)` | `PRIMARY KEY`                      | Unique identifier for the user.           |
| `password_hash`| `VARCHAR(255)` | `NOT NULL`                         | Hashed password using bcrypt.             |
| `role`         | `VARCHAR(50)`  | `NOT NULL`, `DEFAULT 'user'`       | User role for RBAC (e.g., `user`, `admin`). |
| `created_at`   | `TIMESTAMPTZ`  | `NOT NULL`, `DEFAULT NOW()`        | Timestamp of user creation.               |
| `updated_at`   | `TIMESTAMPTZ`  | `NOT NULL`, `DEFAULT NOW()`        | Timestamp of last user update.            |

### `refresh_tokens` Table

Stores valid refresh tokens for users.

| Column          | Type        | Constraints                        | Description                                     |
|-----------------|-------------|------------------------------------|-------------------------------------------------|
| `token`         | `TEXT`      | `PRIMARY KEY`                      | The refresh token string.                         |
| `user_username` | `VARCHAR(255)` | `NOT NULL`, `FOREIGN KEY (users.username)` | The user this token belongs to.                 |
| `expires_at`    | `TIMESTAMPTZ`  | `NOT NULL`                         | The expiry date for the refresh token.          |

---

## API Schemas

For detailed and up-to-date information on all API endpoints, request bodies, and response formats, please see the live Swagger documentation served at the `/swagger/index.html` endpoint of the running application.