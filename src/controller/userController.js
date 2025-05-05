const db = require("../../config/db");
const bcrypt = require("bcrypt");
const SALT_ROUNDS = 10;
exports.getUserById = async (req, res) => {
    const id = Number(req.params.id);
    try {
        const sql = "SELECT * FROM user WHERE ID = ?";
        const results = await new Promise((resolve, reject) => {
            db.query(sql, [id], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });

        if (!results || results.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json(results[0]);
    } catch (err) {
      return res.status(400).json({ message: err.message || err });
    }
};

exports.updateUser = async (req, res) => {
    const id = Number(req.params.id);
    const { fullname, dob, email, tel } = req.body;

    try {
        const sqlCheck = "SELECT * FROM user WHERE ID = ?";
        db.query(sqlCheck, [id], function (err, results) {
            if (err) {
                console.error("Lỗi khi kiểm tra user:", err);
                return res.status(500).json({ message: "Database error" });
            }

            if (results.length === 0) {
                return res.status(404).json({ message: "User not found" });
            }

            const sqlUpdate = `
                UPDATE user 
                SET Fullname = ?, Dob = ?, Email = ?, Tel = ?
                WHERE ID = ?
            `;
            db.query(sqlUpdate, [fullname, dob, email, tel, id], function (err2, results2) {
                if (err2) {
                    console.error("Lỗi khi cập nhật user:", err2);
                    return res.status(500).json({ message: "Update failed" });
                }

                return res.status(200).json({ 
                    message: "User updated successfully", 
                    user: {
                        ID: id,
                        Fullname: fullname,
                        Dob: dob,
                        Email: email,
                        Tel: tel
                    }
                });
            });
        });
    } catch (err) {
        return res.status(400).json({ message: err.message || err });
    }
};

exports.updatePassword = async (req, res) => {
    const id = Number(req.params.id);
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: "Thiếu thông tin mật khẩu." });
    }

    try {
        const sql = "SELECT Pass FROM User WHERE ID = ?";
        db.query(sql, [id], async (err, results) => {
            if (err) {
                console.error("Lỗi khi truy vấn:", err);
                return res.status(500).json({ message: "Lỗi cơ sở dữ liệu." });
            }

            if (results.length === 0) {
                return res.status(404).json({ message: "Không tìm thấy người dùng." });
            }

            const hashedOldPassword = results[0].Pass;

            const isMatch = await bcrypt.compare(oldPassword, hashedOldPassword);
            if (!isMatch) {
                return res.status(401).json({ message: "Mật khẩu cũ không đúng." });
            }

            const hashedNewPassword = bcrypt.hashSync(newPassword, SALT_ROUNDS);

            const sqlUpdate = "UPDATE User SET Pass = ? WHERE ID = ?";
            db.query(sqlUpdate, [hashedNewPassword, id], (err2, result2) => {
                if (err2) {
                    console.error("Lỗi khi cập nhật:", err2);
                    return res.status(500).json({ message: "Không thể cập nhật mật khẩu." });
                }

                return res.status(200).json({ message: "Cập nhật mật khẩu thành công." });
            });
        });
    } catch (error) {
        console.error("Lỗi server:", error);
        return res.status(500).json({ message: "Lỗi máy chủ." });
    }
};