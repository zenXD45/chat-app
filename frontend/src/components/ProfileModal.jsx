import { useState } from "react";
import { useAuthContext } from "../context/AuthContext";
import "./ProfileModal.css";

const ProfileModal = ({ isOpen, onClose }) => {
  const { authUser, updateProfile } = useAuthContext();
  const [username, setUsername] = useState(authUser?.username || "");
  const [avatar, setAvatar] = useState(authUser?.avatar || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const result = await updateProfile({ username, avatar });
    if (result.success) {
      setSuccessMsg("Profile updated successfully!");
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 1500);
    } else {
      setError(result.error || "Failed to update profile");
    }
    setLoading(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(authUser.username);
    setSuccessMsg("Username copied! Tell friends to search for it.");
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Profile Settings</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {error && <div className="modal-alert error">{error}</div>}
        {successMsg && <div className="modal-alert success">{successMsg}</div>}

        <div className="profile-preview">
          <img src={avatar || authUser.avatar} alt="Profile Preview" className="avatar-large" />
        </div>

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              className="input-field"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Avatar URL</label>
            <input
              type="text"
              className="input-field"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
            />
            <small style={{ color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
              Leave blank to keep current, or use an image URL.
            </small>
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%", marginTop: "10px" }}>
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>

        <div className="invite-section">
          <hr className="modal-divider" />
          <p>Invite Friends</p>
          <button className="btn-secondary" onClick={handleCopyLink}>
            Copy My Username
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
