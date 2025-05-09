const db = require("../../config/db");

class Sensor {
  static async findById(sensorID) {
    const [rows] = await db.promise().query(
      `SELECT 
         s.ID AS SensorID, 
         s.SName, 
         s.SType, 
         s.DataEdge,
         s.APIKey,
         s.RoomID,
         r.Name AS RoomName,
         s.HomeID,
         h.HName AS HomeName,
         h.UserID
       FROM Sensors s
       LEFT JOIN Room r ON s.RoomID = r.RoomID
       LEFT JOIN Home h ON s.HomeID = h.ID
       WHERE s.ID = ?`,
      [sensorID]
    );
    return rows[0] || null;
  }

  static async findByUser(userID, homeID) {
    const [sensors] = await db.promise().query(
      `SELECT s.ID as SensorID, s.SName, s.SType, s.RoomID, s.HomeID, s.APIKey
       FROM Sensors s
       JOIN Home h ON s.HomeID = h.ID
       WHERE h.UserID = ? AND s.HomeID = ?`,
      [userID, homeID]
    );
    return sensors;
  }

  static async findLatestData(sensorIDs) {
    const [results] = await db.promise().query(
      `SELECT s.ID AS sensorID, sd.STime AS time, sd.DataType, sd.NumData, sd.TextData
       FROM Sensors s
       LEFT JOIN (
         SELECT SensorID, MAX(STime) AS MaxTime
         FROM SensorData
         WHERE SensorID IN (?)
         GROUP BY SensorID
       ) latest ON s.ID = latest.SensorID
       LEFT JOIN SensorData sd ON s.ID = sd.SensorID AND latest.MaxTime = sd.STime
       WHERE s.ID IN (?)`,
      [sensorIDs, sensorIDs]
    );

    return results.map(item => ({
      sensorID: item.sensorID,
      time: item.time,
      value: item.DataType === "Number" ? item.NumData : item.TextData
    }));
  }

  static async create(sensorData) {
    const { SName, SType, DataEdge, APIKey, HomeID, RoomID } = sensorData;
    const [result] = await db.promise().query(
      `INSERT INTO Sensors (SName, SType, DataEdge, APIKey, HomeID, RoomID)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [SName, SType, DataEdge, APIKey, HomeID, RoomID]
    );
    return result.insertId;
  }

  static async update(id, sensorData) {
    const { SName, SType, DataEdge, APIKey, HomeID, RoomID } = sensorData;
    const [result] = await db.promise().query(
      `UPDATE Sensors SET SName = ?, SType = ?, DataEdge = ?, APIKey = ?, HomeID = ?, RoomID = ?
       WHERE ID = ?`,
      [SName, SType, DataEdge, APIKey, HomeID, RoomID, id]
    );
    return result;
  }

  static async delete(id) {
    const [result] = await db.promise().query("DELETE FROM Sensors WHERE ID = ?", [id]);
    return result;
  }

}

module.exports = Sensor;
