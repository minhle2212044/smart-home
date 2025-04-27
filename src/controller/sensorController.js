const db = require('../../config/db');

exports.getSensorsByUser = async (req, res) => {
    try {
      const { userID, homeID } = req.query;
  
      if (!userID || !homeID) {
        return res.status(400).json({ message: "Missing userID or homeID" });
      }
  
      const [sensors] = await db.promise().query(
        `SELECT s.ID as SensorID, s.SName, s.SType, s.RoomID, s.HomeID, s.APIKey
         FROM Sensors s
         JOIN Home h ON s.HomeID = h.ID
         WHERE h.UserID = ? AND s.HomeID = ?`,
        [userID, homeID]
      );
  
      res.status(200).json({ sensors });
    } catch (error) {
      console.error('Error getting sensors:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  };


exports.getLatestSensorData = async (req, res) => {
    try {
      let { ids } = req.query;
  
      if (!ids) {
        return res.status(400).json({ message: "Missing sensor IDs" });
      }
  
      ids = ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
  
      if (ids.length === 0) {
        return res.status(400).json({ message: "Invalid sensor IDs" });
      }
  
      const [results] = await db.promise().query(`
        SELECT s.ID AS sensorID, sd.STime AS time, sd.DataType, sd.NumData, sd.TextData
        FROM Sensors s
        LEFT JOIN (
          SELECT SensorID, MAX(STime) AS MaxTime
          FROM SensorData
          WHERE SensorID IN (?)
          GROUP BY SensorID
        ) latest ON s.ID = latest.SensorID
        LEFT JOIN SensorData sd ON s.ID = sd.SensorID AND latest.MaxTime = sd.STime
        WHERE s.ID IN (?)
      `, [ids, ids]);
  
      const formattedData = results.map(item => ({
        sensorID: item.sensorID,
        time: item.time,
        value: item.DataType === "Number" ? item.NumData : item.TextData
      }));
  
      return res.status(200).json(formattedData);
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
  