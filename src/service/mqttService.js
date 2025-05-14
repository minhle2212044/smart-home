const mqtt = require('mqtt');
const db = require("../../config/db");

let client = null;
const userTopics = {};
const subscribedTopics = new Set();

let sensorDataQueue = [];

async function handleIncomingMessage(topic, message) {
  try {

    const segments = topic.split('/');
    if (segments.length < 3) {
      console.error('Invalid topic format:', topic);
      return;
    }

    const root = segments[1];
    const type = segments[2];
    const rawData = message.toString();

    let value = isNaN(rawData) ? rawData : parseFloat(rawData);

    if (root === 'sensors') {
      const sensorID = await getSensorIdByApiKey(topic);
      if (!sensorID) {
        console.error('SensorID not found for topic:', topic);
        return;
      }

      const sensorData = {
        STime: new Date(),
        DataType: typeof value === 'number' ? 'Number' : 'String',
        NumData: typeof value === 'number' ? value : null,
        TextData: typeof value !== 'number' ? value : null,
        SensorID: sensorID
      };

      await db.promise().query(
        'INSERT INTO SensorData (STime, DataType, NumData, TextData, SensorID) VALUES (?, ?, ?, ?, ?)',
        [sensorData.STime, sensorData.DataType, sensorData.NumData, sensorData.TextData, sensorData.SensorID]
      );

      const [sensorInfo] = await db.promise().query(`
        SELECT SName, SType, DataEdge, h.UserID 
        FROM Sensors s
        JOIN Home h ON s.HomeID = h.ID
        WHERE s.ID = ?`, 
        [sensorID]
      );

      if (sensorInfo.length > 0) {
        const { SName, SType, DataEdge, UserID } = sensorInfo[0];
      
        if (SName === 'Ultrasonic Sensor') return;
      
        const edge = parseFloat(DataEdge);
        if (!isNaN(edge) && typeof value === 'number' && value > edge) {
          let unit = '';
          switch (SName) {
            case 'Temperature Sensor':
              unit = '°C';
              break;
            case 'Humidity Sensor':
              unit = '%';
              break;
            case 'Gas Sensor':
              unit = 'ppm';
              break;
            case 'Light Sensor':
              unit = 'lux';
              break;
            default:
              unit = '';
          }
      
          const msg = `${SType} đang ở mức cao: ${value}${unit}`;
          await db.promise().query(`
            INSERT INTO Notification (Message, NTime, UserID, SensorID, NType, isRead)
            VALUES (?, NOW(), ?, ?, 'Sensor', false)
          `, [msg, UserID, sensorID]);
        }
      }
    } else {
      const deviceTypeMap = {
        'fan': 'Mini fan',
        'door': 'Door',
        'led': 'Led',
        'buzzer': 'Buzzer'
      };

      const deviceType = deviceTypeMap[type];
      if (!deviceType) {
        console.warn(`Unsupported device type in topic: ${type}`);
        return;
      }

      const [deviceRows] = await db.promise().query(
        'SELECT ID, DName, HomeID FROM Device WHERE DType = ?',
        [deviceType]
      );
      if (deviceRows.length === 0) {
        console.error(`No device found for DType: ${deviceType}`);
        return;
      }

      const { ID: deviceID, DName, HomeID } = deviceRows[0];

      let parsed;
      try {
        parsed = JSON.parse(message.toString());
      } catch (e) {
        console.error('Invalid JSON format from device message:', message.toString());
        return;
      }

      const statusRaw = parsed.status;

      let status;
      if (typeof statusRaw === 'boolean') {
        status = statusRaw ? 'ON' : 'OFF';
      } else if (typeof statusRaw === 'string' && ['ON', 'OFF'].includes(statusRaw.toUpperCase())) {
        status = statusRaw.toUpperCase();
      } else {
        return;
      }

      const [userRows] = await db.promise().query(
        `SELECT UserID FROM Home WHERE ID = ?`,
        [HomeID]
      );
      const userID = userRows.length > 0 ? userRows[0].UserID : null;

      const [modeDeviceRows] = await db.promise().query(
        `SELECT ModeID FROM ModeDevice WHERE DeviceID = ? ORDER BY ModeID DESC LIMIT 1`,
        [deviceID]
      );

      const modeID = modeDeviceRows.length > 0 ? modeDeviceRows[0].ModeID : null;
      const [modeRows] = modeID ? await db.promise().query(`SELECT MType FROM Mode WHERE ID = ?`, [modeID]) : [[]];
      const modeType = modeRows.length > 0 ? modeRows[0].MType : 'Manual';

      const currentTime = new Date();
      await db.promise().query(
        `INSERT INTO ActivityLog (AMode, ADescription, ATime, DeviceID) VALUES (?, ?, ?, ?)`,
        [modeType, status.toUpperCase(), currentTime, deviceID]
      );

      if (userID) {
        const msg = `Thiết bị "${DName}" chuyển sang trạng thái: ${status.toUpperCase()}`;
        await db.promise().query(`
          INSERT INTO Notification (Message, NTime, UserID, DeviceID, NType, isRead)
          VALUES (?, NOW(), ?, ?, 'Device', false)
        `, [msg, userID, deviceID]);
      }
    }
  } catch (error) {
    console.error(`Error processing message: ${error.message}`);
  }
}

async function getSensorIdByApiKey(apiKey) {
  const [rows] = await db.promise().query('SELECT ID FROM Sensors WHERE APIKey = ?', [apiKey]);
  return rows.length > 0 ? rows[0].ID : null;
}

function subscribeTopic(topic) {
  return new Promise((resolve, reject) => {
    if (subscribedTopics.has(topic)) return resolve(topic);

    client.subscribe(topic, (err) => {
      if (err) {
        console.error(`Failed to subscribe ${topic}`, err);
        return reject(err);
      }
      subscribedTopics.add(topic);
      resolve(topic);
    });
  });
}

function unsubscribeTopic(topic) {
  return new Promise((resolve, reject) => {
    client.unsubscribe(topic, (err) => {
      if (err) {
        console.error(`Failed to unsubscribe ${topic}`, err);
        return reject(err);
      }
      subscribedTopics.delete(topic);
      resolve(topic);
    });
  });
}

async function connectToMqtt(config = {}) {
  const {
    host = '81662e041e51410a8ea0b84d4ce532c1.s1.eu.hivemq.cloud',
    port = 8883,
    username = 'client_1',
    password = 'cse_123_DADN',
    protocol = 'mqtts'
  } = config;

  if (client) client.end(true);

  const options = {
    host,
    port,
    username,
    password,
    protocol,
    reconnectPeriod: 1000
  };

  client = mqtt.connect(options);

  client.on('connect', () => {
    console.log('Connected to MQTT broker');
  });

  client.on('error', (err) => {
    console.error('MQTT error:', err.message);
  });

  client.on('message', (topic, message) => {
    handleIncomingMessage(topic, message);
  });
}


async function switchTopicsForUser(userId, homeId) {
  if (!client) {
    console.error('MQTT client is not connected');
    return;
  }

  const [devices] = await db.promise().query(
    `SELECT d.APIKey 
     FROM Device d 
     JOIN Home h ON d.HomeID = h.ID 
     WHERE d.HomeID = ? AND h.UserID = ?`,
    [homeId, userId]
  );

  const [sensors] = await db.promise().query(
    `SELECT s.APIKey 
     FROM Sensors s 
     JOIN Home h ON s.HomeID = h.ID 
     WHERE s.HomeID = ? AND h.UserID = ?`,
    [homeId, userId]
  );

  const deviceTopics = devices.map(d => d.APIKey);
  const sensorTopics = sensors.map(s => s.APIKey);
  const newTopics = [...deviceTopics, ...sensorTopics];

  if (newTopics.length === 0) {
    console.warn(`No topics found for user ${userId} and home ${homeId}`);
    return;
  }

  const oldTopics = userTopics[userId] || [];
  const toUnsubscribe = oldTopics.filter(t => !newTopics.includes(t));
  const toSubscribe = newTopics.filter(t => !oldTopics.includes(t));

  await Promise.all(toUnsubscribe.map(unsubscribeTopic));
  await Promise.all(toSubscribe.map(subscribeTopic));

  userTopics[userId] = newTopics;
}

function registerMessageHandler(handler) {
  messageHandler = handler;
}

function getSensorDataQueue() {
  const data = [...sensorDataQueue];
  sensorDataQueue = [];
  return data;
}

module.exports = {
  connectToMqtt,
  switchTopicsForUser,
  getSensorDataQueue,
  getClient: () => client,
  registerMessageHandler,
};