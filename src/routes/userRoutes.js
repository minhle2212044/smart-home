const express = require('express');
const router = express.Router();
const isAuth = require("../middleware/authMiddleware");
const userController = require("../controller/userController");

router.get("/:id", userController.getUserById);
router.put("/update/:id", userController.updateUser);

module.exports = router;