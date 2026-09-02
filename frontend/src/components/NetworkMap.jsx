import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Droplets,
  Gauge,
  MapPin,
  Radio,
  ShieldCheck,
  Siren,
  Users,
  Waves,
  Zap
} from 'lucide-react';

import { fetchLatestAnalytics } from '../api';

export default function NetworkMap() {
  const [analytics, setAnalytics] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [simulating, setSimulating] = useState(false);

  const loadData = async () => {
    try {
      const data = await fetchLatestAnalytics();

      if (data) {
        setAnalytics(data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Network Map error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const interval = setInterval(loadData, 3000);

    return () => clearInterval(interval);
  }, []);

  /*
   * Normalize backend data.
   *
   * The backend may provide sensor values inside
   * zone.sensor_data, while analytics such as condition,
   * risk and leak are directly inside each zone.
   */
  const zones = useMemo(() => {
  const rawZones = analytics?.zones || [];

  return rawZones.map((zone, index) => {
    const sensor = zone?.sensor_data || zone || {};

    return {
      ...zone,

      id:
        zone?.zone ||
        `Zone_${String.fromCharCode(65 + index)}`,

      device:
        zone?.device_id ||
        `ESP32_Node_${index + 1}`,

      condition:
        zone?.condition?.condition ||
        zone?.stage ||
        'NORMAL',

      risk:
        Number(zone?.risk?.wrs ?? zone?.risk?.score) || 0,

      leakDetected:
        zone?.leak?.leak_detected === true,

      qualityStatus:
        zone?.water_quality?.status || 'Good',

      pressure:
        Number(sensor?.pressure) || 0,

      flow:
        Number(sensor?.flow) || 0,

      acoustic:
        Number(sensor?.acoustic) || 0,

      ph:
        Number(sensor?.ph) || 0,

      tds:
        Number(sensor?.tds) || 0,

      turbidity:
        Number(sensor?.turbidity) || 0,

      population:
        Number(zone?.population ?? zone?.impact?.population) || 0,

      criticalArea:
        Boolean(
          zone?.critical_area ??
          zone?.impact?.critical_area
        ),

      locationScore:
        Number(zone?.location_score) || 0
    };
  });
}, [analytics]);

  useEffect(() => {
    if (!selectedZone && zones.length > 0) {
      setSelectedZone(zones[0]);
    }
  }, [zones, selectedZone]);

  const getStatus = (zone) => {
    if (zone.leakDetected) {
      return 'CRITICAL';
    }

    if (
      zone.condition === 'SENSOR_FAULT'
    ) {
      return 'SENSOR FAULT';
    }

    if (
      zone.condition === 'EARLY_ANOMALY'
    ) {
      return 'EARLY ANOMALY';
    }

    if (
      zone.qualityStatus === 'Poor'
    ) {
      return 'WATER QUALITY';
    }

    return 'NORMAL';
  };

  const getStatusStyle = (zone) => {
    const status = getStatus(zone);

    if (status === 'CRITICAL') {
      return {
        text: 'text-red-400',
        border: 'border-red-500/50',
        bg: 'bg-red-500/10',
        dot: 'bg-red-400',
        glow: 'shadow-red-500/30'
      };
    }

    if (
      status === 'EARLY ANOMALY' ||
      status === 'WATER QUALITY'
    ) {
      return {
        text: 'text-yellow-400',
        border: 'border-yellow-500/40',
        bg: 'bg-yellow-500/10',
        dot: 'bg-yellow-400',
        glow: 'shadow-yellow-500/20'
      };
    }

    if (status === 'SENSOR FAULT') {
      return {
        text: 'text-orange-400',
        border: 'border-orange-500/40',
        bg: 'bg-orange-500/10',
        dot: 'bg-orange-400',
        glow: 'shadow-orange-500/20'
      };
    }

    return {
      text: 'text-accentTeal',
      border: 'border-accentTeal/30',
      bg: 'bg-accentTeal/5',
      dot: 'bg-accentTeal',
      glow: 'shadow-accentTeal/10'
    };
  };

  const networkStats = useMemo(() => {
    const critical = zones.filter(
      (z) => getStatus(z) === 'CRITICAL'
    ).length;

    const anomalies = zones.filter(
      (z) =>
        getStatus(z) === 'EARLY ANOMALY' ||
        getStatus(z) === 'SENSOR FAULT' ||
        getStatus(z) === 'WATER QUALITY'
    ).length;

    const normal = zones.filter(
      (z) => getStatus(z) === 'NORMAL'
    ).length;

    const highestRisk = zones.reduce(
      (max, zone) =>
        Math.max(max, zone.risk),
      0
    );

    const population = zones.reduce(
      (sum, zone) =>
        sum + zone.population,
      0
    );

    return {
      critical,
      anomalies,
      normal,
      highestRisk,
      population
    };
  }, [zones]);

  const handleSelectZone = (zone) => {
    setSelectedZone(zone);
  };

  const handleSimulation = () => {
    setSimulating(true);

    setTimeout(() => {
      setSimulating(false);
    }, 2500);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-cardBg rounded-2xl border border-gray-800 p-8">
          <div className="flex items-center gap-3">
            <Activity className="text-accentTeal animate-pulse" />

            <div>
              <p className="font-semibold">
                Connecting to HydroIQ network...
              </p>

              <p className="text-sm text-gray-500 mt-1">
                Waiting for live telemetry
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

        <div>
          <div className="flex items-center gap-3">

            <div className="p-2 rounded-xl bg-accentTeal/10 border border-accentTeal/20">
              <Waves className="w-6 h-6 text-accentTeal" />
            </div>

            <div>
              <h2 className="text-3xl font-bold">
                Network Command Center
              </h2>

              <p className="text-sm text-gray-400 mt-1">
                Live pipeline topology, sensor health and zone intelligence
              </p>
            </div>

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
            LIVE NETWORK
          </span>

        </div>

      </div>


      {/* =====================================================
          NETWORK STATS
      ===================================================== */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="bg-cardBg rounded-2xl border border-gray-800 p-5">

          <div className="flex justify-between">

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Monitored Zones
              </p>

              <p className="text-3xl font-bold mt-2">
                {zones.length}
              </p>
            </div>

            <MapPin className="text-accentTeal" />

          </div>

          <p className="text-xs text-gray-500 mt-3">
            Network coverage
          </p>

        </div>


        <div className="bg-cardBg rounded-2xl border border-gray-800 p-5">

          <div className="flex justify-between">

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Highest Risk
              </p>

              <p
                className={`text-3xl font-bold mt-2 ${
                  networkStats.highestRisk >= 70
                    ? 'text-red-400'
                    : networkStats.highestRisk > 0
                    ? 'text-yellow-400'
                    : 'text-accentTeal'
                }`}
              >
                {networkStats.highestRisk}
              </p>
            </div>

            <Gauge className="text-yellow-400" />

          </div>

          <p className="text-xs text-gray-500 mt-3">
            Maximum WRS / 100
          </p>

        </div>


        <div className="bg-cardBg rounded-2xl border border-gray-800 p-5">

          <div className="flex justify-between">

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Attention Required
              </p>

              <p className="text-3xl font-bold mt-2 text-yellow-400">
                {networkStats.critical +
                  networkStats.anomalies}
              </p>
            </div>

            <Siren className="text-yellow-400" />

          </div>

          <p className="text-xs text-gray-500 mt-3">
            Anomalies + critical zones
          </p>

        </div>


        <div className="bg-cardBg rounded-2xl border border-gray-800 p-5">

          <div className="flex justify-between">

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Population Coverage
              </p>

              <p className="text-3xl font-bold mt-2">
                {networkStats.population.toLocaleString()}
              </p>
            </div>

            <Users className="text-accentBlue" />

          </div>

          <p className="text-xs text-gray-500 mt-3">
            People across monitored zones
          </p>

        </div>

      </div>


      {/* =====================================================
          MAIN NETWORK VIEW
      ===================================================== */}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* NETWORK MAP */}

        <div className="xl:col-span-2 bg-cardBg rounded-2xl border border-gray-800 overflow-hidden">

          <div className="p-5 border-b border-gray-800 flex justify-between items-center">

            <div>
              <h3 className="text-xl font-bold">
                Pipeline Network
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                Real-time zone condition topology
              </p>
            </div>

            <button
              onClick={handleSimulation}
              className="px-4 py-2 rounded-lg bg-accentTeal/10 border border-accentTeal/30 text-accentTeal text-xs font-semibold hover:bg-accentTeal/20 transition"
            >
              {simulating
                ? 'SIMULATING...'
                : 'SIMULATE INCIDENT'}
            </button>

          </div>


          <div className="relative min-h-[560px] overflow-hidden bg-[#09131f]">

            {/* Grid background */}

            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  'linear-gradient(#294052 1px, transparent 1px), linear-gradient(90deg, #294052 1px, transparent 1px)',
                backgroundSize: '40px 40px'
              }}
            />


            {/* Network lines */}

            <div className="absolute inset-0">

              <div className="absolute left-[12%] right-[12%] top-[50%] h-[3px] bg-gray-700" />

              <div className="absolute left-[28%] top-[22%] bottom-[28%] w-[3px] bg-gray-700" />

              <div className="absolute left-[50%] top-[22%] bottom-[28%] w-[3px] bg-gray-700" />

              <div className="absolute left-[72%] top-[22%] bottom-[28%] w-[3px] bg-gray-700" />

              {/* animated flow */}

              <div className="absolute left-[12%] top-[calc(50%-1px)] w-20 h-[3px] bg-gradient-to-r from-transparent via-accentTeal to-transparent animate-pulse" />

              <div className="absolute left-[45%] top-[calc(50%-1px)] w-20 h-[3px] bg-gradient-to-r from-transparent via-accentTeal to-transparent animate-pulse" />

            </div>


            {/* Central command node */}

            <div className="absolute left-1/2 top-[50%] -translate-x-1/2 -translate-y-1/2 z-10">

              <div className="relative">

                <div className="absolute inset-0 rounded-full bg-accentTeal/20 blur-xl animate-pulse" />

                <div className="relative w-24 h-24 rounded-full border-2 border-accentTeal/60 bg-[#0d1b29] flex flex-col items-center justify-center shadow-xl">

                  <Droplets className="w-7 h-7 text-accentTeal" />

                  <span className="text-[10px] text-gray-400 mt-1">
                    HYDROIQ
                  </span>

                  <span className="text-[9px] text-accentTeal">
                    CORE
                  </span>

                </div>

              </div>

            </div>


            {/* Zones */}

            {zones.map((zone, index) => {

              const positions = [
                {
                  left: '14%',
                  top: '19%'
                },
                {
                  left: '70%',
                  top: '19%'
                },
                {
                  left: '24%',
                  top: '68%'
                },
                {
                  left: '70%',
                  top: '68%'
                }
              ];

              const position =
                positions[index] || {
                  left: `${20 + (index * 15)}%`,
                  top: '30%'
                };

              const style =
                getStatusStyle(zone);

              const status =
                getStatus(zone);

              const selected =
                selectedZone?.id === zone.id;

              return (
                <button
                  key={zone.id}
                  onClick={() =>
                    handleSelectZone(zone)
                  }
                  className="absolute z-20 text-left"
                  style={position}
                >

                  {/* pulse ring */}

                  <span
                    className={`absolute -inset-3 rounded-full opacity-20 ${
                      status === 'CRITICAL'
                        ? 'bg-red-400 animate-ping'
                        : status === 'EARLY ANOMALY'
                        ? 'bg-yellow-400 animate-pulse'
                        : 'bg-accentTeal'
                    }`}
                  />


                  <div
                    className={`relative w-14 h-14 rounded-full border-2 ${
                      style.border
                    } ${style.bg} flex items-center justify-center ${
                      selected
                        ? 'ring-4 ring-accentTeal/20'
                        : ''
                    }`}
                  >

                    {status === 'CRITICAL' ? (
                      <AlertTriangle
                        className={`w-6 h-6 ${style.text}`}
                      />
                    ) : (
                      <Activity
                        className={`w-6 h-6 ${style.text}`}
                      />
                    )}

                  </div>


                  <div
                    className={`mt-2 px-3 py-2 rounded-xl bg-[#101c2b]/95 border ${
                      style.border
                    } shadow-xl min-w-[145px]`}
                  >

                    <div className="flex justify-between items-center gap-3">

                      <span className="font-bold text-sm">
                        {zone.id}
                      </span>

                      <span
                        className={`w-2.5 h-2.5 rounded-full ${style.dot}`}
                      />

                    </div>

                    <p
                      className={`text-[10px] font-semibold mt-1 ${style.text}`}
                    >
                      {status}
                    </p>

                    <p className="text-[10px] text-gray-500 mt-1">
                      Risk {zone.risk}/100
                    </p>

                  </div>

                </button>
              );
            })}


            {/* Empty state */}

            {zones.length === 0 && (

              <div className="absolute inset-0 flex items-center justify-center">

                <div className="text-center">

                  <Radio className="w-12 h-12 text-gray-600 mx-auto mb-3" />

                  <p className="font-semibold text-gray-400">
                    No zones detected
                  </p>

                  <p className="text-sm text-gray-600 mt-1">
                    Waiting for telemetry
                  </p>

                </div>

              </div>

            )}

          </div>


          {/* Legend */}

          <div className="p-4 border-t border-gray-800 flex flex-wrap gap-5 text-xs">

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-accentTeal" />
              Normal
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              Attention
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
              Critical
            </div>

            <div className="ml-auto text-gray-500">
              Click a zone for intelligence
            </div>

          </div>

        </div>


        {/* =================================================
            SELECTED ZONE
        ================================================= */}

        <div className="bg-cardBg rounded-2xl border border-gray-800 p-5">

          {selectedZone ? (

            <div className="space-y-5">

              <div className="flex justify-between items-start">

                <div>

                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Selected Zone
                  </p>

                  <h3 className="text-2xl font-bold mt-1">
                    {selectedZone.id}
                  </h3>

                  <p className="text-sm text-gray-500 mt-1">
                    {selectedZone.device}
                  </p>

                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    getStatusStyle(selectedZone).bg
                  } ${
                    getStatusStyle(selectedZone).text
                  }`}
                >
                  {getStatus(selectedZone)}
                </span>

              </div>


              {/* Risk */}

              <div className="p-4 rounded-xl bg-gray-900/50 border border-gray-800">

                <div className="flex justify-between items-center">

                  <div className="flex items-center gap-2">

                    <ShieldCheck className="w-4 h-4 text-accentTeal" />

                    <span className="text-sm text-gray-400">
                      Water Risk Score
                    </span>

                  </div>

                  <span className="text-2xl font-bold text-accentTeal">
                    {selectedZone.risk}
                    <span className="text-xs text-gray-500">
                      /100
                    </span>
                  </span>

                </div>

                <div className="h-2 bg-gray-800 rounded-full mt-3 overflow-hidden">

                  <div
                    className={`h-full rounded-full ${
                      selectedZone.risk >= 70
                        ? 'bg-red-400'
                        : selectedZone.risk > 0
                        ? 'bg-yellow-400'
                        : 'bg-accentTeal'
                    }`}
                    style={{
                      width: `${Math.min(
                        selectedZone.risk,
                        100
                      )}%`
                    }}
                  />

                </div>

              </div>


              {/* Sensors */}

              <div>

                <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">
                  Live Telemetry
                </p>

                <div className="grid grid-cols-2 gap-3">

                  <div className="p-3 rounded-xl bg-gray-900/50 border border-gray-800">

                    <Gauge className="w-4 h-4 text-accentBlue mb-2" />

                    <p className="text-xs text-gray-500">
                      Pressure
                    </p>

                    <p className="font-bold mt-1">
                      {selectedZone.pressure}
                      <span className="text-xs text-gray-500 ml-1">
                        bar
                      </span>
                    </p>

                  </div>


                  <div className="p-3 rounded-xl bg-gray-900/50 border border-gray-800">

                    <Waves className="w-4 h-4 text-accentTeal mb-2" />

                    <p className="text-xs text-gray-500">
                      Flow
                    </p>

                    <p className="font-bold mt-1">
                      {selectedZone.flow}
                      <span className="text-xs text-gray-500 ml-1">
                        L/min
                      </span>
                    </p>

                  </div>


                  <div className="p-3 rounded-xl bg-gray-900/50 border border-gray-800">

                    <Activity className="w-4 h-4 text-warningOrange mb-2" />

                    <p className="text-xs text-gray-500">
                      Acoustic
                    </p>

                    <p className="font-bold mt-1">
                      {selectedZone.acoustic}
                    </p>

                  </div>


                  <div className="p-3 rounded-xl bg-gray-900/50 border border-gray-800">

                    <Droplets className="w-4 h-4 text-accentBlue mb-2" />

                    <p className="text-xs text-gray-500">
                      Turbidity
                    </p>

                    <p className="font-bold mt-1">
                      {selectedZone.turbidity}
                      <span className="text-xs text-gray-500 ml-1">
                        NTU
                      </span>
                    </p>

                  </div>

                </div>

              </div>


              {/* Impact */}

              <div className="border-t border-gray-800 pt-4">

                <div className="grid grid-cols-2 gap-4">

                  <div>

                    <p className="text-xs text-gray-500">
                      Population
                    </p>

                    <p className="font-semibold mt-1">
                      {selectedZone.population.toLocaleString()}
                    </p>

                  </div>

                  <div>

                    <p className="text-xs text-gray-500">
                      Critical Area
                    </p>

                    <p
                      className={`font-semibold mt-1 ${
                        selectedZone.criticalArea
                          ? 'text-red-400'
                          : 'text-accentTeal'
                      }`}
                    >
                      {selectedZone.criticalArea
                        ? 'YES'
                        : 'NO'}
                    </p>

                  </div>

                </div>

              </div>


              {/* Action */}

              <div
                className={`p-4 rounded-xl border ${
                  getStatusStyle(selectedZone).border
                } ${
                  getStatusStyle(selectedZone).bg
                }`}
              >

                <div className="flex items-start gap-3">

                  <Zap
                    className={`w-5 h-5 ${
                      getStatusStyle(selectedZone).text
                    }`}
                  />

                  <div>

                    <p className="text-sm font-semibold">
                      Network Intelligence
                    </p>

                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">

                      {getStatus(selectedZone) === 'CRITICAL'
                        ? 'Critical condition detected. Immediate inspection and isolation should be considered.'
                        : getStatus(selectedZone) === 'EARLY ANOMALY'
                        ? 'Abnormal trend detected. Continue close monitoring and inspect the affected zone if the trend persists.'
                        : getStatus(selectedZone) === 'WATER QUALITY'
                        ? 'Water quality parameters require attention. Inspect pH, TDS and turbidity trends.'
                        : getStatus(selectedZone) === 'SENSOR FAULT'
                        ? 'Sensor readings may be unreliable. Check device health and connectivity.'
                        : 'Zone is operating within the monitored range.'}

                    </p>

                  </div>

                </div>

              </div>

            </div>

          ) : (

            <div className="h-full min-h-[400px] flex items-center justify-center text-center">

              <div>

                <MapPin className="w-10 h-10 text-gray-600 mx-auto mb-3" />

                <p className="text-gray-400">
                  Select a zone
                </p>

                <p className="text-xs text-gray-600 mt-1">
                  Click any zone on the network map
                </p>

              </div>

            </div>

          )}

        </div>

      </div>


      {/* =====================================================
          ZONE STATUS STRIP
      ===================================================== */}

      <div className="bg-cardBg rounded-2xl border border-gray-800 p-5">

        <div className="flex justify-between items-center mb-4">

          <div>

            <h3 className="text-lg font-bold">
              Zone Intelligence
            </h3>

            <p className="text-xs text-gray-500 mt-1">
              Current operational state across the network
            </p>

          </div>

          <span className="text-xs text-gray-500">
            {networkStats.normal} normal ·{' '}
            {networkStats.anomalies} attention ·{' '}
            {networkStats.critical} critical
          </span>

        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">

          {zones.map((zone) => {

            const style =
              getStatusStyle(zone);

            return (
              <button
                key={zone.id}
                onClick={() =>
                  handleSelectZone(zone)
                }
                className={`text-left p-4 rounded-xl border ${style.border} ${style.bg} hover:scale-[1.01] transition`}
              >

                <div className="flex justify-between">

                  <div>

                    <p className="font-semibold">
                      {zone.id}
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      {zone.device}
                    </p>

                  </div>

                  <span
                    className={`w-3 h-3 rounded-full ${style.dot}`}
                  />

                </div>

                <div className="flex justify-between items-end mt-4">

                  <div>

                    <p className="text-[10px] text-gray-500 uppercase">
                      Condition
                    </p>

                    <p
                      className={`text-xs font-semibold mt-1 ${style.text}`}
                    >
                      {getStatus(zone)}
                    </p>

                  </div>

                  <div className="text-right">

                    <p className="text-[10px] text-gray-500">
                      WRS
                    </p>

                    <p className="font-bold">
                      {zone.risk}
                    </p>

                  </div>

                </div>

              </button>
            );
          })}

        </div>

      </div>


      {/* =====================================================
          FOOTER STATUS
      ===================================================== */}

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500 px-1">

        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-accentTeal" />
          Telemetry gateway connected
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accentTeal animate-pulse" />
          Auto-refresh every 3 seconds
        </div>

        <div>
          HydroIQ Network Intelligence
        </div>

      </div>

    </div>
  );
}