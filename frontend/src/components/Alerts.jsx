import React, { useEffect, useState } from 'react';
import { fetchLatestAnalytics } from '../api';
import {
  AlertTriangle,
  CheckCircle2,
  Activity,
  Droplets
} from 'lucide-react';

export default function Alerts() {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  const getAlerts = async () => {
    try {
      const data = await fetchLatestAnalytics();
      setAnalysis(data);
    } catch (error) {
      console.error('Alerts error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAlerts();

    const interval = setInterval(getAlerts, 3000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-400">
          Loading alerts...
        </p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="p-6">
        <div className="bg-cardBg p-5 rounded-xl border border-gray-800">
          <p className="text-warningOrange">
            Unable to retrieve alerts.
          </p>
        </div>
      </div>
    );
  }

  const zones = analysis.zones || [];

  const alerts = [];

  zones.forEach((zone, index) => {
    const condition = zone?.condition || {};
    const leak = zone?.leak || {};
    const quality = zone?.water_quality || {};
    const risk = zone?.risk || {};

    const zoneName = zone?.zone || `Zone_${index + 1}`;
    const deviceId =
      zone?.device_id || `ESP32_Node_${index + 1}`;

    // Leak
    if (leak.leak_detected === true) {
      alerts.push({
        id: `${zoneName}-leak`,
        type: 'CRITICAL',
        title: `Pipeline Leak Detected — ${zoneName}`,
        message:
          leak.reason ||
          'Multiple sensor signals indicate a possible pipeline leak.',
        zone: zoneName,
        device: deviceId,
        icon: AlertTriangle
      });
    }

    // Sensor fault
    if (condition.condition === 'SENSOR_FAULT') {
      alerts.push({
        id: `${zoneName}-sensor-fault`,
        type: 'HIGH',
        title: `Sensor Fault — ${zoneName}`,
        message:
          condition.reason ||
          'One or more sensor readings appear physically invalid.',
        zone: zoneName,
        device: deviceId,
        icon: Activity
      });
    }

    // Early anomaly
    if (condition.condition === 'EARLY_ANOMALY') {
      alerts.push({
        id: `${zoneName}-anomaly`,
        type: 'MEDIUM',
        title: `Early Network Anomaly — ${zoneName}`,
        message:
          condition.reason ||
          'An abnormal trend has been detected and should be monitored.',
        zone: zoneName,
        device: deviceId,
        icon: Activity
      });
    }

    // Poor water quality
    if (
      quality.status === 'Poor' ||
      quality.status === 'POOR' ||
      (quality.issues && quality.issues.length > 0)
    ) {
      alerts.push({
        id: `${zoneName}-water-quality`,
        type: 'MEDIUM',
        title: `Water Quality Warning — ${zoneName}`,
        message:
          quality.issues?.join(', ') ||
          'Water quality parameters require attention.',
        zone: zoneName,
        device: deviceId,
        icon: Droplets
      });
    }

    // Risk
    const riskScore = Number(risk.score);

    if (Number.isFinite(riskScore) && riskScore > 0) {
      alerts.push({
        id: `${zoneName}-risk`,
        type: riskScore >= 70 ? 'CRITICAL' : 'HIGH',
        title: `Network Risk — ${zoneName}`,
        message: `Risk score is ${riskScore}/100.`,
        zone: zoneName,
        device: deviceId,
        icon: AlertTriangle
      });
    }
  });

  const highestRisk = zones.reduce(
    (highest, zone) =>
      Math.max(
        highest,
        Number(zone?.risk?.score) || 0
      ),
    0
  );

  const typeClass = (type) => {
    if (type === 'CRITICAL') {
      return 'text-red-400 bg-red-500/10 border-red-500/30';
    }

    if (type === 'HIGH') {
      return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
    }

    return 'text-warningOrange bg-yellow-500/10 border-yellow-500/30';
  };

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">

        <div>
          <h2 className="text-2xl font-bold">
            Alerts & Notifications
          </h2>

          <p className="text-sm text-gray-400 mt-1">
            Real-time network events requiring attention
          </p>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-accentTeal/10 text-accentTeal border border-accentTeal/30">
          ● LIVE
        </span>

      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div className="bg-cardBg p-5 rounded-xl border border-gray-800">

          <p className="text-sm text-gray-400">
            Active Alerts
          </p>

          <p
            className={`text-3xl font-bold mt-2 ${
              alerts.length > 0
                ? 'text-red-400'
                : 'text-accentTeal'
            }`}
          >
            {alerts.length}
          </p>

        </div>

        <div className="bg-cardBg p-5 rounded-xl border border-gray-800">

          <p className="text-sm text-gray-400">
            Highest Network Risk
          </p>

          <p className="text-3xl font-bold mt-2 text-warningOrange">
            {highestRisk}
            <span className="text-sm text-gray-500">
              /100
            </span>
          </p>

        </div>

        <div className="bg-cardBg p-5 rounded-xl border border-gray-800">

          <p className="text-sm text-gray-400">
            Monitored Zones
          </p>

          <p className="text-3xl font-bold mt-2">
            {zones.length}
          </p>

        </div>

      </div>

      {/* Alerts */}
      <div className="bg-cardBg p-5 rounded-xl border border-gray-800">

        <h3 className="text-lg font-semibold mb-5">
          Active Alerts
        </h3>

        {alerts.length === 0 ? (

          <div className="flex items-center gap-3 p-5 rounded-lg bg-accentTeal/5 border border-accentTeal/20">

            <CheckCircle2 className="w-6 h-6 text-accentTeal" />

            <div>
              <p className="font-semibold text-accentTeal">
                No Active Alerts
              </p>

              <p className="text-sm text-gray-400 mt-1">
                HydroIQ is not detecting any immediate network issues.
              </p>
            </div>

          </div>

        ) : (

          <div className="space-y-4">

            {alerts.map((alert) => {

              const Icon = alert.icon;

              return (
                <div
                  key={alert.id}
                  className="p-4 rounded-xl border border-gray-800 bg-gray-900/40"
                >

                  <div className="flex items-start gap-4">

                    <div
                      className={`p-3 rounded-lg border ${typeClass(
                        alert.type
                      )}`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>

                    <div className="flex-1">

                      <div className="flex justify-between items-start gap-4">

                        <div>

                          <h4 className="font-semibold text-lg">
                            {alert.title}
                          </h4>

                          <p className="text-sm text-gray-400 mt-1">
                            {alert.message}
                          </p>

                        </div>

                        <span
                          className={`px-2 py-1 rounded text-xs font-bold border ${typeClass(
                            alert.type
                          )}`}
                        >
                          {alert.type}
                        </span>

                      </div>

                      <div className="flex gap-6 mt-4 text-xs text-gray-500">

                        <span>
                          Device:{' '}
                          <strong className="text-gray-300">
                            {alert.device}
                          </strong>
                        </span>

                        <span>
                          Zone:{' '}
                          <strong className="text-gray-300">
                            {alert.zone}
                          </strong>
                        </span>

                      </div>

                    </div>

                  </div>

                </div>
              );
            })}

          </div>

        )}

      </div>

    </div>
  );
}