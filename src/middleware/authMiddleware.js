const jwt = require("jsonwebtoken");    

const handleUnauthorized = (res, message = "Unauthorized") => {
  return res.status(401).json({ message });
};

exports.isAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return handleUnauthorized(res);

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    const verified = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    if (!verified) {
      return handleUnauthorized(
        res,
        "Unauthorized access token, please login again"
      );
    }

    sql = "SELECT * FROM user WHERE ID = ?";
                db.query(sql, [verified.userID], function (err, results) {
                    if (err) {
                        console.error("Lỗi khi tìmtìm user:", err);
                        return res.status(500).json({ message: "Database error" });
                    }
                    if(results.length === 0) {
                        return res.status(401).json({ message: "Unauthorized" });
                    }
                    req.user = results[0];
                    next();
                });
    const user = await userModel.getUserById(verified.payload.id);
    req.user = user;

    next();
  } catch (error) {
    console.error("Authorization error:", error);
    return handleUnauthorized(res, "An error occurred during authorization");
  }
};