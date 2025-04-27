const express = require('express');
const router = express.Router();
const userController = require("../controller/userController");

router.get("/:id", userController.getUserById);
router.put("/update/:id", userController.updateUser);

module.exports = router;