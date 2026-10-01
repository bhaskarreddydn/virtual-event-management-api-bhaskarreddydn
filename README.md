# Virtual Event Management API

A production-ready RESTful backend system for a virtual event management platform built with Node.js, Express.js, bcrypt, and JWT. All data (users, events, participants) is managed efficiently using in-memory data structures, adhering strictly to a layered enterprise architecture (`routes` -> `controllers` -> `services` -> `models`).

---

## Architecture Overview

The system strictly follows a decoupled, maintainable layered design pattern:

```
virtual-event-management-api/
├── controllers/          # HTTP request/response controllers & status code handling
│   ├── authController.js
│   └── eventController.js
├── middleware/           # Security, JWT verification & RBAC authorization
│   ├── auth.js           # verifyToken, requireRole
│   └── errorHandler.js   # Centralized error handler & 404
├── models/               # In-memory data layer (arrays & query/CRUD abstractions)
│   ├── eventModel.js
│   └── userModel.js
├── routes/               # REST API route definitions
│   ├── auth.js
│   └── events.js
├── services/             # Core business logic & external integrations
│   ├── authService.js
│   ├── emailService.js
│   └── eventService.js
├── test/                 # Automated test suite (tap & supertest)
│   └── server.test.js
├── utils/                # Helper utilities (Brevo REST API client)
│   └── mailer.js
├── .env.example          # Sample environment variables
├── app.js                # Express app entrypoint & middleware assembly
├── package.json          # Project metadata & npm scripts
├── postman_collection.json # Ready-to-import Postman test suite
└── README.md
```

- **Routes**: Declare endpoints and bind appropriate authentication/authorization middlewares.
- **Controllers**: Handle incoming HTTP requests, sanitize input, delegate to services, and send consistent JSON responses.
- **Services**: Execute domain business logic (password hashing, JWT token generation, event scheduling checks, capacity rules, and asynchronous email triggering).
- **Models**: Encapsulate in-memory data stores (`users[]` and `events[]`) providing isolated query, creation, update, and deletion methods.
- **Middleware**: Intercepts requests for token verification (`verifyToken`) and role-based permissions (`requireRole('organizer')`).
- **Utils**: Implements transactional email delivery via Brevo REST API v3.

---

## Features

1. **Authentication & Authorization**:
   - Secure password hashing using `bcrypt` (salt rounds: 10).
   - Stateless session management using JSON Web Tokens (`jsonwebtoken`).
   - Role-Based Access Control (RBAC) distinguishing between **`organizer`** and **`attendee`**.
2. **Event Management (CRUD)**:
   - Event creation, modification, and deletion restricted to authenticated **organizers**.
   - Public event discovery with optional query filters (e.g. `category`, `date`, `organizerId`).
   - Detailed event inspection including schedule, description, virtual meeting link, capacity, and current participant lists.
3. **Participant Management**:
   - Authenticated attendees can register for events (`POST /events/:id/register`).
   - Automatic prevention of duplicate registrations.
   - Strict capacity limit enforcement.
   - Attendee registration tracking and cancellation support.
4. **Asynchronous Email Notifications**:
   - Built using `async/await` and Promises calling Brevo's REST API v3 (`https://api.brevo.com/v3/smtp/email`) directly over HTTPS.
   - On successful event registration, a transactional confirmation email is automatically dispatched with event details, schedule, and virtual meeting link.
   - Fully decoupled and production-ready: No bulky SMTP libraries needed. Utilizes lightweight native Node.js fetch.

---

## Email Notification Setup (Brevo REST API)

This platform exclusively uses **Brevo (formerly Sendinblue)** as its transactional email provider. SMTP, Gmail, and other local transports have been completely removed.

### 1. Obtain Your Brevo API Key
1. Log in or create a free account at [brevo.com](https://www.brevo.com) (free tier includes 300 emails/day).
2. Click your account name in the top-right corner and select **SMTP & API**.
3. Under the **API Keys** tab, click **Generate a new API key**.
4. Name your key (e.g., `Virtual Event Management API`) and click **Generate**.
5. Copy your key (starts with `xkeysib-...`).

### 2. Configure Verified Sender & Authorize IP
- **Verified Sender**: Brevo requires emails to be sent from an email address that is verified on your account. Go to **Senders, Domains & Dedicated IPs** > **Senders** in your Brevo dashboard to confirm your verified sender address (by default, the email you registered with).
- **Authorized IPs**: If Brevo restricts API requests from unrecognized IP addresses, authorize your current public IP under [Brevo Authorized IPs](https://app.brevo.com/security/authorised_ips).

### 3. Update Your `.env` File
Add your Brevo credentials to your `.env` file:
```env
BREVO_API_KEY=xkeysib-your_generated_api_key_here
BREVO_SENDER_NAME="Virtual Event Platform"
BREVO_SENDER_EMAIL=your_verified_brevo_account_email@domain.com
```

---

## Installation & Setup

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)

### 1. Clone the Repository
```bash
git clone https://github.com/bhaskarreddydn/virtual-event-management-api-bhaskarreddydn.git
cd virtual-event-management-api-bhaskarreddydn
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure `PORT`, `JWT_SECRET`, and `BREVO_API_KEY` are configured in `.env`.

### 4. Run the Automated Test Suite
Verify that all 29 test suites and 65 assertions pass:
```bash
npm run test
```

### 5. Start the Application
- **Production mode**:
  ```bash
  npm start
  ```
- **Development mode (with auto-reload)**:
  ```bash
  npm run dev
  ```
The server will start on `http://localhost:3000`.

---

## API Endpoints Reference

### 1. Authentication

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/register` | Public | Register a new user (`organizer` or `attendee`) |
| `POST` | `/login` | Public | Authenticate user and receive JWT bearer token |
| `GET` | `/me` | Authenticated | Retrieve profile details of currently logged-in user |

#### Register User
- **URL**: `POST /register`
- **Body**:
  ```json
  {
    "name": "Alice Organizer",
    "email": "alice@example.com",
    "password": "Password123!",
    "role": "organizer"
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "message": "User registered successfully",
    "user": {
      "id": "c1f7b0a2-...",
      "name": "Alice Organizer",
      "email": "alice@example.com",
      "role": "organizer",
      "createdAt": "2026-10-01T09:00:00.000Z"
    }
  }
  ```

#### Login User
- **URL**: `POST /login`
- **Body**:
  ```json
  {
    "email": "alice@example.com",
    "password": "Password123!"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "message": "Login successful",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "c1f7b0a2-...",
      "name": "Alice Organizer",
      "email": "alice@example.com",
      "role": "organizer"
    }
  }
  ```

---

### 2. Event Management

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/events` | Organizer Only | Create a new virtual event |
| `GET` | `/events` | Public | List all scheduled events (supports filtering) |
| `GET` | `/events/:id` | Public | Get details of a single event |
| `PUT` | `/events/:id` | Organizer Only | Update event details (creator only) |
| `DELETE` | `/events/:id` | Organizer Only | Delete event (creator only) |

#### Create Event
- **URL**: `POST /events`
- **Header**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "title": "Global Cloud Architecture Summit 2026",
    "description": "Deep dive into serverless architecture, event-driven backends, and microservices.",
    "date": "2026-11-20",
    "time": "15:00 UTC",
    "location": "https://meet.google.com/xyz-summit-2026",
    "category": "Tech",
    "capacity": 150
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "message": "Event created successfully",
    "event": {
      "id": "e4a2d8e0-...",
      "title": "Global Cloud Architecture Summit 2026",
      "description": "Deep dive into serverless architecture...",
      "date": "2026-11-20",
      "time": "15:00 UTC",
      "location": "https://meet.google.com/xyz-summit-2026",
      "category": "Tech",
      "capacity": 150,
      "organizerId": "c1f7b0a2-...",
      "organizerEmail": "alice@example.com",
      "participants": [],
      "createdAt": "2026-10-01T09:00:00.000Z",
      "updatedAt": "2026-10-01T09:00:00.000Z"
    }
  }
  ```

#### Get All Events
- **URL**: `GET /events?category=Tech&date=2026-11-20`
- **Response** (`200 OK`):
  ```json
  {
    "total": 1,
    "events": [ ... ]
  }
  ```

#### Update Event
- **URL**: `PUT /events/:id`
- **Header**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "title": "Global Cloud Architecture Summit 2026 (Updated)",
    "capacity": 200
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "message": "Event updated successfully",
    "event": { ... }
  }
  ```

#### Delete Event
- **URL**: `DELETE /events/:id`
- **Header**: `Authorization: Bearer <token>`
- **Response** (`200 OK`):
  ```json
  {
    "message": "Event deleted successfully"
  }
  ```

---

### 3. Participant Management & Registrations

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/events/:id/register` | Authenticated | Register current user for an event (triggers email) |
| `GET` | `/events/:id/participants` | Authenticated | View list of registered participants for an event |
| `GET` | `/registrations` | Authenticated | View all events registered by current user |
| `DELETE` | `/events/:id/register` | Authenticated | Cancel user registration for an event |

#### Register for Event
- **URL**: `POST /events/:id/register`
- **Header**: `Authorization: Bearer <token>`
- **Response** (`201 Created`):
  ```json
  {
    "message": "Successfully registered for event",
    "event": {
      "id": "e4a2d8e0-...",
      "title": "Global Cloud Architecture Summit 2026",
      "date": "2026-11-20",
      "time": "15:00 UTC",
      "location": "https://meet.google.com/xyz-summit-2026"
    },
    "participant": {
      "userId": "b2c3d4e5-...",
      "name": "Bob Attendee",
      "email": "bob@example.com",
      "registeredAt": "2026-10-01T09:05:00.000Z"
    },
    "emailSent": true
  }
  ```

---

## Testing

The project includes an end-to-end integration test suite powered by `tap` and `supertest`.

To execute:
```bash
npm run test
```

### Test Coverage Highlights:
- **Authentication**: Registration success, duplicate checks, missing parameters, invalid emails, login success, invalid passwords, non-existent user handling, and token verification.
- **Role-Based Authorization**: Organizers allowed to create/update/delete events, attendees strictly blocked (`403 Forbidden`).
- **Event Lifecycle**: CRUD operations, 404 handlers for non-existent events.
- **Participant Logic**: Attendee registration, duplicate prevention, capacity enforcement, participant listing, user registrations retrieval, and registration cancellation.
- **Asynchronous Operations**: Verifies Promise-based email notification dispatching on registration.

---

## Postman Collection

A complete Postman collection is included in `postman_collection.json`.
1. Open Postman.
2. Click **Import** and select `postman_collection.json`.
3. The collection is pre-configured with environment variables and automated test scripts to capture and pass JWT tokens between requests automatically.

---

## License

ISC License. Built for the Backend Engineering Launchpad.
