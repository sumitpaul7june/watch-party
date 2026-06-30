import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUserSchema } from "../../utils/authValidators";
import { AuthContext } from "../../context/AuthContext.jsx";
import "./Auth.css";

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
        <div className="auth-page-container">
            <div className="auth-card">
                <h2 className="auth-title">Create Account</h2>
                
                {errorMessage && <div className="error-message">{errorMessage}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input 
                            type="text" 
                            placeholder="John Doe"
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                        />
                    </div>
                    
                    <div className="form-group">
                        <label className="form-label">Username</label>
                        <input 
                            type="text" 
                            placeholder="johndoe123"
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)} 
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input 
                            type="email" 
                            placeholder="john@example.com"
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input 
                            type="password" 
                            placeholder="Create a strong password"
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Confirm Password</label>
                        <input 
                            type="password" 
                            placeholder="Repeat your password"
                            value={confirmPassword} 
                            onChange={(e) => setConfirmPassword(e.target.value)} 
                        />
                    </div>

                    <button type="submit" className="btn-primary" style={{marginTop: '8px'}}>Sign Up</button>
                </form>

                <div className="auth-footer">
                    Already have an account? <Link to="/login" className="auth-link">Log In</Link>
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