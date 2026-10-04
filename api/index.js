import app from "../server/src/app.js";
import connectDB from "../server/src/config/db.js";

export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: err.message,
    });
  }

  return app(req, res);
}
