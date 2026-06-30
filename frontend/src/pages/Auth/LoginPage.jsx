import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUserSchema } from "../../utils/authValidators.js";
import { AuthContext } from "../../context/AuthContext.jsx";
import "./Auth.css";

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
        <div className="auth-page-container">
            <div className="auth-card">
                <h2 className="auth-title">Welcome Back</h2>
                
                {errorMessage && <div className="error-message">{errorMessage}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Username</label>
                        <input 
                            type="text" 
                            placeholder="Enter your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input 
                            type="password" 
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    
                    <button type="submit" className="btn-primary" style={{marginTop: '8px'}}>
                        Log In
                    </button>
                </form>

                <div className="auth-footer">
                    Don't have an account? <Link to="/register" className="auth-link">Sign up</Link>
                    <div style={{ marginTop: '12px' }}>
                        <Link to="/" className="auth-link" style={{ color: 'var(--text-muted)' }}>
                            Continue as Guest
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}