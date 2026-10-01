process.env.NODE_ENV = 'test';

const tap = require('tap');
const supertest = require('supertest');
const app = require('../app');
const userModel = require('../models/userModel');
const eventModel = require('../models/eventModel');

const server = supertest(app);

// Reset in-memory stores before tests
userModel.reset();
eventModel.reset();

// Test Fixtures
const mockOrganizer = {
  name: 'Alice Organizer',
  email: 'alice@organizer.com',
  password: 'Password123!',
  role: 'organizer'
};

const mockAttendee = {
  name: 'Bob Attendee',
  email: 'bob@attendee.com',
  password: 'Password123!',
  role: 'attendee'
};

const mockAttendee2 = {
  name: 'Charlie Attendee',
  email: 'charlie@attendee.com',
  password: 'Password123!',
  role: 'attendee'
};

let organizerToken = '';
let attendeeToken = '';
let createdEventId = '';
let limitedEventId = '';

// ==========================================
// 1. USER AUTHENTICATION TESTS
// ==========================================

tap.test('POST /register - Register organizer successfully', async (t) => {
  const res = await server.post('/register').send(mockOrganizer);
  t.equal(res.status, 201);
  t.hasOwnProp(res.body, 'user');
  t.equal(res.body.user.email, mockOrganizer.email);
  t.equal(res.body.user.role, 'organizer');
  t.notHas(res.body.user, 'password');
  t.end();
});

tap.test('POST /register - Register attendee successfully', async (t) => {
  const res = await server.post('/register').send(mockAttendee);
  t.equal(res.status, 201);
  t.hasOwnProp(res.body, 'user');
  t.equal(res.body.user.email, mockAttendee.email);
  t.equal(res.body.user.role, 'attendee');
  t.end();
});

tap.test('POST /register - Missing required fields', async (t) => {
  const res = await server.post('/register').send({
    email: 'incomplete@user.com'
  });
  t.equal(res.status, 400);
  t.hasOwnProp(res.body, 'error');
  t.end();
});

tap.test('POST /register - Invalid email format', async (t) => {
  const res = await server.post('/register').send({
    name: 'Invalid Email',
    email: 'not-an-email',
    password: 'Password123!'
  });
  t.equal(res.status, 400);
  t.end();
});

tap.test('POST /register - Duplicate email registration', async (t) => {
  const res = await server.post('/register').send(mockOrganizer);
  t.equal(res.status, 400);
  t.equal(res.body.error, 'User already exists');
  t.end();
});

tap.test('POST /login - Login organizer successfully', async (t) => {
  const res = await server.post('/login').send({
    email: mockOrganizer.email,
    password: mockOrganizer.password
  });
  t.equal(res.status, 200);
  t.hasOwnProp(res.body, 'token');
  t.equal(res.body.user.role, 'organizer');
  organizerToken = res.body.token;
  t.end();
});

tap.test('POST /login - Login attendee successfully', async (t) => {
  const res = await server.post('/login').send({
    email: mockAttendee.email,
    password: mockAttendee.password
  });
  t.equal(res.status, 200);
  t.hasOwnProp(res.body, 'token');
  t.equal(res.body.user.role, 'attendee');
  attendeeToken = res.body.token;
  t.end();
});

tap.test('POST /login - Invalid password', async (t) => {
  const res = await server.post('/login').send({
    email: mockAttendee.email,
    password: 'wrongpassword'
  });
  t.equal(res.status, 401);
  t.hasOwnProp(res.body, 'error');
  t.end();
});

tap.test('POST /login - Non-existent user', async (t) => {
  const res = await server.post('/login').send({
    email: 'nobody@example.com',
    password: 'password'
  });
  t.equal(res.status, 401);
  t.end();
});

tap.test('GET /me - Fetch profile with valid token', async (t) => {
  const res = await server.get('/me').set('Authorization', `Bearer ${attendeeToken}`);
  t.equal(res.status, 200);
  t.equal(res.body.user.email, mockAttendee.email);
  t.end();
});

tap.test('GET /me - Deny access without token', async (t) => {
  const res = await server.get('/me');
  t.equal(res.status, 401);
  t.end();
});

// ==========================================
// 2. EVENT MANAGEMENT CRUD TESTS
// ==========================================

tap.test('POST /events - Organizer creates event successfully', async (t) => {
  const res = await server
    .post('/events')
    .set('Authorization', `Bearer ${organizerToken}`)
    .send({
      title: 'Global Web Development Summit 2026',
      description: 'An interactive summit covering advanced backend and cloud technologies.',
      date: '2026-11-20',
      time: '15:00 UTC',
      location: 'https://meet.google.com/xyz-demo-evt',
      category: 'Tech',
      capacity: 100
    });

  t.equal(res.status, 201);
  t.hasOwnProp(res.body, 'event');
  t.equal(res.body.event.title, 'Global Web Development Summit 2026');
  createdEventId = res.body.event.id;
  t.end();
});

tap.test('POST /events - Attendee cannot create event (Forbidden)', async (t) => {
  const res = await server
    .post('/events')
    .set('Authorization', `Bearer ${attendeeToken}`)
    .send({
      title: 'Unauthorized Event',
      date: '2026-12-01',
      time: '10:00 AM'
    });

  t.equal(res.status, 403);
  t.end();
});

tap.test('POST /events - Missing required fields', async (t) => {
  const res = await server
    .post('/events')
    .set('Authorization', `Bearer ${organizerToken}`)
    .send({
      title: 'Missing Date Event'
    });

  t.equal(res.status, 400);
  t.end();
});

tap.test('GET /events - List all events', async (t) => {
  const res = await server.get('/events');
  t.equal(res.status, 200);
  t.hasOwnProp(res.body, 'events');
  t.ok(res.body.events.length >= 1);
  t.end();
});

tap.test('GET /events/:id - Get event by ID', async (t) => {
  const res = await server.get(`/events/${createdEventId}`);
  t.equal(res.status, 200);
  t.equal(res.body.event.id, createdEventId);
  t.end();
});

tap.test('GET /events/:id - Event not found', async (t) => {
  const res = await server.get('/events/nonexistent-id');
  t.equal(res.status, 404);
  t.end();
});

tap.test('PUT /events/:id - Organizer updates event successfully', async (t) => {
  const res = await server
    .put(`/events/${createdEventId}`)
    .set('Authorization', `Bearer ${organizerToken}`)
    .send({
      title: 'Global Web Development Summit 2026 (Updated)',
      capacity: 150
    });

  t.equal(res.status, 200);
  t.equal(res.body.event.title, 'Global Web Development Summit 2026 (Updated)');
  t.equal(res.body.event.capacity, 150);
  t.end();
});

tap.test('PUT /events/:id - Attendee cannot update event', async (t) => {
  const res = await server
    .put(`/events/${createdEventId}`)
    .set('Authorization', `Bearer ${attendeeToken}`)
    .send({
      title: 'Hacked Title'
    });

  t.equal(res.status, 403);
  t.end();
});

// ==========================================
// 3. PARTICIPANT MANAGEMENT & REGISTRATION
// ==========================================

tap.test('POST /events/:id/register - Attendee registers for event', async (t) => {
  const res = await server
    .post(`/events/${createdEventId}/register`)
    .set('Authorization', `Bearer ${attendeeToken}`);

  t.equal(res.status, 201);
  t.equal(res.body.message, 'Successfully registered for event');
  t.hasOwnProp(res.body, 'participant');
  t.equal(res.body.participant.email, mockAttendee.email);
  t.equal(res.body.emailSent, true);
  t.end();
});

tap.test('POST /events/:id/register - Prevent duplicate registration', async (t) => {
  const res = await server
    .post(`/events/${createdEventId}/register`)
    .set('Authorization', `Bearer ${attendeeToken}`);

  t.equal(res.status, 400);
  t.equal(res.body.error, 'Already registered for this event');
  t.end();
});

tap.test('POST /events/:id/register - Without auth token', async (t) => {
  const res = await server.post(`/events/${createdEventId}/register`);
  t.equal(res.status, 401);
  t.end();
});

tap.test('GET /events/:id/participants - View participant list', async (t) => {
  const res = await server
    .get(`/events/${createdEventId}/participants`)
    .set('Authorization', `Bearer ${organizerToken}`);

  t.equal(res.status, 200);
  t.equal(res.body.total, 1);
  t.equal(res.body.participants[0].email, mockAttendee.email);
  t.end();
});

tap.test('GET /registrations - View current user registrations', async (t) => {
  const res = await server
    .get('/registrations')
    .set('Authorization', `Bearer ${attendeeToken}`);

  t.equal(res.status, 200);
  t.equal(res.body.total, 1);
  t.equal(res.body.registrations[0].id, createdEventId);
  t.end();
});

tap.test('Capacity limit enforcement test', async (t) => {
  // 1. Organizer creates event with capacity 1
  const createRes = await server
    .post('/events')
    .set('Authorization', `Bearer ${organizerToken}`)
    .send({
      title: 'Exclusive Workshop',
      date: '2026-12-05',
      time: '18:00',
      capacity: 1
    });
  t.equal(createRes.status, 201);
  limitedEventId = createRes.body.event.id;

  // 2. Attendee 1 registers -> succeeds
  const reg1 = await server
    .post(`/events/${limitedEventId}/register`)
    .set('Authorization', `Bearer ${attendeeToken}`);
  t.equal(reg1.status, 201);

  // 3. Register second attendee user
  await server.post('/register').send(mockAttendee2);
  const login2 = await server.post('/login').send({
    email: mockAttendee2.email,
    password: mockAttendee2.password
  });
  const attendee2Token = login2.body.token;

  // 4. Attendee 2 attempts to register -> rejected (Event is full)
  const reg2 = await server
    .post(`/events/${limitedEventId}/register`)
    .set('Authorization', `Bearer ${attendee2Token}`);
  t.equal(reg2.status, 400);
  t.match(reg2.body.error, /full/i);
  t.end();
});

tap.test('DELETE /events/:id/register - Cancel event registration', async (t) => {
  const res = await server
    .delete(`/events/${createdEventId}/register`)
    .set('Authorization', `Bearer ${attendeeToken}`);

  t.equal(res.status, 200);
  t.equal(res.body.message, 'Registration cancelled successfully');
  t.end();
});

// ==========================================
// 4. EVENT DELETION TESTS
// ==========================================

tap.test('DELETE /events/:id - Attendee cannot delete event', async (t) => {
  const res = await server
    .delete(`/events/${createdEventId}`)
    .set('Authorization', `Bearer ${attendeeToken}`);

  t.equal(res.status, 403);
  t.end();
});

tap.test('DELETE /events/:id - Organizer deletes event successfully', async (t) => {
  const res = await server
    .delete(`/events/${createdEventId}`)
    .set('Authorization', `Bearer ${organizerToken}`);

  t.equal(res.status, 200);
  t.equal(res.body.message, 'Event deleted successfully');
  t.end();
});

tap.test('GET /events/:id - Confirm event is deleted', async (t) => {
  const res = await server.get(`/events/${createdEventId}`);
  t.equal(res.status, 404);
  t.end();
});

// Teardown
tap.teardown(() => {
  process.exit(0);
});
