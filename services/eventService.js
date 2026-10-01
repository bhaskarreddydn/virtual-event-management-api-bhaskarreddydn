const eventModel = require('../models/eventModel');
const emailService = require('./emailService');

const eventService = {
  /**
   * Create an event (Organizers only)
   */
  async createEvent(eventData, currentUser) {
    if (!currentUser || currentUser.role !== 'organizer') {
      throw new Error('Unauthorized: Only event organizers can create events');
    }

    const { title, description, date, time, location, category, capacity } = eventData;

    if (!title || !date || !time) {
      throw new Error('Missing required fields: title, date, and time are required');
    }

    const newEvent = eventModel.create({
      title,
      description: description || '',
      date,
      time,
      location: location || 'Virtual (Online)',
      category: category || 'General',
      capacity: capacity !== undefined ? capacity : null,
      organizerId: currentUser.id,
      organizerEmail: currentUser.email,
      organizerName: currentUser.name
    });

    return newEvent;
  },

  /**
   * Get all events with optional filtering
   */
  async getAllEvents(filters = {}) {
    return eventModel.findAll(filters);
  },

  /**
   * Get single event by ID
   */
  async getEventById(id) {
    const event = eventModel.findById(id);
    if (!event) {
      throw new Error('Event not found');
    }
    return event;
  },

  /**
   * Update event (Organizer only - creator of event)
   */
  async updateEvent(id, updateData, currentUser) {
    if (!currentUser || currentUser.role !== 'organizer') {
      throw new Error('Unauthorized: Only event organizers can update events');
    }

    const event = eventModel.findById(id);
    if (!event) {
      throw new Error('Event not found');
    }

    // Check ownership if organizer is not the creator
    if (event.organizerId && event.organizerId !== currentUser.id) {
      throw new Error('Forbidden: You can only update your own events');
    }

    const updatedEvent = eventModel.update(id, updateData);
    return updatedEvent;
  },

  /**
   * Delete event (Organizer only - creator of event)
   */
  async deleteEvent(id, currentUser) {
    if (!currentUser || currentUser.role !== 'organizer') {
      throw new Error('Unauthorized: Only event organizers can delete events');
    }

    const event = eventModel.findById(id);
    if (!event) {
      throw new Error('Event not found');
    }

    if (event.organizerId && event.organizerId !== currentUser.id) {
      throw new Error('Forbidden: You can only delete your own events');
    }

    const deleted = eventModel.delete(id);
    return deleted;
  },

  /**
   * Register authenticated user for an event
   */
  async registerForEvent(eventId, currentUser) {
    if (!currentUser) {
      throw new Error('Authentication required to register for events');
    }

    const event = eventModel.findById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    // Check if user is already registered
    const isAlreadyRegistered = event.participants.some(
      p => p.userId === currentUser.id || p.email.toLowerCase() === currentUser.email.toLowerCase()
    );
    if (isAlreadyRegistered) {
      throw new Error('Already registered for this event');
    }

    // Check capacity if set
    if (event.capacity && event.participants.length >= event.capacity) {
      throw new Error('Event is full: capacity limit reached');
    }

    // Add participant
    const participant = eventModel.addParticipant(eventId, {
      userId: currentUser.id,
      name: currentUser.name,
      email: currentUser.email
    });

    // Send email notification asynchronously using Promise / async-await
    let emailResult = null;
    try {
      emailResult = await emailService.sendRegistrationConfirmation(currentUser, event);
    } catch (err) {
      console.error('[EventService] Email notification error:', err.message);
      emailResult = { success: false, error: err.message };
    }

    return {
      message: 'Successfully registered for event',
      event: {
        id: event.id,
        title: event.title,
        date: event.date,
        time: event.time,
        location: event.location
      },
      participant,
      emailSent: emailResult ? emailResult.success : false,
      previewUrl: emailResult && emailResult.previewUrl ? emailResult.previewUrl : null
    };
  },

  /**
   * Get participant list for an event
   */
  async getEventParticipants(eventId, currentUser) {
    const event = eventModel.findById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }
    return event.participants;
  },

  /**
   * Get events that user is registered for
   */
  async getUserRegistrations(userId) {
    return eventModel.findUserRegistrations(userId);
  },

  /**
   * Cancel user registration for an event
   */
  async cancelRegistration(eventId, userId) {
    const event = eventModel.findById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    const removed = eventModel.removeParticipant(eventId, userId);
    if (!removed) {
      throw new Error('Registration not found');
    }
    return true;
  }
};

module.exports = eventService;
