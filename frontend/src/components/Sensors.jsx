import React, { useEffect, useState } from 'react';
import { fetchLatestSensorData } from '../api';

export default function Sensors() {
  const [sensorData, setSensorData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const getData = async () => {
      const data = await fetchLatestSensorData();

     if (data) {
  setSensorData(data?.zones?.[0] || null);
  setLastUpdated(new Date());
}
    };

    getData();

    const interval = setInterval(getData, 3000);

    return () => clearInterval(interval);
  }, []);

  if (!sensorData) {
    return (
      <div className="p-6">
        <p className="text-gray-400">
          Loading sensor data...
        </p>
      </div>
    );
  }

  const sensors = [
    {
      name: 'Pressure',
      value: sensorData.pressure,
      unit: 'bar',
      description: 'Pipeline pressure',
    },
    {
      name: 'Flow',
      value: sensorData.flow,
      unit: 'L/min',
      description: 'Water flow rate',
    },
    {
      name: 'Acoustic',
      value: sensorData.acoustic,
      unit: '',
      description: 'Pipeline acoustic signal',
    },
    {
      name: 'pH',
      value: sensorData.ph,
      unit: '',
      description: 'Water acidity level',
    },
    {
      name: 'TDS',
      value: sensorData.tds,
      unit: 'mg/L',
      description: 'Total dissolved solids',
    },
    {
      name: 'Turbidity',
      value: sensorData.turbidity,
      unit: 'NTU',
      description: 'Water clarity',
    },
  ];

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">

        <div>
          <h2 className="text-2xl font-bold">
            Sensors & Devices
          </h2>

          <p className="text-sm text-gray-400 mt-1">
            Live telemetry and device health monitoring
          </p>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-accentTeal/20 text-accentTeal border border-accentTeal/30">
          ● ONLINE
        </span>

      </div>


      {/* Device Card */}
      <div className="bg-cardBg p-5 rounded-xl border border-gray-800">

        <div className="flex justify-between items-start">

          <div>
            <p className="text-sm text-gray-400">
              Connected Device
            </p>

            <p className="text-xl font-bold mt-1">
              {sensorData.device_id || 'ESP32_Node_1'}
            </p>

            <p className="text-sm text-gray-400 mt-1">
              Monitoring Zone: {sensorData.zone || 'Zone_A'}
            </p>
          </div>

          <div className="text-right">

            <p className="text-xs text-gray-500">
              DATA STREAM
            </p>

            <p className="text-sm text-accentTeal font-semibold mt-1">
              ● Receiving
            </p>

            {lastUpdated && (
              <p className="text-xs text-gray-500 mt-1">
                Updated {lastUpdated.toLocaleTimeString()}
              </p>
            )}

          </div>

        </div>

      </div>


      {/* Sensor Grid */}
      <div>

        <div className="flex justify-between items-center mb-4">

          <h3 className="text-lg font-semibold">
            Live Sensor Telemetry
          </h3>

          <span className="text-xs text-gray-500">
            Refreshing every 3 seconds
          </span>

        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

          {sensors.map((sensor) => (

            <div
              key={sensor.name}
              className="bg-cardBg p-5 rounded-xl border border-gray-800"
            >

              <div className="flex justify-between items-start">

                <div>
                  <p className="text-sm text-gray-400">
                    {sensor.name}
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    {sensor.description}
                  </p>
                </div>

                <span className="text-xs text-accentTeal">
                  ● LIVE
                </span>

              </div>


              <div className="flex items-baseline gap-2 mt-4">

                <span className="text-3xl font-bold text-accentTeal">
                  {sensor.value ?? '--'}
                </span>

                {sensor.unit && (
                  <span className="text-xs text-gray-500">
                    {sensor.unit}
                  </span>
                )}

              </div>


              <div className="mt-4 pt-3 border-t border-gray-800">

                <div className="flex justify-between">

                  <span className="text-xs text-gray-500">
                    Sensor Status
                  </span>

                  <span className="text-xs text-accentTeal font-semibold">
                    Operational
                  </span>

                </div>

              </div>

            </div>

          ))}

        </div>

      </div>


      {/* Device Summary */}
      <div className="bg-cardBg p-5 rounded-xl border border-gray-800">

        <h3 className="text-lg font-semibold mb-4">
          Device Summary
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          <div>
            <p className="text-xs text-gray-500">
              Device ID
            </p>

            <p className="text-sm font-semibold mt-1">
              {sensorData.device_id || '--'}
            </p>
          </div>


          <div>
            <p className="text-xs text-gray-500">
              Zone
            </p>

            <p className="text-sm font-semibold mt-1">
              {sensorData.zone || '--'}
            </p>
          </div>


          <div>
            <p className="text-xs text-gray-500">
              Sensors Connected
            </p>

            <p className="text-sm font-semibold mt-1">
              6 / 6
            </p>
          </div>


          <div>
            <p className="text-xs text-gray-500">
              Connection
            </p>

            <p className="text-sm font-semibold text-accentTeal mt-1">
              Online
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}