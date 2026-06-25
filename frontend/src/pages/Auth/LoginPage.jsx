import { useState, useContext } from "react";
import { useNavigate } from "react-router";
import { loginUserSchema } from "../../utils/authValidators.js";
import { AuthContext } from "../../context/AuthContext.jsx";


export const LoginPage = () => {
    
    // 1. Local State for Controlled Inputs
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    
    // 2. Global State (API Functions)
    const {login} = useContext(AuthContext);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        // Prevent default form submission (page reload)
        e.preventDefault(); 
        
        // 3. Frontend Validation Phase (Zod)
        const result = loginUserSchema.safeParse({username, password});

        // Check if Zod found any errors
        if(!result.success)
        {
            setErrorMessage(result.error.issues[0].message);
            return;
        }

        // 4. Backend API Phase
        const response = await login(username, password);

        if(!response.success)
        {
            setErrorMessage(response.error);
        }
        else
        {
            console.log("Successfully logged in");
            navigate("/");
            
        }

        setErrorMessage("");
        
        
    }

    return(
        <div>
            <h2>Login to Watch Party</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    Username: 
                    <input 
                        type="text" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </div>
                <div>
                    Password: 
                    <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <span style={{ color: "red", fontSize: "12px" }}>{errorMessage}</span>
                <button type="submit">Submit</button>

            </form>
        </div>
        
    );
}