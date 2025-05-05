const db = require('../../config/db');
const mqttService = require('../service/mqttService');

exports.addSchedule = async (req, res) => {
    try {
      const { deviceID, hour, minute, status, para, userID, index } = req.body;
  
      if (!deviceID || hour === undefined || minute === undefined || status === undefined || para === undefined || !userID) {
        return res.status(400).json({ message: 'Thiếu thông tin cần thiết' });
      }
  
      // Kiểm tra tổng số lượng lịch (tối đa 5)
      const [existingSchedules] = await db.promise().query('SELECT ModeID FROM ScheMode');
      if (existingSchedules.length >= 5) {
        return res.status(400).json({ message: 'Chỉ được đặt tối đa 5 lịch trong toàn hệ thống' });
      }
  
      let freeIndex = index;
  
      // Nếu không truyền index, tự động tìm index trống từ 0–4 trong bảng ScheMode
      if (freeIndex === undefined) {
        const [rows] = await db.promise().query('SELECT SIndex FROM ScheMode');
        const usedIndexes = rows.map(r => r.SIndex);
        for (let i = 0; i < 5; i++) {
          if (!usedIndexes.includes(i)) {
            freeIndex = i;
            break;
          }
        }
  
        if (freeIndex === undefined) {
          return res.status(400).json({ message: 'Không tìm thấy index trống (0–4) để đặt lịch mới' });
        }
      }
  
      // Lấy thông tin thiết bị
      const [deviceRows] = await db.promise().query('SELECT APIKey, DType FROM Device WHERE ID = ?', [deviceID]);
      if (deviceRows.length === 0) return res.status(404).json({ message: 'Không tìm thấy thiết bị' });
  
      const { APIKey, DType } = deviceRows[0];
      const type = DType.toLowerCase();
  
      if (!type.includes('fan') && !type.includes('led')) {
        return res.status(400).json({ message: `Thiết bị ${DType} không hỗ trợ đặt lịch` });
      }
  
      const client = mqttService.getClient();
      if (!client || !client.connected) {
        return res.status(500).json({ message: 'MQTT client chưa kết nối' });
      }
  
      const modeType = 'SCHEDULE';
      const now = new Date();
  
      // Thêm mode
      const [modeResult] = await db.promise().query(
        'INSERT INTO Mode (MType, MTime, UserID) VALUES (?, ?, ?)',
        [modeType, now, userID]
      );
      const modeID = modeResult.insertId;
  
      // Gắn thiết bị vào mode
      await db.promise().query(
        'INSERT INTO ModeDevice (ModeID, DeviceID) VALUES (?, ?)',
        [modeID, deviceID]
      );
  
      const scheDescription = `Hẹn giờ ${status ? 'bật' : 'tắt'} ${DType} sau ${hour}:${minute < 10 ? '0' + minute : minute}, giá trị: ${para}`;
      await db.promise().query(
        'INSERT INTO ScheMode (ModeID, SDescription, SIndex) VALUES (?, ?, ?)',
        [modeID, scheDescription, freeIndex]
      );
  
      const startTime = new Date(now.getTime() + hour * 60 * 60 * 1000 + minute * 60 * 1000);
      const endTime = new Date(startTime.getTime() + 10 * 60 * 1000);
  
      await db.promise().query(
        'INSERT INTO ScheDetail (StartTime, EndTime, ModeID, DeviceID) VALUES (?, ?, ?, ?)',
        [startTime, endTime, modeID, deviceID]
      );
  
      let messageObj = {
        action: 'add_schedule',
        hour,
        minute,
        status: Boolean(status),
        index: freeIndex
      };
  
      if (type.includes('fan')) {
        messageObj.speed = para;
      } else if (type.includes('led')) {
        messageObj.brightness = para;
      }
  
      client.publish(APIKey, JSON.stringify(messageObj), (err) => {
        if (err) {
          console.error('Lỗi publish MQTT:', err.message);
          return res.status(500).json({ message: 'Gửi lệnh lịch thất bại' });
        }
  
        res.status(200).json({
          message: 'Đặt lịch thành công và đã lưu vào CSDL',
          index: freeIndex,
          sent: messageObj,
          dbRecord: {
            modeID,
            scheDescription,
            startTime,
            endTime
          }
        });
      });
  
    } catch (error) {
      console.error('Lỗi addSchedule:', error.message);
      res.status(500).json({ message: 'Lỗi server' });
    }
  };  

  exports.updateSchedule = async (req, res) => {
    try {
      const { index, hour, minute, status, para, userID } = req.body;
  
      if (index === undefined || hour === undefined || minute === undefined || status === undefined || para === undefined || !userID) {
        return res.status(400).json({ message: 'Thiếu thông tin cần thiết' });
      }
  
      // Lấy thông tin từ index
      const [[deviceRow]] = await db.promise().query(
        `SELECT sm.ModeID, md.DeviceID, d.APIKey, d.DType
         FROM ScheMode sm
         JOIN ModeDevice md ON sm.ModeID = md.ModeID
         JOIN Device d ON md.DeviceID = d.ID
         WHERE sm.SIndex = ?`,
        [index]
      );
  
      if (!deviceRow) {
        return res.status(404).json({ message: 'Không tìm thấy lịch với index đã cung cấp' });
      }
  
      const { ModeID, DeviceID, APIKey, DType } = deviceRow;
      const type = DType.toLowerCase();
      const client = mqttService.getClient();
      if (!client || !client.connected) {
        return res.status(500).json({ message: 'MQTT client chưa kết nối' });
      }
  
      // Bước 1: Gửi lệnh xóa lịch cũ qua MQTT
      const deleteMessage = { action: 'delete_schedule', index: Number(index) };
      client.publish(APIKey, JSON.stringify(deleteMessage));
  
      // Bước 2: Cập nhật mô tả & thời gian
      const now = new Date();
      const scheDescription = `Cập nhật hẹn giờ ${status ? 'bật' : 'tắt'} ${DType} sau ${hour}:${minute < 10 ? '0' + minute : minute}, giá trị: ${para}`;
      const startTime = new Date(now.getTime() + hour * 60 * 60 * 1000 + minute * 60 * 1000);
      const endTime = new Date(startTime.getTime() + 10 * 60 * 1000);
  
      await db.promise().query(
        'UPDATE ScheMode SET SDescription = ? WHERE ModeID = ?',
        [scheDescription, ModeID]
      );
  
      await db.promise().query(
        'UPDATE ScheDetail SET StartTime = ?, EndTime = ? WHERE ModeID = ? AND DeviceID = ?',
        [startTime, endTime, ModeID, DeviceID]
      );
  
      // Bước 3: Gửi lệnh lịch mới qua MQTT
      let messageObj = {
        action: 'add_schedule',
        hour,
        minute,
        status: Boolean(status),
        index: Number(index)
      };
  
      if (type.includes('fan')) {
        messageObj.speed = para;
      } else if (type.includes('led')) {
        messageObj.brightness = para;
      }
  
      client.publish(APIKey, JSON.stringify(messageObj), (err) => {
        if (err) {
          return res.status(500).json({ message: 'Cập nhật MQTT thất bại', error: err.message });
        }
  
        res.status(200).json({
          message: 'Cập nhật lịch thành công (đã xóa lịch cũ trước khi cập nhật)',
          sent: messageObj,
          modeID: ModeID,
          updated: { scheDescription, startTime, endTime }
        });
      });
  
    } catch (error) {
      console.error('Lỗi updateSchedule:', error.message);
      res.status(500).json({ message: 'Lỗi server' });
    }
  };
  
  
  
  exports.deleteSchedule = async (req, res) => {
    try {
      const { index } = req.params;
  
      if (index === undefined) {
        return res.status(400).json({ message: 'Thiếu index để xóa lịch' });
      }
  
      const [[row]] = await db.promise().query(
        `SELECT sm.ModeID, d.APIKey 
         FROM ScheMode sm 
         JOIN ModeDevice md ON sm.ModeID = md.ModeID 
         JOIN Device d ON md.DeviceID = d.ID 
         WHERE sm.SIndex = ?`,
        [index]
      );
  
      if (!row) {
        return res.status(404).json({ message: 'Không tìm thấy lịch với index này' });
      }
  
      const { ModeID, APIKey } = row;
  
      await db.promise().query('DELETE FROM ScheDetail WHERE ModeID = ?', [ModeID]);
      await db.promise().query('DELETE FROM ScheMode WHERE ModeID = ?', [ModeID]);
      await db.promise().query('DELETE FROM ModeDevice WHERE ModeID = ?', [ModeID]);
      await db.promise().query('DELETE FROM Mode WHERE ID = ?', [ModeID]);
  
      const message = JSON.stringify({ action: 'delete_schedule', index: Number(index) });
      const client = mqttService.getClient();
      if (client && client.connected) {
        client.publish(APIKey, message);
      }
  
      res.status(200).json({
        message: 'Xóa lịch thành công',
        deletedIndex: Number(index),
        mqttSent: message
      });
  
    } catch (error) {
      console.error('Lỗi deleteSchedule:', error.message);
      res.status(500).json({ message: 'Lỗi server' });
    }
  };
  

  exports.getSchedules = async (req, res) => {
    try {
      const [rows] = await db.promise().query(`
        SELECT 
          sm.SIndex,
          d.ID AS DeviceID,
          d.DName AS DeviceName,
          d.DType AS DeviceType,
          sm.SDescription,
          sd.StartTime,
          sd.EndTime,
          m.UserID
        FROM ScheMode sm
        JOIN ModeDevice md ON sm.ModeID = md.ModeID
        JOIN Device d ON md.DeviceID = d.ID
        JOIN ScheDetail sd ON sm.ModeID = sd.ModeID
        JOIN Mode m ON sm.ModeID = m.ID
        ORDER BY sm.SIndex ASC
      `);
  
      const formatted = rows.map(r => ({
        index: r.SIndex,
        deviceID: r.DeviceID,
        deviceName: r.DeviceName,
        deviceType: r.DeviceType,
        description: r.SDescription,
        startTime: r.StartTime,
        endTime: r.EndTime,
        userID: r.UserID
      }));
  
      res.status(200).json({
        total: formatted.length,
        schedules: formatted
      });
  
    } catch (error) {
      console.error('Lỗi getSchedules:', error.message);
      res.status(500).json({ message: 'Lỗi server' });
    }
  };
  
  exports.getScheduleByIndex = async (req, res) => {
    try {
      const { index } = req.params;
  
      if (!index) {
        return res.status(400).json({ message: 'Thiếu chỉ số index của lịch' });
      }
  
      const [rows] = await db.promise().query(`
        SELECT 
          sm.SIndex,
          d.ID AS DeviceID,
          d.DName AS DeviceName,
          d.DType AS DeviceType,
          sm.SDescription,
          sd.StartTime,
          sd.EndTime,
          m.UserID
        FROM ScheMode sm
        JOIN ModeDevice md ON sm.ModeID = md.ModeID
        JOIN Device d ON md.DeviceID = d.ID
        JOIN ScheDetail sd ON sm.ModeID = sd.ModeID
        JOIN Mode m ON sm.ModeID = m.ID
        WHERE sm.SIndex = ?
      `, [index]);
  
      if (rows.length === 0) {
        return res.status(404).json({ message: `Không tìm thấy lịch với index ${index}` });
      }
  
      const r = rows[0];
      const result = {
        index: r.SIndex,
        deviceID: r.DeviceID,
        deviceName: r.DeviceName,
        deviceType: r.DeviceType,
        description: r.SDescription,
        startTime: r.StartTime,
        endTime: r.EndTime,
        userID: r.UserID
      };
  
      res.status(200).json(result);
  
    } catch (error) {
      console.error('Lỗi getScheduleByIndex:', error.message);
      res.status(500).json({ message: 'Lỗi server' });
    }
  };