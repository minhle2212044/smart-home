const db = require('../../config/db');

class NotificationModel {
  async getNotifications(userID, page = 1, limit = 10, isRead) {
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let readFilter = '';
    const dataParams = [userID];
    const countParams = [userID];

    if (typeof isRead !== 'undefined') {
      const isReadBool = isRead === 'true';
      readFilter = 'AND n.isRead = ?';
      dataParams.push(isReadBool);
      countParams.push(isReadBool);
    }

    const [rows] = await db.promise().query(
      `SELECT n.ID, n.Message, n.NTime, n.NType, n.isRead, s.SName, s.SType
       FROM Notification n
       LEFT JOIN Sensors s ON n.SensorID = s.ID
       WHERE n.UserID = ? ${readFilter}
       ORDER BY n.NTime DESC
       LIMIT ? OFFSET ?`,
      [...dataParams, parseInt(limit), offset]
    );

    const [countRows] = await db.promise().query(
      `SELECT COUNT(*) AS total FROM Notification n WHERE n.UserID = ? ${readFilter}`,
      countParams
    );

    const total = countRows[0].total;
    const totalPages = Math.ceil(total / parseInt(limit));

    return {
      currentPage: parseInt(page),
      totalPages,
      totalRecords: total,
      notifications: rows
    };
  }

  async getNotificationById(id) {
    const [notifications] = await db.promise().query(
      `SELECT ID, Message, NTime, NType, isRead, UserID, SensorID, DeviceID 
       FROM Notification 
       WHERE ID = ?`,
      [id]
    );

    if (notifications.length === 0) return null;

    return notifications[0];
  }

  async getSensorLocation(sensorID) {
    const [[row]] = await db.promise().query(
      `SELECT 
         s.SName, s.SType,
         r.RoomID, r.Name AS RoomName,
         h.ID AS HomeID, h.HName AS HomeName
       FROM Sensors s
       JOIN Room r ON s.RoomID = r.RoomID
       JOIN Home h ON s.HomeID = h.ID
       WHERE s.ID = ?`,
      [sensorID]
    );
    return row;
  }

  async getDeviceLocation(deviceID) {
    const [[row]] = await db.promise().query(
      `SELECT 
         d.DName,
         r.RoomID, r.Name AS RoomName,
         h.ID AS HomeID, h.HName AS HomeName
       FROM Device d
       JOIN Room r ON d.RoomID = r.RoomID
       JOIN Home h ON d.HomeID = h.ID
       WHERE d.ID = ?`,
      [deviceID]
    );
    return row;
  }

  async getUserFullname(userID) {
    const [[row]] = await db.promise().query(
      `SELECT Fullname FROM User WHERE ID = ?`,
      [userID]
    );
    return row?.Fullname || null;
  }

  async markAsRead(id) {
    const [result] = await db.promise().query(
      `UPDATE Notification SET isRead = true WHERE ID = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }

  async markAllAsRead(userID) {
    await db.promise().query(
      `UPDATE Notification SET isRead = true WHERE UserID = ?`,
      [userID]
    );
  }
}

module.exports = new NotificationModel();
