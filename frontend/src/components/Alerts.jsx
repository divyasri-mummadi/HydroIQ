import React, { useEffect, useState } from 'react';
import { fetchLatestAnalytics } from '../api';
import {
  AlertTriangle,
  CheckCircle2,
  Activity,
  Droplets
} from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8001';

export default function Alerts() {
  const [analysis, setAnalysis] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      const [analyticsData, alertsResponse] = await Promise.all([
        fetchLatestAnalytics(),
        fetch(`${API_BASE}/api/alerts`)
      ]);

      setAnalysis(analyticsData);

      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json();

        const incomingAlerts = alertsData.alerts || [];

        /*
         * n8n may send the same incident repeatedly.
         * Keep only the latest alert for each
         * zone + condition + priority combination.
         */
        const uniqueAlerts = new Map();

        incomingAlerts.forEach((alert) => {
          const key = [
            alert?.zone || 'unknown',
            alert?.condition || 'UNKNOWN',
            alert?.priority || 'NONE'
          ].join('-');

          uniqueAlerts.set(key, alert);
        });

        setAlerts(Array.from(uniqueAlerts.values()));
      }
    } catch (error) {
      console.error('Alerts dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    const interval = setInterval(
      loadDashboardData,
      3000
    );

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
            Unable to retrieve network data.
          </p>
        </div>
      </div>
    );
  }

  const zones = analysis.zones || [];

  const highestRisk = zones.reduce(
    (highest, zone) =>
      Math.max(
        highest,
        Number(zone?.risk?.score) || 0
      ),
    0
  );

  const getAlertType = (alert) => {
    const condition =
      String(alert?.condition || '').toUpperCase();

    const priority =
      String(alert?.priority || '').toUpperCase();

    if (
      condition === 'LEAK' ||
      priority === 'P1'
    ) {
      return 'CRITICAL';
    }

    if (
      priority === 'P2' ||
      condition === 'SENSOR_FAULT'
    ) {
      return 'HIGH';
    }

    return 'MEDIUM';
  };

  const getAlertTitle = (alert) => {
    const zone = alert?.zone || 'Unknown Zone';

    const condition =
      String(alert?.condition || '').toUpperCase();

    if (condition === 'LEAK') {
      return `Pipeline Leak Detected — ${zone}`;
    }

    if (condition === 'EARLY_ANOMALY') {
      return `Early Network Anomaly — ${zone}`;
    }

    if (condition === 'WATER_QUALITY') {
      return `Water Quality Warning — ${zone}`;
    }

    if (condition === 'SENSOR_FAULT') {
      return `Sensor Fault — ${zone}`;
    }

    return `Network Alert — ${zone}`;
  };

  const getAlertMessage = (alert) => {
    if (alert?.recommended_action) {
      return alert.recommended_action;
    }

    const condition =
      String(alert?.condition || '').toUpperCase();

    if (condition === 'LEAK') {
      return 'Multiple sensor signals indicate a possible pipeline leak.';
    }

    if (condition === 'EARLY_ANOMALY') {
      return 'An abnormal network condition has been detected and should be monitored.';
    }

    if (condition === 'WATER_QUALITY') {
      return 'Water quality parameters require attention.';
    }

    if (condition === 'SENSOR_FAULT') {
      return 'One or more sensors require inspection or recalibration.';
    }

    return 'Investigate the affected zone.';
  };

  const getIcon = (alert) => {
    const condition =
      String(alert?.condition || '').toUpperCase();

    if (condition === 'WATER_QUALITY') {
      return Droplets;
    }

    if (condition === 'EARLY_ANOMALY') {
      return Activity;
    }

    if (condition === 'SENSOR_FAULT') {
      return Activity;
    }

    return AlertTriangle;
  };

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

        <div className="flex justify-between items-center mb-5">

          <h3 className="text-lg font-semibold">
            Active Alerts
          </h3>

          <span className="text-xs text-gray-500">
            Powered by HydroIQ Automation
          </span>

        </div>

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

            {alerts.map((alert, index) => {

              const type = getAlertType(alert);
              const Icon = getIcon(alert);

              const zone =
                alert?.zone || 'Unknown';

              const device =
                alert?.device_id || 'Unknown';

              const risk =
                Number(alert?.risk);

              return (
                <div
                  key={`${zone}-${alert?.condition}-${alert?.priority}-${index}`}
                  className="p-4 rounded-xl border border-gray-800 bg-gray-900/40"
                >

                  <div className="flex items-start gap-4">

                    <div
                      className={`p-3 rounded-lg border ${typeClass(
                        type
                      )}`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>

                    <div className="flex-1">

                      <div className="flex justify-between items-start gap-4">

                        <div>

                          <h4 className="font-semibold text-lg">
                            {getAlertTitle(alert)}
                          </h4>

                          <p className="text-sm text-gray-400 mt-1">
                            {getAlertMessage(alert)}
                          </p>

                        </div>

                        <span
                          className={`px-2 py-1 rounded text-xs font-bold border ${typeClass(
                            type
                          )}`}
                        >
                          {type}
                        </span>

                      </div>

                      <div className="flex flex-wrap gap-6 mt-4 text-xs text-gray-500">

                        <span>
                          Device:{' '}
                          <strong className="text-gray-300">
                            {device}
                          </strong>
                        </span>

                        <span>
                          Zone:{' '}
                          <strong className="text-gray-300">
                            {zone}
                          </strong>
                        </span>

                        {Number.isFinite(risk) && (
                          <span>
                            WRS:{' '}
                            <strong className="text-gray-300">
                              {risk}/100
                            </strong>
                          </span>
                        )}

                        {alert?.priority && (
                          <span>
                            Priority:{' '}
                            <strong className="text-red-400">
                              {String(
                                alert.priority
                              ).toUpperCase()}
                            </strong>
                          </span>
                        )}

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