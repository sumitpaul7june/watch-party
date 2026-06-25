import { useState, createContext} from "react"; 
import { loginApi, registerApi } from "../api/authApi.js";



// 1. Create the globally accessible Context
export const AuthContext = createContext();

// 2. The Provider component that wraps our app and manages state
export const AuthProvider = ({children}) => {
    
    // Hold the logged-in user's data globally so any component can read it
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('watchPartyUser');
        
        
        return savedUser ? JSON.parse(savedUser) : null;
    });

    


    // --- LOGIN LOGIC ---
    const login = async (username, password) => {
        try
        {
            const data = await loginApi(username, password);
            setUser(data.user);
            localStorage.setItem('watchPartyUser', JSON.stringify(data.user));
            localStorage.setItem('watchPartyToken', data.token);
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
            return {success: true};
        }
        catch(error)
        {
            return {success: false, error: error.response?.data?.error || "Registration failed"};
        }
    }

    const logout = () => {
        setUser(null);
        localStorage.removeItem('watchPartyUser');
        localStorage.removeItem('watchPartyToken');
    }

    // 3. Share the state AND the functions with the rest of the app!
    return(
        <AuthContext.Provider value={{user, setUser, login, register, logout}}>
            {children}
        </AuthContext.Provider>
    )
}
