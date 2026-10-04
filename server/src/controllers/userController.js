import User from "../models/User.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import asyncHandler from "../utils/asyncHandler.js";

// @desc    Search other users (excludes current user)
// @route   GET /api/users
// @access  Protected
export const getUsers = asyncHandler(async (req, res) => {
  const querySource = req.validated?.query || req.query;
  const search = (querySource.search || "").trim();

  const filter = {
    _id: { $ne: req.user._id },
  };

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const users = await User.find(filter)
    .select("_id name email createdAt")
    .limit(20)
    .sort({ name: 1 });

  res.status(200).json({
    success: true,
    data: users,
  });
});

// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Protected
export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: req.user,
  });
});

// @desc    Update current user profile (name, email)
// @route   PATCH /api/users/me
// @access  Protected
export const updateMe = asyncHandler(async (req, res) => {
  const bodySource = req.validated?.body || req.body;
  const { name, email } = bodySource;

  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  if (email && email.toLowerCase() !== user.email) {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already in use",
      });
    }
    user.email = email.toLowerCase();
  }

  if (name) {
    user.name = name;
  }

  await user.save();

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Delete current user account and cleanup user data
// @route   DELETE /api/users/me
// @access  Protected
export const deleteMe = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Cleanup conversations and messages involving this user
  const userConversations = await Conversation.find({ participants: userId });
  const conversationIds = userConversations.map((c) => c._id);

  await Message.deleteMany({ conversation: { $in: conversationIds } });
  await Conversation.deleteMany({ _id: { $in: conversationIds } });
  await User.findByIdAndDelete(userId);

  res.status(200).json({
    success: true,
    data: null,
    message: "User account and chat data deleted successfully",
  });
});
