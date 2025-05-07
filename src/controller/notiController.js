const db = require('../../config/db');

exports.getNotifications = async (req, res) => {
    try {
      const { userID, page = 1, limit = 10, isRead } = req.query;
  
      if (!userID) {
        return res.status(400).json({ message: "Missing userID" });
      }
  
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
  
      res.status(200).json({
        currentPage: parseInt(page),
        totalPages,
        totalRecords: total,
        notifications: rows
      });
    } catch (error) {
      console.error("Error fetching notifications:", error.message);
      res.status(500).json({ message: "Internal server error" });
    }
  };
  
  
  exports.getNotificationById = async (req, res) => {
    try {
      const { id } = req.params;
  
      const [notifications] = await db.promise().query(
        `SELECT ID, Message, NTime, NType, isRead, UserID, SensorID, DeviceID 
         FROM Notification 
         WHERE ID = ?`,
        [id]
      );
  
      if (notifications.length === 0) {
        return res.status(404).json({ message: "Notification not found" });
      }
  
      const notification = notifications[0];
      const { SensorID, DeviceID, UserID } = notification;
  
      let locationData = null;
  
      if (SensorID) {
        const [[sensorRow]] = await db.promise().query(
          `SELECT 
             s.SName,
             s.SType,
             r.RoomID, r.Name AS RoomName,
             h.ID AS HomeID, h.HName AS HomeName
           FROM Sensors s
           JOIN Room r ON s.RoomID = r.RoomID
           JOIN Home h ON s.HomeID = h.ID
           WHERE s.ID = ?`,
          [SensorID]
        );
        locationData = {
          SName: sensorRow.SName,
          SType: sensorRow.SType,
          RoomID: sensorRow.RoomID,
          RoomName: sensorRow.RoomName,
          HomeID: sensorRow.HomeID,
          HomeName: sensorRow.HomeName,
          DName: null
        };
      } else if (DeviceID) {
        const [[deviceRow]] = await db.promise().query(
          `SELECT 
             d.DName,
             r.RoomID, r.Name AS RoomName,
             h.ID AS HomeID, h.HName AS HomeName
           FROM Device d
           JOIN Room r ON d.RoomID = r.RoomID
           JOIN Home h ON d.HomeID = h.ID
           WHERE d.ID = ?`,
          [DeviceID]
        );
        locationData = {
          SName: null,
          SType: null,
          DName: deviceRow.DName,
          RoomID: deviceRow.RoomID,
          RoomName: deviceRow.RoomName,
          HomeID: deviceRow.HomeID,
          HomeName: deviceRow.HomeName
        };
      }
  
      const [[userRow]] = await db.promise().query(
        `SELECT Fullname FROM User WHERE ID = ?`,
        [UserID]
      );
  
      res.status(200).json({
        ID: notification.ID,
        Message: notification.Message,
        NTime: notification.NTime,
        NType: notification.NType,
        isRead: notification.isRead,
        Fullname: userRow?.Fullname || null,
        ...locationData
      });
  
    } catch (error) {
      console.error("Error fetching notification detail:", error.message);
      res.status(500).json({ message: "Internal server error" });
    }
  };
  
  
  
  exports.markNotificationAsRead = async (req, res) => {
    try {
      const { id } = req.params;
  
      const [result] = await db.promise().query(
        `UPDATE Notification SET isRead = true WHERE ID = ?`,
        [id]
      );
  
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Notification not found" });
      }
  
      res.status(200).json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error.message);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  exports.markAllNotificationsAsRead = async (req, res) => {
    try {
      const userID = req.params.userID;
  
      if (!userID) {
        return res.status(400).json({ message: "Missing userID" });
      }
  
      await db.promise().query(
        `UPDATE Notification SET isRead = true WHERE UserID = ?`,
        [userID]
      );
  
      res.status(200).json({ message: "All notifications marked as read." });
    } catch (error) {
      console.error("Error updating notifications:", error.message);
      res.status(500).json({ message: "Internal server error" });
    }
  };
  