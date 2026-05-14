import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthContext } from "./context/AuthContext";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ChatLayout from "./pages/ChatLayout";

function App() {
  const { authUser } = useAuthContext();

  return (
    <Routes>
      <Route path="/" element={authUser ? <ChatLayout /> : <Navigate to="/login" />} />
      <Route path="/login" element={authUser ? <Navigate to="/" /> : <Login />} />
      <Route path="/signup" element={authUser ? <Navigate to="/" /> : <Signup />} />
    </Routes>
  );
}

export default App;
