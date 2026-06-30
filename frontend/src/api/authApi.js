import axios from 'axios';

// Attach the JWT token to every single request automatically
axios.interceptors.request.use((req) => {
    const token = localStorage.getItem('watchPartyToken');
    if (token) {
        req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
})

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

// --- API LAYER ---
// I keep all backend HTTP requests here to ensure my React components stay clean and focused only on UI.

/**
 * Authenticates a user and retrieves a JWT token.
 * @param {string} username 
 * @param {string} password 
 * @returns {object} The authentication response containing user data and token.
 */
export const loginApi = async (username, password) => {
    const response = await axios.post(`${API_URL}/api/auth/login`, { username, password });
    return response.data;
};

/**
 * Registers a new user account.
 * @param {string} name 
 * @param {string} username 
 * @param {string} email 
 * @param {string} password 
 * @returns {object} The registration response.
 */
export const registerApi = async (name, username, email, password) => {
    const response = await axios.post(`${API_URL}/api/auth/register`, { name, username, email, password });
    return response.data;
};

/**
 * Authenticates the user as an anonymous guest to allow access to rooms without an account.
 * @returns {object} Guest authentication response containing a temporary token.
 */
export const loginAsGuestApi = async () => {
    const response = await axios.get(`${API_URL}/api/auth/guest`);
    return response.data;
}