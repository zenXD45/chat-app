import bcryptjs from "bcryptjs";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import { OAuth2Client } from "google-auth-library";



export const signup = async (req, res) => {
  try {
    const { username, email, password, publicKey } = req.body;

    if (!username || !email || !password || !publicKey) {
      return res.status(400).json({ error: "All fields are required, including publicKey" });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Hash password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      publicKey, // Store public key for E2EE
      avatar: `https://api.dicebear.com/9.x/glass/svg?seed=${username}`,
    });

    if (newUser) {
      await newUser.save();
      const token = generateToken(newUser._id);
      
      res.status(201).json({
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        avatar: newUser.avatar,
        publicKey: newUser.publicKey,
        token
      });
    } else {
      res.status(400).json({ error: "Invalid user data" });
    }
  } catch (error) {
    console.error("Error in signup controller", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    const isPasswordCorrect = await bcryptjs.compare(password, user?.password || "");

    if (!user || !isPasswordCorrect) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      publicKey: user.publicKey,
      token
    });
  } catch (error) {
    console.error("Error in login controller", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.status(200).json(user);
  } catch (error) {
    console.error("Error in getMe controller", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const googleLogin = async (req, res) => {
  try {
    const { token, publicKey } = req.body;
    
    if (!token || !publicKey) {
      return res.status(400).json({ error: "Token and public key are required" });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const client = new OAuth2Client(clientId);

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: clientId, 
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub } = payload; // sub is the unique Google user ID

    let user = await User.findOne({ email });

    if (!user) {
      // Create a new user since they don't exist
      user = new User({
        username: name.replace(/\s+/g, '').toLowerCase() + Math.floor(Math.random() * 1000), // simple unique username generation
        email,
        publicKey,
        avatar: picture || `https://api.dicebear.com/9.x/glass/svg?seed=${name}`,
      });
      await user.save();
    }

    // Since we generate a new JWT for our app session
    const jwtToken = generateToken(user._id);

    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      publicKey: user.publicKey,
      token: jwtToken
    });

  } catch (error) {
    console.error("Error in googleLogin controller", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
