import React, { useEffect, useState } from 'react';
import './MoistureMonitor.css'; // Add styling for a better UI

function MoistureMonitor() {
  const [moisture, setMoisture] = useState(0); // Moisture level
  const [ledStatus, setLedStatus] = useState(false); // LED status

  // Fetch moisture level from FastAPI
  useEffect(() => {
    const fetchMoistureData = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/get_moisture');
        const data = await response.json();
        setMoisture(data.moisture);
      } catch (error) {
        console.error('Error fetching moisture data:', error);
      }
    };

    const interval = setInterval(fetchMoistureData, 1000); // Update every second
    return () => clearInterval(interval); // Cleanup
  }, []);

  // Fetch LED status from FastAPI
  useEffect(() => {
    const fetchLedStatus = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/get_led_status'); // Use GET method
        const data = await response.json();
        setLedStatus(data.led_status === "ON"); // Update LED status (true or false)
      } catch (error) {
        console.error('Error fetching LED status:', error);
      }
    };

    fetchLedStatus(); // Fetch on component mount
  }, []);






  const [mode, setMode] = useState('manual'); // Mode: 'manual' or 'automatic'

  // Toggle between manual and automatic modes
  const toggleMode = () => {
  const newMode = mode === 'manual' ? 'automatic' : 'manual';
  setMode(newMode);
  // Send mode update to FastAPI
  fetch('http://127.0.0.1:8000/set_mode', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: newMode }),
  });
  };


  // Automatic LED Control (checks moisture and sets LED status)
useEffect(() => {
  if (mode === 'automatic') {
    const interval = setInterval(async () => {
      try {
        const moistureResponse = await fetch('http://127.0.0.1:8000/get_moisture');
        const moistureData = await moistureResponse.json();

        const newLedStatus = moistureData.moisture >= 70 ? 1 : 0;
        await fetch('http://127.0.0.1:8000/set_led_status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ led_status: newLedStatus }),
        });
        // Update local ledStatus state based on the new status
        if (newLedStatus === 0) {
          setLedStatus(false); // Turn on locally
        } else {
          setLedStatus(true); // Turn off locally
        }
       
      } catch (error) {
        console.error('Error in automatic LED control:', error);
      }
    }, 1000);
    return () => clearInterval(interval); // Cleanup
  }
}, [mode]);










  // Toggle LED status by sending a POST request
  const toggleLed = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/set_led_status', {
        method: 'POST', // POST method to toggle the status
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ led_status: ledStatus ? 0 : 1 }), // Send opposite status to toggle
      });

      if (response.ok) {
        setLedStatus(!ledStatus); // Update UI after successful toggle
      } else {
        console.error('Failed to toggle LED status. HTTP response code:', response.status);
      }
    } catch (error) {
      console.error('Error toggling LED:', error);
    }
  };

  return (
    <div className="dashboard">
      <h1>Soil Monitoring Dashboard</h1>

      {/* Sensor Data */}
      <div className="sensor-data">
        <div className="sensor-card">
          <h2>Moisture Level</h2>
          <div className="progress-bar">
            <div
              className="progress"
              style={{
                width: `${moisture}%`,
                backgroundColor: moisture > 50 ? 'green' : 'orange',
              }}
            ></div>
          </div>
          <p>{moisture}%</p>
        </div>
      </div>

      {/* LED Control */}
      <div className="led-control">
        <div className="led-indicator">
          <span
            className={`led-light ${ledStatus ? 'led-on' : 'led-off'}`}
          ></span>
          <p>LED is {ledStatus ? 'ON' : 'OFF'}</p>
        </div>

              {/* Slider for Mode */}
    

    <div className="slider-container">
  <label className="slider-label">
    <span>{mode === 'manual' ? 'Manual' : 'Automatic'}</span>
    <input
      type="checkbox"
      checked={mode === 'automatic'}
      onChange={toggleMode}
      className="slider-input"
    />
    <span className="slider"></span>
  </label>
</div>





        <button
          onClick={toggleLed}
          disabled={mode === 'automatic'}
          style={{ opacity: mode === 'automatic' ? 0.5 : 1 }}
          className={ledStatus ? 'led-button led-on' : 'led-button led-off'}
        >
          {ledStatus ? 'Turn LED Off' : 'Turn LED On'}
        </button>
      </div>


    </div>
  );
}

export default MoistureMonitor;
