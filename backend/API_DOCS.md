# Kyokushin Karate Platform - API Documentation

## Overview
This API is built as a **Modular Monolith** using Node.js, Express, and Prisma. It is designed to be easily decomposable into microservices.

## Base URL
`http://localhost:5000/api`

## Authentication
All protected routes require a Bearer Token in the Authorization header:
`Authorization: Bearer <token>`

---

## Modules & Endpoints

### 1. Auth Module
**Responsibility:** User authentication and token management.
- `POST /auth/register` - Register a new user (Student/Instructor)
- `POST /auth/login` - Login and receive JWT
- `GET /auth/me` - Get current user profile

### 2. Core Module (Users & Dojos)
**Responsibility:** User management and Dojo administration.
- `GET /users` - List all users (Admin only)
- `GET /users/:id` - Get user details
- `PUT /users/:id` - Update user details
- `GET /dojos` - List all dojos
- `GET /dojos/:id` - Get dojo details
- `POST /dojos` - Create a new dojo (Admin only)

### 3. Belt Module
**Responsibility:** Tracking belt progression and history.
- `GET /belts/history/:userId` - Get belt history for a user
- `POST /belts/promote` - Promote a student (Instructor/Admin only)

### 4. Event Module
**Responsibility:** Event management and registration.
- `GET /events` - List all events (Tournaments/Camps)
- `GET /events/:id` - Get event details
- `POST /events` - Create an event (Admin only)
- `POST /events/:id/register` - Register for an event

### 5. Tournament Module
**Responsibility:** Bracket generation, match management, and results.
- `POST /tournaments/:eventId/brackets/generate` - Generate brackets for an event
- `GET /tournaments/:eventId/brackets` - Get brackets for an event
- `GET /matches/:id` - Get match details
- `PUT /matches/:id/score` - Update match score (Live updates)
- `POST /results/publish` - Publish final results

---

## Microservices Migration Strategy

The backend is structured to facilitate migration to a microservices architecture. Here is the recommended strategy:

### Phase 1: Service Extraction
Extract distinct modules into separate services.
1.  **Auth Service**: Extract `authRouter` and `userRouter`.
2.  **Core Service**: Extract `dojoRouter` and `beltRouter`.
3.  **Event Service**: Extract `eventRouter`, `tournamentRouter`, `matchRouter`, and `resultRouter`.

### Phase 2: Database Decomposition
Currently, all modules share a single PostgreSQL database.
1.  Create separate databases for each service (e.g., `auth_db`, `core_db`, `event_db`).
2.  Migrate relevant tables to their respective databases.
3.  Use **Event Bus** (e.g., RabbitMQ or Kafka) for inter-service communication (e.g., when a User registers for an Event, the Event Service listens to a `UserCreated` event or verifies user existence via RPC).

### Phase 3: API Gateway
Implement an API Gateway (e.g., Nginx, Kong) to route requests to the appropriate microservice, replacing the current `app.ts` routing logic.

---

## Error Handling
The API uses a standardized error response format:
```json
{
  "status": "error",
  "message": "Error description"
}
```
