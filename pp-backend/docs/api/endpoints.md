<!-- /Users/ze/work/go/docs/api.md -->
# API Endpoint Documentation

This document provides details on the available API endpoints.

**Base URL**: `/api/v1`

--- 

### Authentication

#### `POST /auth/login`

Authenticates a user and returns JWT tokens.

- **Request Body:**
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "access_token": "string",
    "refresh_token": "string"
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request body.
  - `401 Unauthorized`: Invalid credentials.

#### `POST /auth/refresh`

Refreshes an access token using a refresh token.

- **Request Body:**
  ```json
  {
    "refresh_token": "string"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "access_token": "string"
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request body.
  - `401 Unauthorized`: Invalid or expired refresh token.

#### `POST /auth/logout`

Invalidates a refresh token.

- **Request Body:**
  ```json
  {
    "refresh_token": "string"
  }
  ```
- **Success Response (204 No Content):**
- **Note:** This endpoint will return 204 even if the token is already invalid.

--- 

### User Management

#### `GET /users`

Lists all users.

*Authentication Required: Bearer Token*
*Role Required: `admin`*

- **Success Response (200 OK):**
  ```json
  [
    {
      "username": "string",
      "role": "string"
    }
  ]
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or invalid access token.
  - `403 Forbidden`: User does not have the 'admin' role.

#### `POST /users`

Creates a new user.

- **Request Body:**
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- **Success Response (201 Created):**
  ```json
  {
    "username": "string",
    "role": "user"
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid input (e.g., password too short, username missing).
  - `409 Conflict`: Username already exists.

#### `PUT /users/:username`

Updates a user's role.

*Authentication Required: Bearer Token*
*Role Required: `admin`*

- **URL Params:**
  - `username=[string]` (required) - The username of the user to update.
- **Request Body:**
  ```json
  {
    "role": "string (user or admin)"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "username": "string",
    "role": "string"
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request body (e.g., invalid role).
  - `401 Unauthorized`: Missing or invalid access token.
  - `403 Forbidden`: User does not have the 'admin' role.
  - `404 Not Found`: User with the specified username does not exist.

#### `DELETE /users/:username`

Deletes a user. 

*Authentication Required: Bearer Token*
*Role Required: `admin`*

- **URL Params:**
  - `username=[string]` (required) - The username of the user to delete.
- **Success Response (204 No Content):**
- **Error Responses:**
  - `401 Unauthorized`: Missing or invalid access token.
  - `403 Forbidden`: User does not have the 'admin' role.
  - `404 Not Found`: User with the specified username does not exist.

--- 

### User

*Authentication Required: Bearer Token*

#### `GET /me`

Retrieves the authenticated user's profile information.

- **Success Response (200 OK):**
  ```json
  {
    "user": "string (username)",
    "role": "string (e.g., user, admin)"
  }
  ```

--- 

### Admin

*Authentication Required: Bearer Token*
*Role Required: `admin`*

#### `GET /admin/stats`

Retrieves application statistics. (Currently just uptime).

- **Success Response (200 OK):**
  ```json
  {
    "uptime": "string (e.g., 1m30s)"
  }
  ```