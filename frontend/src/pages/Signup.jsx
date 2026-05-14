import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import "./Auth.css";

const Signup = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login, register, googleLogin } = useAuthContext();

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError(null);
    try {
      const publicKey = await googleLogin(credentialResponse.credential);
      const backendUrl = import.meta.env.MODE === "development" ? "http://localhost:5000" : "";
      const res = await axios.post(`${backendUrl}/api/auth/google`, {
        token: credentialResponse.credential,
        publicKey,
      });
      login(res.data);
    } catch (err) {
      setError("Google Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // 1. Generate RSA Key Pair locally
      const publicKey = await register();

      // 2. Send user data including public key to backend
      const backendUrl = import.meta.env.MODE === "development" ? "http://localhost:5000" : "";
      const res = await axios.post(`${backendUrl}/api/auth/signup`, {
        username,
        email,
        password,
        publicKey,
      });

      // 3. Login with returned user data
      login(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass-panel animate-fade-in">
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Join the secure chat platform</p>
        
        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              className="input-field"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              className="input-field"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary auth-submit" disabled={loading}>
            {loading ? "Generating Encryption Keys..." : "Sign Up"}
          </button>
          
          <div className="divider">
             <span>OR</span>
          </div>

          <div className="google-btn-wrapper">
             <GoogleLogin
               onSuccess={handleGoogleSuccess}
               onError={() => setError("Google Signup Failed")}
               theme="filled_black"
               shape="pill"
             />
          </div>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
