require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const db = require("./config/db");

app.use(bodyParser.json({ limit: "150mb" })); 
app.use(bodyParser.urlencoded({ limit: "150mb", extended: true })); 
app.use(cors());
app.use(express.json());

const userRoutes = require('./src/routes/userRoutes');
app.use("/api", userRoutes);

app.get("/", (req, res) => {
    res.send("Hello World");
});

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
  
    db.connect((err) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Database connected");
      }
    });
  });