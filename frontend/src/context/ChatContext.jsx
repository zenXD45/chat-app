import { createContext, useState, useEffect, useContext } from "react";
import { useAuthContext } from "./AuthContext";
import io from "socket.io-client";

export const ChatContext = createContext();

export const useChatContext = () => {
  return useContext(ChatContext);
};

export const ChatContextProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { authUser } = useAuthContext();
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    if (authUser) {
      const backendUrl = import.meta.env.MODE === "development" ? "http://localhost:5000" : "";
      const newSocket = io(backendUrl, {
        query: {
          userId: authUser._id,
        },
      });

      setSocket(newSocket);

      newSocket.on("getOnlineUsers", (users) => {
        setOnlineUsers(users);
      });

      return () => newSocket.close();
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
  }, [authUser]);

  return (
    <ChatContext.Provider value={{ socket, onlineUsers, selectedUser, setSelectedUser }}>
      {children}
    </ChatContext.Provider>
  );
};
