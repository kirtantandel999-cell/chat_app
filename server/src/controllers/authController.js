import User from "../models/User.js";
import { signToken } from "../utils/token.js";
import asyncHandler from "../utils/asyncHandler.js";

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req, res) => {
  const bodySource = req.validated?.body || req.body;
  const { name, email, password } = bodySource;

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: "Email already in use",
    });
  }

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
  });

  const token = signToken(user._id);

  res.status(201).json({
    success: true,
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token,
    },
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  const bodySource = req.validated?.body || req.body;
  const { email, password } = bodySource;

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  }

  const token = signToken(user._id);

  res.status(200).json({
    success: true,
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token,
    },
  });
});

// @desc    Get current logged in user (session restore)
// @route   GET /api/auth/me
// @access  Protected
export const getCurrentUser = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: req.user,
  });
});

// @desc    Change password
// @route   PATCH /api/auth/change-password
// @access  Protected
export const changePassword = asyncHandler(async (req, res) => {
  const bodySource = req.validated?.body || req.body;
  const { currentPassword, newPassword } = bodySource;

  const user = await User.findById(req.user._id).select("+password");

  if (!user || !(await user.comparePassword(currentPassword))) {
    return res.status(401).json({
      success: false,
      message: "Current password does not match",
    });
  }

  user.password = newPassword;
  user.passwordChangedAt = new Date();
  await user.save();

  // Return fresh token so current session continues
  const token = signToken(user._id);

  res.status(200).json({
    success: true,
    message: "Password updated successfully",
    data: {
      token,
    },
  });
});
