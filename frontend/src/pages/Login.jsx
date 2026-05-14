import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import "./Auth.css";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login, googleLogin } = useAuthContext();

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
      setError("Google Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const backendUrl = import.meta.env.MODE === "development" ? "http://localhost:5000" : "";
      const res = await axios.post(`${backendUrl}/api/auth/login`, { username, password });
      login(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass-panel animate-fade-in">
        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Log in to continue chatting</p>
        
        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              className="input-field"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary auth-submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
          
          <div className="divider">
             <span>OR</span>
          </div>

          <div className="google-btn-wrapper">
             <GoogleLogin
               onSuccess={handleGoogleSuccess}
               onError={() => setError("Google Login Failed")}
               theme="filled_black"
               shape="pill"
             />
          </div>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
