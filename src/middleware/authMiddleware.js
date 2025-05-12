const jwt = require("jsonwebtoken");    
const db = require("../../config/db");
const userModel = require("../controller/userController");
const handleUnauthorized = (res, message = "Unauthorized") => {
  return res.status(401).json({ message });
};

exports.isAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "Missing Authorization Header" });
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    const verified = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    if (!verified || !verified.id) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const sql = "SELECT * FROM User WHERE ID = ?";
    const results = await new Promise((resolve, reject) => {
      db.query(sql, [verified.id], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });

    if (!results || results.length === 0) {
      return res.status(401).json({ message: "Unauthorized: " + verified.id });
    }

    req.user = results[0];
    next();
  } catch (error) {
    console.error("Authorization error:", error);
    return res.status(401).json({ message: "Authorization error" });
  }
};