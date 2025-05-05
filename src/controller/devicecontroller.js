const db = require('../../config/db');
const mqttService = require('../service/mqttService');
const ExcelJS = require('exceljs');

exports.getDeviceByID = async (req, res) => {
  try {
    const { deviceID } = req.body;

    if (!deviceID) {
      return res.status(400).json({ message: "Missing deviceID" });
    }

    const [deviceRows] = await db.promise().query(
      `SELECT d.ID as DeviceID, d.DName, d.DType, d.APIKey, d.RoomID, r.Name as RoomName, 
              d.HomeID, h.HName as HomeName, h.UserID
       FROM Device d
       LEFT JOIN Room r ON d.RoomID = r.RoomID
       LEFT JOIN Home h ON d.HomeID = h.ID
       WHERE d.ID = ?`,
      [deviceID]
    );

    if (deviceRows.length === 0) {
      return res.status(404).json({ message: "Device not found" });
    }

    res.status(200).json({ device: deviceRows[0] });
  } catch (error) {
    console.error('Error getting device info:', error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

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
    const { deviceID, modeID, userID} = req.body;

    if (!deviceID || modeID === undefined || userID === undefined) {
      return res.status(400).json({ message: 'Thiếu deviceID, modeID hoặc userID' });
    }

    if (![0, 2].includes(modeID)) {
      return res.status(400).json({ message: 'Giá trị modeID không hợp lệ (0: Manual, 2: Auto)' });
    }

    const [[device]] = await db.promise().query("SELECT APIKey FROM Device WHERE ID = ?", [deviceID]);
    if (!device) return res.status(404).json({ message: "Không tìm thấy thiết bị" });

    const topic = device.APIKey;
    const messageObj = { action: "set_mode", mode: modeID };

    const client = mqttService.getClient();
    if (!client || !client.connected) return res.status(500).json({ message: 'MQTT client chưa kết nối' });

    client.publish(topic, JSON.stringify(messageObj), async (err) => {
      if (err) return res.status(500).json({ message: 'Gửi MQTT thất bại', error: err.message });

      if (modeID === 0 || modeID === 2) {
          const [result] = await db.promise().query(
            "INSERT INTO Mode (MType, MTime, UserID) VALUES (?, NOW(), ?)",
            [modeID === 0 ? 'MANUAL' : 'AUTO', userID]
          );
          const insertedModeID = result.insertId;
          const [result2] = await db.promise().query(
            "INSERT INTO ModeDevice (ModeID, DeviceID) VALUES (?, ?)",
            [insertedModeID, deviceID]
          );
      }
      res.status(200).json({
        message: "Thiết lập chế độ thành công",
        topic,
        sentPayload: messageObj
      });
    });

  } catch (error) {
    console.error('Lỗi trong setMode:', error.message);
    res.status(500).json({ message: 'Lỗi server' });
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
      return res.status(400).json({ message: 'Thiếu hoặc sai deviceID/threshold' });
    }

    const [deviceRows] = await db.promise().query(
      'SELECT APIKey, DType, HomeID, RoomID FROM Device WHERE ID = ?',
      [deviceID]
    );
    if (deviceRows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy thiết bị' });
    }

    const { APIKey, DType, HomeID, RoomID } = deviceRows[0];
    const topic = APIKey;
    const payload = {
      action: 'set_threshold',
      threshold: threshold
    };

    const client = mqttService.getClient();
    if (!client || !client.connected) {
      return res.status(500).json({ message: 'MQTT client chưa kết nối' });
    }


    client.publish(topic, JSON.stringify(payload), async (err) => {
      if (err) {
        console.error('Lỗi gửi threshold:', err.message);
        return res.status(500).json({ message: 'Gửi MQTT thất bại' });
      }


      let sensorType = '';
      const dtype = DType.toLowerCase();

      if (dtype.includes('fan')) sensorType = 'Temperature Sensor';
      else if (dtype.includes('door')) sensorType = 'Ultrasonic Sensor';
      else if (dtype.includes('led')) sensorType = 'Light Sensor';
      else if (dtype.includes('buzzer')) sensorType = 'Gas Sensor';
      else return res.status(400).json({ message: `Không hỗ trợ DType: ${DType}` });

      const [sensorRows] = await db.promise().query(
        'SELECT ID FROM Sensors WHERE SName = ? AND HomeID = ? AND RoomID = ? LIMIT 1',
        [sensorType, HomeID, RoomID]
      );

      if (sensorRows.length === 0) {
        return res.status(404).json({ message: `Không tìm thấy cảm biến kiểu ${sensorType}` });
      }

      const sensorID = sensorRows[0].ID;

      await db.promise().query(
        'UPDATE Sensors SET DataEdge = ? WHERE ID = ?',
        [threshold.toString(), sensorID]
      );


      res.status(200).json({
        message: 'Đặt ngưỡng và cập nhật cảm biến thành công',
        topic,
        payload
      });
    });
  } catch (error) {
    console.error('Lỗi trong setThreshold:', error.message);
    res.status(500).json({ message: 'Lỗi server' });
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

exports.SetParameter = async (req, res) => {
  try {
    const { deviceID, para } = req.body;

    if (!deviceID || para === undefined) {
      return res.status(400).json({ message: 'Thiếu deviceID hoặc para' });
    }

    const [rows] = await db.promise().query(
      'SELECT APIKey, DType FROM Device WHERE ID = ?', 
      [deviceID]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy thiết bị' });
    }

    const { APIKey, DType } = rows[0];
    const type = DType.toLowerCase();
    let messageObj = { action: 'set_parameter' };
    let parameterToStore = para;

    if (type.includes('fan')) {
      messageObj.speed = para;
    } else if (type.includes('led')) {
      messageObj.brightness = para;
    } else if (type.includes('buzzer')) {
      messageObj.amplitude = para;
    } else if (type.includes('door')) {
      messageObj = {
        action: 'set_password',
        is_set_password: Boolean(para)
      };
      parameterToStore = Boolean(para).toString();
    } else {
      return res.status(400).json({ message: `Không hỗ trợ loại thiết bị: ${DType}` });
    }

    const message = JSON.stringify(messageObj);
    const client = mqttService.getClient();

    if (!client || !client.connected) {
      return res.status(500).json({ message: 'MQTT client chưa kết nối' });
    }

    client.publish(APIKey, message, async (err) => {
      if (err) {
        console.error('MQTT publish error:', err.message);
        return res.status(500).json({ message: 'Lỗi gửi lệnh' });
      }

      try {
        await db.promise().query(
          'UPDATE Device SET Parameter = ? WHERE ID = ?', 
          [parameterToStore.toString(), deviceID]
        );
      } catch (updateErr) {
        console.error('Lỗi cập nhật parameter trong DB:', updateErr.message);
        return res.status(500).json({ message: 'Gửi lệnh thành công nhưng lỗi khi lưu DB' });
      }

      res.status(200).json({ message: 'Gửi và lưu thành công', sent: messageObj });
    });

  } catch (error) {
    console.error('Lỗi SetParameter:', error.message);
    res.status(500).json({ message: 'Lỗi server' });
  }
};


exports.getDeviceDataHistory = async (req, res) => {
  try {
    let { deviceID, startDate, endDate, page = 1, limit = 10, sortOrder = 'asc' } = req.query;

    if (!deviceID) {
      return res.status(400).json({ message: "Missing deviceID" });
    }

    const deviceIDs = deviceID.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    if (deviceIDs.length === 0) {
      return res.status(400).json({ message: "Invalid deviceID list" });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const orderDirection = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    let dateCondition = '';
    const params = [];

    if (startDate) {
      dateCondition += ' AND al.ATime >= ?';
      params.push(startDate);
    }

    if (endDate) {
      dateCondition += ' AND al.ATime <= ?';
      params.push(endDate);
    }

    const devicePlaceholders = deviceIDs.map(() => '?').join(',');

    const [rows] = await db.promise().query(
      `SELECT 
         al.ID,
         al.DeviceID,
         al.AMode,
         al.ADescription,
         al.ATime,
         d.DName,
         d.DType,
         r.Name AS RoomName
       FROM ActivityLog al
       JOIN Device d ON al.DeviceID = d.ID
       LEFT JOIN Room r ON d.RoomID = r.RoomID
       WHERE al.DeviceID IN (${devicePlaceholders}) ${dateCondition}
       ORDER BY al.ATime ${orderDirection}
       LIMIT ? OFFSET ?`,
      [...deviceIDs, ...params, parseInt(limit), offset]
    );

    const [countRows] = await db.promise().query(
      `SELECT COUNT(*) AS total
       FROM ActivityLog al
       WHERE al.DeviceID IN (${devicePlaceholders}) ${dateCondition}`,
      [...deviceIDs, ...params]
    );

    const total = countRows[0].total;
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      currentPage: parseInt(page),
      totalPages,
      totalRecords: total,
      sortOrder: orderDirection,
      deviceIDs,
      data: rows
    });

  } catch (error) {
    console.error("Error fetching device activity history:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.exportDeviceDataToExcel = async (req, res) => {
  try {
    let { deviceID, startDate, endDate, sortOrder = 'asc' } = req.query;

    if (!deviceID) {
      return res.status(400).json({ message: "Missing deviceID" });
    }

    const deviceIDs = deviceID.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    if (deviceIDs.length === 0) {
      return res.status(400).json({ message: "Invalid deviceID list" });
    }

    let dateCondition = '';
    const params = [];

    if (startDate) {
      dateCondition += ' AND al.ATime >= ?';
      params.push(startDate);
    }

    if (endDate) {
      dateCondition += ' AND al.ATime <= ?';
      params.push(endDate);
    }

    const devicePlaceholders = deviceIDs.map(() => '?').join(',');
    const orderDirection = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    const [rows] = await db.promise().query(
      `SELECT 
         al.ID,
         al.DeviceID,
         al.AMode,
         al.ADescription,
         al.ATime,
         d.DName,
         d.DType,
         r.Name AS RoomName
       FROM ActivityLog al
       JOIN Device d ON al.DeviceID = d.ID
       LEFT JOIN Room r ON d.RoomID = r.RoomID
       WHERE al.DeviceID IN (${devicePlaceholders}) ${dateCondition}
       ORDER BY al.ATime ${orderDirection}`,
      [...deviceIDs, ...params]
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Device Activity History');

    worksheet.columns = [
      { header: 'Log ID', key: 'ID', width: 10 },
      { header: 'Device ID', key: 'DeviceID', width: 12 },
      { header: 'Device Name', key: 'DName', width: 20 },
      { header: 'Device Type', key: 'DType', width: 15 },
      { header: 'Room Name', key: 'RoomName', width: 20 },
      { header: 'Mode', key: 'AMode', width: 10 },
      { header: 'Description', key: 'ADescription', width: 30 },
      { header: 'Time', key: 'ATime', width: 25 },
    ];

    rows.forEach(row => {
      worksheet.addRow(row);
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=device_activity_history.xlsx'
    );

    // Ghi workbook ra response
    await workbook.xlsx.write(res);
    res.status(200).end();

  } catch (error) {
    console.error("Error exporting device data to Excel:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};