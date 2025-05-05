require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const swagger = require("./src/service/swagger");
const db = require("./config/db");
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const deviceRoutes = require('./src/routes/deviceRoutes');
const sensorRoutes = require('./src/routes/sensorRoutes');
const mqttRoutes = require('./src/routes/mqttRoutes');
const scheduleRoutes = require('./src/routes/scheduleRoutes');
const notificationRoutes = require('./src/routes/notiRoutes');
const {isAuth} = require("./src/middleware/authMiddleware");
app.use(bodyParser.json({ limit: "150mb" })); 
app.use(bodyParser.urlencoded({ limit: "150mb", extended: true })); 
app.use(cors());
app.use(express.json());

const specs = swaggerJsdoc(swagger);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
app.use("/api/auth", authRoutes);
app.use("/api/user", isAuth, userRoutes);
app.use("/api/topic", isAuth, mqttRoutes);
app.use("/api/device", isAuth, deviceRoutes);
app.use("/api/sensor", isAuth, sensorRoutes);
app.use("/api/schedule", isAuth, scheduleRoutes);
app.use("/api/notification", isAuth, notificationRoutes);

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