import jwt from "jsonwebtoken";

const generateToken = (userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET || "fallback_secret", {
    expiresIn: "15d",
  });
  return token;
};

export default generateToken;
