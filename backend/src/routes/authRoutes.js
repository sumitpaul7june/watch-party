import express from 'express';
import { registerUser, loginUser, generateGuestToken } from '../controllers/authController.js';

// Initializes a new Express Router instance to handle authentication-related endpoints
const router = express.Router();

// Creates a new user account, hashes the password, and returns a JWT token
router.post('/register', registerUser);

// Authenticates an existing user and returns a JWT token
router.post('/login', loginUser);

// Generates a temporary guest JWT token for users joining a room without an account
router.get('/guest', generateGuestToken);

export default router;