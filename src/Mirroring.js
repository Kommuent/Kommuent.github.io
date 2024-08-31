import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [networks, setNetworks] = useState([]);
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [password, setPassword] = useState('');
  const [deviceId, setDeviceId] = useState('');

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const response = await axios.get('http://localhost:4000/devices');
      if (response.data.length > 0) {
        setDeviceId(response.data[0].id); // Assuming you want to use the first device found
      }
    } catch (error) {
      console.error('Error fetching devices', error);
    }
  };

  const handleScanWifi = async () => {
    try {
      const response = await axios.get(`http://localhost:4000/wifi/${deviceId}`);
      setNetworks(response.data);
    } catch (error) {
      console.error('Error scanning WiFi networks', error);
    }
  };

  const handleConnectAndMirror = async () => {
    try {
      await axios.post('http://localhost:4000/connect_wifi', { ssid: selectedNetwork, password, deviceId });
      // Proceed to mirroring after connecting to WiFi
    } catch (error) {
      console.error('Error connecting to WiFi and starting mirroring', error);
    }
  };

  return (
    <div>
      <button onClick={handleScanWifi}>Scan WiFi Networks</button>
      {networks.length > 0 && (
        <div>
          <select onChange={(e) => setSelectedNetwork(e.target.value)}>
            {networks.map((network) => (
              <option key={network.ssid} value={network.ssid}>
                {network.ssid}
              </option>
            ))}
          </select>
          <input
            type="password"
            placeholder="Enter WiFi Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={handleConnectAndMirror}>Connect and Mirror</button>
        </div>
      )}
    </div>
  );
}

export default App