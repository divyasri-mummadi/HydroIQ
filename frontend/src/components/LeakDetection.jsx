import React, { useEffect, useState } from 'react';
import {
  fetchLatestAnalytics,
  fetchLatestSensorData
} from '../api';

export default function LeakDetection() {
  const [analysis, setAnalysis] = useState(null);
  const [sensorData, setSensorData] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);

  useEffect(() => {
    const getData = async () => {
      const analytics = await fetchLatestAnalytics();
      const sensors = await fetchLatestSensorData();

      if (analytics) {
        setAnalysis(analytics);
      }

      const zones = sensors?.zones || [];
      setSensorData(zones);

      if (zones.length > 0) {
        setSelectedZone((current) => {
          if (current) {
            const exists = zones.find(
              (zone) => zone.device_id === current.device_id
            );

            if (exists) {
              return exists;
            }
          }

          return zones[0];
        });
      }
    };

    getData();

    const interval = setInterval(getData, 3000);

    return () => clearInterval(interval);
  }, []);

  if (!analysis || !selectedZone) {
    return (
      <div className="p-6">
        <p className="text-gray-400">
          Analyzing pipeline conditions...
        </p>
      </div>
    );
  }

  const analyticsZones = analysis.zones || [];

  const selectedAnalytics =
    analyticsZones.find(
      (zone) => zone.device_id === selectedZone.device_id
    ) || {};

  const leak = selectedAnalytics.leak || {};
  const risk = selectedAnalytics.risk || {};
  const condition = selectedAnalytics.condition || {};

  const leakDetected =
    leak.leak_detected === true ||
    condition.condition === 'LEAK';

  const conditionName =
    condition.condition ||
    selectedZone.stage ||
    'NORMAL';

  const severity =
    condition.severity ||
    'LOW';

  const getStatusClass = (zone) => {
    const zoneAnalytics =
      analyticsZones.find(
        (item) => item.device_id === zone.device_id
      ) || {};

    const zoneCondition =
      zoneAnalytics.condition?.condition ||
      zone.stage ||
      'NORMAL';

    if (zoneCondition === 'LEAK') {
      return 'border-red-500/40 bg-red-500/10';
    }

    if (zoneCondition === 'EARLY_ANOMALY') {
      return 'border-yellow-500/40 bg-yellow-500/10';
    }

    if (zoneCondition === 'WATER_QUALITY') {
      return 'border-orange-500/40 bg-orange-500/10';
    }

    return 'border-gray-800 bg-cardBg';
  };

  const getStatusTextClass = (zone) => {
    const zoneAnalytics =
      analyticsZones.find(
        (item) => item.device_id === zone.device_id
      ) || {};

    const zoneCondition =
      zoneAnalytics.condition?.condition ||
      zone.stage ||
      'NORMAL';

    if (zoneCondition === 'LEAK') {
      return 'text-red-400';
    }

    if (zoneCondition === 'EARLY_ANOMALY') {
      return 'text-yellow-400';
    }

    if (zoneCondition === 'WATER_QUALITY') {
      return 'text-orange-400';
    }

    return 'text-accentTeal';
  };

  const abnormalZones = analyticsZones.filter((zone) => {
    const conditionName =
      zone.condition?.condition ||
      zone.stage ||
      'NORMAL';

    return conditionName !== 'NORMAL';
  });

  return (
    <div className="p-6 space-y-6">

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
            abnormalZones.some(
              (zone) =>
                zone.condition?.condition === 'LEAK'
            )
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : 'bg-accentTeal/20 text-accentTeal border border-accentTeal/30'
          }`}
        >
          {abnormalZones.some(
            (zone) =>
              zone.condition?.condition === 'LEAK'
          )
            ? '● LEAK DETECTED'
            : '● NO LEAK'}
        </span>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">
          Zone Leak Status
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {sensorData.map((zone) => {
            const zoneAnalytics =
              analyticsZones.find(
                (item) =>
                  item.device_id === zone.device_id
              ) || {};

            const zoneCondition =
              zoneAnalytics.condition?.condition ||
              zone.stage ||
              'NORMAL';

            const zoneRisk =
              zoneAnalytics.risk?.score ??
              zoneAnalytics.risk?.wrs ??
              0;

            const isSelected =
              selectedZone.device_id === zone.device_id;

            return (
              <button
                key={zone.device_id}
                onClick={() => setSelectedZone(zone)}
                className={`text-left p-5 rounded-xl border transition-all ${
                  getStatusClass(zone)
                } ${
                  isSelected
                    ? 'ring-2 ring-accentTeal'
                    : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-400">
                      {zone.zone}
                    </p>

                    <p className="text-lg font-bold mt-1">
                      {zone.device_id}
                    </p>
                  </div>

                  <span
                    className={`text-xs font-semibold ${
                      getStatusTextClass(zone)
                    }`}
                  >
                    ●
                  </span>
                </div>

                <p
                  className={`text-sm font-semibold mt-4 ${
                    getStatusTextClass(zone)
                  }`}
                >
                  {zoneCondition}
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  Risk {zoneRisk}/100
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div
        className={`p-6 rounded-xl border ${
          leakDetected
            ? 'border-red-500/30 bg-red-500/5'
            : conditionName === 'EARLY_ANOMALY'
            ? 'border-yellow-500/30 bg-yellow-500/5'
            : 'border-gray-800 bg-cardBg'
        }`}
      >
        <div className="flex justify-between items-start">

          <div>
            <p className="text-sm text-gray-400">
              Selected Zone
            </p>

            <h3 className="text-xl font-bold mt-1">
              {selectedZone.zone}
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              {selectedZone.device_id}
            </p>

            <p
              className={`text-3xl font-bold mt-4 ${
                leakDetected
                  ? 'text-red-400'
                  : conditionName === 'EARLY_ANOMALY'
                  ? 'text-yellow-400'
                  : conditionName === 'WATER_QUALITY'
                  ? 'text-orange-400'
                  : 'text-accentTeal'
              }`}
            >
              {conditionName}
            </p>

            <p className="text-sm text-gray-400 mt-2">
              Severity: {severity}
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
                ? `${Math.round(
                    leak.confidence * 100
                  )}%`
                : condition.confidence != null
                ? `${Math.round(
                    condition.confidence * 100
                  )}%`
                : '--'}
            </p>
          </div>

        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">
          Sensor Evidence — {selectedZone.zone}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <div className="bg-cardBg p-5 rounded-xl border border-gray-800">
            <p className="text-sm text-gray-400">
              Pressure
            </p>

            <p className="text-3xl font-bold text-accentBlue mt-2">
              {selectedZone.pressure ?? '--'}
              <span className="text-sm text-gray-500 ml-1">
                bar
              </span>
            </p>

            <p className="text-xs text-gray-400 mt-2">
              {leakDetected
                ? 'Possible pressure drop'
                : 'Within monitored range'}
            </p>
          </div>

          <div className="bg-cardBg p-5 rounded-xl border border-gray-800">
            <p className="text-sm text-gray-400">
              Flow Rate
            </p>

            <p className="text-3xl font-bold text-accentTeal mt-2">
              {selectedZone.flow ?? '--'}
              <span className="text-sm text-gray-500 ml-1">
                L/min
              </span>
            </p>

            <p className="text-xs text-gray-400 mt-2">
              {leakDetected
                ? 'Abnormal flow indicator'
                : 'Flow being monitored'}
            </p>
          </div>

          <div className="bg-cardBg p-5 rounded-xl border border-gray-800">
            <p className="text-sm text-gray-400">
              Acoustic Signal
            </p>

            <p className="text-3xl font-bold text-warningOrange mt-2">
              {selectedZone.acoustic ?? '--'}
            </p>

            <p className="text-xs text-gray-400 mt-2">
              {leakDetected
                ? 'Elevated acoustic signal'
                : 'Acoustic signal monitored'}
            </p>
          </div>

        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div className="bg-cardBg p-5 rounded-xl border border-gray-800">

          <p className="text-sm text-gray-400">
            Zone Risk
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
            {risk.score ?? risk.wrs ?? '--'}

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
            Selected Device
          </p>

          <p className="text-xl font-bold mt-2">
            {selectedZone.device_id || '--'}
          </p>

          <p className="text-sm text-gray-400 mt-1">
            Zone: {selectedZone.zone || '--'}
          </p>

        </div>

      </div>

      <div className="bg-cardBg p-5 rounded-xl border border-gray-800">

        <h3 className="text-lg font-semibold mb-3">
          🧠 Why does HydroIQ think there is a leak?
        </h3>

        <p className="text-sm text-gray-300 leading-relaxed">
          {leak.reason ||
            condition.reason ||
            'No abnormal leak indicators have been detected.'}
        </p>

      </div>

      <div className="bg-cardBg p-5 rounded-xl border border-gray-800">

        <h3 className="text-lg font-semibold mb-2">
          Recommended Action
        </h3>

        <p className="text-sm text-gray-400">
          {leakDetected
            ? `Inspect ${selectedZone.zone || 'the affected zone'} and verify pressure, flow and acoustic readings.`
            : conditionName === 'EARLY_ANOMALY'
            ? `Continue monitoring ${selectedZone.zone} and schedule a preventive field inspection.`
            : 'Continue monitoring the network for abnormal changes.'}
        </p>

      </div>

    </div>
  );
}

