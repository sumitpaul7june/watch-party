import bcrypt from 'bcrypt';
import { pool } from '../config/db.js';
import jwt from 'jsonwebtoken';

// --- REGISTER CONTROLLER ---
// Handles new user signups by cryptographically hashing the password 
// before persisting to PostgreSQL, and issues a 7-day JWT token on success.
export const registerUser = async (req, res) => {
    const { username, password } = req.body;

    // 1. Input Validation
    // Ensure the client provided the required payload
    if (!username || !password) {
        return res.status(400).json({ error: "Missing username or password" });
    };

    try {
        // 2. Cryptographic Hashing
        // Generate a random "salt" to prevent rainbow table attacks, 
        // then hash the password so it is never stored in plaintext.
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // 3. Database Persistence
        // Use parameterized queries ($1, $2) to prevent SQL injection attacks.
        const SQL = `INSERT INTO users(username, password_hash) VALUES ($1, $2) RETURNING id, username, created_at`;
        const result = await pool.query(SQL, [username, passwordHash]);
        const newUser = result.rows[0];

        // 4. Token Generation
        // Create a JWT payload containing the user's non-sensitive data and sign it securely.
        const token = jwt.sign({ id: newUser.id, username: newUser.username }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({ message: "User created", user: newUser, token });

    } catch (err) {
        // Handle Postgres unique constraint violation gracefully (Error code 23505 = unique_violation)
        if (err.code === '23505') {
            return res.status(400).json({ error: 'Username already taken' });
        }

        res.status(500).json({ error: 'Server error' });
    }
};

// --- LOGIN CONTROLLER ---
// Verifies user credentials against the database and issues a 7-day JWT token on success.
export const loginUser = async (req, res) => {
    const { username, password } = req.body;

    // 1. Input Validation
    if (!username || !password) {
        return res.status(400).json({ error: `Missing username or password` });
    }

    try {
        // 2. Database Lookup
        // Attempt to find the user by their username
        const SQL = 'SELECT * FROM users WHERE username = $1';
        const result = await pool.query(SQL, [username]);
        const user = result.rows[0];

        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // 3. Password Verification
        // Use bcrypt to safely compare the incoming plaintext password against the stored hash
        const validPassword = await bcrypt.compare(password, user.password_hash)
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // 4. Token Generation
        const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' })

        res.json({ message: "Login successful", user: { id: user.id, username: user.username }, token });

    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

// --- GUEST CONTROLLER ---

// Utility data for generating random, fun usernames for guest sessions
const adjectives = ['Brave', 'Swift', 'Cosmic', 'Chill', 'Funky', 'Sneaky', 'Wild', 'Zen', 'Lucky', 'Epic', 'Mystic', 'Turbo', 'Jolly', 'Shadow', 'Neon'];
const animals = ['Panda', 'Falcon', 'Fox', 'Otter', 'Wolf', 'Penguin', 'Tiger', 'Koala', 'Eagle', 'Dolphin', 'Lynx', 'Owl', 'Raven', 'Bear', 'Hawk'];

// Helper function to combine a random adjective with a random animal
function generateGuestName() {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const animal = animals[Math.floor(Math.random() * animals.length)];
    return `${adj}${animal}`;
}

// Generates a temporary guest token for users joining a room without an account.
// This allows guests to participate in real-time WebSockets without needing database persistence.
export const generateGuestToken = async (req, res) => {
    try {
        // 1. Generate a random identity
        // A unique guest ID is generated to prevent collision in WebSockets
        const guestId = `guest_${Math.random().toString(36).substring(2, 9)}`;
        const guestUsername = generateGuestName();
        const fakeUser = { id: guestId, username: guestUsername };

        // 2. Token Generation
        // Sign a real JWT token, but restrict its validity to 24 hours
        const token = jwt.sign(fakeUser, process.env.JWT_SECRET, { expiresIn: '24h' });

        res.status(200).json({ message: "Guest session created", user: fakeUser, token });
    } catch (err) {
        res.status(500).json({ error: 'Server error generating guest token' });
    }
}
