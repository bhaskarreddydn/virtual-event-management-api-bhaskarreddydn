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
├── utils/                # Helper utilities (Nodemailer setup & transports)
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
- **Utils**: Configures email sending (supporting zero-config test mailboxes or custom SMTP providers).

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
   - Built using `async/await` and Promises via `nodemailer`.
   - On successful event registration, an email is automatically dispatched with event details, time, and meeting link.
   - **Zero-config developer preview**: If no SMTP credentials are configured, the service falls back to Nodemailer's ephemeral Ethereal test inbox, logging immediate preview URLs to the console.
   - **Production-ready SMTP**: Seamlessly connects to free providers like Brevo, Gmail App Passwords, SendGrid, or Resend.

---

## Email Notification Setup & Free Alternatives

The backend supports any standard SMTP provider or zero-setup local dev inbox:

### Option 1: Zero-Setup Local Dev / Testing (Default)
Leave `SMTP_USER` and `SMTP_PASS` empty in `.env`. The system automatically generates an ephemeral **Ethereal Email** test inbox and prints email preview URLs directly to your terminal.

### Option 2: Brevo (Formerly Sendinblue) — Recommended (300 Free Emails / Day)
1. Sign up for a free account at [brevo.com](https://www.brevo.com).
2. Go to **Settings** > **SMTP & API** > **SMTP**.
3. Generate a new SMTP Key.
4. Update your `.env`:
   ```env
   SMTP_HOST=smtp-relay.brevo.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your_brevo_account_email@domain.com
   SMTP_PASS=your_generated_brevo_smtp_key
   EMAIL_FROM="Virtual Event Platform <your_verified_sender@domain.com>"
   ```

### Option 3: Gmail App Password
1. In your Google Account, enable **2-Step Verification**.
2. Navigate to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
3. Create an App Password (name it "Virtual Event Platform").
4. Update `.env`:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=your_gmail@gmail.com
   SMTP_PASS=your_16_digit_app_password
   EMAIL_FROM="Virtual Event Platform <your_gmail@gmail.com>"
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
Ensure `PORT` and `JWT_SECRET` are set. Configure SMTP credentials if live email delivery is desired.

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
    "emailSent": true,
    "previewUrl": "https://ethereal.email/message/..."
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
