const db = require('../../config/db');
const mqttService = require('../service/mqttService');

exports.getDevicesByUser = async (req, res) => {
  try {
    const { userID, homeID } = req.query;

    if (!userID || !homeID) {
      return res.status(400).json({ message: "Missing userID or homeID" });
    }

    const [devices] = await db.promise().query(
      `SELECT d.ID as DeviceID, d.DName, d.DType, d.RoomID, d.HomeID, d.APIKey
       FROM Device d
       JOIN Home h ON d.HomeID = h.ID
       WHERE h.UserID = ? AND d.HomeID = ?`,
      [userID, homeID]
    );

    res.status(200).json({ devices });
  } catch (error) {
    console.error('Error getting sensors:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.setMode = async (req, res) => {
  try {
    const { deviceID, modeID } = req.body;

    if (!deviceID || modeID === undefined) {
      return res.status(400).json({ message: 'Missing deviceID or modeID' });
    }

    if (![0, 1, 2].includes(modeID)) {
      return res.status(400).json({ message: 'Invalid modeID. Must be 0, 1, or 2' });
    }

    const sql = "SELECT APIKey FROM Device WHERE ID = ?";
    db.query(sql, [deviceID], (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ message: "Database error" });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "Device not found" });
      }

      const topic = results[0].APIKey;

      const message = JSON.stringify({
        action: "set_mode",
        mode: modeID
      });

      const client = mqttService.getClient();

      if (!client || !client.connected) {
        return res.status(500).json({ message: 'MQTT client not connected' });
      }

      client.publish(topic, message, (err) => {
        if (err) {
          console.error('Error publishing MQTT message:', err.message);
          return res.status(500).json({ message: 'Error publishing message' });
        }

        console.log(`Published to topic "${topic}": ${message}`);
        res.status(200).json({
          message: 'Mode message published successfully',
          topic,
          sentPayload: message
        });
      });
    });

  } catch (error) {
    console.error('Error in publishMessage controller:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.manualControl = async (req, res) => {
  try {
    const { deviceID, status } = req.body;

    if (!deviceID || typeof status !== 'boolean') {
      return res.status(400).json({ message: 'Missing or invalid deviceID/status' });
    }

    const [rows] = await db.promise().query('SELECT APIKey FROM Device WHERE ID = ?', [deviceID]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Device not found' });
    }

    const topic = rows[0].APIKey;
    const payload = {
      action: 'manual_control',
      status
    };

    const client = mqttService.getClient();
    if (!client || !client.connected) {
      return res.status(500).json({ message: 'MQTT client not connected' });
    }

    client.publish(topic, JSON.stringify(payload), (err) => {
      if (err) {
        console.error('Error publishing manual control:', err.message);
        return res.status(500).json({ message: 'Publish failed' });
      }

      console.log(`Manual control published to ${topic}:`, payload);
      res.status(200).json({ message: 'Manual control sent', topic, payload });
    });
  } catch (error) {
    console.error('Error in manualControl:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.setThreshold = async (req, res) => {
  try {
    const { deviceID, threshold } = req.body;

    if (!deviceID || typeof threshold !== 'number') {
      return res.status(400).json({ message: 'Missing or invalid deviceID/threshold' });
    }

    const [rows] = await db.promise().query('SELECT APIKey FROM Device WHERE ID = ?', [deviceID]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Device not found' });
    }

    const topic = rows[0].APIKey;
    const payload = {
      action: 'set_threshold',
      threshold: threshold
    };

    const client = mqttService.getClient();
    if (!client || !client.connected) {
      return res.status(500).json({ message: 'MQTT client not connected' });
    }

    client.publish(topic, JSON.stringify(payload), (err) => {
      if (err) {
        console.error('Error publishing threshold:', err.message);
        return res.status(500).json({ message: 'Publish failed' });
      }

      console.log(`Threshold published to ${topic}:`, payload);
      res.status(200).json({ message: 'Threshold set successfully', topic, payload });
    });
  } catch (error) {
    console.error('Error in setThreshold:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.addDevice = (req, res) => {
  const { DType, DName, APIKey, RoomID, HomeID } = req.body;

  const sql = `
      INSERT INTO Device (DType, DName, APIKey, RoomID, HomeID)
      VALUES (?, ?, ?, ?, ?)
  `;
  db.query(sql, [DType, DName, APIKey, RoomID, HomeID], (err, result) => {
      if (err) return res.status(500).json({ message: "Thêm thiết bị thất bại", error: err });
      res.status(201).json({ message: "Thêm thiết bị thành công", deviceID: result.insertId });
  });
};

exports.updateDevice = (req, res) => {
  const id = req.params.id;
  const { DType, DName, APIKey, RoomID, HomeID } = req.body;

  const sql = `
      UPDATE Device SET DType = ?, DName = ?, APIKey = ?, RoomID = ?, HomeID = ?
      WHERE ID = ?
  `;
  db.query(sql, [DType, DName, APIKey, RoomID, HomeID, id], (err, result) => {
      if (err) return res.status(500).json({ message: "Cập nhật thiết bị thất bại", error: err });
      res.status(200).json({ message: "Cập nhật thiết bị thành công" });
  });
};

exports.deleteDevice = (req, res) => {
  const id = req.params.id;

  const sql = "DELETE FROM Device WHERE ID = ?";
  db.query(sql, [id], (err, result) => {
      if (err) return res.status(500).json({ message: "Xóa thiết bị thất bại", error: err });
      res.status(200).json({ message: "Xóa thiết bị thành công" });
  });
};