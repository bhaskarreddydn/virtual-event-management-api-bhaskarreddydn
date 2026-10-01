const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Event CRUD routes
router.get('/', eventController.getAllEvents);
router.post('/', verifyToken, requireRole('organizer'), eventController.createEvent);

// User's own registered events (placed before :id to prevent route clash)
router.get('/user/registrations', verifyToken, eventController.getUserRegistrations);

router.get('/:id', eventController.getEventById);
router.put('/:id', verifyToken, requireRole('organizer'), eventController.updateEvent);
router.delete('/:id', verifyToken, requireRole('organizer'), eventController.deleteEvent);

// Participant management routes
router.post('/:id/register', verifyToken, eventController.registerForEvent);
router.delete('/:id/register', verifyToken, eventController.cancelRegistration);
router.get('/:id/participants', verifyToken, eventController.getEventParticipants);

module.exports = router;
