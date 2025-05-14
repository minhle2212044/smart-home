const db = require("../../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mqttService = require('../service/mqttService');
const SALT_ROUNDS = 10;

const generateToken = (userID, username) => {
    const token = jwt.sign({ id: userID, username: username}, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_LIFE,
    });
    return token;
}

exports.register = async (req, res) => {
    try {
        const { username, password, name, dob, email, tel } = req.body;

        if (!username || !password || !email) {
            return res.status(400).json({ message: "Missing username, password or email"});
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Invalid password"});
        }

        sql = "SELECT * FROM User WHERE Username = ?";
        db.query(sql, username, function (err, results) {
            if (results.length > 0) {
                return res.status(409).json("Username already exists");
            } else {
                const hashedPassword = bcrypt.hashSync(password, SALT_ROUNDS);
                sql = "INSERT INTO User (Username, Pass, Fullname, Dob, Email, Tel) VALUES (?, ?, ?, ?, ?, ?)";
                db.query(sql, [username, hashedPassword, name, dob, email, tel], function (err, results1) {
                    if (err) {
                        console.error("Lỗi khi insert user:", err);
                        return res.status(500).json({ message: "Database insert error" });
                    }

                    return res.status(201).json({
                        message: "User created successfully",
                        user: {
                            Username: username,
                            Fullname: name,
                            Dob: dob,
                            Email: email,
                            Tel: tel
                        }
                    });
                });
            }
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

exports.login = async (req, res) => {
    try {
      const { username, password } = req.body;
  
      if (!username || !password) {
        return res.status(400).json({ message: "Missing username or password" });
      }
  
      const [userResults] = await db.promise().query("SELECT * FROM User WHERE Username = ?", [username]);
      if (userResults.length === 0) {
        return res.status(401).json({ message: "User does not exist" });
      }
  
      const user = userResults[0];
      const userID = user.ID;
  
      const isValid = bcrypt.compareSync(password, user.Pass);
      if (!isValid) {
        return res.status(401).json({ message: "Wrong password" });
      }
  
      const token = generateToken(userID, username);
  
      const [homes] = await db.promise().query("SELECT * FROM Home WHERE UserID = ? ORDER BY ID ASC LIMIT 1", [userID]);
      if (homes.length > 0) {
        const homeId = homes[0].ID;
        const apiKey = homes[0].APIKey;

        await mqttService.connectToMqtt();
        await mqttService.switchTopicsForUser(userID, homeId);
        
        return res.status(200).json({
          token,
          user, 
          homeId
        });
      }
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
  

exports.verifyToken = (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }
  
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: "Invalid token" });
        }
        res.status(200).json({ message: "Token is valid", userID: decoded.userID });
    });
  };