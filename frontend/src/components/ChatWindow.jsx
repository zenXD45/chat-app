import { useEffect, useState, useRef } from "react";
import { useAuthContext } from "../context/AuthContext";
import { useChatContext } from "../context/ChatContext";
import { encryptMessage, decryptMessage } from "../utils/crypto";
import axios from "axios";

const ChatWindow = () => {
  const { selectedUser, socket } = useChatContext();
  const { authUser, privateKey } = useAuthContext();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedUser) return;
      setLoading(true);
      try {
        const backendUrl = import.meta.env.MODE === "development" ? "http://localhost:5000" : "";
        const res = await axios.get(`${backendUrl}/api/messages/${selectedUser._id}`, {
          headers: { Authorization: `Bearer ${authUser.token}` },
        });

        // Decrypt messages
        const decryptedMessages = await Promise.all(
          res.data.map(async (msg) => {
            if (msg.senderId === authUser._id) {
              // We sent this. Ideally, we should have stored a copy encrypted with our own public key,
              // but for this simple E2EE demo without duplicating ciphertext, we assume we can't read our own sent messages 
              // UNLESS we encrypt a copy for ourselves. To keep it simple, if we sent it, we just display a placeholder 
              // or handle it by storing the decrypted message locally. 
              // Wait, to make this work seamlessly, let's just attempt to decrypt. If we can't (because it's encrypted with their key),
              // we will see [Decryption Failed].
              // Proper E2EE: We encrypt the message twice. Once for receiver, once for ourselves.
              // Since the schema only has one `encryptedContent` field, we will just show "[Encrypted for Receiver]" for sent messages,
              // unless it's in our local state.
              return { ...msg, text: "[Sent Message - Encrypted]" };
            } else {
              // We received this. Decrypt with our private key.
              const text = await decryptMessage(msg.encryptedContent, privateKey);
              return { ...msg, text };
            }
          })
        );
        setMessages(decryptedMessages);
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [selectedUser, authUser.token, privateKey, authUser._id]);

  useEffect(() => {
    if (!socket) return;

    socket.on("newMessage", async (newMessage) => {
      // If the message is from the currently selected user
      if (selectedUser && newMessage.senderId === selectedUser._id) {
        const text = await decryptMessage(newMessage.encryptedContent, privateKey);
        setMessages((prev) => [...prev, { ...newMessage, text }]);
      }
    });

    return () => socket.off("newMessage");
  }, [socket, selectedUser, privateKey]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    try {
      // Encrypt message with receiver's public key
      const encryptedContent = await encryptMessage(newMessage, selectedUser.publicKey);

      const backendUrl = import.meta.env.MODE === "development" ? "http://localhost:5000" : "";
      const res = await axios.post(
        `${backendUrl}/api/messages/send/${selectedUser._id}`,
        { encryptedContent },
        { headers: { Authorization: `Bearer ${authUser.token}` } }
      );

      // Add to local state (unencrypted for our own view)
      setMessages((prev) => [...prev, { ...res.data, text: newMessage }]);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  if (!selectedUser) {
    return (
      <div className="no-chat-selected">
        <span style={{ fontSize: "40px" }}>💬</span>
        <p>Select a chat to start messaging</p>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <img src={selectedUser.avatar} alt="Avatar" className="avatar" />
        <div className="user-info">
          <h3>{selectedUser.username}</h3>
          <span style={{ fontSize: "12px", color: "var(--success)" }}>E2EE Active 🔒</span>
        </div>
      </div>

      <div className="messages-container">
        {loading && <div style={{ textAlign: "center", color: "var(--text-muted)" }}>Loading messages...</div>}
        
        {!loading && messages.map((msg, idx) => {
          const isSent = msg.senderId === authUser._id;
          return (
            <div key={msg._id || idx} className={`message-wrapper ${isSent ? "sent" : "received"}`}>
              <div className="message-bubble">{msg.text}</div>
              <span className="message-time">
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form className="message-input-container" onSubmit={handleSendMessage}>
        <input
          type="text"
          className="input-field"
          placeholder="Type an encrypted message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button type="submit" className="btn-primary send-btn" disabled={!newMessage.trim()}>
          ➤
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;
