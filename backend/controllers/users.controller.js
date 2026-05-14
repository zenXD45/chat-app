import User from "../models/User.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const { search } = req.query;

    let query = { _id: { $ne: loggedInUserId } };
    
    if (search) {
      query.username = { $regex: search, $options: "i" };
    }

    // Find all users except the currently logged in user (filtered by search)
    const filteredUsers = await User.find(query).select("-password").limit(50);

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { username, avatar } = req.body;
    const userId = req.user._id;

    if (!username && !avatar) {
      return res.status(400).json({ error: "Please provide username or avatar to update" });
    }

    // Check if new username is already taken
    if (username) {
      const existingUser = await User.findOne({ username, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ error: "Username already taken" });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { ...(username && { username }), ...(avatar && { avatar }) } },
      { new: true }
    ).select("-password");

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error in updateProfile: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
