const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const wifi = require('node-wifi');
const bodyParser = require('body-parser');
const qr = require('qr-image');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 4000;

app.use(cors());
app.use(bodyParser.json());

let devices = [];
let deviceTokens = {}; // To store generated tokens for devices

wifi.init({
  iface: null // Network interface, choose a specific interface or null for auto-detect
});

// Fetch connected devices using ADB
const fetchDevices = () => {
  exec('adb devices', (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }

    devices = stdout.split('\n')
      .slice(1) // Skip the first line "List of devices attached"
      .filter(line => line.includes('device') && !line.includes('unauthorized')) // Filter out unauthorized and empty lines
      .map(line => {
        const deviceId = line.split('\t')[0];
        const deviceName = `Device ${deviceId}`;

        // Generate a unique token for the device if not already generated
        if (!deviceTokens[deviceId]) {
          deviceTokens[deviceId] = uuidv4();
        }

        return {
          id: deviceId,
          name: deviceName,
          ip: null, // IP will be set after USB mirroring
          port: '5000' // Default port
        };
      });

    console.log('Devices fetched:', devices);
  });
};

app.get('/devices', (req, res) => {
  fetchDevices();
  res.json(devices);
});

app.get('/mirror/usb/:deviceId', (req, res) => {
  const { deviceId } = req.params;
  console.log(`Starting mirroring for device: ${deviceId}`);

  exec(`scrcpy -s ${deviceId} -b 4M -m 1024`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error starting mirroring via USB: ${error}`);
      return res.status(500).send('Error starting mirroring via USB');
    }

    console.log(`Mirroring started for device: ${deviceId}`);

    // Get the device's IP address after mirroring via USB
    exec(`adb -s ${deviceId} shell ip route`, (ipError, ipStdout, ipStderr) => {
      console.log(`ADB shell ip route output: ${ipStdout}`); // Log the full output
      if (ipError) {
        console.error(`Error fetching IP address: ${ipError}`);
        return res.status(500).send('Error fetching IP address');
      }

      const ipMatch = ipStdout.match(/src\s+([0-9.]+)/);
      const ipAddress = ipMatch ? ipMatch[1] : null;

      if (!ipAddress) {
        console.error(`IP address not found for device: ${deviceId}`);
        return res.status(500).send('IP address not found');
      }

      console.log(`Fetched IP Address: ${ipAddress} for device: ${deviceId}`);

      // Find the device in the list and update its IP address
      const device = devices.find(d => d.id === deviceId);
      if (!device) {
        console.error(`Device not found in list: ${deviceId}`);
        return res.status(404).send('Device not found');
      }

      device.ip = ipAddress;

      // Generate QR code with the device ID, IP, and port
      const qrData = JSON.stringify({
        id: deviceId,
        ip: ipAddress,
        port: device.port
      });

      try {
        const qrCode = qr.imageSync(qrData, { type: 'png' });
        console.log(`Generated QR code for device ${deviceId}: ${qrData}`);

        res.json({ qrCode: qrCode.toString('base64') });
      } catch (qrError) {
        console.error(`Error generating QR code: ${qrError}`);
        return res.status(500).send('Error generating QR code');
      }
    });
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  fetchDevices();
});
