const authService = require('../services/authService');

const authController = {
  /**
   * Handle user registration
   * POST /register
   */
  async register(req, res) {
    try {
      const user = await authService.register(req.body);
      return res.status(201).json({
        message: 'User registered successfully',
        user
      });
    } catch (error) {
      if (
        error.message.includes('Missing required fields') ||
        error.message.includes('Invalid email') ||
        error.message.includes('Password must be') ||
        error.message.includes('User already exists')
      ) {
        return res.status(400).json({ error: error.message });
      }
      console.error('[authController.register]', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  /**
   * Handle user login
   * POST /login
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      return res.status(200).json({
        message: 'Login successful',
        token: result.token,
        user: result.user
      });
    } catch (error) {
      if (
        error.message.includes('Invalid credentials') ||
        error.message.includes('Missing required fields')
      ) {
        return res.status(401).json({ error: error.message });
      }
      console.error('[authController.login]', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  /**
   * Get current user profile
   * GET /me
   */
  async getProfile(req, res) {
    try {
      const user = authService.getUserById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      return res.status(200).json({ user });
    } catch (error) {
      console.error('[authController.getProfile]', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = authController;
