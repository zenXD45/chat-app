import { useEffect, useState } from "react";
import { useAuthContext } from "../context/AuthContext";
import { useChatContext } from "../context/ChatContext";
import axios from "axios";
import ProfileModal from "./ProfileModal";

const Sidebar = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const { authUser, logout } = useAuthContext();
  const { onlineUsers, selectedUser, setSelectedUser } = useChatContext();

  useEffect(() => {
    const getUsers = async () => {
      try {
        const backendUrl = import.meta.env.MODE === "development" ? "http://localhost:5000" : "";
        // Debounce or just fetch on search change
        const res = await axios.get(`${backendUrl}/api/users?search=${search}`, {
          headers: {
            Authorization: `Bearer ${authUser.token}`,
          },
        });
        setUsers(res.data);
      } catch (error) {
        console.error("Error fetching users", error);
      }
    };
    
    // Add simple debounce
    const timeoutId = setTimeout(() => {
      getUsers();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [authUser.token, search]);

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="user-profile" onClick={() => setIsProfileModalOpen(true)} style={{ cursor: "pointer" }} title="Edit Profile">
          <img src={authUser.avatar} alt="Avatar" className="avatar" />
          <div className="user-info">
            <h3>{authUser.username}</h3>
          </div>
        </div>
        <div>
          <button className="icon-btn" onClick={() => setIsProfileModalOpen(true)} title="Settings" style={{ marginRight: '10px' }}>
            ⚙️
          </button>
          <button className="logout-btn" onClick={logout} title="Logout">
            ⎋
          </button>
        </div>
      </div>

      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="users-list">
        {users.map((user) => {
          const isOnline = onlineUsers.includes(user._id);
          const isSelected = selectedUser?._id === user._id;

          return (
            <div
              key={user._id}
              className={`user-item ${isSelected ? "selected" : ""}`}
              onClick={() => setSelectedUser(user)}
            >
              <div className="avatar-container">
                <img src={user.avatar} alt="Avatar" className="avatar" />
                {isOnline && <span className="online-indicator"></span>}
              </div>
              <div className="user-info">
                <h3>{user.username}</h3>
              </div>
            </div>
          );
        })}
        {users.length === 0 && (
          <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>
            No users found
          </div>
        )}
      </div>

      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
    </div>
  );
};

export default Sidebar;
