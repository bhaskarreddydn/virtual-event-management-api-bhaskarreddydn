const eventService = require('../services/eventService');

const eventController = {
  /**
   * Create a new event
   * POST /events
   */
  async createEvent(req, res) {
    try {
      const event = await eventService.createEvent(req.body, req.user);
      return res.status(201).json({
        message: 'Event created successfully',
        event
      });
    } catch (error) {
      if (error.message.includes('Missing required fields')) {
        return res.status(400).json({ error: error.message });
      }
      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({ error: error.message });
      }
      console.error('[eventController.createEvent]', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  /**
   * Get all events
   * GET /events
   */
  async getAllEvents(req, res) {
    try {
      const { category, date, organizerId } = req.query;
      const events = await eventService.getAllEvents({ category, date, organizerId });
      return res.status(200).json({
        total: events.length,
        events
      });
    } catch (error) {
      console.error('[eventController.getAllEvents]', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  /**
   * Get event details by ID
   * GET /events/:id
   */
  async getEventById(req, res) {
    try {
      const event = await eventService.getEventById(req.params.id);
      return res.status(200).json({ event });
    } catch (error) {
      if (error.message === 'Event not found') {
        return res.status(404).json({ error: error.message });
      }
      console.error('[eventController.getEventById]', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  /**
   * Update an event
   * PUT /events/:id
   */
  async updateEvent(req, res) {
    try {
      const updatedEvent = await eventService.updateEvent(req.params.id, req.body, req.user);
      return res.status(200).json({
        message: 'Event updated successfully',
        event: updatedEvent
      });
    } catch (error) {
      if (error.message === 'Event not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('Forbidden') || error.message.includes('Unauthorized')) {
        return res.status(403).json({ error: error.message });
      }
      console.error('[eventController.updateEvent]', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  /**
   * Delete an event
   * DELETE /events/:id
   */
  async deleteEvent(req, res) {
    try {
      await eventService.deleteEvent(req.params.id, req.user);
      return res.status(200).json({ message: 'Event deleted successfully' });
    } catch (error) {
      if (error.message === 'Event not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('Forbidden') || error.message.includes('Unauthorized')) {
        return res.status(403).json({ error: error.message });
      }
      console.error('[eventController.deleteEvent]', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  /**
   * Register attendee for an event
   * POST /events/:id/register
   */
  async registerForEvent(req, res) {
    try {
      const result = await eventService.registerForEvent(req.params.id, req.user);
      return res.status(201).json(result);
    } catch (error) {
      if (error.message === 'Event not found') {
        return res.status(404).json({ error: error.message });
      }
      if (
        error.message.includes('Already registered') ||
        error.message.includes('Event is full')
      ) {
        return res.status(400).json({ error: error.message });
      }
      if (error.message.includes('Authentication required')) {
        return res.status(401).json({ error: error.message });
      }
      console.error('[eventController.registerForEvent]', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  /**
   * Get participants for an event
   * GET /events/:id/participants
   */
  async getEventParticipants(req, res) {
    try {
      const participants = await eventService.getEventParticipants(req.params.id, req.user);
      return res.status(200).json({
        total: participants.length,
        participants
      });
    } catch (error) {
      if (error.message === 'Event not found') {
        return res.status(404).json({ error: error.message });
      }
      console.error('[eventController.getEventParticipants]', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  /**
   * Get current user's registered events
   * GET /events/registrations OR GET /registrations
   */
  async getUserRegistrations(req, res) {
    try {
      const registrations = await eventService.getUserRegistrations(req.user.id);
      return res.status(200).json({
        total: registrations.length,
        registrations
      });
    } catch (error) {
      console.error('[eventController.getUserRegistrations]', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  /**
   * Cancel attendee registration
   * DELETE /events/:id/register
   */
  async cancelRegistration(req, res) {
    try {
      await eventService.cancelRegistration(req.params.id, req.user.id);
      return res.status(200).json({ message: 'Registration cancelled successfully' });
    } catch (error) {
      if (error.message === 'Event not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Registration not found') {
        return res.status(400).json({ error: error.message });
      }
      console.error('[eventController.cancelRegistration]', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = eventController;
