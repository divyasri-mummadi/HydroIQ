import React, { useEffect, useMemo, useState } from 'react';
import {
  Droplets,
  Activity,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Gauge,
  FlaskConical,
  Waves,
  Radio,
  Lightbulb
} from 'lucide-react';

import {
  fetchLatestSensorData,
  fetchLatestAnalytics
} from '../api';

export default function WaterQuality() {
  const [sensorData, setSensorData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [selectedZone, setSelectedZone] = useState('Zone_A');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [sensor, analysis] = await Promise.all([
        fetchLatestSensorData(),
        fetchLatestAnalytics()
      ]);

      if (sensor) {
        setSensorData(sensor);
      }

      if (analysis) {
        setAnalytics(analysis);
      }

      if (sensor || analysis) {
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Water quality error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const interval = setInterval(loadData, 3000);

    return () => clearInterval(interval);
  }, []);

  const zones = sensorData?.zones || [];

  const currentZone = useMemo(() => {
    if (!zones.length) {
      return null;
    }

    const selected = zones.find(
      zone => zone.zone === selectedZone
    );

    return selected || zones[0];
  }, [zones, selectedZone]);

  const currentAnalytics = useMemo(() => {
    if (!analytics?.zones || !currentZone) {
      return null;
    }

    return (
      analytics.zones.find(
        zone => zone.zone === currentZone.zone
      ) || null
    );
  }, [analytics, currentZone]);

  const ph = Number(currentZone?.ph);
  const tds = Number(currentZone?.tds);
  const turbidity = Number(currentZone?.turbidity);

  const waterQuality =
    currentAnalytics?.water_quality || {};

  const qualityScore = useMemo(() => {
    if (waterQuality.score != null) {
      return Math.round(Number(waterQuality.score));
    }

    if (
      Number.isNaN(ph) ||
      Number.isNaN(tds) ||
      Number.isNaN(turbidity)
    ) {
      return null;
    }

    let score = 100;

    if (ph < 6.5 || ph > 8.5) {
      score -= 30;
    } else if (ph < 6.8 || ph > 8.2) {
      score -= 10;
    }

    if (tds > 500) {
      score -= 30;
    } else if (tds > 300) {
      score -= 10;
    }

    if (turbidity > 5) {
      score -= 30;
    } else if (turbidity > 1) {
      score -= 10;
    }

    return Math.max(0, score);
  }, [waterQuality.score, ph, tds, turbidity]);

  const qualityStatus = useMemo(() => {
    if (waterQuality.status) {
      return String(waterQuality.status).toUpperCase();
    }

    if (qualityScore == null) {
      return 'UNKNOWN';
    }

    if (qualityScore >= 80) {
      return 'GOOD';
    }

    if (qualityScore >= 50) {
      return 'WARNING';
    }

    return 'POOR';
  }, [waterQuality.status, qualityScore]);

  const issues = useMemo(() => {
    if (
      Array.isArray(waterQuality.issues) &&
      waterQuality.issues.length > 0
    ) {
      return waterQuality.issues;
    }

    const detected = [];

    if (!Number.isNaN(ph) && (ph < 6.5 || ph > 8.5)) {
      detected.push(
        'pH is outside the monitored safe range.'
      );
    }

    if (!Number.isNaN(tds) && tds > 500) {
      detected.push(
        'TDS is above the monitored threshold.'
      );
    }

    if (!Number.isNaN(turbidity) && turbidity > 5) {
      detected.push(
        'Turbidity is above the monitored threshold.'
      );
    }

    return detected;
  }, [waterQuality.issues, ph, tds, turbidity]);

  const getParameterStatus = type => {
    if (type === 'ph') {
      if (Number.isNaN(ph)) {
        return 'UNKNOWN';
      }

      return ph >= 6.5 && ph <= 8.5
        ? 'NORMAL'
        : 'ATTENTION';
    }

    if (type === 'tds') {
      if (Number.isNaN(tds)) {
        return 'UNKNOWN';
      }

      return tds <= 500
        ? 'NORMAL'
        : 'ATTENTION';
    }

    if (type === 'turbidity') {
      if (Number.isNaN(turbidity)) {
        return 'UNKNOWN';
      }

      return turbidity <= 5
        ? 'NORMAL'
        : 'ATTENTION';
    }

    return 'UNKNOWN';
  };

  const statusClasses = {
    GOOD: {
      text: 'text-accentTeal',
      bg: 'bg-accentTeal/10',
      border: 'border-accentTeal/30'
    },

    WARNING: {
      text: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30'
    },

    POOR: {
      text: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30'
    },

    UNKNOWN: {
      text: 'text-gray-400',
      bg: 'bg-gray-500/10',
      border: 'border-gray-700'
    }
  };

  const statusStyle =
    statusClasses[qualityStatus] ||
    statusClasses.UNKNOWN;

  const formatValue = (value, decimals = 2) => {
    if (
      value == null ||
      Number.isNaN(Number(value))
    ) {
      return '--';
    }

    return Number(value).toFixed(decimals);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-cardBg rounded-2xl border border-gray-800 p-8">
          <div className="flex items-center gap-3">
            <Droplets className="text-accentTeal animate-pulse" />

            <div>
              <p className="font-semibold">
                Loading water quality data...
              </p>

              <p className="text-sm text-gray-500 mt-1">
                Connecting to live telemetry
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!sensorData || !currentZone) {
    return (
      <div className="p-6">
        <div className="bg-cardBg rounded-2xl border border-gray-800 p-8">
          <AlertTriangle className="text-yellow-400 mb-3" />

          <p className="font-semibold">
            Water quality data unavailable
          </p>

          <p className="text-sm text-gray-500 mt-1">
            Make sure the backend and sensor data source are running.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}

      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">

        <div className="flex items-center gap-3">

          <div className="p-3 rounded-xl bg-accentBlue/10 border border-accentBlue/20">
            <Droplets className="w-7 h-7 text-accentBlue" />
          </div>

          <div>
            <h2 className="text-3xl font-bold">
              Water Quality Intelligence
            </h2>

            <p className="text-sm text-gray-400 mt-1">
              Real-time pH, TDS and turbidity monitoring
            </p>
          </div>

        </div>

        <div className="flex items-center gap-3">

          {lastUpdated && (
            <span className="text-xs text-gray-500">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}

          <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-accentTeal/10 border border-accentTeal/30 text-accentTeal text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-accentTeal animate-pulse" />
            LIVE
          </span>

        </div>

      </div>


      {/* ZONE SELECTOR */}

      <div className="bg-cardBg rounded-2xl border border-gray-800 p-4">

        <div className="flex items-center justify-between mb-3">

          <div>
            <p className="text-sm font-semibold">
              Select Zone
            </p>

            <p className="text-xs text-gray-500 mt-1">
              View water quality for each monitored zone
            </p>
          </div>

          <Radio className="w-5 h-5 text-accentTeal" />

        </div>

        <div className="flex flex-wrap gap-3">

          {zones.map(zone => {
            const active =
              zone.zone === selectedZone;

            return (
              <button
                key={zone.zone}
                onClick={() => setSelectedZone(zone.zone)}
                className={`px-5 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                  active
                    ? 'bg-accentTeal/15 border-accentTeal text-accentTeal'
                    : 'bg-gray-900/40 border-gray-700 text-gray-400 hover:border-accentTeal/50 hover:text-white'
                }`}
              >
                {zone.zone}
              </button>
            );
          })}

        </div>

      </div>


      {/* MAIN QUALITY CARD */}

      <div
        className={`rounded-2xl border ${statusStyle.border} ${statusStyle.bg} p-6`}
      >

        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">

          <div>

            <p className="text-sm text-gray-400">
              Current Water Quality
            </p>

            <div className="flex items-center gap-3 mt-2">

              {qualityStatus === 'GOOD' ? (
                <CheckCircle2
                  className={`w-8 h-8 ${statusStyle.text}`}
                />
              ) : (
                <AlertTriangle
                  className={`w-8 h-8 ${statusStyle.text}`}
                />
              )}

              <h3
                className={`text-4xl font-bold ${statusStyle.text}`}
              >
                {qualityStatus}
              </h3>

            </div>

            <p className="text-sm text-gray-400 mt-3">
              Zone:{' '}
              <span className="text-white font-semibold">
                {currentZone.zone}
              </span>
            </p>

            <p className="text-xs text-gray-500 mt-1">
              Device: {currentZone.device_id}
            </p>

          </div>


          {/* QUALITY SCORE */}

          <div className="flex items-center gap-5">

            <div className="relative w-32 h-32">

              <div className="absolute inset-0 rounded-full border-[10px] border-gray-800" />

              <div
                className={`absolute inset-0 rounded-full border-[10px] border-r-transparent border-b-transparent ${statusStyle.text}`}
                style={{
                  transform: `rotate(${
                    qualityScore != null
                      ? -45 + qualityScore * 3.6
                      : -45
                  }deg)`
                }}
              />

              <div className="absolute inset-0 flex flex-col items-center justify-center">

                <span className="text-3xl font-bold">
                  {qualityScore ?? '--'}
                </span>

                <span className="text-xs text-gray-500">
                  /100
                </span>

              </div>

            </div>

            <div>

              <p className="text-xs text-gray-500 uppercase">
                Quality Index
              </p>

              <p
                className={`text-lg font-bold mt-1 ${statusStyle.text}`}
              >
                {qualityScore == null
                  ? 'Waiting for data'
                  : qualityScore >= 80
                  ? 'Safe range'
                  : qualityScore >= 50
                  ? 'Needs attention'
                  : 'Poor quality'}
              </p>

            </div>

          </div>

        </div>

      </div>


      {/* QUALITY PARAMETERS */}

      <div>

        <div className="flex justify-between items-center mb-4">

          <div>
            <h3 className="text-xl font-bold">
              Quality Parameters
            </h3>

            <p className="text-xs text-gray-500 mt-1">
              Live measurements from {currentZone.zone}
            </p>
          </div>

          <Radio className="w-5 h-5 text-accentTeal" />

        </div>


        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">


          {/* PH */}

          <div className="bg-cardBg rounded-2xl border border-gray-800 p-5">

            <div className="flex justify-between items-start">

              <div>
                <p className="text-sm text-gray-400">
                  pH
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  Acidity / alkalinity
                </p>
              </div>

              <FlaskConical className="text-accentBlue" />

            </div>

            <p className="text-4xl font-bold text-accentTeal mt-5">
              {formatValue(ph, 2)}
            </p>

            <div className="mt-4">

              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span>6.5</span>
                <span>Safe range</span>
                <span>8.5</span>
              </div>

              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">

                <div
                  className="h-full bg-accentTeal rounded-full"
                  style={{
                    width: `${
                      Number.isNaN(ph)
                        ? 0
                        : Math.min(
                            100,
                            Math.max(
                              0,
                              ((ph - 4) / 6) * 100
                            )
                          )
                    }%`
                  }}
                />

              </div>

            </div>

            <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-800">

              <span className="text-xs text-gray-500">
                Status
              </span>

              <span
                className={`text-xs font-semibold ${
                  getParameterStatus('ph') === 'NORMAL'
                    ? 'text-accentTeal'
                    : 'text-yellow-400'
                }`}
              >
                {getParameterStatus('ph')}
              </span>

            </div>

          </div>


          {/* TDS */}

          <div className="bg-cardBg rounded-2xl border border-gray-800 p-5">

            <div className="flex justify-between items-start">

              <div>
                <p className="text-sm text-gray-400">
                  TDS
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  Total dissolved solids
                </p>
              </div>

              <Gauge className="text-accentBlue" />

            </div>

            <p className="text-4xl font-bold text-accentTeal mt-5">
              {formatValue(tds, 0)}

              <span className="text-sm text-gray-500 ml-1">
                mg/L
              </span>
            </p>

            <div className="mt-5">

              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span>0</span>
                <span>500 mg/L threshold</span>
              </div>

              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">

                <div
                  className="h-full bg-accentTeal rounded-full"
                  style={{
                    width: `${
                      Number.isNaN(tds)
                        ? 0
                        : Math.min(
                            100,
                            Math.max(
                              0,
                              (tds / 700) * 100
                            )
                          )
                    }%`
                  }}
                />

              </div>

            </div>

            <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-800">

              <span className="text-xs text-gray-500">
                Status
              </span>

              <span
                className={`text-xs font-semibold ${
                  getParameterStatus('tds') === 'NORMAL'
                    ? 'text-accentTeal'
                    : 'text-yellow-400'
                }`}
              >
                {getParameterStatus('tds')}
              </span>

            </div>

          </div>


          {/* TURBIDITY */}

          <div className="bg-cardBg rounded-2xl border border-gray-800 p-5">

            <div className="flex justify-between items-start">

              <div>
                <p className="text-sm text-gray-400">
                  Turbidity
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  Water clarity
                </p>
              </div>

              <Waves className="text-accentBlue" />

            </div>

            <p className="text-4xl font-bold text-accentTeal mt-5">
              {formatValue(turbidity, 2)}

              <span className="text-sm text-gray-500 ml-1">
                NTU
              </span>
            </p>

            <div className="mt-5">

              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span>0</span>
                <span>5 NTU threshold</span>
              </div>

              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">

                <div
                  className="h-full bg-accentTeal rounded-full"
                  style={{
                    width: `${
                      Number.isNaN(turbidity)
                        ? 0
                        : Math.min(
                            100,
                            Math.max(
                              0,
                              (turbidity / 10) * 100
                            )
                          )
                    }%`
                  }}
                />

              </div>

            </div>

            <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-800">

              <span className="text-xs text-gray-500">
                Status
              </span>

              <span
                className={`text-xs font-semibold ${
                  getParameterStatus('turbidity') === 'NORMAL'
                    ? 'text-accentTeal'
                    : 'text-yellow-400'
                }`}
              >
                {getParameterStatus('turbidity')}
              </span>

            </div>

          </div>

        </div>

      </div>


      {/* EXPLANATION + DEVICE */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">


        {/* EXPLANATION */}

        <div className="bg-cardBg rounded-2xl border border-gray-800 p-5">

          <div className="flex items-center gap-3 mb-4">

            <div className="p-2 rounded-lg bg-accentTeal/10">
              <Lightbulb className="w-5 h-5 text-accentTeal" />
            </div>

            <div>
              <h3 className="font-bold">
                Why this quality rating?
              </h3>

              <p className="text-xs text-gray-500">
                HydroIQ water quality reasoning
              </p>
            </div>

          </div>


          {issues.length > 0 ? (

            <div className="space-y-3">

              {issues.map((issue, index) => (

                <div
                  key={index}
                  className="flex gap-3 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20"
                >

                  <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5" />

                  <p className="text-sm text-gray-300">
                    {issue}
                  </p>

                </div>

              ))}

            </div>

          ) : (

            <div className="flex gap-3 p-4 rounded-lg bg-accentTeal/5 border border-accentTeal/20">

              <CheckCircle2 className="w-5 h-5 text-accentTeal" />

              <div>

                <p className="text-sm font-semibold text-accentTeal">
                  Parameters are within the monitored range.
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  Continue monitoring the water quality trend.
                </p>

              </div>

            </div>

          )}

        </div>


        {/* DEVICE */}

        <div className="bg-cardBg rounded-2xl border border-gray-800 p-5">

          <div className="flex justify-between items-start">

            <div>

              <p className="text-xs text-gray-500 uppercase">
                Monitoring Device
              </p>

              <h3 className="text-xl font-bold mt-2">
                {currentZone.device_id}
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                Zone: {currentZone.zone}
              </p>

            </div>

            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-accentTeal/10 text-accentTeal border border-accentTeal/30">
              ONLINE
            </span>

          </div>


          <div className="grid grid-cols-2 gap-3 mt-5">

            <div className="p-3 rounded-xl bg-gray-900/50 border border-gray-800">

              <p className="text-xs text-gray-500">
                Sampling
              </p>

              <p className="font-semibold mt-1">
                Live
              </p>

            </div>

            <div className="p-3 rounded-xl bg-gray-900/50 border border-gray-800">

              <p className="text-xs text-gray-500">
                Refresh
              </p>

              <p className="font-semibold mt-1">
                3 sec
              </p>

            </div>

          </div>

        </div>

      </div>


      {/* RECOMMENDATION */}

      <div
        className={`rounded-2xl border ${statusStyle.border} ${statusStyle.bg} p-5`}
      >

        <div className="flex items-start gap-4">

          <ShieldCheck
            className={`w-6 h-6 ${statusStyle.text} mt-1`}
          />

          <div>

            <h3 className="font-bold">
              Recommended Action
            </h3>

            <p className="text-sm text-gray-400 mt-1 leading-relaxed">

              {qualityStatus === 'POOR'
                ? `Immediate water quality investigation is recommended for ${currentZone.zone}. Verify the affected sensors and inspect the zone before normal operation continues.`
                : qualityStatus === 'WARNING'
                ? `Continue close monitoring of ${currentZone.zone} and investigate any parameter showing a sustained abnormal trend.`
                : `Water quality in ${currentZone.zone} is currently within the monitored range. Continue routine telemetry monitoring.`}

            </p>

          </div>

        </div>

      </div>


      {/* FOOTER */}

      <div className="flex items-center justify-between text-xs text-gray-500 px-1">

        <span>
          HydroIQ Water Quality Intelligence
        </span>

        <span className="flex items-center gap-2">

          <Activity className="w-3 h-3 text-accentTeal" />

          Auto-refreshing

        </span>

      </div>

    </div>
  );
}