import { useState, createContext, useEffect } from "react"; 
import { loginApi, registerApi, loginAsGuestApi } from "../api/authApi.js";
import { socket } from "../socket.js";


// 1. Create the globally accessible Context
export const AuthContext = createContext();

// 2. The Provider component that wraps the app and manages state
export const AuthProvider = ({children}) => {
    
    // I hold the logged-in user's data globally so any component can read it
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('watchPartyUser');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    // Automatically connect the socket if the user refreshes the page and is already logged in
    useEffect(() => {
        if (user) {
            socket.connect();
        }
    }, [user]);

    // --- LOGIN LOGIC ---
    // Authenticates an existing user and stores their JWT token and user profile in localStorage.
    // Also explicitly establishes the WebSocket connection post-login.
    const login = async (username, password) => {
        try
        {
            const data = await loginApi(username, password);
            setUser(data.user);
            localStorage.setItem('watchPartyUser', JSON.stringify(data.user));
            localStorage.setItem('watchPartyToken', data.token);
            
            socket.connect(); 
            return {success: true};

        }
        catch(error)
        {
            return {success: false, error: error.response?.data?.error || "Login failed"};
        }
    }

    // --- REGISTER LOGIC ---
    // Registers a new user, saves their session data to localStorage, and connects the socket.
    const register = async(name, username, email, password) => {
        try
        {
            const data = await registerApi(name, username, email, password);
            setUser(data.user);
            localStorage.setItem('watchPartyUser', JSON.stringify(data.user));
            localStorage.setItem('watchPartyToken', data.token);
            
            socket.connect(); 
            return {success: true};
        }
        catch(error)
        {
            return {success: false, error: error.response?.data?.error || "Registration failed"};
        }
    }

    // --- LOGOUT LOGIC ---
    // Clears the user's session data and forcefully disconnects the WebSocket.
    const logout = () => {
        setUser(null);
        localStorage.removeItem('watchPartyUser');
        localStorage.removeItem('watchPartyToken');
        
        socket.disconnect(); // Kicks them out of the socket
    }

    // --- GUEST LOGIC ---
    // Generates a temporary guest token from the backend for users who just want to join a room quickly.
    const loginAsGuest = async () => {
        try
        {
            const data = await loginAsGuestApi();
            setUser(data.user);
            localStorage.setItem('watchPartyUser', JSON.stringify(data.user));
            localStorage.setItem('watchPartyToken', data.token);
            socket.connect();
            
            return {success: true};
        }
        catch(error)
        {
            console.error("Failed to generate token", error);
            return {success: false};
            
        }
    }

    // 3. Share the state AND the functions with the rest of the app
    return(
        <AuthContext.Provider value={{user, setUser, login, register, logout, loginAsGuest}}>
            {children}
        </AuthContext.Provider>
    )
}
