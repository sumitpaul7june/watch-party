import { useState, useContext } from "react";
import { useNavigate } from "react-router";
import { registerUserSchema } from "../../utils/authValidators";
import { AuthContext } from "../../context/AuthContext.jsx";



export const RegisterPage = () => {

    // 1. Local State for Controlled Inputs
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    
    // 2. Global State (API Functions)
    const {register} = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        // Prevent default form submission (page reload)
        e.preventDefault();
        
        // 3. Frontend Validation Phase (Zod)
        const result = registerUserSchema.safeParse({name, username, email, password, confirmPassword});

        if(!result.success)
        {
            setErrorMessage(result.error.issues[0].message);
            return;
        }

        // 4. Backend API Phase
        const response = await register(name, username, email, password);
    
        if(!response.success)
        {
            setErrorMessage(response.error);
            return;
        }
        else
        {
            console.log("Successfully registered in");
            navigate("/");
        }


        setErrorMessage("");
    }

    

    return(
        <div>
            <h2>Sign Up for Watch Party</h2>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: "10px" }}>
                    Name: 
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                
                <div style={{ marginBottom: "10px" }}>
                    Username: 
                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
                </div>

                <div style={{ marginBottom: "10px" }}>
                    Email: 
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>

                <div style={{ marginBottom: "10px" }}>
                    Password: 
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>

                <div style={{ marginBottom: "15px" }}>
                    Confirm Password: 
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </div>

                
                <span style={{ color: "red", display: "block", fontSize: "12px", marginBottom: "10px" }}>
                    {errorMessage}
                </span>

                <button type="submit">Sign Up</button>
            </form>

        </div>

    );
}