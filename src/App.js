import React, { useState, useEffect } from 'react';
import axios from 'axios';
import QrScanner from 'react-qr-scanner';
import logo from './logo.png';
import net from 'net'; // Import net for TCP/IP
import './App.css';
import wifiIcon from './wifi_PNG62346.png';
import playIcon from './play_icon.png';
import forwardArrowIcon from './forward_arrow_icon.png';

function App() {
  const [devices, setDevices] = useState([]);
  const [showSerial, setShowSerial] = useState(false);
  const [wifiNetworks, setWifiNetworks] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [qrData, setQrData] = useState('');
  const [previousDevices, setPreviousDevices] = useState([]); // State to store previously connected devices
  const [tcpClient, setTcpClient] = useState(null);
  const [mirroringDeviceId, setMirroringDeviceId] = useState(null);

  // Fetch devices connected via ADB
  const fetchDevices = async () => {
    try {
      const response = await axios.get('http://localhost:4000/devices');
      setDevices(response.data);
    } catch (error) {
      console.error('Error fetching devices:', error);
    }
  };

  const startMirroringUsb = async (deviceId) => {
    try {
      console.log(`Requesting mirroring for device: ${deviceId}`);
      const response = await axios.get(`http://localhost:4000/mirror/usb/${deviceId}`);
      console.log(`Mirroring started for device: ${deviceId}`);
      console.log('QR Code data received:', response.data.qrCode);
  
      setMirroringDeviceId(deviceId);
  
      // Fetch the QR code for the device
      const newQrData = `data:image/png;base64,${response.data.qrCode}`;
      setQrData(newQrData);
  
      // Store the device and its QR code in the previously connected devices list
      setPreviousDevices(prev => [
        ...prev.filter(device => device.id !== deviceId), // Remove existing device entry if exists
        { id: deviceId, qrCode: newQrData }
      ]);
    } catch (error) {
      console.error('Error starting screen mirroring via USB:', error);
    }
  };

  // Scan for available WiFi networks
  const scanWifi = async (deviceId) => {
    try {
      const response = await axios.get(`http://localhost:4000/wifi/${deviceId}`);
      setWifiNetworks(response.data);
      setSelectedDeviceId(deviceId);
    } catch (error) {
      console.error('Error scanning WiFi networks:', error);
    }
  };

  // Connect to WiFi network and start mirroring via WiFi
  const connectWifi = async (ssid, password) => {
    try {
      await axios.post('http://localhost:4000/connect_wifi', { ssid, password, deviceId: selectedDeviceId });
      setWifiNetworks([]);
      startMirroringWifi(selectedDeviceId);
    } catch (error) {
      console.error('Error connecting to WiFi:', error);
    }
  };

  // Start mirroring via WiFi
  const startMirroringWifi = async (deviceId) => {
    try {
      await axios.post('http://localhost:4000/connect_wifi', { deviceId });
    } catch (error) {
      console.error('Error starting screen mirroring via WiFi:', error);
    }
  };

  // Handle QR code scanning and connect via TCP/IP
  const handleScan = async (data) => {
    if (data) {
      setQrData(data);
      try {
        // Verify the QR code
        const verificationResponse = await axios.post('http://localhost:4000/verify_qr', { qrCode: data });
        if (verificationResponse.data.verified) {
          const { ip, port } = JSON.parse(data); // Extract IP and port from QR code data

          // Create a TCP/IP client and connect
          const client = new net.Socket();
          client.connect(port, ip, () => {
            console.log('Connected to server via QR code');
            setTcpClient(client);
          });

          client.on('data', (data) => {
            console.log('Data received from server:', data.toString());
            // Handle screen data here
          });

          client.on('close', () => {
            console.log('Connection closed');
            setTcpClient(null);
          });

          client.on('error', (error) => {
            console.error('Connection error:', error);
            setTcpClient(null);
          });
        }
      } catch (error) {
        console.error('Error verifying QR code:', error);
      }
    }
  };

  const handleError = (err) => {
    console.error(err);
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  return (
    <div className="App">
      <div className="container">
        <div className="box green-box">
          <h2>Android Devices</h2>
          <p>No Android devices are connected. Please ensure the Android device is connected with a data cable, and USB Debugging is enabled.</p>
          <p>Android not found? Make sure <a href="#">Android USB Debugging</a> is enabled. Windows users need to install <a href="#">ADB Drivers</a>.</p>
          <p>Using Android SDK ADB server. <button onClick={fetchDevices}>Force Restart</button></p>
          {devices.length > 0 && (
            <div>
              <h3>Connected Devices:</h3>
              <ul>
                {devices.map(device => (
                  <li key={device.id} className="device-list-item">
                    <span>{showSerial ? device.id : device.name}</span>
                    <img
                      src={playIcon}
                      alt="Play"
                      className="icon"
                      onClick={() => startMirroringUsb(device.id)}
                    />
                    <img
                      src={wifiIcon}
                      alt="WiFi"
                      className="icon"
                      onClick={() => scanWifi(device.id)}
                    />
                    <img
                      src={forwardArrowIcon}
                      alt="Forward Arrow"
                      className="icon"
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="box middle-box">
          <h2>Connect by scanning the QR code</h2>
          <div className="qr-code">
            {qrData && mirroringDeviceId && <img src={qrData} alt="QR Code" />} {/* Display QR Code only when mirroring starts */}
            {!qrData && mirroringDeviceId && <p>Loading QR code...</p>}
          </div>
          
          {/* List of previously connected devices with their QR codes */}
          <div className="previous-devices">
            <h3>Previously Connected Devices</h3>
            <ul>
              {previousDevices.map(device => (
                <li key={device.id} onClick={() => setQrData(device.qrCode)}>
                  <span>Device ID: {device.id}</span>
                </li>
              ))}
            </ul>
          </div>

            <QrScanner
            delay={300}
            onError={handleError}
            onScan={handleScan}
            style={{ width: '100%' }}
          />
        </div>
        <div className="box blue-box">
          <h2>iOS Devices</h2>
          <p>No iOS devices are connected.</p>
          <p><a href="#">Download</a> Kommuent for iOS on the App Store and launch the app on your iOS device.</p>
          <p>iOS device not found? Ensure the iOS device is unlocked and connected with a Lightning data cable. Click "Trust Computer" on your iOS when prompted. You may need to disconnect and reconnect your iOS device after trusting the connection.</p>
          <p>Windows users will also need to install the <a href="#">AppleMobileDeviceSupport</a> drivers and services package.</p>
          <p><a href="#">Kommuent Dongle</a> not found. Mirroring only mode. Windows users must install a <a href="#">driver</a> for ESP32 dongles.</p>
          <button>Refresh</button>
        </div>
      </div>
      {wifiNetworks.length > 0 && (
        <div className="wifi-modal">
          <h3>Select WiFi Network</h3>
          <ul>
            {wifiNetworks.map(network => (
              <li key={network.ssid}>
                <span>{network.ssid}</span>
                <input type="password" placeholder="Password" id={`password-${network.ssid}`} />
                <button onClick={() => connectWifi(network.ssid, document.getElementById(`password-${network.ssid}`).value)}>Connect</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
