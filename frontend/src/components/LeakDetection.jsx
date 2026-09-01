import React, { useEffect, useState } from 'react';
import { fetchLatestAnalytics, fetchLatestSensorData } from '../api';

export default function LeakDetection() {
  const [analysis, setAnalysis] = useState(null);
  const [sensorData, setSensorData] = useState(null);

  useEffect(() => {
    const getData = async () => {
      const analytics = await fetchLatestAnalytics();
      const sensors = await fetchLatestSensorData();

      setAnalysis(analytics);
      setSensorData(sensors?.zones?.[0] || null);
    };

    getData();

    const interval = setInterval(getData, 3000);

    return () => clearInterval(interval);
  }, []);

  if (!analysis || !sensorData) {
    return (
      <div className="p-6">
        <p className="text-gray-400">
          Analyzing pipeline conditions...
        </p>
      </div>
    );
  }

  const leak = analysis.leak || {};
  const risk = analysis.risk || {};
  const condition = analysis.condition || {};

  const leakDetected = leak.leak_detected === true;
  const isAnomaly = condition.condition === 'EARLY_ANOMALY';
  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">

        <div>
          <h2 className="text-2xl font-bold">
            Leak Detection
          </h2>

          <p className="text-sm text-gray-400 mt-1">
            Multi-sensor pipeline leak analysis
          </p>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            leakDetected
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : 'bg-accentTeal/20 text-accentTeal border border-accentTeal/30'
          }`}
        >
          {leakDetected ? '● LEAK DETECTED' : '● NO LEAK'}
        </span>

      </div>


      {/* Main Status */}
      <div
        className={`p-6 rounded-xl border ${
          leakDetected
            ? 'border-red-500/30 bg-red-500/5'
            : 'border-gray-800 bg-cardBg'
        }`}
      >

        <div className="flex justify-between items-start">

          <div>

            <p className="text-sm text-gray-400">
              Current Network Condition
            </p>

            <h3
              className={`text-3xl font-bold mt-2 ${
                leakDetected
                  ? 'text-red-400'
                  : 'text-accentTeal'
              }`}
            >
              {condition.condition || 'NORMAL'}
            </h3>

            <p className="text-sm text-gray-400 mt-2">
              Severity: {condition.severity || 'LOW'}
            </p>

          </div>


          <div className="text-right">

            <p className="text-sm text-gray-400">
              Detection Confidence
            </p>

            <p
              className={`text-4xl font-bold mt-1 ${
                leakDetected
                  ? 'text-red-400'
                  : 'text-accentTeal'
              }`}
            >
              {leak.confidence != null
                ? `${Math.round(leak.confidence * 100)}%`
                : '--'}
            </p>

          </div>

        </div>

      </div>


      {/* Sensor Evidence */}
      <div>

        <h3 className="text-lg font-semibold mb-4">
          Sensor Evidence
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <div className="bg-cardBg p-5 rounded-xl border border-gray-800">
            <p className="text-sm text-gray-400">
              Pressure
            </p>

            <p className="text-3xl font-bold text-accentBlue mt-2">
              {sensorData.pressure}
              <span className="text-sm text-gray-500 ml-1">
                bar
              </span>
            </p>

            <p className="text-xs text-gray-400 mt-2">
              {leakDetected ? 'Possible pressure drop' : 'Within monitored range'}
            </p>
          </div>


          <div className="bg-cardBg p-5 rounded-xl border border-gray-800">
            <p className="text-sm text-gray-400">
              Flow Rate
            </p>

            <p className="text-3xl font-bold text-accentTeal mt-2">
              {sensorData.flow}
              <span className="text-sm text-gray-500 ml-1">
                L/min
              </span>
            </p>

            <p className="text-xs text-gray-400 mt-2">
              {leakDetected ? 'Abnormal flow indicator' : 'Flow being monitored'}
            </p>
          </div>


          <div className="bg-cardBg p-5 rounded-xl border border-gray-800">
            <p className="text-sm text-gray-400">
              Acoustic Signal
            </p>

            <p className="text-3xl font-bold text-warningOrange mt-2">
              {sensorData.acoustic}
            </p>

            <p className="text-xs text-gray-400 mt-2">
              {leakDetected ? 'Elevated acoustic signal' : 'Acoustic signal monitored'}
            </p>
          </div>

        </div>

      </div>


      {/* Risk */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div className="bg-cardBg p-5 rounded-xl border border-gray-800">

          <p className="text-sm text-gray-400">
            Network Risk
          </p>

          <p
            className={`text-4xl font-bold mt-2 ${
              risk.level === 'High'
                ? 'text-red-400'
                : risk.level === 'Medium'
                ? 'text-warningOrange'
                : 'text-accentTeal'
            }`}
          >
            {risk.score ?? '--'}
            <span className="text-sm text-gray-500">
              /100
            </span>
          </p>

          <p className="text-sm text-gray-400 mt-2">
            Risk Level: {risk.level || '--'}
          </p>

        </div>


        <div className="bg-cardBg p-5 rounded-xl border border-gray-800">

          <p className="text-sm text-gray-400">
            Affected Device
          </p>

          <p className="text-xl font-bold mt-2">
            {sensorData.device_id || '--'}
          </p>

          <p className="text-sm text-gray-400 mt-1">
            Zone: {sensorData.zone || '--'}
          </p>

        </div>

      </div>


      {/* Explanation */}
      <div className="bg-cardBg p-5 rounded-xl border border-gray-800">

        <h3 className="text-lg font-semibold mb-3">
          🧠 Why does HydroIQ think there is a leak?
        </h3>

        <p className="text-sm text-gray-300 leading-relaxed">
          {leak.reason ||
            'No abnormal leak indicators have been detected.'}
        </p>

      </div>


      {/* Action */}
      <div className="bg-cardBg p-5 rounded-xl border border-gray-800">

        <h3 className="text-lg font-semibold mb-2">
          Recommended Action
        </h3>

        <p className="text-sm text-gray-400">
          {leakDetected
            ? `Inspect ${sensorData.zone || 'the affected zone'} and verify pressure, flow and acoustic readings.`
            : 'Continue monitoring the network for abnormal changes.'}
        </p>

      </div>

    </div>
  );
}