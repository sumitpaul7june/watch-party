import { useState, createContext, useEffect } from "react"; 
import { loginApi, registerApi, loginAsGuestApi } from "../api/authApi.js";
import { socket } from "../socket.js";


// 1. Create the globally accessible Context
export const AuthContext = createContext();

// 2. The Provider component that wraps our app and manages state
export const AuthProvider = ({children}) => {
    
    // Hold the logged-in user's data globally so any component can read it
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('watchPartyUser');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    // Automatically connect the socket if the user refreshes the page and is already logged in!
    useEffect(() => {
        if (user) {
            socket.connect();
        }
    }, [user]);

    // --- LOGIN LOGIC ---
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
    const logout = () => {
        setUser(null);
        localStorage.removeItem('watchPartyUser');
        localStorage.removeItem('watchPartyToken');
        
        socket.disconnect(); // 🔥 KICK THEM OUT OF THE SOCKET
    }

    // --- GUEST LOGIC ---
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

    // 3. Share the state AND the functions with the rest of the app!
    return(
        <AuthContext.Provider value={{user, setUser, login, register, logout, loginAsGuest}}>
            {children}
        </AuthContext.Provider>
    )
}
