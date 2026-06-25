import axios from 'axios';

// Attach the JWT token to every single request automatically
axios.interceptors.request.use((req) => {
    const token = localStorage.getItem('watchPartyToken');
    if (token) {
        req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
})

// --- API LAYER ---
// I keep all backend HTTP requests here to ensure my React components stay clean and focused only on UI.
export const loginApi = async (username, password) => {
    const response = await axios.post('http://localhost:8080/api/auth/login', { username, password });
    return response.data;
};

export const registerApi = async (name, username, email, password) => {
    const response = await axios.post('http://localhost:8080/api/auth/register', { name, username, email, password });
    return response.data;
};
