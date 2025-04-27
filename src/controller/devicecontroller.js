const db = require('../../config/db');
const mqttService = require('../service/mqttService');

exports.publishMessage = async (req, res) => {
    try {
      const { topic, message } = req.body;
  
      if (!topic || !message) {
        return res.status(400).json({ message: 'Missing topic or message' });
      }
  
      const client = mqttService.getClient();
  
      if (!client || !client.connected) {
        return res.status(500).json({ message: 'MQTT client not connected' });
      }
  
      client.publish(topic, message, (err) => {
        if (err) {
          console.error('Error publishing MQTT message:', err.message);
          return res.status(500).json({ message: 'Error publishing message' });
        }
        console.log(`✅ Published to ${topic}: ${message}`);
        res.status(200).json({ message: 'Message published successfully' });
      });
    } catch (error) {
      console.error('Error in publishMessage controller:', error.message);
      res.status(500).json({ message: 'Internal server error' });
    }
  };