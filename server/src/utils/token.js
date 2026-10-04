import jwt from "jsonwebtoken";
import config from "../config/env.js";

export const signToken = (id) => {
  return jwt.sign({ id }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};

export const verifyToken = (token) => {
  return jwt.verify(token, config.jwtSecret);
};

export default { signToken, verifyToken };
