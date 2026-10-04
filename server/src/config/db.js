import dns from "node:dns";
import mongoose from "mongoose";
import config from "./env.js";

// Fix Node 20+ querySrv ECONNREFUSED on Windows local DNS by using Google & Cloudflare DNS
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {
  // Ignore in environments where setting servers is restricted
}

let cachedConnection = null;

export const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    cachedConnection = conn;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    throw error;
  }
};

export default connectDB;
