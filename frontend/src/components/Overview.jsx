import React, { useEffect, useState } from 'react';
import { fetchLatestSensorData, fetchSensorHistory } from '../api';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

export default function Overview() {
  const [latestData, setLatestData] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getData = async () => {
      const latest = await fetchLatestSensorData();
      const history = await fetchSensorHistory();

      setLatestData(latest || {
        device_id: "ESP32_01",
        zone: "Zone_A",
        pressure: 2.6,
        flow: 118,
        acoustic: 0.82,
        ph: 7.2,
        tds: 312,
        turbidity: 4.8
      });

      setHistoryData(history.length > 0 ? history : [
        { time: '10:00', pressure: 2.8, flow: 110, turbidity: 4.2 },
        { time: '10:05', pressure: 2.7, flow: 112, turbidity: 4.5 },
        { time: '10:10', pressure: 2.6, flow: 118, turbidity: 4.8 },
      ]);
      setLoading(false);
    };

    getData();
    const interval = setInterval(getData, 3000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="p-6 text-gray-400">Loading Telemetry...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Network Overview</h2>
        <span className="text-xs bg-accentTeal/20 text-accentTeal px-3 py-1 rounded-full border border-accentTeal/30">
          Live Connection: {latestData.device_id} ({latestData.zone})
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-cardBg p-4 rounded-xl border border-gray-800">
          <p className="text-sm text-gray-400">Water Pressure</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold text-accentBlue">{latestData.pressure}</span>
            <span className="text-xs text-gray-500">bar</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">Acoustic Signal: {latestData.acoustic}</p>
        </div>

        <div className="bg-cardBg p-4 rounded-xl border border-gray-800">
          <p className="text-sm text-gray-400">Flow Rate</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold text-white">{latestData.flow}</span>
            <span className="text-xs text-gray-500">L/min</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">Status: Active Stream</p>
        </div>

        <div className="bg-cardBg p-4 rounded-xl border border-gray-800">
          <p className="text-sm text-gray-400">Water pH & TDS</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold text-accentTeal">{latestData.ph}</span>
            <span className="text-xs text-gray-500">pH</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">TDS: {latestData.tds} mg/L</p>
        </div>

        <div className="bg-cardBg p-4 rounded-xl border border-gray-800">
          <p className="text-sm text-gray-400">Turbidity</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold text-warningOrange">{latestData.turbidity}</span>
            <span className="text-xs text-gray-500">NTU</span>
          </div>
          <p className="text-xs text-warningOrange mt-2 font-medium">Safe Limit: &lt;5.0 NTU</p>
        </div>
      </div>

      <div className="bg-cardBg p-5 rounded-xl border border-gray-800">
        <h3 className="text-md font-semibold mb-4">Historical Telemetry Stream</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historyData}>
              <XAxis dataKey="time" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip contentStyle={{ backgroundColor: '#131F2E', borderColor: '#374151' }} />
              <Line type="monotone" dataKey="pressure" stroke="#1A8CFF" strokeWidth={2} name="Pressure (bar)" />
              <Line type="monotone" dataKey="flow" stroke="#00D2C8" strokeWidth={2} name="Flow Rate (L/min)" />
              <Line type="monotone" dataKey="turbidity" stroke="#FFA500" strokeWidth={2} name="Turbidity (NTU)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}