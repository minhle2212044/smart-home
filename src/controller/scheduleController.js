const db = require('../../config/db');
const scheduleModel = require('../model/scheduleModel');
const mqttService = require('../service/mqttService');

function formatDateToMySQL(date) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

exports.addSchedule = async (req, res) => {
  try {
    const { deviceID, hour, minute, status, para, userID, index } = req.body;

    if (!deviceID || hour === undefined || minute === undefined || status === undefined || para === undefined || !userID) {
      return res.status(400).json({ message: 'Thiếu thông tin cần thiết' });
    }

    const existingSchedules = await scheduleModel.countSchedules();
    if (existingSchedules.length >= 5) {
      return res.status(400).json({ message: 'Chỉ được đặt tối đa 5 lịch trong toàn hệ thống' });
    }

    let freeIndex = index;

    if (freeIndex === undefined) {
      const usedIndexes = await scheduleModel.getUsedIndexes();
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

    const deviceInfo = await scheduleModel.getDeviceInfo(deviceID);
    if (!deviceInfo) return res.status(404).json({ message: 'Không tìm thấy thiết bị' });

    const { APIKey, DType } = deviceInfo;
    const type = DType.toLowerCase();

    if (!type.includes('fan') && !type.includes('led')) {
      return res.status(400).json({ message: `Thiết bị ${DType} không hỗ trợ đặt lịch` });
    }

    const client = mqttService.getClient();
    if (!client || !client.connected) {
      return res.status(500).json({ message: 'MQTT client chưa kết nối' });
    }

    const now = new Date();
    const modeID = await scheduleModel.insertMode(now, userID);
    await scheduleModel.linkDeviceToMode(modeID, deviceID);

    const scheDescription = `Hẹn giờ ${status ? 'bật' : 'tắt'} ${DType} sau ${hour}:${minute < 10 ? '0' + minute : minute}, giá trị: ${para}`;
    await scheduleModel.insertScheMode(modeID, scheDescription, freeIndex);

    const startTime = new Date(now.getTime());
    const endTime = new Date(startTime.getTime() + hour * 60 * 60 * 1000 + minute * 60 * 1000);
    await scheduleModel.insertScheDetail(startTime, endTime, modeID, deviceID);

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

    // Gửi lệnh schedule
    client.publish(APIKey, JSON.stringify(messageObj), (err) => {
      if (err) {
        console.error('Lỗi publish MQTT:', err.message);
        return res.status(500).json({ message: 'Gửi lệnh lịch thất bại' });
      }

      // Gửi thêm lệnh chuyển mode sang SCHEDULE
      const modeMessage = {
        action: 'set_mode',
        mode: 1 // 1 là SCHEDULE
      };

      client.publish(APIKey, JSON.stringify(modeMessage), (err2) => {
        if (err2) {
          console.error('Lỗi gửi set_mode:', err2.message);
          return res.status(500).json({ message: 'Gửi set_mode thất bại' });
        }

        res.status(200).json({
          message: 'Đặt lịch thành công và đã lưu vào CSDL',
          index: freeIndex,
          sent: {
            scheduleCommand: messageObj,
            setModeCommand: modeMessage
          },
          dbRecord: {
            modeID,
            scheDescription,
            startTime,
            endTime
          }
        });
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
  
      const scheduleInfo = await scheduleModel.getScheduleByIndex(index);
  
      if (!scheduleInfo) {
        return res.status(404).json({ message: 'Không tìm thấy lịch với index đã cung cấp' });
      }
  
      const { ModeID, DeviceID, APIKey, DType } = scheduleInfo;
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
      const startTime = new Date(now.getTime() + hour * 0 + minute * 0);
      const endTime = new Date(startTime.getTime() + hour * 60 * 60 * 1000 + minute * 60 * 1000);

      await scheduleModel.updateScheModeDescription(ModeID, scheDescription);
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
  
      const info = await scheduleModel.getScheduleByIndex(index);
  
      if (!info) {
        return res.status(404).json({ message: 'Không tìm thấy lịch với index này' });
      }
  
      const { ModeID, APIKey } = info;
  
      await scheduleModel.deleteScheduleByModeID(ModeID);
  
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
      const { userID } = req.body;

      if (!userID) {
        return res.status(400).json({ message: 'Thiếu userID' });
      }

      const schedules = await scheduleModel.getSchedulesByUser(userID);
      res.status(200).json({ total: schedules.length, schedules });
  
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
  
      const schedule = await scheduleModel.getScheduleDetail(index);
      if (!schedule) return res.status(404).json({ message: `Không tìm thấy lịch với index ${index}` });

      res.status(200).json(schedule);
  
    } catch (error) {
      console.error('Lỗi getScheduleByIndex:', error.message);
      res.status(500).json({ message: 'Lỗi server' });
    }
  };