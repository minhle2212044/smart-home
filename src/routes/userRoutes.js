const express = require('express');
const router = express.Router();
const userController = require("../controller/userController");

router.get("/:id", userController.getUserById);
router.put("/update/:id", userController.updateUser);
router.put("/change-pass/:id", userController.updatePassword);

module.exports = router;