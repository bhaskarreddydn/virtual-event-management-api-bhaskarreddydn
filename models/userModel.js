const crypto = require('crypto');

// In-memory data store for users
const users = [];

const userModel = {
  users,

  findAll() {
    return users;
  },

  findByEmail(email) {
    if (!email) return null;
    return users.find(u => u.email.toLowerCase() === email.trim().toLowerCase()) || null;
  },

  findById(id) {
    if (!id) return null;
    return users.find(u => u.id === id) || null;
  },

  create(userData) {
    const newUser = {
      id: crypto.randomUUID ? crypto.randomUUID() : `usr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name: userData.name.trim(),
      email: userData.email.trim().toLowerCase(),
      password: userData.password,
      role: userData.role || 'attendee',
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    return newUser;
  },

  reset() {
    users.length = 0;
  }
};

module.exports = userModel;
