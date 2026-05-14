import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import "./Chat.css";

const ChatLayout = () => {
  return (
    <div className="chat-layout-container">
      <div className="chat-app glass-panel animate-fade-in">
        <Sidebar />
        <ChatWindow />
      </div>
    </div>
  );
};

export default ChatLayout;
