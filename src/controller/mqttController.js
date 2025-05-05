const db = require('../../config/db');
const mqttService = require('../service/mqttService');
const client = mqttService.getClient();

exports.switchTopicsForUser = async (req, res) => {
  try {
    const { userID, homeID } = req.body;

    if (!userID || !homeID) {
      return res.status(400).json({ message: "Missing userID or homeID" });
    }

    await mqttService.switchTopicsForUser(userID, homeID);

    mqttService.registerMessageHandler(async (topic, message) => {
        try {
      
          const rawData = message.toString();
          let value = null;
      
          if (!isNaN(rawData)) {
            value = parseFloat(rawData);
          } else {
            value = rawData;
          }
      
          const sensorID = await getSensorIdByApiKey(topic);
      
          if (!sensorID) {
            console.error('SensorID not found for topic', topic);
            return;
          }
      
          const sensorData = {
            STime: new Date(),
            DataType: typeof value === 'number' ? 'Number' : 'String',
            NumData: typeof value === 'number' ? value : null,
            TextData: typeof value !== 'number' ? value : null,
            SensorID: sensorID
          };
      
          // Save thẳng vào database
          await db.promise().query(
            'INSERT INTO SensorData (STime, DataType, NumData, TextData, SensorID) VALUES (?, ?, ?, ?, ?)',
            [sensorData.STime, sensorData.DataType, sensorData.NumData, sensorData.TextData, sensorData.SensorID]
          );
      
      
        } catch (error) {
          console.error(`Error processing message: ${error.message}`);
        }
      });      

    res.status(200).json({ message: "Switched topics successfully and registered handler"});
  } catch (error) {
    console.error("Error switching topics:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};