require('dotenv').config();
const express = require('express');
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const eventController = require('./controllers/eventController');
const { verifyToken } = require('./middleware/auth');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();
const port = process.env.PORT || 3000;

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'Virtual Event Management API' });
});

// Authentication routes (supporting POST /register and POST /login directly at root, plus /auth and /users prefixes)
app.use('/', authRoutes);
app.use('/auth', authRoutes);
app.use('/users', authRoutes);

// Event management routes (GET, POST, PUT, DELETE /events and /events/:id/register)
app.use('/events', eventRoutes);

// User registrations shortcut
app.get('/registrations', verifyToken, eventController.getUserRegistrations);

// 404 & Centralized Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Start server only when executed directly (not when required by tests)
if (require.main === module) {
  app.listen(port, () => {
    console.log(`[Virtual Event Server] listening on port ${port}`);
  });
}

module.exports = app;
