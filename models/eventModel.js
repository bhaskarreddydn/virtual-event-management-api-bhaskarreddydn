const crypto = require('crypto');

// In-memory data store for events
const events = [];

const eventModel = {
  events,

  findAll(filters = {}) {
    let result = [...events];
    if (filters.category) {
      result = result.filter(e => e.category && e.category.toLowerCase() === filters.category.toLowerCase());
    }
    if (filters.date) {
      result = result.filter(e => e.date === filters.date);
    }
    if (filters.organizerId) {
      result = result.filter(e => e.organizerId === filters.organizerId);
    }
    return result;
  },

  findById(id) {
    if (!id) return null;
    return events.find(e => e.id === id) || null;
  },

  create(data) {
    const newEvent = {
      id: crypto.randomUUID ? crypto.randomUUID() : `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      title: data.title.trim(),
      description: data.description ? data.description.trim() : '',
      date: data.date,
      time: data.time,
      location: data.location || 'Virtual (Google Meet / Zoom)',
      category: data.category || 'General',
      capacity: data.capacity !== undefined && data.capacity !== null ? Number(data.capacity) : null,
      organizerId: data.organizerId,
      organizerEmail: data.organizerEmail,
      organizerName: data.organizerName || 'Organizer',
      participants: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    events.push(newEvent);
    return newEvent;
  },

  update(id, data) {
    const event = this.findById(id);
    if (!event) return null;

    if (data.title !== undefined) event.title = data.title.trim();
    if (data.description !== undefined) event.description = data.description.trim();
    if (data.date !== undefined) event.date = data.date;
    if (data.time !== undefined) event.time = data.time;
    if (data.location !== undefined) event.location = data.location;
    if (data.category !== undefined) event.category = data.category;
    if (data.capacity !== undefined) event.capacity = data.capacity !== null ? Number(data.capacity) : null;
    
    event.updatedAt = new Date().toISOString();
    return event;
  },

  delete(id) {
    const index = events.findIndex(e => e.id === id);
    if (index === -1) return false;
    events.splice(index, 1);
    return true;
  },

  addParticipant(eventId, participant) {
    const event = this.findById(eventId);
    if (!event) return null;

    const record = {
      userId: participant.userId,
      name: participant.name,
      email: participant.email.toLowerCase(),
      registeredAt: new Date().toISOString()
    };

    event.participants.push(record);
    return record;
  },

  removeParticipant(eventId, userId) {
    const event = this.findById(eventId);
    if (!event) return false;

    const initialLength = event.participants.length;
    event.participants = event.participants.filter(p => p.userId !== userId);
    return event.participants.length < initialLength;
  },

  findUserRegistrations(userId) {
    return events.filter(e => e.participants.some(p => p.userId === userId));
  },

  reset() {
    events.length = 0;
  }
};

module.exports = eventModel;
