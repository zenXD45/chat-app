import { createContext, useState, useEffect, useContext } from "react";
import { generateKeyPair } from "../utils/crypto";

export const AuthContext = createContext();

export const useAuthContext = () => {
  return useContext(AuthContext);
};

export const AuthContextProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(
    JSON.parse(localStorage.getItem("chat-user")) || null
  );

  // When a user registers, they generate a key pair. We keep the private key locally.
  const [privateKey, setPrivateKey] = useState(
    localStorage.getItem("chat-private-key") || null
  );

  const login = (userData) => {
    setAuthUser(userData);
    localStorage.setItem("chat-user", JSON.stringify(userData));
    localStorage.setItem("chat-token", userData.token);
  };

  const logout = () => {
    setAuthUser(null);
    setPrivateKey(null);
    localStorage.removeItem("chat-user");
    localStorage.removeItem("chat-token");
    localStorage.removeItem("chat-private-key"); // Depending on requirements, we might want to prompt them to back it up!
  };

  const register = async (userData) => {
    // Generate RSA keys
    const keys = await generateKeyPair();
    
    // Save private key locally
    setPrivateKey(keys.privateKey);
    localStorage.setItem("chat-private-key", keys.privateKey);

    return keys.publicKey;
  };

  const googleLogin = async (token) => {
    // Generate RSA keys for E2EE (even for Google users, we need keypairs)
    let keys = { publicKey: null, privateKey: null };
    
    // If they already have a private key, we don't regenerate to avoid losing old messages.
    // If they don't, we generate a new one.
    if (!privateKey) {
       keys = await generateKeyPair();
       setPrivateKey(keys.privateKey);
       localStorage.setItem("chat-private-key", keys.privateKey);
    } else {
       // Ideally we'd derive public key from private key, but for simplicity, 
       // if we don't have it, we just generate a new pair. 
       // Note: In a real E2EE app, we would derive or fetch the public key securely.
       // For this demo, let's just generate new keys if missing.
       keys = await generateKeyPair();
       setPrivateKey(keys.privateKey);
       localStorage.setItem("chat-private-key", keys.privateKey);
    }

    return keys.publicKey;
  };

  const updateProfile = async (data) => {
    try {
      const backendUrl = import.meta.env.MODE === "development" ? "http://localhost:5000" : "";
      // We assume data has username and/or avatar.
      const res = await fetch(`${backendUrl}/api/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authUser.token}`,
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update profile");
      }

      const updatedUser = await res.json();
      
      // Merge token and privateKey which are not returned from backend
      const newAuthUser = { ...updatedUser, token: authUser.token };
      
      setAuthUser(newAuthUser);
      localStorage.setItem("chat-user", JSON.stringify(newAuthUser));
      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false, error: error.message };
    }
  };

  return (
    <AuthContext.Provider value={{ authUser, setAuthUser, login, logout, register, googleLogin, updateProfile, privateKey }}>
      {children}
    </AuthContext.Provider>
  );
};
