import React, { useEffect, useMemo, useState } from 'react';

import {
  Activity,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Droplets,
  Radio,
  TrendingDown,
} from 'lucide-react';

import { fetchLatestAnalytics } from '../api';


// ============================================================
// HELPERS
// ============================================================

const numberValue = (value, fallback = 0) => {
  const n = Number(value);

  return Number.isFinite(n)
    ? n
    : fallback;
};


const normalizeZones = (response) => {

  if (!response) {
    return [];
  }

  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response.zones)) {
    return response.zones;
  }

  return [];
};


const getCondition = (zone) => {

  return (
    zone?.condition?.condition ||
    zone?.stage ||
    'NORMAL'
  );
};


const getRisk = (zone) => {

  return numberValue(
    zone?.risk?.score,
    0
  );
};


const getSensorHealth = (zone) => {

  return numberValue(
    zone?.sensor_health?.overall_score,
    100
  );
};


const getQualityPenalty = (zone) => {

  const quality =
    zone?.water_quality;

  if (!quality) {
    return 0;
  }

  if (quality.status === 'Poor') {

    const issues =
      Array.isArray(
        quality.issues
      )
        ? quality.issues.length
        : 1;

    return Math.min(
      25,
      issues * 10
    );
  }

  if (quality.status === 'Fair') {
    return 6;
  }

  return 0;
};


// ============================================================
// PROBLEM ZONE
// ============================================================

const isProblem = (zone) => {

  const condition =
    getCondition(zone);

  const risk =
    getRisk(zone);

  const sensorHealth =
    getSensorHealth(zone);

  const leakDetected =
    zone?.leak?.leak_detected === true;

  const poorQuality =
    zone?.water_quality?.status === 'Poor';


  return (
    condition !== 'NORMAL' ||
    risk >= 30 ||
    sensorHealth < 90 ||
    leakDetected ||
    poorQuality
  );
};


// ============================================================
// SEVERITY
//
// IMPORTANT:
// Higher health score = better network
//
// 80-100 HEALTHY
// 60-79 WATCH
// 35-59 HIGH RISK
// 0-34 CRITICAL
// ============================================================

const getSeverity = (score) => {

  if (score <= 34) {

    return {
      label: 'CRITICAL',

      description:
        'Immediate network attention required',

      icon: ShieldAlert,

      className:
        'text-red-400',

      badge:
        'bg-red-500/10 border-red-500/30',

      bar:
        'bg-red-500',
    };
  }


  if (score <= 59) {

    return {
      label: 'HIGH RISK',

      description:
        'Network conditions require attention',

      icon: AlertTriangle,

      className:
        'text-orange-400',

      badge:
        'bg-orange-500/10 border-orange-500/30',

      bar:
        'bg-orange-400',
    };
  }


  if (score <= 79) {

    return {
      label: 'WATCH',

      description:
        'Early anomalies detected',

      icon: TrendingDown,

      className:
        'text-yellow-400',

      badge:
        'bg-yellow-500/10 border-yellow-500/30',

      bar:
        'bg-yellow-400',
    };
  }


  return {

    label: 'HEALTHY',

    description:
      'Network operating within normal conditions',

    icon: ShieldCheck,

    className:
      'text-accentTeal',

    badge:
      'bg-accentTeal/10 border-accentTeal/30',

    bar:
      'bg-accentTeal',
  };
};


// ============================================================
// NETWORK HEALTH
// ============================================================

const calculateNetworkHealth = (zones) => {

  if (!zones.length) {

    return {
      score: 0,
      activeAlerts: 0,
      highestRisk: 0,
      dominantZone: null,
    };
  }


  const problemZones =
    zones.filter(isProblem);


  const highestRisk =
    zones.reduce(
      (highest, zone) =>
        Math.max(
          highest,
          getRisk(zone)
        ),
      0
    );


  // ----------------------------------------------------------
  // FIND THE MOST IMPORTANT PROBLEM
  //
  // NORMAL zones are NEVER selected as the dominant incident.
  // ----------------------------------------------------------

  const dominantZone =
    [...problemZones].sort(
      (a, b) => {

        const riskDifference =
          getRisk(b) -
          getRisk(a);

        if (
          riskDifference !== 0
        ) {
          return riskDifference;
        }


        const sensorDifference =
          getSensorHealth(a) -
          getSensorHealth(b);

        if (
          sensorDifference !== 0
        ) {
          return sensorDifference;
        }


        return (
          getQualityPenalty(b) -
          getQualityPenalty(a)
        );
      }
    )[0] || null;


  // ==========================================================
  // HEALTH SCORE
  //
  // Start at 100.
  //
  // Penalize:
  // - meaningful risk
  // - active incidents
  // - sensor degradation
  // - water quality problems
  // ==========================================================

  let penalty = 0;


  // ----------------------------------------------------------
  // RISK
  //
  // Small risk values have only a small effect.
  // ----------------------------------------------------------

  if (highestRisk > 20) {

    penalty += Math.min(
      45,
      (highestRisk - 20) * 0.55
    );
  }


  // ----------------------------------------------------------
  // ACTIVE PROBLEMS
  // ----------------------------------------------------------

  problemZones.forEach(
    (zone) => {

      const condition =
        getCondition(zone);


      if (condition === 'LEAK') {

        penalty += 22;

      } else if (
        condition === 'CRITICAL'
      ) {

        penalty += 25;

      } else if (
        condition === 'SENSOR_FAULT'
      ) {

        penalty += 15;

      } else if (
        condition === 'WATER_QUALITY'
      ) {

        penalty += 12;

      } else if (
        condition === 'EARLY_ANOMALY'
      ) {

        penalty += 7;

      }
    }
  );


  // ----------------------------------------------------------
  // SENSOR HEALTH
  // ----------------------------------------------------------

  const averageSensorHealth =
    zones.reduce(
      (sum, zone) =>
        sum +
        getSensorHealth(zone),
      0
    ) / zones.length;


  if (
    averageSensorHealth < 90
  ) {

    penalty += Math.min(
      15,
      (90 -
        averageSensorHealth) *
        0.75
    );
  }


  // ----------------------------------------------------------
  // WATER QUALITY
  // ----------------------------------------------------------

  const qualityPenalty =
    zones.reduce(
      (sum, zone) =>
        sum +
        getQualityPenalty(zone),
      0
    ) / zones.length;


  penalty +=
    qualityPenalty;


  // ----------------------------------------------------------
  // FINAL SCORE
  // ----------------------------------------------------------

  const score =
    Math.round(
      Math.max(
        0,
        Math.min(
          100,
          100 - penalty
        )
      )
    );


  return {

    score,

    activeAlerts:
      problemZones.length,

    highestRisk,

    dominantZone,
  };
};


// ============================================================
// COMPONENT
// ============================================================

export default function NetworkHealth() {

  const [
    analytics,
    setAnalytics,
  ] = useState(null);


  const [
    connected,
    setConnected,
  ] = useState(false);


  // ==========================================================
  // LIVE DATA
  // ==========================================================

  useEffect(() => {

    let mounted = true;


    const loadData =
      async () => {

        try {

          const response =
            await fetchLatestAnalytics();


          if (!mounted) {
            return;
          }


          setAnalytics(
            response
          );


          setConnected(
            true
          );

        } catch (error) {

          console.error(
            'Network health error:',
            error
          );


          if (mounted) {

            setConnected(
              false
            );
          }
        }
      };


    loadData();


    const interval =
      setInterval(
        loadData,
        3000
      );


    return () => {

      mounted = false;

      clearInterval(
        interval
      );
    };

  }, []);


  // ==========================================================
  // DATA
  // ==========================================================

  const zones =
    normalizeZones(
      analytics
    );


  const network =
    useMemo(
      () =>
        calculateNetworkHealth(
          zones
        ),
      [zones]
    );


  const severity =
    getSeverity(
      network.score
    );


  const SeverityIcon =
    severity.icon;


  const dominantZone =
    network.dominantZone;


  const dominantCondition =
    dominantZone
      ? getCondition(
          dominantZone
        )
      : 'NORMAL';


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div className="px-6 pt-6">

      <div
        className="
          bg-cardBg
          border
          border-gray-800
          rounded-2xl
          overflow-hidden
          shadow-lg
        "
      >

        {/* ==================================================
            HEADER
        =================================================== */}

        <div
          className="
            flex
            flex-col
            lg:flex-row
            lg:items-center
            lg:justify-between
            gap-4
            px-6
            py-4
            border-b
            border-gray-800
          "
        >

          <div
            className="
              flex
              items-center
              gap-3
            "
          >

            <div
              className="
                w-10
                h-10
                rounded-xl
                bg-accentTeal/10
                border
                border-accentTeal/20
                flex
                items-center
                justify-center
              "
            >

              <Activity
                className="
                  w-5
                  h-5
                  text-accentTeal
                "
              />

            </div>


            <div>

              <div
                className="
                  flex
                  items-center
                  gap-2
                "
              >

                <h2
                  className="
                    font-bold
                    text-lg
                  "
                >
                  Network Intelligence
                </h2>


                <span
                  className="
                    text-[10px]
                    uppercase
                    tracking-widest
                    text-gray-500
                  "
                >
                  Live
                </span>

              </div>


              <p
                className="
                  text-xs
                  text-gray-500
                  mt-0.5
                "
              >
                Continuous network health assessment
              </p>

            </div>

          </div>


          <div
            className="
              flex
              items-center
              gap-2
              text-xs
            "
          >

            <span
              className={`
                w-2
                h-2
                rounded-full
                ${
                  connected
                    ? 'bg-accentTeal animate-pulse'
                    : 'bg-red-500'
                }
              `}
            />


            <span
              className={
                connected
                  ? 'text-gray-400'
                  : 'text-red-400'
              }
            >
              {connected
                ? 'Telemetry connected'
                : 'Telemetry unavailable'}
            </span>

          </div>

        </div>


        {/* ==================================================
            BODY
        =================================================== */}

        <div
          className="
            grid
            grid-cols-1
            lg:grid-cols-12
            gap-0
          "
        >

          {/* ==================================================
              HEALTH SCORE
          =================================================== */}

          <div
            className="
              lg:col-span-4
              p-6
              border-b
              lg:border-b-0
              lg:border-r
              border-gray-800
            "
          >

            <div
              className="
                flex
                items-start
                justify-between
              "
            >

              <div>

                <p
                  className="
                    text-xs
                    uppercase
                    tracking-widest
                    text-gray-500
                  "
                >
                  Network Health
                </p>


                <div
                  className="
                    flex
                    items-baseline
                    gap-2
                    mt-2
                  "
                >

                  <span
                    className={`
                      text-5xl
                      font-bold
                      tracking-tight
                      ${severity.className}
                    `}
                  >
                    {network.score}
                  </span>


                  <span
                    className="
                      text-gray-600
                      text-sm
                    "
                  >
                    /100
                  </span>

                </div>

              </div>


              <div
                className={`
                  px-3
                  py-1.5
                  rounded-full
                  border
                  text-xs
                  font-semibold
                  ${severity.badge}
                  ${severity.className}
                `}
              >
                {severity.label}
              </div>

            </div>


            {/* SCORE BAR */}

            <div
              className="
                h-2
                bg-gray-800
                rounded-full
                mt-5
                overflow-hidden
              "
            >

              <div
                className={`
                  h-full
                  rounded-full
                  transition-all
                  duration-700
                  ${severity.bar}
                `}
                style={{
                  width:
                    `${network.score}%`,
                }}
              />

            </div>


            <div
              className="
                flex
                justify-between
                mt-2
                text-[11px]
                text-gray-600
              "
            >

              <span>
                0
              </span>

              <span>
                50
              </span>

              <span>
                100
              </span>

            </div>


            <p
              className="
                text-sm
                text-gray-400
                mt-4
              "
            >
              {severity.description}
            </p>

          </div>


          {/* ==================================================
              SNAPSHOT
          =================================================== */}

          <div
            className="
              lg:col-span-4
              p-6
              border-b
              lg:border-b-0
              lg:border-r
              border-gray-800
            "
          >

            <p
              className="
                text-xs
                uppercase
                tracking-widest
                text-gray-500
              "
            >
              Network Snapshot
            </p>


            <div
              className="
                grid
                grid-cols-2
                gap-4
                mt-4
              "
            >

              <div
                className="
                  bg-gray-950/30
                  rounded-xl
                  p-4
                  border
                  border-gray-800
                "
              >

                <div
                  className="
                    flex
                    items-center
                    gap-2
                    text-gray-500
                    text-xs
                  "
                >

                  <Radio
                    className="w-4 h-4"
                  />

                  Zones

                </div>


                <p
                  className="
                    text-2xl
                    font-bold
                    mt-2
                  "
                >
                  {zones.length}
                </p>


                <p
                  className="
                    text-[11px]
                    text-gray-600
                    mt-1
                  "
                >
                  monitored
                </p>

              </div>


              <div
                className="
                  bg-gray-950/30
                  rounded-xl
                  p-4
                  border
                  border-gray-800
                "
              >

                <div
                  className="
                    flex
                    items-center
                    gap-2
                    text-gray-500
                    text-xs
                  "
                >

                  <AlertTriangle
                    className="w-4 h-4"
                  />

                  Alerts

                </div>


                <p
                  className={`
                    text-2xl
                    font-bold
                    mt-2
                    ${
                      network.activeAlerts > 0
                        ? 'text-red-400'
                        : 'text-accentTeal'
                    }
                  `}
                >
                  {network.activeAlerts}
                </p>


                <p
                  className="
                    text-[11px]
                    text-gray-600
                    mt-1
                  "
                >
                  requiring attention
                </p>

              </div>

            </div>

          </div>


          {/* ==================================================
              DOMINANT CONDITION
          =================================================== */}

          <div
            className="
              lg:col-span-4
              p-6
            "
          >

            <p
              className="
                text-xs
                uppercase
                tracking-widest
                text-gray-500
              "
            >
              Dominant Network Condition
            </p>


            {dominantZone ? (

              <div
                className="
                  mt-4
                  flex
                  items-start
                  gap-4
                "
              >

                <div
                  className={`
                    w-11
                    h-11
                    rounded-xl
                    flex
                    items-center
                    justify-center
                    border
                    ${severity.badge}
                  `}
                >

                  <SeverityIcon
                    className={`
                      w-5
                      h-5
                      ${severity.className}
                    `}
                  />

                </div>


                <div>

                  <p
                    className="
                      text-xl
                      font-bold
                    "
                  >
                    {dominantZone.zone ||
                      'Unknown Zone'}
                  </p>


                  <p
                    className={`
                      text-sm
                      font-semibold
                      mt-1
                      ${severity.className}
                    `}
                  >
                    {dominantCondition}
                  </p>


                  <p
                    className="
                      text-xs
                      text-gray-500
                      mt-2
                    "
                  >
                    Risk{' '}
                    {Math.round(
                      getRisk(
                        dominantZone
                      )
                    )}
                    /100
                    {' · '}
                    Sensor health{' '}
                    {Math.round(
                      getSensorHealth(
                        dominantZone
                      )
                    )}%
                  </p>

                </div>

              </div>

            ) : (

              <div
                className="
                  mt-4
                  flex
                  items-center
                  gap-3
                "
              >

                <div
                  className="
                    w-11
                    h-11
                    rounded-xl
                    bg-accentTeal/10
                    border
                    border-accentTeal/20
                    flex
                    items-center
                    justify-center
                  "
                >

                  <ShieldCheck
                    className="
                      w-5
                      h-5
                      text-accentTeal
                    "
                  />

                </div>


                <div>

                  <p
                    className="
                      font-semibold
                      text-accentTeal
                    "
                  >
                    All systems normal
                  </p>


                  <p
                    className="
                      text-xs
                      text-gray-500
                      mt-1
                    "
                  >
                    No active network incident
                  </p>

                </div>

              </div>

            )}


            <div
              className="
                flex
                items-center
                gap-2
                mt-5
                text-xs
                text-gray-600
              "
            >

              <Droplets
                className="
                  w-3.5
                  h-3.5
                "
              />

              <span>
                Derived from live telemetry and network analytics
              </span>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}