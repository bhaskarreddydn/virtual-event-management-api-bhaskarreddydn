# Project Submission Notes & Links

### 📋 Submission Details
- **Student Name:** Bhaskar Reddy
- **Email:** dnbhaskarreddy@gmail.com
- **Project Title:** Virtual Event Management API
- **GitHub Repository Link:** [https://github.com/bhaskarreddydn/virtual-event-management-api-bhaskarreddydn](https://github.com/bhaskarreddydn/virtual-event-management-api-bhaskarreddydn)
- **Submission Date:** October 2026

---

### 📝 Note for the Instructor / Evaluator
> Hello Instructor,
> 
> Here is my final submission for the **Virtual Event Management API** project.
> 
> **Zero Configuration Setup:**
> - To make your evaluation seamless, the `.env` file is intentionally bundled in the repository with active, working credentials (including a verified Brevo Transactional Email API key and JWT secret).
> - You do not need to register for any external accounts or create an environment file manually.
> - An end-to-end Postman collection (`postman_collection.json`) is also included with automated token-passing scripts for quick testing.

---

### ⚡ Quick Start & Verification Commands
```bash
# 1. Clone & Enter Project
git clone https://github.com/bhaskarreddydn/virtual-event-management-api-bhaskarreddydn.git
cd virtual-event-management-api-bhaskarreddydn

# 2. Install Dependencies
npm install

# 3. Run Automated Integration Test Suite (29 subtests, 65 assertions passing)
npm test

# 4. Start Server (starts on http://localhost:3000)
npm start
```

---

### 🔑 Key Implementation Highlights
1. **Layered Enterprise Architecture**: Strict separation of concerns across `routes/`, `controllers/`, `services/`, `models/`, and `utils/`.
2. **Authentication & RBAC**: Stateless JWT auth with bcrypt password hashing (10 salt rounds) and role-based permissions (`organizer` vs `attendee`).
3. **Event CRUD & Filtering**: Organizers manage events; attendees browse with query filters (`category`, `date`, `organizerId`).
4. **Concurrency & Capacity Rules**: Prevents duplicate registrations and enforces strict capacity limits.
5. **Transactional Email**: Built with Brevo REST API v3 using native HTTPS fetch to dispatch confirmation emails asynchronously on event registration.
6. **100% Test Pass Rate**: Full end-to-end integration test coverage (`tap` + `supertest`).
