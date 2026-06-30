import { CONFIG } from "../config.js";

/**
 * AuthService
 * 
 * Functional service responsible strictly for authentication.
 * Data Flow: Makes a REST call to the Node.js backend to retrieve a stateless JWT guest token.
 * This token is required for establishing authenticated WebSocket connections.
 */
export async function getGuestToken() {
    try {
        const response = await fetch(`${CONFIG.BACKEND_URL}/api/auth/guest`);
        const data = await response.json();
        return data.token;
    } catch (error) {
        console.error("AuthService: Failed to fetch guest token", error);
        return null;
    }
}
