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

  const loadDashboardData = async () => {
    try {
      const analyticsData = await fetchLatestAnalytics();
      setAnalysis(analyticsData);
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

  const zones = Array.isArray(analysis?.zones)
    ? analysis.zones
    : [];

  /*
   * ==========================================================
   * SINGLE SOURCE OF TRUTH FOR ACTIVE ALERTS
   * ==========================================================
   *
   * A zone is considered an active alert when:
   *
   * - LEAK
   * - SENSOR_FAULT
   * - EARLY_ANOMALY
   * - WATER_QUALITY
   * - CRITICAL
   * - Leak explicitly detected
   * - WRS >= 35
   *
   * This is intentionally derived from analytics.zones
   * so Overview and Alerts always agree.
   */
  const activeAlerts = zones.filter((zone) => {
    const condition =
      String(
        zone?.stage ||
        zone?.condition?.condition ||
        'NORMAL'
      ).toUpperCase();

    const risk = Number(
      zone?.risk?.score ??
      zone?.risk?.wrs ??
      0
    );

    const leakDetected =
      zone?.leak?.leak_detected === true;

    return (
      leakDetected ||
      condition !== 'NORMAL' ||
      risk >= 35
    );
  });

  const highestRisk = zones.reduce(
    (highest, zone) => {
      const risk = Number(
        zone?.risk?.score ??
        zone?.risk?.wrs ??
        0
      );

      return Math.max(
        highest,
        Number.isFinite(risk) ? risk : 0
      );
    },
    0
  );

  const getCondition = (zone) => {
    return String(
      zone?.stage ||
      zone?.condition?.condition ||
      'NORMAL'
    ).toUpperCase();
  };

  const getPriority = (zone) => {
    return (
      zone?.priority?.priority ||
      null
    );
  };

  const getAlertType = (zone) => {
    const condition = getCondition(zone);
    const priority = String(
      getPriority(zone) || ''
    ).toUpperCase();

    const risk = Number(
      zone?.risk?.score ??
      zone?.risk?.wrs ??
      0
    );

    if (
      condition === 'LEAK' ||
      condition === 'CRITICAL' ||
      priority === 'P1' ||
      risk >= 70
    ) {
      return 'CRITICAL';
    }

    if (
      condition === 'SENSOR_FAULT' ||
      priority === 'P2' ||
      risk >= 60
    ) {
      return 'HIGH';
    }

    return 'MEDIUM';
  };

  const getAlertTitle = (zone) => {
    const zoneName =
      zone?.zone || 'Unknown Zone';

    const condition =
      getCondition(zone);

    if (condition === 'LEAK') {
      return `Pipeline Leak Detected — ${zoneName}`;
    }

    if (condition === 'EARLY_ANOMALY') {
      return `Early Network Anomaly — ${zoneName}`;
    }

    if (condition === 'WATER_QUALITY') {
      return `Water Quality Warning — ${zoneName}`;
    }

    if (condition === 'SENSOR_FAULT') {
      return `Sensor Fault — ${zoneName}`;
    }

    if (condition === 'CRITICAL') {
      return `Critical Network Condition — ${zoneName}`;
    }

    return `Network Alert — ${zoneName}`;
  };

  const getAlertMessage = (zone) => {
    if (
      zone?.priority?.recommended_action
    ) {
      return zone.priority.recommended_action;
    }

    const condition =
      getCondition(zone);

    if (condition === 'LEAK') {
      return 'Multiple sensor signals indicate a possible pipeline leak. Immediate inspection and isolation is recommended.';
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

    if (condition === 'CRITICAL') {
      return 'A critical network condition requires immediate attention.';
    }

    return 'Investigate the affected zone.';
  };

  const getIcon = (zone) => {
    const condition =
      getCondition(zone);

    if (condition === 'WATER_QUALITY') {
      return Droplets;
    }

    if (
      condition === 'EARLY_ANOMALY' ||
      condition === 'SENSOR_FAULT'
    ) {
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

      {/* =====================================================
          HEADER
      ====================================================== */}

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


      {/* =====================================================
          SUMMARY
      ====================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* ACTIVE ALERTS */}

        <div className="bg-cardBg p-5 rounded-xl border border-gray-800">

          <p className="text-sm text-gray-400">
            Active Alerts
          </p>

          <p
            className={`text-3xl font-bold mt-2 ${
              activeAlerts.length > 0
                ? 'text-red-400'
                : 'text-accentTeal'
            }`}
          >
            {activeAlerts.length}
          </p>

        </div>


        {/* HIGHEST RISK */}

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


        {/* MONITORED ZONES */}

        <div className="bg-cardBg p-5 rounded-xl border border-gray-800">

          <p className="text-sm text-gray-400">
            Monitored Zones
          </p>

          <p className="text-3xl font-bold mt-2">
            {zones.length}
          </p>

        </div>

      </div>


      {/* =====================================================
          ACTIVE ALERTS
      ====================================================== */}

      <div className="bg-cardBg p-5 rounded-xl border border-gray-800">

        <div className="flex justify-between items-center mb-5">

          <h3 className="text-lg font-semibold">
            Active Alerts
          </h3>

          <span className="text-xs text-gray-500">
            Powered by HydroIQ Analytics
          </span>

        </div>


        {/* NO ALERTS */}

        {activeAlerts.length === 0 ? (

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

            {activeAlerts.map((zone, index) => {

              const type =
                getAlertType(zone);

              const Icon =
                getIcon(zone);

              const zoneName =
                zone?.zone || 'Unknown';

              const device =
                zone?.device_id || 'Unknown';

              const risk = Number(
                zone?.risk?.score ??
                zone?.risk?.wrs ??
                0
              );

              const priority =
                getPriority(zone);

              const condition =
                getCondition(zone);

              return (

                <div
                  key={`${zoneName}-${condition}-${index}`}
                  className="p-4 rounded-xl border border-gray-800 bg-gray-900/40"
                >

                  <div className="flex items-start gap-4">

                    {/* ICON */}

                    <div
                      className={`p-3 rounded-lg border ${typeClass(
                        type
                      )}`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>


                    {/* CONTENT */}

                    <div className="flex-1">

                      <div className="flex justify-between items-start gap-4">

                        <div>

                          <h4 className="font-semibold text-lg">
                            {getAlertTitle(zone)}
                          </h4>

                          <p className="text-sm text-gray-400 mt-1">
                            {getAlertMessage(zone)}
                          </p>

                        </div>


                        {/* SEVERITY */}

                        <span
                          className={`px-2 py-1 rounded text-xs font-bold border ${typeClass(
                            type
                          )}`}
                        >
                          {type}
                        </span>

                      </div>


                      {/* META */}

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
                            {zoneName}
                          </strong>
                        </span>


                        <span>
                          WRS:{' '}
                          <strong className="text-gray-300">
                            {risk}/100
                          </strong>
                        </span>


                        <span>
                          Condition:{' '}
                          <strong className="text-gray-300">
                            {condition}
                          </strong>
                        </span>


                        {priority && (
                          <span>
                            Priority:{' '}
                            <strong className="text-red-400">
                              {String(
                                priority
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