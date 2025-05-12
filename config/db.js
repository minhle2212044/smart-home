require("dotenv").config();
const mysql = require("mysql2");

const db = mysql.createConnection(process.env.DB_URL);

module.exports = db;
