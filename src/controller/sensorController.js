let mqttClient = null;

exports.setMqttClient = (client) => {
    mqttClient = client;

    client.on('message', (topic, message) => {
        const data = message.toString();

        switch (topic) {
            case 'SmartHome/sensors/temperature':
                console.log('Temperature data:', data);
                break;
            case 'SmartHome/sensors/humidity':
                console.log('Humidity data:', data);
                break;
            case 'SmartHome/sensors/gas':
                console.log('Gas data:', data);
                break;
            case 'SmartHome/sensors/light':
                console.log('Light data:', data);
                break;
                case 'SmartHome/sensors/ultrasonic':
                    console.log('Ultrasonic data:', data);
                    break;
            default:
                console.log('Unknown topic:', topic);
        }
    });
};

// Fan
exports.controlFan = (req, res) => {
    const topic = 'SmartHome/devices/fan';
    const payload = JSON.stringify(req.body);
  
    mqttClient.publish(topic, payload, (err) => {
      if (err) {
        console.error(`Publish thất bại: ${err.message}`);
        return res.status(500).json({ message: 'Gửi điều khiển fan thất bại', error: err.message });
      }
  
      console.log(`Publish thành công: Topic: ${topic} | Payload: ${payload}`);
      res.status(200).json({ message: 'Gửi điều khiển fan thành công', topic, payload });
    });
  };

exports.getFanData = (req, res) => {
    res.send('Dữ liệu fan (demo)');
};

// Door
exports.controlDoor = (req, res) => {
    const topic = 'SmartHome/devices/door';
    const payload = JSON.stringify(req.body);
    mqttClient.publish(topic, payload);
    res.send('Gửi điều khiển cửa thành công');
};

exports.getDoorData = (req, res) => {x
    res.send('📥 Dữ liệu cửa (demo)');
};
