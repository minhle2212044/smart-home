const mqtt = require('mqtt');
const db = require("../../config/db");

let client = null;
const userTopics = {};
const subscribedTopics = new Set();

let sensorDataQueue = [];

async function handleIncomingMessage(topic, message) {
  try {
    console.log(`Received on ${topic}: ${message.toString()}`);

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
      const sensorID = await getSensorIdByType(type);
      if (!sensorID) {
        console.error('SensorID not found for type:', type);
        return;
      }

      const sensorData = {
        STime: new Date(),
        DataType: typeof value === 'number' ? 'Number' : 'String',
        NumData: typeof value === 'number' ? value : null,
        TextData: typeof value !== 'number' ? value : null,
        SensorID: sensorID
      };

      // Push vào queue cho FE
      sensorDataQueue.push(sensorData);

      // Save thẳng vào database
      await db.promise().query(
        'INSERT INTO SensorData (STime, DataType, NumData, TextData, SensorID) VALUES (?, ?, ?, ?, ?)',
        [sensorData.STime, sensorData.DataType, sensorData.NumData, sensorData.TextData, sensorData.SensorID]
      );

      console.log(`Saved sensor data for SensorID=${sensorID}`);
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

async function connectToMqtt(apiKey) {
  if (client) client.end(true);
  client = mqtt.connect(apiKey);

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
