const db = require("../../config/db");

exports.getUserById = async (req, res) => {
    const id = Number(req.params.id);
    try {
        sql = "SELECT * FROM user WHERE ID = ?";
        db.query(sql, id, function (err, results) {
            if (!results) {
                return res.status(200).json({"message": "User not found"});
            } else {
                return res.status(401).json(results[0]);
            };
        });
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
        console.log("Lỗi server:", err);
        return res.status(400).json({ message: err.message || err });
    }
};