import bcrypt from 'bcrypt';
import { pool } from '../config/db.js';
import jwt from 'jsonwebtoken';

// --- REGISTER CONTROLLER ---
// Handles new user signups. I hash the password before saving to Postgres and issue a 7-day JWT.
export const registerUser = async (req, res) => {
    const { username, password } = req.body;

    // 1. Basic Backend Validation
    if (!username || !password) {
        return res.status(400).json({ error: "Missing username or password" });
    };
    try {
        // 2. Cryptographically secure the password
        const salt = await bcrypt.genSalt(10);
        const passworHash = await bcrypt.hash(password, salt);

        // 3. Persist to Postgres database
        const SQL = `INSERT INTO users(username, password_hash) VALUES ($1, $2) RETURNING id, username, created_at`;
        const result = await pool.query(SQL, [username, passworHash]);
        const newUser = result.rows[0];

        // 4. Generate a secure token so they don't have to log in again immediately
        const token = jwt.sign({ id: newUser.id, username: newUser.username }, process.env.JWT_SECRET, { expiresIn: '7d' });

        // Return 201 Created status
        res.status(201).json({ message: "User created", user: newUser, token });

    }
    catch (err) {
        // Handle Postgres unique constraint violation gracefully
        if (err.code === '23505') {
            return res.status(400).json({ error: 'Username already taken' });
        }

        res.status(500).json({ error: 'Server error' });
    }
};

// --- LOGIN CONTROLLER ---
// Verifies credentials against the DB and issues a 7-day JWT on success.
export const loginUser = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: `Missing username or password` });
    }

    try {
        // 1. Check if the user exists in Postgres
        const SQL = 'SELECT * FROM users WHERE username = $1';
        const result = await pool.query(SQL, [username]);
        const user = result.rows[0];

        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // 2. Compare the plaintext password attempt with the hashed password in the DB
        const validPassword = await bcrypt.compare(password, user.password_hash)
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // 3. Generate the VIP pass (JWT)
        const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' })

        // Return standard 200 OK
        res.json({ message: "Login successful", user: { id: user.id, username: user.username }, token });

    }
    catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};


// --- GUEST CONTROLLER ---

export const generateGuestToken = async (req, res) => {
    try {
        // 1. Generate a random identity
        const guestId = `guest_${Math.random().toString(36).substring(2, 9)}`;
        const guestUsername = `Guest_${Math.floor(Math.random() * 10000)}`;
        const fakeUser = { id: guestId, username: guestUsername };

        // 2. Sign a real JWT token valid for 24 hours
        const token = jwt.sign(fakeUser, process.env.JWT_SECRET, { expiresIn: '24h' });
        // 3. Return it just like a normal login
        res.status(200).json({ message: "Guest session created", user: fakeUser, token });
    }

    catch (err) {
        res.status(500).json({ error: 'Server error generating guest token' });

    }

}
