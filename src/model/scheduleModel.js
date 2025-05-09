const db = require('../../config/db');

class Schedule {
  static async getUsedIndexes() {
    const [rows] = await db.promise().query('SELECT SIndex FROM ScheMode');
    return rows.map(r => r.SIndex);
  }

  static async countSchedules() {
    const [rows] = await db.promise().query('SELECT ModeID FROM ScheMode');
    return rows.length;
  }

  static async getDeviceInfo(deviceID) {
    const [rows] = await db.promise().query('SELECT APIKey, DType FROM Device WHERE ID = ?', [deviceID]);
    return rows[0];
  }

  static async insertMode(now, userID) {
    const [result] = await db.promise().query(
      'INSERT INTO Mode (MType, MTime, UserID) VALUES (?, ?, ?)',
      ['SCHEDULE', now, userID]
    );
    return result.insertId;
  }

  static async linkDeviceToMode(modeID, deviceID) {
    await db.promise().query(
      'INSERT INTO ModeDevice (ModeID, DeviceID) VALUES (?, ?)',
      [modeID, deviceID]
    );
  }

  static async insertScheMode(modeID, description, index) {
    await db.promise().query(
      'INSERT INTO ScheMode (ModeID, SDescription, SIndex) VALUES (?, ?, ?)',
      [modeID, description, index]
    );
  }

  static async insertScheDetail(startTime, endTime, modeID, deviceID) {
    await db.promise().query(
      'INSERT INTO ScheDetail (StartTime, EndTime, ModeID, DeviceID) VALUES (?, ?, ?, ?)',
      [startTime, endTime, modeID, deviceID]
    );
  }

  static async getScheduleByIndex(index) {
    const [[row]] = await db.promise().query(
      `SELECT sm.ModeID, md.DeviceID, d.APIKey, d.DType
       FROM ScheMode sm
       JOIN ModeDevice md ON sm.ModeID = md.ModeID
       JOIN Device d ON md.DeviceID = d.ID
       WHERE sm.SIndex = ?`, [index]
    );
    return row;
  }

  static async updateScheModeDescription(modeID, description) {
    await db.promise().query('UPDATE ScheMode SET SDescription = ? WHERE ModeID = ?', [description, modeID]);
  }

  static async updateScheDetailTimes(modeID, deviceID, startTime, endTime) {
    await db.promise().query(
      'UPDATE ScheDetail SET StartTime = ?, EndTime = ? WHERE ModeID = ? AND DeviceID = ?',
      [startTime, endTime, modeID, deviceID]
    );
  }

  static async deleteScheduleByModeID(modeID) {
    await db.promise().query('DELETE FROM ScheDetail WHERE ModeID = ?', [modeID]);
    await db.promise().query('DELETE FROM ScheMode WHERE ModeID = ?', [modeID]);
    await db.promise().query('DELETE FROM ModeDevice WHERE ModeID = ?', [modeID]);
    await db.promise().query('DELETE FROM Mode WHERE ID = ?', [modeID]);
  }

  static async getScheduleDetail(index) {
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
    return rows[0];
  }

  static async getSchedulesByUser(userID) {
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
      WHERE m.UserID = ?
      ORDER BY sm.SIndex ASC
    `, [userID]);
    return rows;
  }
}

module.exports = Schedule;
