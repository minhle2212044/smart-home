const db = require("../../config/db");
const bcrypt = require("bcrypt");
const SALT_ROUNDS = 10;
const User = require("../model/userModel");

exports.getUserById = async (req, res) => {
    const id = Number(req.params.id);
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng." });
        res.json(user);
    } catch (err) {
      return res.status(400).json({ message: err.message || err });
    }
};

exports.updateUser = async (req, res) => {
    const id = Number(req.params.id);
    const { fullname, dob, email, tel } = req.body;

    if (!fullname || !dob || !email || !tel) {
        return res.status(400).json({ message: "Thiếu hoặc sai định dạng dữ liệu đầu vào." });
    }

    try {
        const exists = await User.exists(id);
        if (!exists) {
            return res.status(404).json({ message: "Không tìm thấy người dùng." });
        }

        const user = await User.findById(id);
        user.Fullname = fullname;
        user.Dob = dob;
        user.Email = email;
        user.Tel = tel;

        await user.save();

        return res.status(200).json({
            message: "Cập nhật thông tin người dùng thành công",
            user: {
                ID: user.ID,
                Fullname: user.Fullname,
                Dob: user.Dob,
                Email: user.Email,
                Tel: user.Tel
            }
        });
    } catch (err) {
        console.error("Lỗi máy chủ:", err);
        return res.status(500).json({ message: "Lỗi máy chủ." });
    }
};

exports.updatePassword = async (req, res) => {
    const id = Number(req.params.id);
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: "Thiếu thông tin mật khẩu." });
    }

    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "Không tìm thấy người dùng." });
        }

        const isMatch = await user.comparePassword(oldPassword);
        if (!isMatch) {
            return res.status(401).json({ message: "Mật khẩu cũ không đúng." });
        }

        await User.updatePassword(id, newPassword);

        return res.status(200).json({ message: "Cập nhật mật khẩu thành công." });
    } catch (error) {
        console.error("Lỗi server:", error);
        return res.status(500).json({ message: "Lỗi máy chủ." });
    }
};