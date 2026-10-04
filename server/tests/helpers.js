import jwt from "jsonwebtoken";
import User from "../src/models/User.js";
import config from "../src/config/env.js";

export const createUser = async (overrides = {}) => {
  const defaultUser = {
    name: "Test User",
    email: `test_${Date.now()}_${Math.random().toString(36).substring(7)}@example.com`,
    password: "Password123",
    role: "user",
  };

  const userData = { ...defaultUser, ...overrides };
  const user = await User.create(userData);
  return user;
};

export const getAuthToken = (userId, payloadOverrides = {}) => {
  return jwt.sign({ id: userId, ...payloadOverrides }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};

export default { createUser, getAuthToken };
