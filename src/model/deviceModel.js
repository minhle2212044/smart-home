const db = require('../../config/db');

class Device {
    constructor({ ID, DName, DType, APIKey, RoomID, HomeID }) {
        this.ID = ID;
        this.DName = DName;
        this.DType = DType;
        this.APIKey = APIKey;
        this.RoomID = RoomID;
        this.HomeID = HomeID;
    }

    static async findById(deviceID) {
        const [rows] = await db.promise().query(
            `SELECT d.ID, d.DName, d.DType, d.APIKey, d.RoomID, r.Name as RoomName,
                    d.HomeID, h.HName as HomeName, h.UserID
             FROM Device d
             LEFT JOIN Room r ON d.RoomID = r.RoomID
             LEFT JOIN Home h ON d.HomeID = h.ID
             WHERE d.ID = ?`,
            [deviceID]
        );
        if (rows.length === 0) return null;
        return new Device(rows[0]);
    }

    static async findByUserAndHome(userID, homeID) {
        const [rows] = await db.promise().query(
            `SELECT d.ID, d.DName, d.DType, d.APIKey, d.RoomID, d.HomeID
             FROM Device d
             JOIN Home h ON d.HomeID = h.ID
             WHERE h.UserID = ? AND d.HomeID = ?`,
            [userID, homeID]
        );
        return rows.map(row => new Device(row));
    }

    static async getAPIKey(deviceID) {
        const [rows] = await db.promise().query("SELECT APIKey FROM Device WHERE ID = ?", [deviceID]);
        return rows.length ? rows[0].APIKey : null;
    }

    static async create({ DType, DName, APIKey, RoomID, HomeID }) {
        const [result] = await db.promise().query(
            `INSERT INTO Device (DType, DName, APIKey, RoomID, HomeID)
             VALUES (?, ?, ?, ?, ?)`,
            [DType, DName, APIKey, RoomID, HomeID]
        );
        return result.insertId;
    }

    static async update(id, { DType, DName, APIKey, RoomID, HomeID }) {
        await db.promise().query(
            `UPDATE Device SET DType = ?, DName = ?, APIKey = ?, RoomID = ?, HomeID = ?
             WHERE ID = ?`,
            [DType, DName, APIKey, RoomID, HomeID, id]
        );
    }

    static async delete(id) {
        await db.promise().query("DELETE FROM Device WHERE ID = ?", [id]);
    }

    static async updateParameter(deviceID, parameter) {
        await db.promise().query(
            "UPDATE Device SET Parameter = ? WHERE ID = ?",
            [parameter.toString(), deviceID]
        );
    }

    static async getWithType(deviceID) {
        const [rows] = await db.promise().query(
            "SELECT APIKey, DType FROM Device WHERE ID = ?",
            [deviceID]
        );
        return rows.length ? rows[0] : null;
    }

    static async getThresholdInfo(deviceID) {
        const [rows] = await db.promise().query(
            "SELECT APIKey, DType, HomeID, RoomID FROM Device WHERE ID = ?",
            [deviceID]
        );
        return rows.length ? rows[0] : null;
    }
}

module.exports = Device;
