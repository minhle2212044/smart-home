require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const db = require("./config/db");
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const deviceRoutes = require('./src/routes/deviceRoutes');
const sensorRoutes = require('./src/routes/sensorRoutes');
const deviceController = require('./src/controller/devicecontroller');
const sensorController = require('./src/controller/sensorController');
const mqtt = require('mqtt');

app.use(bodyParser.json({ limit: "150mb" })); 
app.use(bodyParser.urlencoded({ limit: "150mb", extended: true })); 
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/device", deviceRoutes);
//app.use("/api/sensor", sensorRoutes);

app.get("/", (req, res) => {
    res.send("Hello World");
});

const client = mqtt.connect('mqtt://test.mosquitto.org:1883');

client.on('connect', () => {
  console.log('MQTT connected');

  const topics = [
    'SmartHome/devices/fan',
    'SmartHome/devices/door',
    'SmartHome/devices/led',
    'SmartHome/devices/buzzer',
    'SmartHome/sensors/temperature'
  ];

  client.subscribe(topics, () => {
    console.log('Subscribed to all device topics');
  });

  deviceController.setMqttClient(client);
  sensorController.setMqttClient(client);
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