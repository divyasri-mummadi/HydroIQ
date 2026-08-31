import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { fetchLatestAnalytics } from '../api';

export default function Maintenance() {
  const [analysis, setAnalysis] = useState(null);
  const [dispatched, setDispatched] = useState(false);
  const [loading, setLoading] = useState(true);

  const getAnalysis = async () => {
    try {
      const data = await fetchLatestAnalytics();
      setAnalysis(data);
    } catch (error) {
      console.error('Maintenance analytics error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAnalysis();

    const interval = setInterval(getAnalysis, 3000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-400">
          Loading risk & maintenance data...
        </p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="p-6">
        <div className="bg-cardBg p-5 rounded-xl border border-gray-800">
          <p className="text-warningOrange">
            Unable to retrieve maintenance analytics.
          </p>
        </div>
      </div>
    );
  }

  const risk = analysis.risk || {};
  const leak = analysis.leak || {};
  const condition = analysis.condition || {};
  const sensorHealth = analysis.sensor_health || {};

  const deviceId = analysis.device_id || 'ESP32_Node_1';
  const zone = analysis.zone || 'Zone_A';

  const riskScore = risk.score ?? 0;
  const riskLevel = risk.level || 'Low';

  const riskClass =
    riskLevel === 'High'
      ? 'text-red-400'
      : riskLevel === 'Medium'
      ? 'text-warningOrange'
      : 'text-accentTeal';

  // Build issue description from the backend analytics
  let issue = 'Network operating normally.';

  if (leak.leak_detected) {
    issue = 'Confirmed pipeline leak';
  } else if (condition.condition === 'SENSOR_FAULT') {
    issue = 'Sensor fault detected';
  } else if (condition.condition === 'EARLY_ANOMALY') {
    issue = 'Early network anomaly';
  }

  const handleDispatch = () => {
    setDispatched(true);
  };

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">
            Risk & Maintenance Prioritization
          </h2>

          <p className="text-sm text-gray-400 mt-1">
            Prioritize maintenance using live HydroIQ risk analysis
          </p>
        </div>

        <button
          onClick={getAnalysis}
          className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* WRS Queue */}
        <div className="lg:col-span-2 bg-cardBg p-5 rounded-xl border border-gray-800">

          <div className="flex justify-between items-center mb-4">
            <h3 className="text-md font-semibold">
              Water Risk Score (WRS) Queue
            </h3>

            <span className={`font-bold ${riskClass}`}>
              {riskLevel} Risk
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">

              <thead className="bg-gray-800/50 text-gray-400 text-xs">
                <tr>
                  <th className="p-3">Device</th>
                  <th className="p-3">Zone</th>
                  <th className="p-3">WRS</th>
                  <th className="p-3">Issue</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-800">

                <tr>

                  <td className="p-3 font-mono text-accentBlue font-bold">
                    {deviceId}
                  </td>

                  <td className="p-3">
                    {zone}
                  </td>

                  <td className={`p-3 font-bold ${riskClass}`}>
                    {riskScore}
                  </td>

                  <td className="p-3">
                    {issue}
                  </td>

                  <td className="p-3">

                    {dispatched ? (

                      <span className="flex items-center gap-1 text-accentTeal text-xs font-semibold">
                        <CheckCircle2 className="w-4 h-4" />
                        Dispatched
                      </span>

                    ) : (

                      <button
                        onClick={handleDispatch}
                        className="px-3 py-1 bg-accentBlue hover:bg-blue-600 font-semibold rounded text-xs transition"
                      >
                        Dispatch Crew
                      </button>

                    )}

                  </td>

                </tr>

              </tbody>

            </table>
          </div>
        </div>

        {/* AI Decision Logic */}
        <div className="bg-cardBg p-5 rounded-xl border border-gray-800">

          <div className="flex items-center gap-2 mb-3">

            <AlertCircle className="text-accentTeal w-5 h-5" />

            <h3 className="text-md font-semibold">
              AI Decision Logic
            </h3>

          </div>

          <div className="text-xs text-gray-300 leading-relaxed bg-darkBg p-3 rounded-lg border border-gray-800">

            <p>
              <strong>Current condition:</strong>{' '}
              {condition.condition || 'NORMAL'}
            </p>

            <p className="mt-2">
              <strong>Severity:</strong>{' '}
              {condition.severity || 'LOW'}
            </p>

            {condition.reason && (
              <p className="mt-2">
                <strong>Reason:</strong>{' '}
                {condition.reason}
              </p>
            )}

            {leak.reason && (
              <p className="mt-2">
                <strong>Leak evidence:</strong>{' '}
                {leak.reason}
              </p>
            )}

          </div>

        </div>

      </div>

      {/* Maintenance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div className="bg-cardBg p-5 rounded-xl border border-gray-800">

          <p className="text-sm text-gray-400">
            Risk Score
          </p>

          <p className={`text-3xl font-bold mt-2 ${riskClass}`}>
            {riskScore}
            <span className="text-sm text-gray-500">
              /100
            </span>
          </p>

        </div>

        <div className="bg-cardBg p-5 rounded-xl border border-gray-800">

          <p className="text-sm text-gray-400">
            Sensor Health
          </p>

          <p className="text-3xl font-bold mt-2 text-accentTeal">
            {sensorHealth.overall_score ?? '--'}
            <span className="text-sm text-gray-500">
              %
            </span>
          </p>

        </div>

        <div className="bg-cardBg p-5 rounded-xl border border-gray-800">

          <p className="text-sm text-gray-400">
            Recommended Action
          </p>

          <p className="text-sm font-semibold mt-2">

            {leak.leak_detected
              ? 'Inspect affected zone immediately.'
              : condition.condition === 'SENSOR_FAULT'
              ? 'Inspect or recalibrate sensor.'
              : condition.condition === 'EARLY_ANOMALY'
              ? 'Continue monitoring for deterioration.'
              : 'Continue routine monitoring.'}

          </p>

        </div>

      </div>

    </div>
  );
}