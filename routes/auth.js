const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

// Public authentication routes
router.post('/register', authController.register);
router.post('/signup', authController.register); // Alias for convenience
router.post('/login', authController.login);

// Protected profile route
router.get('/me', verifyToken, authController.getProfile);

module.exports = router;
