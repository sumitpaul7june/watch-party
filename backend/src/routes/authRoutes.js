import express from 'express';
import { registerUser, loginUser } from '../controllers/authController.js';

const router = express.Router();

// --- 1. REGISTER ROUTE ---
router.post('/register', registerUser);

// --- 2. LOGIN ROUTE ---
router.post('/login', loginUser);

export default router;