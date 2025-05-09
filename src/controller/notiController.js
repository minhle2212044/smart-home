const db = require('../../config/db');
const notiModel = require('../model/notiModel');

exports.getNotifications = async (req, res) => {
    try {
      const { userID, page, limit, isRead } = req.query;
  
      if (!userID) {
        return res.status(400).json({ message: "Missing userID" });
      }
  
      const result = await notiModel.getNotifications(userID, page, limit, isRead);
      res.status(200).json(result);
    } catch (error) {
      console.error("Error fetching notifications:", error.message);
      res.status(500).json({ message: "Internal server error" });
    }
  };
  
  
  exports.getNotificationById = async (req, res) => {
    try {
      const { id } = req.params;
  
      const notification = await notiModel.getNotificationById(id);

      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }

      const { SensorID, DeviceID, UserID } = notification;
  
      let locationData = {};
  
      if (SensorID) {
        const sensorRow = await notiModel.getSensorLocation(SensorID);
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
        const deviceRow = await notiModel.getDeviceLocation(DeviceID);
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
  
      const fullname = await notiModel.getUserFullname(UserID);
  
      res.status(200).json({
        ID: notification.ID,
        Message: notification.Message,
        NTime: notification.NTime,
        NType: notification.NType,
        isRead: notification.isRead,
        Fullname: fullname,
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
  
      const success = await notiModel.markAsRead(id);

      if (!success) {
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
  
      await notiModel.markAllAsRead(userID);
  
      res.status(200).json({ message: "All notifications marked as read." });
    } catch (error) {
      console.error("Error updating notifications:", error.message);
      res.status(500).json({ message: "Internal server error" });
    }
  };
  