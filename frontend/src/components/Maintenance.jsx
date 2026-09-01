import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ShieldAlert,
  Activity,
  Wrench,
  Users,
  Droplets,
  Zap,
  ArrowUpRight,
  Clock
} from 'lucide-react';

import {
  fetchLatestAnalytics,
  fetchLatestSensorData
} from '../api';

export default function Maintenance() {
  const [analysis, setAnalysis] = useState(null);
  const [sensorData, setSensorData] = useState(null);
  const [dispatched, setDispatched] = useState(false);
  const [loading, setLoading] = useState(true);

  const getData = async () => {
    try {
      const analytics = await fetchLatestAnalytics();
      const sensors = await fetchLatestSensorData();

      setAnalysis(analytics);
      setSensorData(sensors);
    } catch (error) {
      console.error('Maintenance error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();

    const interval = setInterval(getData, 3000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-cardBg rounded-2xl border border-gray-800 p-8">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-accentTeal animate-pulse" />
            <div>
              <p className="font-semibold">
                Loading risk intelligence...
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Analyzing network conditions
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="p-6">
        <div className="bg-cardBg rounded-2xl border border-gray-800 p-6">
          <AlertCircle className="text-warningOrange mb-3" />

          <p className="font-semibold">
            Unable to retrieve risk analytics.
          </p>

          <p className="text-sm text-gray-500 mt-1">
            Make sure the HydroIQ backend is running.
          </p>
        </div>
      </div>
    );
  }

  /* ================================
     BACKEND DATA
  ================================= */

  const risk =
    typeof analysis.risk === 'object' && analysis.risk !== null
      ? analysis.risk
      : {};

  const leak =
    typeof analysis.leak === 'object' && analysis.leak !== null
      ? analysis.leak
      : {};

  const condition =
    typeof analysis.condition === 'object' &&
    analysis.condition !== null
      ? analysis.condition
      : {};

  const currentSensor =
    sensorData?.zones?.[0] ||
    sensorData ||
    {};

  const deviceId =
    analysis.device_id ||
    currentSensor.device_id ||
    'ESP32_Node_1';

  const zone =
    analysis.zone ||
    currentSensor.zone ||
    'Zone_A';

  /* ================================
     IMPORTANT:
     condition is an OBJECT.
     We extract the actual text.
  ================================= */

  const conditionName =
    typeof condition.condition === 'string'
      ? condition.condition
      : 'NORMAL';

  const severity =
    typeof condition.severity === 'string'
      ? condition.severity
      : 'LOW';

  const conditionReason =
    typeof condition.reason === 'string'
      ? condition.reason
      : '';

  const leakDetected =
    leak.leak_detected === true;

  const leakReason =
    typeof leak.reason === 'string'
      ? leak.reason
      : '';

  /* ================================
     RISK
  ================================= */

  const riskScore = Number(risk.score ?? 0);

  const riskLevel =
    typeof risk.level === 'string'
      ? risk.level
      : riskScore >= 70
      ? 'High'
      : riskScore >= 40
      ? 'Medium'
      : 'Low';

  let riskStyle;

  if (riskScore >= 70) {
    riskStyle = {
      text: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      bar: 'bg-red-400'
    };
  } else if (riskScore >= 40) {
    riskStyle = {
      text: 'text-warningOrange',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/30',
      bar: 'bg-orange-400'
    };
  } else {
    riskStyle = {
      text: 'text-accentTeal',
      bg: 'bg-accentTeal/10',
      border: 'border-accentTeal/30',
      bar: 'bg-accentTeal'
    };
  }

  /* ================================
     SENSOR HEALTH
  ================================= */

  const sensorValues = [
    currentSensor.pressure,
    currentSensor.flow,
    currentSensor.acoustic,
    currentSensor.ph,
    currentSensor.tds,
    currentSensor.turbidity
  ];

  const validSensors = sensorValues.filter(
    value =>
      value !== null &&
      value !== undefined &&
      value !== '' &&
      !Number.isNaN(Number(value))
  ).length;

  const sensorHealth = Math.round(
    (validSensors / sensorValues.length) * 100
  );

  /* ================================
     ISSUE
  ================================= */

  let issue = 'Network operating normally.';

  if (leakDetected) {
    issue =
      leakReason ||
      'Confirmed pipeline leak';
  } else if (conditionName === 'SENSOR_FAULT') {
    issue =
      conditionReason ||
      'Sensor fault detected';
  } else if (conditionName === 'EARLY_ANOMALY') {
    issue =
      conditionReason ||
      'Early network anomaly';
  }

  /* ================================
     ACTION
  ================================= */

  let recommendedAction =
    'Continue routine monitoring.';

  if (leakDetected) {
    recommendedAction =
      'Inspect affected zone immediately.';
  } else if (conditionName === 'SENSOR_FAULT') {
    recommendedAction =
      'Inspect or recalibrate sensor.';
  } else if (conditionName === 'EARLY_ANOMALY') {
    recommendedAction =
      'Continue close monitoring for deterioration.';
  }

  /* ================================
     PRIORITY
  ================================= */

  const priority =
    riskScore >= 70
      ? 'P1'
      : riskScore >= 40
      ? 'P2'
      : conditionName === 'EARLY_ANOMALY'
      ? 'P3'
      : 'P4';

  /* ================================
     ZONES
  ================================= */

  let zones = [];

  if (
    Array.isArray(analysis.zones) &&
    analysis.zones.length > 0
  ) {
    zones = analysis.zones;
  } else if (
    Array.isArray(sensorData?.zones) &&
    sensorData.zones.length > 0
  ) {
    zones = sensorData.zones;
  } else {
    zones = [
      {
        device_id: deviceId,
        zone: zone,
        risk_score: riskScore,
        condition: conditionName
      }
    ];
  }

  /* ================================
     DISPATCH
  ================================= */

  const handleDispatch = () => {
    setDispatched(true);
  };

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}

      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">

        <div className="flex items-center gap-3">

          <div className="p-3 rounded-xl bg-accentTeal/10 border border-accentTeal/20">
            <ShieldAlert className="w-7 h-7 text-accentTeal" />
          </div>

          <div>

            <h2 className="text-3xl font-bold">
              Risk & Maintenance
            </h2>

            <p className="text-sm text-gray-400 mt-1">
              Intelligent maintenance prioritization using live HydroIQ risk analysis
            </p>

          </div>

        </div>

        <button
          onClick={getData}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm transition border border-gray-700"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Analysis
        </button>

      </div>


      {/* TOP CARDS */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

        {/* RISK */}

        <div
          className={`rounded-2xl border ${riskStyle.border} ${riskStyle.bg} p-5`}
        >

          <div className="flex justify-between">

            <div>

              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Water Risk Score
              </p>

              <p className={`text-4xl font-bold mt-2 ${riskStyle.text}`}>
                {riskScore}
                <span className="text-sm text-gray-500">
                  /100
                </span>
              </p>

            </div>

            <ShieldAlert
              className={`w-6 h-6 ${riskStyle.text}`}
            />

          </div>

          <div className="mt-4 h-2 bg-gray-800 rounded-full overflow-hidden">

            <div
              className={`h-full rounded-full ${riskStyle.bar}`}
              style={{
                width: `${Math.min(100, riskScore)}%`
              }}
            />

          </div>

          <p className={`text-xs font-semibold mt-3 ${riskStyle.text}`}>
            {riskLevel} Risk
          </p>

        </div>


        {/* SENSOR HEALTH */}

        <div className="bg-cardBg rounded-2xl border border-gray-800 p-5">

          <div className="flex justify-between">

            <div>

              <p className="text-xs text-gray-500 uppercase">
                Sensor Health
              </p>

              <p className="text-4xl font-bold text-accentTeal mt-2">
                {sensorHealth}
                <span className="text-sm text-gray-500">
                  %
                </span>
              </p>

            </div>

            <Activity className="w-6 h-6 text-accentTeal" />

          </div>

          <p className="text-xs text-gray-500 mt-4">
            {validSensors} / {sensorValues.length} sensors reporting
          </p>

        </div>


        {/* POPULATION */}

        <div className="bg-cardBg rounded-2xl border border-gray-800 p-5">

          <div className="flex justify-between">

            <div>

              <p className="text-xs text-gray-500 uppercase">
                Population Coverage
              </p>

              <p className="text-4xl font-bold mt-2">
                1,200
              </p>

            </div>

            <Users className="w-6 h-6 text-accentBlue" />

          </div>

          <p className="text-xs text-gray-500 mt-4">
            Residents monitored
          </p>

        </div>


        {/* PRIORITY */}

        <div className="bg-cardBg rounded-2xl border border-gray-800 p-5">

          <div className="flex justify-between">

            <div>

              <p className="text-xs text-gray-500 uppercase">
                Maintenance Priority
              </p>

              <p className={`text-4xl font-bold mt-2 ${riskStyle.text}`}>
                {priority}
              </p>

            </div>

            <Wrench
              className={`w-6 h-6 ${riskStyle.text}`}
            />

          </div>

          <p className="text-xs text-gray-500 mt-4">
            {recommendedAction}
          </p>

        </div>

      </div>


      {/* MAIN AREA */}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* QUEUE */}

        <div className="xl:col-span-2 bg-cardBg rounded-2xl border border-gray-800 overflow-hidden">

          <div className="p-5 border-b border-gray-800">

            <div className="flex justify-between">

              <div>

                <h3 className="text-lg font-bold">
                  Maintenance Priority Queue
                </h3>

                <p className="text-xs text-gray-500 mt-1">
                  Zones ranked by Water Risk Score
                </p>

              </div>

              <span className={`font-bold ${riskStyle.text}`}>
                {riskLevel} Risk
              </span>

            </div>

          </div>


          <div className="overflow-x-auto">

            <table className="w-full text-left">

              <thead className="bg-gray-900/60">

                <tr className="text-xs text-gray-500 uppercase">

                  <th className="px-5 py-3">
                    Priority
                  </th>

                  <th className="px-5 py-3">
                    Zone
                  </th>

                  <th className="px-5 py-3">
                    WRS
                  </th>

                  <th className="px-5 py-3">
                    Condition
                  </th>

                  <th className="px-5 py-3">
                    Issue
                  </th>

                  <th className="px-5 py-3">
                    Action
                  </th>

                </tr>

              </thead>


              <tbody className="divide-y divide-gray-800">

                {zones.map((item, index) => {

                  const itemRisk = Number(
                    item?.risk_score ??
                    item?.wrs ??
                    item?.risk?.score ??
                    riskScore
                  );

                  /*
                   * VERY IMPORTANT:
                   * Never render item.condition directly
                   * because it may be an object.
                   */

                  let itemCondition = 'NORMAL';

                  if (typeof item?.condition === 'string') {
                    itemCondition = item.condition;
                  } else if (
                    typeof item?.condition?.condition === 'string'
                  ) {
                    itemCondition =
                      item.condition.condition;
                  }

                  const itemPriority =
                    itemRisk >= 70
                      ? 'P1'
                      : itemRisk >= 40
                      ? 'P2'
                      : itemCondition === 'EARLY_ANOMALY'
                      ? 'P3'
                      : 'P4';

                  const itemRiskClass =
                    itemRisk >= 70
                      ? 'text-red-400'
                      : itemRisk >= 40
                      ? 'text-warningOrange'
                      : 'text-accentTeal';

                  let itemIssue =
                    'Network operating normally.';

                  if (itemCondition === 'EARLY_ANOMALY') {
                    itemIssue =
                      'Early network anomaly';
                  }

                  if (itemCondition === 'SENSOR_FAULT') {
                    itemIssue =
                      'Sensor fault detected';
                  }

                  if (leakDetected) {
                    itemIssue =
                      'Confirmed pipeline leak';
                  }

                  return (
                    <tr
                      key={`${item?.zone || 'zone'}-${index}`}
                      className="hover:bg-gray-900/40"
                    >

                      <td className="px-5 py-4">

                        <span
                          className={`px-2 py-1 rounded-lg text-xs font-bold ${itemRiskClass} bg-gray-900`}
                        >
                          {itemPriority}
                        </span>

                      </td>


                      <td className="px-5 py-4">

                        <p className="font-semibold">
                          {typeof item?.zone === 'string'
                            ? item.zone
                            : zone}
                        </p>

                        <p className="text-xs text-gray-500 mt-1">
                          {typeof item?.device_id === 'string'
                            ? item.device_id
                            : deviceId}
                        </p>

                      </td>


                      <td className="px-5 py-4">

                        <span
                          className={`text-xl font-bold ${itemRiskClass}`}
                        >
                          {itemRisk}
                        </span>

                      </td>


                      <td className="px-5 py-4">

                        <span className="text-xs font-semibold">
                          {itemCondition}
                        </span>

                      </td>


                      <td className="px-5 py-4">

                        <span className="text-xs text-gray-400">
                          {itemIssue}
                        </span>

                      </td>


                      <td className="px-5 py-4">

                        {index === 0 && !dispatched ? (

                          <button
                            onClick={handleDispatch}
                            className="px-3 py-2 rounded-lg bg-accentBlue hover:bg-blue-600 text-white text-xs font-semibold"
                          >
                            Dispatch
                          </button>

                        ) : index === 0 && dispatched ? (

                          <span className="flex items-center gap-1 text-accentTeal text-xs font-semibold">

                            <CheckCircle2 className="w-4 h-4" />

                            Dispatched

                          </span>

                        ) : (

                          <span className="text-xs text-gray-500">
                            Monitor
                          </span>

                        )}

                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>

        </div>


        {/* AI LOGIC */}

        <div className="bg-cardBg rounded-2xl border border-gray-800 p-5">

          <div className="flex items-center gap-3 mb-5">

            <div className="p-2 rounded-lg bg-accentTeal/10">

              <Zap className="w-5 h-5 text-accentTeal" />

            </div>

            <div>

              <h3 className="font-bold">
                AI Decision Logic
              </h3>

              <p className="text-xs text-gray-500">
                Why HydroIQ ranked this zone
              </p>

            </div>

          </div>


          <div className="space-y-4">

            <div className="p-4 rounded-xl bg-darkBg border border-gray-800">

              <p className="text-xs text-gray-500 uppercase">
                Current Condition
              </p>

              <p className={`font-bold mt-1 ${riskStyle.text}`}>
                {conditionName}
              </p>

            </div>


            <div className="p-4 rounded-xl bg-darkBg border border-gray-800">

              <p className="text-xs text-gray-500 uppercase">
                Severity
              </p>

              <p className="font-bold mt-1">
                {severity}
              </p>

            </div>


            <div className="p-4 rounded-xl bg-darkBg border border-gray-800">

              <p className="text-xs text-gray-500 uppercase">
                Evidence
              </p>

              <p className="text-sm text-gray-300 mt-2">
                {conditionReason ||
                  leakReason ||
                  issue}
              </p>

            </div>


            <div
              className={`p-4 rounded-xl border ${riskStyle.border} ${riskStyle.bg}`}
            >

              <div className="flex items-start gap-3">

                <ArrowUpRight
                  className={`w-5 h-5 ${riskStyle.text}`}
                />

                <div>

                  <p className={`font-semibold ${riskStyle.text}`}>
                    Recommended Decision
                  </p>

                  <p className="text-sm text-gray-300 mt-1">
                    {recommendedAction}
                  </p>

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>


      {/* BOTTOM */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className="bg-cardBg rounded-2xl border border-gray-800 p-5">

          <div className="flex items-center gap-3 mb-5">

            <ShieldAlert className="w-6 h-6 text-accentTeal" />

            <div>

              <h3 className="font-bold">
                Network Risk Assessment
              </h3>

              <p className="text-xs text-gray-500">
                Current operational health
              </p>

            </div>

          </div>


          <div className="space-y-5">

            <div>

              <div className="flex justify-between text-xs mb-2">

                <span className="text-gray-400">
                  Water Risk Score
                </span>

                <span className={riskStyle.text}>
                  {riskScore}/100
                </span>

              </div>

              <div className="h-2 bg-gray-800 rounded-full">

                <div
                  className={`h-full rounded-full ${riskStyle.bar}`}
                  style={{
                    width: `${Math.min(100, riskScore)}%`
                  }}
                />

              </div>

            </div>


            <div>

              <div className="flex justify-between text-xs mb-2">

                <span className="text-gray-400">
                  Sensor Availability
                </span>

                <span className="text-accentTeal">
                  {sensorHealth}%
                </span>

              </div>

              <div className="h-2 bg-gray-800 rounded-full">

                <div
                  className="h-full rounded-full bg-accentTeal"
                  style={{
                    width: `${sensorHealth}%`
                  }}
                />

              </div>

            </div>

          </div>

        </div>


        <div
          className={`rounded-2xl border ${riskStyle.border} ${riskStyle.bg} p-5`}
        >

          <div className="flex items-center gap-3 mb-4">

            <Wrench
              className={`w-6 h-6 ${riskStyle.text}`}
            />

            <div>

              <h3 className="font-bold">
                Recommended Maintenance
              </h3>

              <p className="text-xs text-gray-500">
                AI-generated recommendation
              </p>

            </div>

          </div>


          <p className="text-lg font-semibold">
            {recommendedAction}
          </p>


          <div className="flex flex-wrap gap-3 mt-5">

            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-900/50 border border-gray-800">

              <Clock className="w-4 h-4 text-gray-500" />

              <span className="text-xs text-gray-400">
                Live analysis
              </span>

            </div>


            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-900/50 border border-gray-800">

              <Droplets className="w-4 h-4 text-accentBlue" />

              <span className="text-xs text-gray-400">
                {zone}
              </span>

            </div>


            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-900/50 border border-gray-800">

              <Users className="w-4 h-4 text-accentTeal" />

              <span className="text-xs text-gray-400">
                1,200 residents
              </span>

            </div>

          </div>

        </div>

      </div>


      {/* FOOTER */}

      <div className="flex justify-between text-xs text-gray-500 px-1">

        <span>
          HydroIQ Decision Intelligence
        </span>

        <span className="flex items-center gap-2">

          <span className="w-2 h-2 rounded-full bg-accentTeal animate-pulse" />

          Live analysis • Refreshing every 3 seconds

        </span>

      </div>

    </div>
  );
}