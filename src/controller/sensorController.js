const db = require('../../config/db');
const Sensor = require('../model/sensorModel');
const ExcelJS = require('exceljs');

exports.getSensorByID = async (req, res) => {
  try {
    const { sensorID } = req.body;

    if (!sensorID) {
      return res.status(400).json({ message: "Missing sensorID" });
    }

    const sensor = await Sensor.findById(sensorID);

    if (!sensor) {
      return res.status(404).json({ message: "Sensor not found" });
    }

    res.status(200).json({ sensor });
  } catch (error) {
    console.error('Error getting sensor info:', error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getSensorsByUser = async (req, res) => {
    try {
      const { userID, homeID } = req.query;
  
      if (!userID || !homeID) {
        return res.status(400).json({ message: "Missing userID or homeID" });
      }
  
      const sensors = await Sensor.findByUser(userID, homeID);
  
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
  
      const data = await Sensor.findLatestData(ids);
  
      return res.status(200).json(data);
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

exports.addSensor = async (req, res) => {
  try {
    const { SName, SType, DataEdge, APIKey, HomeID, RoomID } = req.body;
    const sensorID = await Sensor.create({ SName, SType, DataEdge, APIKey, HomeID, RoomID });
    res.status(201).json({ message: "Thêm cảm biến thành công", sensorID });
  } catch (err) {
    res.status(500).json({ message: "Thêm cảm biến thất bại", error: err });
  }
};

exports.updateSensor = async (req, res) => {
  try {
    const id = req.params.id;
    const updates = req.body;
    await Sensor.update(id, updates);
    res.status(200).json({ message: "Cập nhật cảm biến thành công" });
  } catch (err) {
    res.status(500).json({ message: "Cập nhật cảm biến thất bại", error: err });
  }
};

exports.deleteSensor = async (req, res) => {
  try {
    const id = req.params.id;
    await Sensor.delete(id);
    res.status(200).json({ message: "Xóa cảm biến thành công" });
  } catch (err) {
    res.status(500).json({ message: "Xóa cảm biến thất bại", error: err });
  }
};

exports.getSensorDataHistory = async (req, res) => {
  try {
    let { sensorID, startDate, endDate, page = 1, limit = 10, sortOrder = 'asc' } = req.query;

    if (!sensorID) {
      return res.status(400).json({ message: "Missing sensorID" });
    }

    const sensorIDs = sensorID.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    if (sensorIDs.length === 0) {
      return res.status(400).json({ message: "Invalid sensorID list" });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const orderDirection = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    let dateCondition = '';
    const params = [];

    if (startDate) {
      dateCondition += ' AND STime >= ?';
      params.push(startDate);
    }

    if (endDate) {
      dateCondition += ' AND STime <= ?';
      params.push(endDate);
    }

    const sensorPlaceholders = sensorIDs.map(() => '?').join(',');

    const [rows] = await db.promise().query(
      `SELECT 
         sd.ID, 
         sd.SensorID,
         sd.STime, 
         sd.NumData,
         sd.TextData,
         sd.DataType,
         s.SName,
         s.SType,
         r.Name AS RoomName
       FROM SensorData sd
       JOIN Sensors s ON sd.SensorID = s.ID
       LEFT JOIN Room r ON s.RoomID = r.RoomID
       WHERE sd.SensorID IN (${sensorPlaceholders}) ${dateCondition}
       ORDER BY sd.STime ${orderDirection}
       LIMIT ? OFFSET ?`,
      [...sensorIDs, ...params, parseInt(limit), offset]
    );

    const [countRows] = await db.promise().query(
      `SELECT COUNT(*) AS total 
       FROM SensorData 
       WHERE SensorID IN (${sensorPlaceholders}) ${dateCondition}`,
      [...sensorIDs, ...params]
    );

    const total = countRows[0].total;
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      currentPage: parseInt(page),
      totalPages,
      totalRecords: total,
      sortOrder: orderDirection,
      sensorIDs,
      data: rows
    });
  } catch (error) {
    console.error("Error fetching sensor data history:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.exportSensorDataToExcel = async (req, res) => {
  try {
    let { sensorID, startDate, endDate, sortOrder = 'asc' } = req.query;

    if (!sensorID) {
      return res.status(400).json({ message: "Missing sensorID" });
    }

    const sensorIDs = sensorID.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    if (sensorIDs.length === 0) {
      return res.status(400).json({ message: "Invalid sensorID list" });
    }

    const orderDirection = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    let dateCondition = '';
    const params = [];

    if (startDate) {
      dateCondition += ' AND sd.STime >= ?';
      params.push(startDate);
    }

    if (endDate) {
      dateCondition += ' AND sd.STime <= ?';
      params.push(endDate);
    }

    const sensorPlaceholders = sensorIDs.map(() => '?').join(',');

    const [rows] = await db.promise().query(
      `SELECT 
         sd.ID, 
         sd.SensorID,
         sd.STime, 
         sd.NumData,
         sd.TextData,
         sd.DataType,
         s.SName,
         s.SType,
         r.Name AS RoomName
       FROM SensorData sd
       JOIN Sensors s ON sd.SensorID = s.ID
       LEFT JOIN Room r ON s.RoomID = r.RoomID
       WHERE sd.SensorID IN (${sensorPlaceholders}) ${dateCondition}
       ORDER BY sd.STime ${orderDirection}`,
      [...sensorIDs, ...params]
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sensor Data History');

    worksheet.columns = [
      { header: 'ID', key: 'ID', width: 10 },
      { header: 'Sensor ID', key: 'SensorID', width: 10 },
      { header: 'Sensor Name', key: 'SName', width: 20 },
      { header: 'Sensor Type', key: 'SType', width: 15 },
      { header: 'Room', key: 'RoomName', width: 20 },
      { header: 'Time', key: 'STime', width: 20 },
      { header: 'Number Data', key: 'NumData', width: 15 },
      { header: 'Text Data', key: 'TextData', width: 20 },
      { header: 'Data Type', key: 'DataType', width: 15 }
    ];

    rows.forEach(row => worksheet.addRow(row));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=sensor_data_history.xlsx');

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error("Error exporting sensor data:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};