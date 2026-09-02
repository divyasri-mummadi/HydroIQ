import React, { useEffect, useMemo, useState } from 'react';

import {
  fetchLatestSensorData,
  fetchLatestAnalytics,
  fetchSensorHistory,
} from '../api';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';


// ============================================================
// HELPERS
// ============================================================

const numberValue = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};


// ============================================================
// DEVICE → ZONE MAPPING
// ============================================================

const DEVICE_ZONE_MAP = {
  ESP32_Node_1: 'Zone_A',
  ESP32_Node_2: 'Zone_B',
  ESP32_Node_3: 'Zone_C',
  ESP32_Node_4: 'Zone_D',
};


// ============================================================
// NORMALIZE ZONE
// ============================================================

const normalizeZone = (zone, index = 0) => {
  const deviceId =
    zone?.device_id ||
    zone?.deviceId ||
    `ESP32_Node_${index + 1}`;

  const backendZone =
    zone?.zone ||
    zone?.zone_id ||
    zone?.zoneId ||
    zone?.sensor_data?.zone;

  if (
    backendZone &&
    backendZone !== 'UNKNOWN' &&
    backendZone !== 'Unknown'
  ) {
    return backendZone;
  }

  if (DEVICE_ZONE_MAP[deviceId]) {
    return DEVICE_ZONE_MAP[deviceId];
  }

  return `Zone_${String.fromCharCode(65 + index)}`;
};


// ============================================================
// NORMALIZE ANALYTICS RESPONSE
// ============================================================

const normalizeAnalytics = (response) => {
  if (!response) {
    return [];
  }

  // Backend returns multiple zones
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response.zones)) {
    return response.zones;
  }

  // Backend currently returns one analytics object
  if (
    response.device_id ||
    response.sensor_data ||
    response.ml_prediction ||
    response.priority
  ) {
    return [response];
  }

  return [];
};

// ============================================================
// SENSOR VALUES
// ============================================================

const getSensorValues = (zone) => {
  const data = zone?.sensor_data || zone || {};

  return {
    pressure: numberValue(
      data.pressure ??
      data.pressure_bar ??
      data.pressureBar
    ),

    flow: numberValue(
      data.flow ??
      data.flow_L_min ??
      data.flow_l_min ??
      data.flowRate
    ),

    acoustic: numberValue(
      data.acoustic ??
      data.acoustic_amp ??
      data.acousticAmplitude
    ),

    ph: numberValue(
      data.ph ??
      data.pH ??
      data.ph_value
    ),

    tds: numberValue(
      data.tds ??
      data.tds_ppm
    ),

    turbidity: numberValue(
      data.turbidity ??
      data.turbidity_NTU ??
      data.turbidity_ntu
    ),
  };
};


// ============================================================
// CONDITION
// ============================================================

const getCondition = (zone) => {
  return (
    zone?.condition?.condition ||
    zone?.stage ||
    'NORMAL'
  );
};


// ============================================================
// PROBLEM DETECTION
//
// IMPORTANT:
// NORMAL ZONES = NO PRIORITY
//
// Problem if:
// - condition is not NORMAL
// - leak detected
// - poor water quality
// - risk > 0
// - sensor health < 90
// ============================================================

const isProblemZone = (zone) => {
  const condition = getCondition(zone);

  const risk = numberValue(
    zone?.risk?.score
  );

  const leakDetected =
    zone?.leak?.leak_detected === true;

  const qualityStatus =
    zone?.water_quality?.status;

  const sensorHealth =
    numberValue(
      zone?.sensor_health?.overall_score,
      100
    );

  return (
    condition !== 'NORMAL' ||
    risk > 0 ||
    leakDetected ||
    qualityStatus === 'Poor' ||
    sensorHealth < 90
  );
};


// ============================================================
// PRIORITY
//
// BACKEND IS THE ONLY SOURCE OF PRIORITY.
// FRONTEND DOES NOT CREATE P1/P2/P3/P4/P5.
// ============================================================

const getPriority = (zone) => {
  if (!isProblemZone(zone)) {
    return null;
  }

  return zone?.priority || null;
};


// ============================================================
// PRIORITY ORDER
// ============================================================

const priorityRank = {
  P1: 1,
  P2: 2,
  P3: 3,
  P4: 4,
  P5: 5,
};


// ============================================================
// STATUS COLORS
// ============================================================

const getStatusClass = (condition) => {
  switch (condition) {
    case 'LEAK':
      return 'text-red-400';

    case 'CRITICAL':
      return 'text-red-400';

    case 'SENSOR_FAULT':
      return 'text-orange-400';

    case 'WATER_QUALITY':
      return 'text-yellow-400';

    case 'EARLY_ANOMALY':
      return 'text-yellow-400';

    default:
      return 'text-accentTeal';
  }
};


const getStatusBg = (condition) => {
  switch (condition) {
    case 'LEAK':
      return 'bg-red-500/15 border-red-500/30';

    case 'CRITICAL':
      return 'bg-red-500/15 border-red-500/30';

    case 'SENSOR_FAULT':
      return 'bg-orange-500/15 border-orange-500/30';

    case 'WATER_QUALITY':
      return 'bg-yellow-500/15 border-yellow-500/30';

    case 'EARLY_ANOMALY':
      return 'bg-yellow-500/15 border-yellow-500/30';

    default:
      return 'bg-accentTeal/10 border-accentTeal/20';
  }
};


// ============================================================
// PRIORITY COLORS
// ============================================================

const getPriorityClass = (priority) => {
  switch (priority) {
    case 'P1':
      return 'bg-red-500/20 text-red-400';

    case 'P2':
      return 'bg-orange-500/20 text-orange-400';

    case 'P3':
      return 'bg-yellow-500/20 text-yellow-400';

    case 'P4':
      return 'bg-blue-500/20 text-blue-400';

    case 'P5':
      return 'bg-gray-500/20 text-gray-400';

    default:
      return 'bg-gray-700/30 text-gray-400';
  }
};


// ============================================================
// HISTORY NORMALIZATION
// ============================================================

const normalizeHistory = (response, selectedZone) => {
  let raw = [];

  if (Array.isArray(response)) {
    raw = response;
  } else if (
    response &&
    Array.isArray(response.data)
  ) {
    raw = response.data;
  }

  return raw
    .map((item, index) => {
      const deviceId =
        item?.device_id ||
        item?.deviceId ||
        item?.sensor_data?.device_id ||
        `ESP32_Node_${index + 1}`;

      const zone =
        item?.zone ||
        item?.zone_id ||
        item?.zoneId ||
        item?.sensor_data?.zone ||
        DEVICE_ZONE_MAP[deviceId] ||
        `Zone_${String.fromCharCode(65 + index)}`;

      const data =
        item?.sensor_data ||
        item ||
        {};

      const rawTime =
        item?.timestamp ||
        item?.time ||
        item?._time;

      const parsedTime =
        rawTime
          ? new Date(rawTime).getTime()
          : Date.now() - (raw.length - index) * 3000;

      return {
        timestamp: Number.isFinite(parsedTime)
          ? parsedTime
          : Date.now() - (raw.length - index) * 3000,

        zone,

        pressure: numberValue(
          data.pressure ??
          data.pressure_bar ??
          data.pressureBar
        ),

        flow: numberValue(
          data.flow ??
          data.flow_L_min ??
          data.flow_l_min ??
          data.flowRate
        ),

        turbidity: numberValue(
          data.turbidity ??
          data.turbidity_NTU ??
          data.turbidity_ntu
        ),
      };
    })
    .filter((item) => {
      if (!selectedZone) {
        return true;
      }

      return item.zone === selectedZone;
    })
    .sort(
      (a, b) =>
        a.timestamp - b.timestamp
    )
    .slice(-60);
};


// ============================================================
// CHART TOOLTIP
// ============================================================

const ChartTooltip = ({
  active,
  payload,
  label,
}) => {
  if (
    !active ||
    !payload ||
    payload.length === 0
  ) {
    return null;
  }

  return (
    <div className="bg-[#131F2E] border border-gray-700 rounded-lg px-4 py-3 shadow-xl">

      <p className="text-gray-300 text-sm mb-2">
        {new Date(label).toLocaleTimeString()}
      </p>

      {payload.map((entry) => (
        <p
          key={entry.dataKey}
          className="text-sm"
        >
          <span className="text-gray-400">
            {entry.name}:
          </span>{' '}

          <span className="font-semibold">
            {entry.value}
          </span>
        </p>
      ))}

    </div>
  );
};


// ============================================================
// MAIN COMPONENT
// ============================================================

export default function Overview() {

  const [zones, setZones] = useState([]);

  const [selectedGraphZone, setSelectedGraphZone] =
    useState('Zone_A');

  const [historyData, setHistoryData] =
    useState([]);

  const [networkData, setNetworkData] =
  useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);


  // ==========================================================
  // FETCH ANALYTICS
  // ==========================================================

  useEffect(() => {

    let mounted = true;

    const loadData = async () => {

      try {

        /*
         * Analytics already contains:
         *
         * sensor_data
         * leak
         * water_quality
         * condition
         * sensor_health
         * risk
         * priority
         * device_id
         * zone
         *
         * Therefore we use analytics as the main source.
         */

        const analytics =
  await fetchLatestAnalytics();

if (analytics?.network) {
  setNetworkData(analytics.network);
}

let analyticsZones =
  normalizeAnalytics(analytics);

        // ------------------------------------------------------
        // FALLBACK TO SENSOR DATA IF ANALYTICS FAILS
        // ------------------------------------------------------

        if (
          analyticsZones.length === 0
        ) {

          const sensorData =
            await fetchLatestSensorData();

          if (sensorData) {

            if (
              Array.isArray(
                sensorData.zones
              )
            ) {
              analyticsZones =
                sensorData.zones;
            } else if (
              Array.isArray(sensorData)
            ) {
              analyticsZones =
                sensorData;
            } else {
              analyticsZones = [
                sensorData
              ];
            }

          }

        }


        // ------------------------------------------------------
        // NORMALIZE ZONES
        // ------------------------------------------------------

        const normalizedZones =
          analyticsZones.map(
            (zone, index) => {

              const deviceId =
                zone?.device_id ||
                zone?.deviceId ||
                `ESP32_Node_${index + 1}`;

              return {
                ...zone,

                zone:
                  normalizeZone(
                    zone,
                    index
                  ),

                device_id:
                  deviceId,
              };

            }
          );


        // ------------------------------------------------------
        // CANONICAL ORDER
        // ------------------------------------------------------

        const zoneOrder = {
          Zone_A: 1,
          Zone_B: 2,
          Zone_C: 3,
          Zone_D: 4,
          Zone_E: 5,
          Zone_F: 6,
        };


        normalizedZones.sort(
          (a, b) =>
            (zoneOrder[a.zone] || 999) -
            (zoneOrder[b.zone] || 999)
        );


        if (mounted) {

          setZones(
            normalizedZones
          );

          setLastUpdated(
            new Date()
          );

        }

      } catch (error) {

        console.error(
          'HydroIQ analytics error:',
          error
        );

      } finally {

        if (mounted) {
          setLoading(false);
        }

      }

    };


    loadData();


    // Refresh every 3 seconds.

    const interval =
      setInterval(
        loadData,
        3000
      );


    return () => {

      mounted = false;

      clearInterval(interval);

    };

  }, []);


  // ==========================================================
  // PROBLEM ZONES
  //
  // ONLY PROBLEM ZONES WITH BACKEND PRIORITY.
  // NORMAL ZONES ARE NEVER SHOWN HERE.
  // ==========================================================

  const problemZones =
    useMemo(() => {

      return zones
        .filter(
          (zone) =>
            isProblemZone(zone)
        )
        .filter(
          (zone) =>
            getPriority(zone) !== null
        )
        .sort(
          (a, b) => {

            const aPriority =
              getPriority(a);

            const bPriority =
              getPriority(b);


            const aRank =
              priorityRank[
                aPriority?.priority
              ] || 999;

            const bRank =
              priorityRank[
                bPriority?.priority
              ] || 999;


            if (
              aRank !== bRank
            ) {
              return (
                aRank - bRank
              );
            }


            return (
              numberValue(
                bPriority?.score
              ) -
              numberValue(
                aPriority?.score
              )
            );

          }
        );

    }, [zones]);


  // ==========================================================
  // HIGHEST PRIORITY ZONE
  // ==========================================================

  const highestPriorityZone =
    problemZones.length > 0
      ? problemZones[0]
      : null;


  // ==========================================================
  // GRAPH ZONE
  // ==========================================================

  const graphZone =
    zones.find(
      (zone) => zone?.zone === selectedGraphZone
    ) ||
    zones[0] ||
    null;

  const graphZoneName =
    graphZone?.zone ||
    selectedGraphZone ||
    'Network';


  // ==========================================================
  // LOAD HISTORY
  // ==========================================================

  useEffect(() => {

    if (!graphZoneName) {
      return;
    }


    let mounted = true;


    const loadHistory =
      async () => {

        try {

          const response =
            await fetchSensorHistory();


          if (!mounted) {
            return;
          }


          const normalized =
            normalizeHistory(
              response,
              graphZoneName
            );


          setHistoryData(
            normalized
          );

        } catch (error) {

          console.error(
            'HydroIQ history error:',
            error
          );

        }

      };


    loadHistory();


    const interval =
      setInterval(
        loadHistory,
        3000
      );


    return () => {

      mounted = false;

      clearInterval(interval);

    };

  }, [graphZoneName]);


  // ==========================================================
  // NETWORK STATISTICS
  // ==========================================================

  const networkStats =
    useMemo(() => {

      const activeAlerts =
        zones.filter(
          isProblemZone
        );


      const highestRisk = numberValue(
  networkData?.risk_score,
  0
);


      // ------------------------------------------------------
      // WATER QUALITY INDEX
      // ------------------------------------------------------

      const qualityScores =
        zones.map((zone) => {

          const quality =
            zone?.water_quality;


          if (!quality) {
            return 100;
          }


          if (
            quality.status ===
            'Good'
          ) {
            return 100;
          }


          if (
            quality.status ===
            'Poor'
          ) {

            const issues =
              Array.isArray(
                quality.issues
              )
                ? quality.issues.length
                : 1;

            return Math.max(
              0,
              100 -
              issues * 20
            );

          }


          return 80;

        });


      const waterQualityIndex =
        qualityScores.length > 0
          ? Math.round(
              qualityScores.reduce(
                (a, b) =>
                  a + b,
                0
              ) /
              qualityScores.length
            )
          : 100;


      return {
        activeAlerts,
        highestRisk,
        waterQualityIndex,
      };

    }, [zones,networkData]);


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {

    return (
      <div className="p-8 text-gray-400">
        Loading HydroIQ network...
      </div>
    );

  }


  // ==========================================================
  // UI
  // ==========================================================

  return (

    <div className="p-6 space-y-6">


      {/* ======================================================
          HEADER
      ======================================================= */}

      <div className="flex justify-between items-center">

        <div>

          <h1 className="text-3xl font-bold">
            Network Overview
          </h1>

          <p className="text-gray-400 mt-1">
            Live HydroIQ network monitoring and analytics
          </p>

        </div>


        <div
          className={`
            px-4 py-2
            rounded-full
            border
            ${
              highestPriorityZone
                ? getStatusBg(
                    getCondition(
                      highestPriorityZone
                    )
                  )
                : 'bg-accentTeal/10 border-accentTeal/30 text-accentTeal'
            }
          `}
        >

          ●{' '}

          {highestPriorityZone
            ? getCondition(
                highestPriorityZone
              )
            : 'NORMAL'}

        </div>

      </div>


      {/* ======================================================
          TOP CARDS
      ======================================================= */}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">


        {/* WATER RISK */}

        <div className="bg-cardBg p-5 rounded-xl border border-gray-800">

          <p className="text-gray-400">
            Water Risk Score
          </p>

          <div className="mt-3">

            <span
              className={`
                text-4xl font-bold
                ${
                  networkStats.highestRisk >= 70
                    ? 'text-red-400'
                    : networkStats.highestRisk >= 40
                    ? 'text-yellow-400'
                    : 'text-accentTeal'
                }
              `}
            >
              {networkStats.highestRisk}
            </span>

            <span className="text-gray-500 ml-2">
              /100
            </span>

          </div>

          <p className="text-sm text-gray-500 mt-2">
            Highest current network risk
          </p>

        </div>


        {/* ACTIVE ALERTS */}

        <div className="bg-cardBg p-5 rounded-xl border border-gray-800">

          <p className="text-gray-400">
            Active Alerts
          </p>

          <p className="text-4xl font-bold text-red-400 mt-3">
            {networkStats.activeAlerts.length}
          </p>

          <p className="text-sm text-gray-500 mt-2">
            Zones requiring attention
          </p>

        </div>


        {/* HIGHEST PRIORITY */}

        <div className="bg-cardBg p-5 rounded-xl border border-gray-800">

          <p className="text-gray-400">
            Highest Priority Zone
          </p>

          <p
            className={`
              text-3xl font-bold mt-3
              ${
                highestPriorityZone
                  ? getStatusClass(
                      getCondition(
                        highestPriorityZone
                      )
                    )
                  : 'text-accentTeal'
              }
            `}
          >
            {highestPriorityZone?.zone ||
              'None'}
          </p>

          <p className="text-sm text-gray-500 mt-2">

            {highestPriorityZone
              ? `${getCondition(
                  highestPriorityZone
                )} · ${
                  getPriority(
                    highestPriorityZone
                  )?.priority || ''
                }`
              : 'All zones normal'}

          </p>

        </div>


        {/* WATER QUALITY */}

        <div className="bg-cardBg p-5 rounded-xl border border-gray-800">

          <p className="text-gray-400">
            Water Quality Index
          </p>

          <div className="mt-3">

            <span className="text-4xl font-bold text-accentTeal">
              {networkStats.waterQualityIndex}
            </span>

            <span className="text-gray-500 ml-2">
              /100
            </span>

          </div>

          <p className="text-sm text-gray-500 mt-2">
            Based on pH, TDS and turbidity
          </p>

        </div>

      </div>


      {/* ======================================================
          PIPELINE + LIVE ALERTS
      ======================================================= */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">


        {/* PIPELINE */}

        <div className="lg:col-span-2 bg-cardBg p-6 rounded-xl border border-gray-800">

          <div className="flex justify-between">

            <div>

              <h2 className="text-2xl font-bold">
                Pipeline Network
              </h2>

              <p className="text-gray-500 mt-1">
                Live zone condition map
              </p>

            </div>

            <span className="text-gray-500">
              {zones.length} monitored zones
            </span>

          </div>


          <div className="relative h-80 mt-6 bg-gray-950/40 rounded-xl border border-gray-800 overflow-hidden">


            {/* HORIZONTAL PIPE */}

            <div
              className="
                absolute
                left-[15%]
                right-[15%]
                top-1/2
                h-1
                bg-gray-700
              "
            />


            {/* VERTICAL PIPE */}

            <div
              className="
                absolute
                top-[25%]
                bottom-[25%]
                left-1/2
                w-1
                bg-gray-700
              "
            />


            {/* ZONES */}

            {zones.slice(0, 6).map(
              (zone, index) => {

                const condition =
                  getCondition(zone);

                const problem =
                  isProblemZone(zone);


                const positions = [
                  {
                    left: '25%',
                    top: '35%',
                  },
                  {
                    left: '65%',
                    top: '35%',
                  },
                  {
                    left: '40%',
                    top: '65%',
                  },
                  {
                    left: '75%',
                    top: '65%',
                  },
                  {
                    left: '50%',
                    top: '20%',
                  },
                  {
                    left: '20%',
                    top: '70%',
                  },
                ];


                const position =
                  positions[index];


                if (!position) {
                  return null;
                }


                return (

                  <div
                    key={zone.zone}
                    className="absolute"
                    style={{
                      left:
                        position.left,
                      top:
                        position.top,
                    }}
                  >

                    <div
                      className={`
                        w-4 h-4
                        rounded-full
                        mb-2
                        ${
                          problem
                            ? 'bg-red-500'
                            : 'bg-accentTeal'
                        }
                      `}
                    />


                    <div className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2">

                      <p className="font-semibold">
                        {zone.zone}
                      </p>

                      <p
                        className={`
                          text-xs
                          ${getStatusClass(
                            condition
                          )}
                        `}
                      >
                        {condition}
                      </p>

                    </div>

                  </div>

                );

              }
            )}

          </div>

        </div>


        {/* LIVE ALERTS */}

        <div className="bg-cardBg p-6 rounded-xl border border-gray-800">

          <div className="flex justify-between">

            <h2 className="text-2xl font-bold">
              Live Alerts
            </h2>

            <span className="text-gray-500">
              Live
            </span>

          </div>


          <div className="mt-5 space-y-4">

            {problemZones.length === 0 ? (

              <div className="text-gray-500">
                No active alerts.
              </div>

            ) : (

              problemZones.map(
                (zone) => {

                  const condition =
                    getCondition(zone);

                  const risk =
                    numberValue(
                      zone?.risk?.score
                    );

                  const priority =
                    getPriority(zone);


                  return (

                    <div
                      key={zone.zone}
                      className="pb-4 border-b border-gray-800"
                    >

                      <div className="flex gap-3">

                        <span
                          className={
                            condition === 'LEAK'
                              ? 'text-red-400'
                              : 'text-yellow-400'
                          }
                        >
                          ●
                        </span>


                        <div>

                          <p className="font-semibold">

                            {condition}

                            {' — '}

                            {zone.zone}

                          </p>


                          <p className="text-sm text-gray-500 mt-1">

                            Risk {risk}/100

                            {priority &&
                              ` · ${priority.priority}`}

                          </p>


                          <p className="text-xs text-gray-600 mt-2">

                            {zone?.condition?.reason ||
                              zone?.leak?.reason ||
                              'Attention required'}

                          </p>

                        </div>

                      </div>

                    </div>

                  );

                }
              )

            )}

          </div>

        </div>

      </div>


      {/* ======================================================
          ZONE STATUS
      ======================================================= */}

      <div className="bg-cardBg p-6 rounded-xl border border-gray-800">

        <div className="flex justify-between">

          <div>

            <h2 className="text-2xl font-bold">
              Zone Status
            </h2>

            <p className="text-gray-500 mt-1">
              Current condition of every monitored zone
            </p>

          </div>

          <span className="text-gray-500">

            Updated{' '}

            {lastUpdated
              ? lastUpdated.toLocaleTimeString()
              : '--'}

          </span>

        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">

          {zones.map(
            (zone) => {

              const condition =
                getCondition(zone);

              const values =
                getSensorValues(zone);


              return (

                <div
                  key={zone.zone}
                  className={`
                    p-5
                    rounded-xl
                    border
                    ${getStatusBg(
                      condition
                    )}
                  `}
                >

                  <div className="flex justify-between items-center">

                    <p className="text-lg font-semibold">
                      {zone.zone}
                    </p>

                    <span
                      className={`
                        text-xs
                        px-3 py-1
                        rounded-full
                        ${getStatusClass(
                          condition
                        )}
                        bg-gray-900/50
                      `}
                    >
                      {condition}
                    </span>

                  </div>


                  <p className="text-sm text-gray-500 mt-2">
                    {zone.device_id}
                  </p>


                  <div className="space-y-2 mt-5 text-sm">

                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        Pressure
                      </span>

                      <span>
                        {values.pressure} bar
                      </span>
                    </div>


                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        Flow
                      </span>

                      <span>
                        {values.flow} L/min
                      </span>
                    </div>


                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        Acoustic
                      </span>

                      <span>
                        {values.acoustic}
                      </span>
                    </div>


                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        pH
                      </span>

                      <span>
                        {values.ph}
                      </span>
                    </div>


                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        TDS
                      </span>

                      <span>
                        {values.tds} mg/L
                      </span>
                    </div>


                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        Turbidity
                      </span>

                      <span>
                        {values.turbidity} NTU
                      </span>
                    </div>

                  </div>

                </div>

              );

            }
          )}

        </div>

      </div>


      {/* ======================================================
          SENSOR TRENDS
      ======================================================= */}

      <div className="bg-cardBg p-6 rounded-xl border border-gray-800">

        <div className="flex justify-between items-center">

          <div>

            <h2 className="text-2xl font-bold">
              Sensor Trends
            </h2>

            <p className="text-gray-500 mt-1">
              Continuous telemetry · {graphZoneName}
            </p>

          </div>

          <span className="text-gray-500">
            Last 60 readings
          </span>

        </div>


        {/* ZONE SELECTOR */}

        <div className="flex flex-wrap gap-2 mt-5 mb-6">

          {['Zone_A', 'Zone_B', 'Zone_C', 'Zone_D'].map(
            (zoneName) => (

              <button
                key={zoneName}
                type="button"
                onClick={() => setSelectedGraphZone(zoneName)}
                className={`
                  px-4 py-2
                  rounded-lg
                  border
                  text-sm
                  font-semibold
                  transition
                  ${
                    selectedGraphZone === zoneName
                      ? 'bg-accentTeal/15 border-accentTeal/50 text-accentTeal'
                      : 'bg-gray-900/30 border-gray-800 text-gray-400 hover:text-gray-200 hover:border-gray-600'
                  }
                `}
              >
                {zoneName}
              </button>

            )
          )}

        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">


          {/* ==================================================
              PRESSURE
          =================================================== */}

          <div className="bg-gray-950/20 border border-gray-800 rounded-xl p-4">

            <div className="mb-3">

              <p className="text-gray-400">
                Pressure
              </p>

              <p className="text-2xl font-bold text-blue-400">

                {graphZone
                  ? getSensorValues(
                      graphZone
                    ).pressure
                  : '--'}

                <span className="text-sm text-gray-500 ml-1">
                  bar
                </span>

              </p>

            </div>


            <div className="h-56">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <LineChart
                  data={historyData}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1f2937"
                  />

                  <XAxis
                    dataKey="timestamp"
                    type="number"
                    domain={[
                      'dataMin',
                      'dataMax',
                    ]}
                    tickFormatter={(value) =>
                      new Date(
                        value
                      ).toLocaleTimeString(
                        [],
                        {
                          minute: '2-digit',
                          second: '2-digit',
                        }
                      )
                    }
                    stroke="#6B7280"
                    tick={{ fontSize: 11 }}
                  />

                  <YAxis
                    stroke="#6B7280"
                    tick={{ fontSize: 11 }}
                    domain={[
                      'auto',
                      'auto',
                    ]}
                  />

                  <Tooltip
                    content={
                      <ChartTooltip />
                    }
                  />

                  <Line
                    type="monotone"
                    dataKey="pressure"
                    stroke="#1A8CFF"
                    strokeWidth={2}
                    dot={false}
                    name="Pressure (bar)"
                    isAnimationActive={false}
                  />

                </LineChart>

              </ResponsiveContainer>

            </div>

          </div>


          {/* ==================================================
              FLOW
          =================================================== */}

          <div className="bg-gray-950/20 border border-gray-800 rounded-xl p-4">

            <div className="mb-3">

              <p className="text-gray-400">
                Flow Rate
              </p>

              <p className="text-2xl font-bold text-teal-400">

                {graphZone
                  ? getSensorValues(
                      graphZone
                    ).flow
                  : '--'}

                <span className="text-sm text-gray-500 ml-1">
                  L/min
                </span>

              </p>

            </div>


            <div className="h-56">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <LineChart
                  data={historyData}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1f2937"
                  />

                  <XAxis
                    dataKey="timestamp"
                    type="number"
                    domain={[
                      'dataMin',
                      'dataMax',
                    ]}
                    tickFormatter={(value) =>
                      new Date(
                        value
                      ).toLocaleTimeString(
                        [],
                        {
                          minute: '2-digit',
                          second: '2-digit',
                        }
                      )
                    }
                    stroke="#6B7280"
                    tick={{ fontSize: 11 }}
                  />

                  <YAxis
                    stroke="#6B7280"
                    tick={{ fontSize: 11 }}
                    domain={[
                      'auto',
                      'auto',
                    ]}
                  />

                  <Tooltip
                    content={
                      <ChartTooltip />
                    }
                  />

                  <Line
                    type="monotone"
                    dataKey="flow"
                    stroke="#00D2C8"
                    strokeWidth={2}
                    dot={false}
                    name="Flow (L/min)"
                    isAnimationActive={false}
                  />

                </LineChart>

              </ResponsiveContainer>

            </div>

          </div>


          {/* ==================================================
              TURBIDITY
          =================================================== */}

          <div className="bg-gray-950/20 border border-gray-800 rounded-xl p-4">

            <div className="mb-3">

              <p className="text-gray-400">
                Turbidity
              </p>

              <p className="text-2xl font-bold text-yellow-400">

                {graphZone
                  ? getSensorValues(
                      graphZone
                    ).turbidity
                  : '--'}

                <span className="text-sm text-gray-500 ml-1">
                  NTU
                </span>

              </p>

            </div>


            <div className="h-56">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <LineChart
                  data={historyData}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1f2937"
                  />

                  <XAxis
                    dataKey="timestamp"
                    type="number"
                    domain={[
                      'dataMin',
                      'dataMax',
                    ]}
                    tickFormatter={(value) =>
                      new Date(
                        value
                      ).toLocaleTimeString(
                        [],
                        {
                          minute: '2-digit',
                          second: '2-digit',
                        }
                      )
                    }
                    stroke="#6B7280"
                    tick={{ fontSize: 11 }}
                  />

                  <YAxis
                    stroke="#6B7280"
                    tick={{ fontSize: 11 }}
                    domain={[
                      'auto',
                      'auto',
                    ]}
                  />

                  <Tooltip
                    content={
                      <ChartTooltip />
                    }
                  />

                  <Line
                    type="monotone"
                    dataKey="turbidity"
                    stroke="#FFA500"
                    strokeWidth={2}
                    dot={false}
                    name="Turbidity (NTU)"
                    isAnimationActive={false}
                  />

                </LineChart>

              </ResponsiveContainer>

            </div>

          </div>

        </div>

      </div>


      {/* ======================================================
          NETWORK PRIORITY
      ======================================================= */}

      <div className="bg-cardBg p-6 rounded-xl border border-gray-800">

        <h2 className="text-2xl font-bold">
          Network Priority
        </h2>

        <p className="text-gray-500 mt-1">
          Only zones requiring attention are shown
        </p>


        <div className="space-y-3 mt-6">

          {problemZones.length === 0 ? (

            <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/20 text-gray-500">

              All monitored zones are operating normally.

            </div>

          ) : (

            problemZones.map(
              (zone) => {

                const condition =
                  getCondition(zone);

                const risk =
                  numberValue(
                    zone?.risk?.score
                  );

                const priority =
                  getPriority(zone);

                const priorityScore =
                  numberValue(
                    priority?.score
                  );

                const locationScore =
                  numberValue(
                    priority?.location_score
                  );


                return (

                  <div
                    key={zone.zone}
                    className="p-5 rounded-xl border border-gray-800 bg-gray-900/20"
                  >

                    <div className="flex items-center justify-between">


                      {/* LEFT */}

                      <div className="flex items-center gap-5">

                        <span
                          className={`
                            px-4 py-2
                            rounded-full
                            font-bold
                            ${getPriorityClass(
                              priority?.priority
                            )}
                          `}
                        >
                          {priority?.priority}
                        </span>


                        <div>

                          <p className="text-xl font-semibold">
                            {zone.zone}
                          </p>

                          <p
                            className={`
                              text-sm
                              ${getStatusClass(
                                condition
                              )}
                            `}
                          >
                            {condition}
                          </p>

                          <p className="text-xs text-gray-500 mt-1">
                            {zone.device_id}
                          </p>

                        </div>

                      </div>


                      {/* RIGHT */}

                      <div className="text-right">

                        <p
                          className={`
                            text-2xl font-bold
                            ${
                              priorityScore >= 70
                                ? 'text-red-400'
                                : priorityScore >= 40
                                ? 'text-yellow-400'
                                : 'text-accentTeal'
                            }
                          `}
                        >
                          {priorityScore}/100
                        </p>

                        <p className="text-sm text-gray-500">
                          Priority Score
                        </p>

                      </div>

                    </div>


                    {/* PRIORITY FACTORS */}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-4 border-t border-gray-800">


                      <div>

                        <p className="text-xs text-gray-500">
                          Sensor / WRS Risk
                        </p>

                        <p className="font-semibold">
                          {risk}/100
                        </p>

                      </div>


                      <div>

                        <p className="text-xs text-gray-500">
                          Location Score
                        </p>

                        <p className="font-semibold">
                          {locationScore}
                        </p>

                      </div>


                      <div>

                        <p className="text-xs text-gray-500">
                          Population
                        </p>

                        <p className="font-semibold">
                          {numberValue(
                            zone?.population
                          ).toLocaleString()}
                        </p>

                      </div>


                      <div>

                        <p className="text-xs text-gray-500">
                          Critical Area
                        </p>

                        <p className="font-semibold">
                          {zone?.critical_area
                            ? 'YES'
                            : 'NO'}
                        </p>

                      </div>


                    </div>

                  </div>

                );

              }
            )

          )}

        </div>

      </div>


    </div>

  );

}