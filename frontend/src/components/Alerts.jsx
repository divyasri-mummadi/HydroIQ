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

  const leak = analysis.leak || {};
  const condition = analysis.condition || {};
  const quality = analysis.water_quality || {};
  const risk = analysis.risk || {};

  const deviceId = analysis.device_id || 'ESP32_Node_1';
  const zone = analysis.zone || 'Zone_A';

  const alerts = [];

  // Leak alert
  if (leak.leak_detected) {
    alerts.push({
      id: 'leak',
      type: 'CRITICAL',
      title: 'Pipeline Leak Detected',
      message:
        leak.reason ||
        'Multiple sensor signals indicate a possible pipeline leak.',
      zone,
      device: deviceId,
      icon: AlertTriangle
    });
  }

  // Sensor fault
  if (condition.condition === 'SENSOR_FAULT') {
    alerts.push({
      id: 'sensor-fault',
      type: 'HIGH',
      title: 'Sensor Fault Detected',
      message:
        condition.reason ||
        'One or more sensor readings appear physically invalid.',
      zone,
      device: deviceId,
      icon: Activity
    });
  }

  // Early anomaly
  if (condition.condition === 'EARLY_ANOMALY') {
    alerts.push({
      id: 'anomaly',
      type: 'MEDIUM',
      title: 'Early Network Anomaly',
      message:
        condition.reason ||
        'An abnormal trend has been detected and should be monitored.',
      zone,
      device: deviceId,
      icon: Activity
    });
  }

  // Water quality
  if (
    quality.status === 'Poor' ||
    (quality.issues && quality.issues.length > 0)
  ) {
    alerts.push({
      id: 'water-quality',
      type: 'MEDIUM',
      title: 'Water Quality Warning',
      message:
        quality.issues?.join(', ') ||
        'Water quality parameters require attention.',
      zone,
      device: deviceId,
      icon: Droplets
    });
  }

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
            Network Risk
          </p>

          <p className="text-3xl font-bold mt-2 text-warningOrange">
            {risk.score ?? 0}
            <span className="text-sm text-gray-500">
              /100
            </span>
          </p>

        </div>

        <div className="bg-cardBg p-5 rounded-xl border border-gray-800">

          <p className="text-sm text-gray-400">
            Current Condition
          </p>

          <p className="text-xl font-bold mt-2">
            {condition.condition || 'NORMAL'}
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