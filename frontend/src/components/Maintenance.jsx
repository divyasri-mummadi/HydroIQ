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

  // ============================================================
  // LOAD DATA
  // ============================================================

  const getData = async () => {
    try {
      const analytics = await fetchLatestAnalytics();
      const sensors = await fetchLatestSensorData();

      console.log('MAINTENANCE ANALYTICS:', analytics);
      console.log('MAINTENANCE SENSORS:', sensors);

      setAnalysis(analytics || {});
      setSensorData(sensors || {});
    } catch (error) {
      console.error('Maintenance error:', error);
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();

    const interval = setInterval(getData, 3000);

    return () => clearInterval(interval);
  }, []);

  // ============================================================
  // LOADING
  // ============================================================

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

  // ============================================================
  // NO DATA
  // ============================================================

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

  // ============================================================
  // BACKEND OBJECTS
  // ============================================================

  const risk =
    analysis?.risk &&
    typeof analysis.risk === 'object'
      ? analysis.risk
      : {};

  const condition =
    analysis?.condition &&
    typeof analysis.condition === 'object'
      ? analysis.condition
      : {};

  const leak =
    analysis?.leak &&
    typeof analysis.leak === 'object'
      ? analysis.leak
      : {};

  const waterQuality =
    analysis?.water_quality &&
    typeof analysis.water_quality === 'object'
      ? analysis.water_quality
      : {};

  const sensorHealthResult =
    analysis?.sensor_health &&
    typeof analysis.sensor_health === 'object'
      ? analysis.sensor_health
      : {};

  // ============================================================
  // SENSOR ZONES
  // ============================================================

  const sensorZones =
    Array.isArray(sensorData?.zones)
      ? sensorData.zones
      : [];

  // ============================================================
  // BUILD ZONES
  // ============================================================

  let zones = [];

  if (
    Array.isArray(analysis?.zones) &&
    analysis.zones.length > 0
  ) {
    zones = analysis.zones;
  } else if (
    sensorZones.length > 0
  ) {
    zones = sensorZones;
  } else {
    zones = [
      {
        zone:
          analysis?.zone ||
          'Zone_A',

        device_id:
          analysis?.device_id ||
          'ESP32_Node_1',

        risk,
        condition,
        leak,
        water_quality:
          waterQuality
      }
    ];
  }

  // ============================================================
  // NORMALIZE ZONES
  // ============================================================

  const normalizedZones = zones.map((item, index) => {

    const zoneRiskObject =
      item?.risk &&
      typeof item.risk === 'object'
        ? item.risk
        : {};

    const zoneConditionObject =
      item?.condition &&
      typeof item.condition === 'object'
        ? item.condition
        : {};

    const zoneLeakObject =
      item?.leak &&
      typeof item.leak === 'object'
        ? item.leak
        : {};

    const zoneQualityObject =
      item?.water_quality &&
      typeof item.water_quality === 'object'
        ? item.water_quality
        : {};

    // ----------------------------------------------------------
    // WRS
    // ----------------------------------------------------------

    const zoneRisk = Number(
      item?.risk_score ??
      item?.wrs ??
      zoneRiskObject?.score ??
      zoneRiskObject?.wrs ??
      risk?.score ??
      risk?.wrs ??
      0
    ) || 0;

    const safeZoneRisk =
      Math.max(
        0,
        Math.min(
          100,
          zoneRisk
        )
      );

    // ----------------------------------------------------------
    // CONDITION
    // ----------------------------------------------------------

    let zoneCondition = 'NORMAL';

    if (
      typeof item?.condition === 'string'
    ) {
      zoneCondition = item.condition;
    } else if (
      typeof zoneConditionObject?.condition === 'string'
    ) {
      zoneCondition =
        zoneConditionObject.condition;
    } else if (
      typeof condition?.condition === 'string'
    ) {
      zoneCondition =
        condition.condition;
    }

    // ----------------------------------------------------------
    // SEVERITY
    // ----------------------------------------------------------

    let zoneSeverity = 'LOW';

    if (
      typeof zoneConditionObject?.severity === 'string'
    ) {
      zoneSeverity =
        zoneConditionObject.severity;
    } else if (
      typeof item?.severity === 'string'
    ) {
      zoneSeverity =
        item.severity;
    } else if (
      typeof condition?.severity === 'string'
    ) {
      zoneSeverity =
        condition.severity;
    }

    // ----------------------------------------------------------
    // LEAK
    // ----------------------------------------------------------

    const zoneLeakDetected =
      zoneLeakObject?.leak_detected === true ||
      item?.leak_detected === true ||
      (
        index === 0 &&
        leak?.leak_detected === true
      );

    // ----------------------------------------------------------
    // WATER QUALITY
    // ----------------------------------------------------------

    const zoneQualityStatus =
      typeof zoneQualityObject?.status === 'string'
        ? zoneQualityObject.status
        : (
          index === 0 &&
          typeof waterQuality?.status === 'string'
            ? waterQuality.status
            : 'Good'
        );

    // ==========================================================
    // IMPORTANT FIX
    //
    // WRS below 35 by itself does NOT create maintenance priority.
    //
    // Therefore:
    //
    // NORMAL + WRS 12 = NO PRIORITY
    //
    // ==========================================================

    const problem =
      zoneLeakDetected ||
      zoneQualityStatus === 'Poor' ||
      zoneCondition !== 'NORMAL' ||
      safeZoneRisk >= 35;

    // ----------------------------------------------------------
    // PRIORITY
    // ----------------------------------------------------------

    let zonePriority = 'NONE';

    if (problem) {

      if (
        safeZoneRisk >= 80 ||
        zoneLeakDetected
      ) {
        zonePriority = 'P1';

      } else if (
        safeZoneRisk >= 60 ||
        zoneQualityStatus === 'Poor'
      ) {
        zonePriority = 'P2';

      } else if (
        safeZoneRisk >= 35 ||
        zoneCondition === 'EARLY_ANOMALY'
      ) {
        zonePriority = 'P3';

      } else {
        zonePriority = 'P4';
      }
    }

    // ----------------------------------------------------------
    // ISSUE
    // ----------------------------------------------------------

    let zoneIssue =
      'Network operating normally.';

    if (zoneLeakDetected) {

      zoneIssue =
        zoneLeakObject?.reason ||
        'Pipeline leak detected.';

    } else if (
      zoneCondition === 'WATER_QUALITY' ||
      zoneQualityStatus === 'Poor'
    ) {

      zoneIssue =
        zoneConditionObject?.reason ||
        'Water quality requires attention.';

    } else if (
      zoneCondition === 'SENSOR_FAULT'
    ) {

      zoneIssue =
        zoneConditionObject?.reason ||
        'Sensor fault detected.';

    } else if (
      zoneCondition === 'EARLY_ANOMALY'
    ) {

      zoneIssue =
        zoneConditionObject?.reason ||
        'Early network anomaly detected.';
    }

    // ----------------------------------------------------------
    // ACTION
    // ----------------------------------------------------------

    let zoneAction =
      'Continue routine monitoring.';

    if (zoneLeakDetected) {

      zoneAction =
        'Inspect immediately';

    } else if (
      zoneCondition === 'WATER_QUALITY' ||
      zoneQualityStatus === 'Poor'
    ) {

      zoneAction =
        'Check water quality';

    } else if (
      zoneCondition === 'SENSOR_FAULT'
    ) {

      zoneAction =
        'Inspect sensor';

    } else if (
      zoneCondition === 'EARLY_ANOMALY'
    ) {

      zoneAction =
        'Monitor trend';
    }

    return {

      ...item,

      zone:
        item?.zone ||
        analysis?.zone ||
        'Zone_A',

      device_id:
        item?.device_id ||
        analysis?.device_id ||
        'ESP32_Node_1',

      risk_score:
        safeZoneRisk,

      condition:
        zoneCondition,

      severity:
        zoneSeverity,

      leak_detected:
        zoneLeakDetected,

      quality_status:
        zoneQualityStatus,

      problem,

      priority:
        zonePriority,

      issue:
        zoneIssue,

      action:
        zoneAction
    };
  });

  // ============================================================
  // SORT HIGHEST RISK FIRST
  // ============================================================

  normalizedZones.sort(
    (a, b) =>
      b.risk_score -
      a.risk_score
  );

  // ============================================================
  // HIGHEST ZONE
  // ============================================================

  const highestZone =
    normalizedZones[0] ||
    null;

  // ============================================================
  // OVERALL WRS
  // ============================================================

  const backendRiskScore =
    Number(
      risk?.score ??
      risk?.wrs ??
      analysis?.wrs ??
      0
    ) || 0;

  const zoneRiskScores =
    normalizedZones.map(
      zone =>
        Number(
          zone.risk_score
        ) || 0
    );

  const safeRiskScore =
    Math.max(
      0,
      Math.min(
        100,
        highestZone
          ? Math.max(
              backendRiskScore,
              ...zoneRiskScores
            )
          : backendRiskScore
      )
    );

  // ============================================================
  // OVERALL CONDITION
  // ============================================================

  const networkCondition =
    highestZone?.condition ||
    condition?.condition ||
    'NORMAL';

  const networkSeverity =
    highestZone?.severity ||
    condition?.severity ||
    'LOW';

  // ============================================================
  // SENSOR HEALTH
  // ============================================================

  let sensorHealth =
    Number(
      sensorHealthResult?.overall_score
    );

  if (Number.isNaN(sensorHealth)) {

    const currentSensor =
      sensorZones[0] ||
      {};

    const sensorValues = [

      currentSensor?.pressure,
      currentSensor?.flow,
      currentSensor?.acoustic,
      currentSensor?.ph ??
        currentSensor?.pH,
      currentSensor?.tds,
      currentSensor?.turbidity

    ];

    const validSensors =
      sensorValues.filter(
        value =>
          value !== null &&
          value !== undefined &&
          value !== '' &&
          !Number.isNaN(
            Number(value)
          )
      ).length;

    sensorHealth =
      sensorValues.length > 0
        ? (
            validSensors /
            sensorValues.length
          ) * 100
        : 100;
  }

  sensorHealth =
    Math.max(
      0,
      Math.min(
        100,
        sensorHealth
      )
    );

  // ============================================================
  // OVERALL PRIORITY
  // ============================================================

  let priority = 'NONE';

  if (highestZone?.priority) {
    priority =
      highestZone.priority;
  }

  // ============================================================
  // RISK LEVEL
  // ============================================================

  let riskLevel = 'Low';

  if (safeRiskScore >= 80) {

    riskLevel = 'Critical';

  } else if (safeRiskScore >= 60) {

    riskLevel = 'High';

  } else if (safeRiskScore >= 40) {

    riskLevel = 'Medium';

  }

  // ============================================================
  // RECOMMENDED ACTION
  // ============================================================

  let recommendedAction =
    'Continue routine monitoring.';

  if (
    networkCondition === 'LEAK' ||
    highestZone?.leak_detected
  ) {

    if (priority === 'P1') {

      recommendedAction =
        'Immediately isolate the affected zone and dispatch a repair team.';

    } else {

      recommendedAction =
        'Inspect the affected zone for a possible pipeline leak.';
    }

  } else if (
    networkCondition === 'WATER_QUALITY' ||
    highestZone?.quality_status === 'Poor'
  ) {

    recommendedAction =
      'Inspect water-quality parameters and schedule corrective maintenance.';

  } else if (
    networkCondition === 'SENSOR_FAULT'
  ) {

    recommendedAction =
      'Inspect or recalibrate the affected sensor.';

  } else if (
    networkCondition === 'EARLY_ANOMALY'
  ) {

    recommendedAction =
      'Continue close monitoring and schedule preventive inspection.';
  }

  // ============================================================
  // RISK STYLE
  // ============================================================

  let riskStyle;

  if (safeRiskScore >= 70) {

    riskStyle = {
      text: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      bar: 'bg-red-400'
    };

  } else if (safeRiskScore >= 40) {

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

  // ============================================================
  // DISPLAY INFO
  // ============================================================

  const displayZone =
    highestZone?.zone ||
    analysis?.zone ||
    'Zone_A';

  const displayDevice =
    highestZone?.device_id ||
    analysis?.device_id ||
    'ESP32_Node_1';

  // ============================================================
  // DISPATCH
  // ============================================================

  const handleDispatch = () => {
    setDispatched(true);
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (

    <div className="p-6 space-y-6">

      {/* ======================================================
          HEADER
      ======================================================= */}

      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">

        <div className="flex items-center gap-3">

          <div className="p-3 rounded-xl bg-accentTeal/10 border border-accentTeal/20">

            <ShieldAlert
              className="w-7 h-7 text-accentTeal"
            />

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

      {/* ======================================================
          TOP CARDS
      ======================================================= */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

        {/* WRS */}

        <div
          className={`rounded-2xl border ${riskStyle.border} ${riskStyle.bg} p-5`}
        >

          <div className="flex justify-between">

            <div>

              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Water Risk Score
              </p>

              <p
                className={`text-4xl font-bold mt-2 ${riskStyle.text}`}
              >

                {Math.round(safeRiskScore)}

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
                width:
                  `${safeRiskScore}%`
              }}
            />

          </div>

          <p
            className={`text-xs font-semibold mt-3 ${riskStyle.text}`}
          >
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

                {Math.round(sensorHealth)}

                <span className="text-sm text-gray-500">
                  %
                </span>

              </p>

            </div>

            <Activity
              className="w-6 h-6 text-accentTeal"
            />

          </div>

          <p className="text-xs text-gray-500 mt-4">
            Backend sensor health status
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

              <p
                className={`text-4xl font-bold mt-2 ${
                  priority === 'NONE'
                    ? 'text-accentTeal'
                    : riskStyle.text
                }`}
              >

                {priority}

              </p>

            </div>

            <Wrench
              className={`w-6 h-6 ${
                priority === 'NONE'
                  ? 'text-accentTeal'
                  : riskStyle.text
              }`}
            />

          </div>

          <p className="text-xs text-gray-500 mt-4">
            {recommendedAction}
          </p>

        </div>

      </div>

      {/* ======================================================
          MAIN AREA
      ======================================================= */}

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
                  Zones ranked by actual Water Risk Score
                </p>

              </div>

              <span
                className={`font-bold ${
                  priority === 'NONE'
                    ? 'text-accentTeal'
                    : riskStyle.text
                }`}
              >

                {priority === 'NONE'
                  ? 'NORMAL'
                  : `${priority} • ${riskLevel}`}

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

                {normalizedZones.map(
                  (item, index) => {

                    const itemRiskClass =
                      item.risk_score >= 70
                        ? 'text-red-400'
                        : item.risk_score >= 40
                        ? 'text-warningOrange'
                        : 'text-accentTeal';

                    return (

                      <tr
                        key={`${item.zone}-${index}`}
                        className="hover:bg-gray-900/40"
                      >

                        <td className="px-5 py-4">

                          <span
                            className={`px-2 py-1 rounded-lg text-xs font-bold ${
                              item.priority === 'NONE'
                                ? 'text-accentTeal'
                                : itemRiskClass
                            } bg-gray-900`}
                          >

                            {item.priority}

                          </span>

                        </td>

                        <td className="px-5 py-4">

                          <p className="font-semibold">
                            {item.zone}
                          </p>

                          <p className="text-xs text-gray-500 mt-1">
                            {item.device_id}
                          </p>

                        </td>

                        <td className="px-5 py-4">

                          <span
                            className={`text-xl font-bold ${itemRiskClass}`}
                          >
                            {Math.round(item.risk_score)}
                          </span>

                        </td>

                        <td className="px-5 py-4">

                          <span className="text-xs font-semibold">
                            {item.condition}
                          </span>

                        </td>

                        <td className="px-5 py-4">

                          <span className="text-xs text-gray-400">
                            {item.issue}
                          </span>

                        </td>

                        <td className="px-5 py-4">

                          {item.problem &&
                          index === 0 &&
                          !dispatched ? (

                            <button
                              onClick={handleDispatch}
                              className="px-3 py-2 rounded-lg bg-accentBlue hover:bg-blue-600 text-white text-xs font-semibold"
                            >
                              Dispatch
                            </button>

                          ) : item.problem &&
                            index === 0 &&
                            dispatched ? (

                            <span className="flex items-center gap-1 text-accentTeal text-xs font-semibold">

                              <CheckCircle2 className="w-4 h-4" />

                              Dispatched

                            </span>

                          ) : (

                            <span className="text-xs text-gray-500">
                              {item.action}
                            </span>

                          )}

                        </td>

                      </tr>

                    );

                  }
                )}

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

              <p
                className={`font-bold mt-1 ${
                  networkCondition === 'NORMAL'
                    ? 'text-accentTeal'
                    : riskStyle.text
                }`}
              >
                {networkCondition}
              </p>

            </div>

            <div className="p-4 rounded-xl bg-darkBg border border-gray-800">

              <p className="text-xs text-gray-500 uppercase">
                Severity
              </p>

              <p className="font-bold mt-1">
                {networkSeverity}
              </p>

            </div>

            <div className="p-4 rounded-xl bg-darkBg border border-gray-800">

              <p className="text-xs text-gray-500 uppercase">
                Evidence
              </p>

              <p className="text-sm text-gray-300 mt-2">
                {highestZone?.issue ||
                  condition?.reason ||
                  'Network operating normally.'}
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

                  <p
                    className={`font-semibold ${riskStyle.text}`}
                  >
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

      {/* ======================================================
          BOTTOM
      ======================================================= */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* NETWORK RISK */}

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
                  {Math.round(safeRiskScore)}/100
                </span>

              </div>

              <div className="h-2 bg-gray-800 rounded-full">

                <div
                  className={`h-full rounded-full ${riskStyle.bar}`}
                  style={{
                    width:
                      `${safeRiskScore}%`
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
                  {Math.round(sensorHealth)}%
                </span>

              </div>

              <div className="h-2 bg-gray-800 rounded-full">

                <div
                  className="h-full rounded-full bg-accentTeal"
                  style={{
                    width:
                      `${sensorHealth}%`
                  }}
                />

              </div>

            </div>

          </div>

        </div>

        {/* MAINTENANCE */}

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
                Based on current HydroIQ analysis
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
                {displayZone}
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

      {/* ======================================================
          FOOTER
      ======================================================= */}

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