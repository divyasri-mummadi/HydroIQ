import React, { useEffect, useState } from 'react';
import { fetchLatestAnalytics } from '../api';

export default function ExplainableAI() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);

  const getAnalysis = async () => {
    try {
      const data = await fetchLatestAnalytics();

      if (data && data.zones) {
        setZones(data.zones);
      }
    } catch (error) {
      console.error('Analytics error:', error);
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
      <div className="bg-cardBg p-5 rounded-xl border border-gray-800">
        <p className="text-gray-400">
          Analyzing network...
        </p>
      </div>
    );
  }

  if (!zones.length) {
    return (
      <div className="bg-cardBg p-5 rounded-xl border border-gray-800">
        <p className="text-warningOrange">
          Unable to retrieve analysis.
        </p>
      </div>
    );
  }

  // Highest priority zone is already first
  const priorityOrder = {
  P1: 1,
  P2: 2,
  P3: 3,
  P4: 4,
  P5: 5
};

const sortedZones = [...zones].sort(
  (a, b) =>
    (priorityOrder[a.priority?.priority] || 5) -
    (priorityOrder[b.priority?.priority] || 5)
);

const highestPriority = sortedZones[0];

  const priority = highestPriority.priority || {};
  const condition = highestPriority.condition || {};
  const risk = highestPriority.risk || {};

  const affectedZones = zones.filter(
    zone =>
      zone.condition?.condition !== 'NORMAL'
  );

  const priorityClass = (priorityValue) => {
    if (priorityValue === 'P1') {
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    }

    if (priorityValue === 'P2') {
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    }

    if (priorityValue === 'P3') {
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }

    if (priorityValue === 'P4') {
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }

    return 'bg-accentTeal/20 text-accentTeal border-accentTeal/30';
  };

  const conditionClass = (conditionValue) => {
    if (
      conditionValue === 'LEAK' ||
      conditionValue === 'CRITICAL'
    ) {
      return 'text-red-400';
    }

    if (
      conditionValue === 'SENSOR_FAULT' ||
      conditionValue === 'WATER_QUALITY'
    ) {
      return 'text-orange-400';
    }

    if (conditionValue === 'EARLY_ANOMALY') {
      return 'text-yellow-400';
    }

    return 'text-accentTeal';
  };

  const getAction = (zone) => {
    const condition = zone.condition?.condition;

    if (condition === 'LEAK') {
      return 'Inspect and isolate the affected zone immediately.';
    }

    if (condition === 'SENSOR_FAULT') {
      return 'Inspect or recalibrate the faulty sensor.';
    }

    if (condition === 'WATER_QUALITY') {
      return 'Inspect water-quality parameters in this zone.';
    }

    if (condition === 'EARLY_ANOMALY') {
      return 'Continue monitoring for further deterioration.';
    }

    return 'Continue normal monitoring.';
  };

  return (
    <div className="bg-cardBg p-5 rounded-xl border border-gray-800">

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="flex justify-between items-center mb-6">

        <div>
          <h3 className="text-lg font-semibold">
            🤖 HydroIQ Intelligence
          </h3>

          <p className="text-xs text-gray-500 mt-1">
            Explainable multi-zone network analysis
          </p>
        </div>

        <div className="text-right">

          <span
            className={`font-bold ${conditionClass(
              condition.condition
            )}`}
          >
            {condition.condition || 'UNKNOWN'}
          </span>

          <p className="text-xs mt-1 text-gray-400">
            Highest Priority: {priority.priority || '--'}
          </p>

        </div>

      </div>


      {/* ================================================= */}
      {/* NETWORK SUMMARY */}
      {/* ================================================= */}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

        {/* Monitored Zones */}

        <div className="bg-gray-900/40 p-4 rounded-lg">

          <p className="text-sm text-gray-400">
            Monitored Zones
          </p>

          <p className="text-3xl font-bold mt-2 text-white">
            {zones.length}
          </p>

          <p className="text-xs text-gray-500 mt-2">
            Active sensor nodes
          </p>

        </div>


        {/* Active Alerts */}

        <div className="bg-gray-900/40 p-4 rounded-lg">

          <p className="text-sm text-gray-400">
            Active Alerts
          </p>

          <p
            className={`text-3xl font-bold mt-2 ${
              affectedZones.length > 0
                ? 'text-red-400'
                : 'text-accentTeal'
            }`}
          >
            {affectedZones.length}
          </p>

          <p className="text-xs text-gray-500 mt-2">
            Zones requiring attention
          </p>

        </div>


        {/* Affected Zone */}

        <div className="bg-gray-900/40 p-4 rounded-lg">

          <p className="text-sm text-gray-400">
            Highest Priority Zone
          </p>

          <p
            className={`text-xl font-bold mt-2 ${conditionClass(
              condition.condition
            )}`}
          >
            {highestPriority.zone || 'None'}
          </p>

          <p className="text-xs text-gray-500 mt-2">
            {condition.condition || 'NORMAL'}
          </p>

        </div>


        {/* Network Risk */}

        <div className="bg-gray-900/40 p-4 rounded-lg">

          <p className="text-sm text-gray-400">
            Highest Risk
          </p>

          <p className="text-3xl font-bold mt-2 text-red-400">
            {risk.score ?? 0}
            <span className="text-sm text-gray-500">
              /100
            </span>
          </p>

          <p className="text-xs text-gray-500 mt-2">
            {risk.level || 'Low'} risk
          </p>

        </div>

      </div>


      {/* ================================================= */}
      {/* PRIORITY QUEUE */}
      {/* ================================================= */}

      <div className="mt-6">

        <div className="flex justify-between items-center mb-3">

          <h4 className="font-semibold">
            🚦 Zone Priority Queue
          </h4>

          <span className="text-xs text-gray-500">
            Highest priority first
          </span>

        </div>


        <div className="space-y-3">

          {sortedZones.map((zone, index) => {

            const zonePriority =
              zone.priority || {};

            const zoneCondition =
              zone.condition || {};

            const zoneRisk =
              zone.risk || {};

            return (
              <div
                key={zone.zone || index}
                className="bg-gray-900/40 p-4 rounded-lg border border-gray-800"
              >

                <div className="flex justify-between items-center">

                  <div className="flex items-center gap-3">

                    <span
                      className={`px-3 py-1 rounded-full border text-xs font-bold ${priorityClass(
                        zonePriority.priority
                      )}`}
                    >
                      {zonePriority.priority || 'P5'}
                    </span>

                    <div>

                      <p className="font-semibold">
                        {zone.zone}
                      </p>

                      <p className="text-xs text-gray-500">
                        {zone.device_id}
                      </p>

                    </div>

                  </div>


                  <div className="text-right">

                    <p
                      className={`font-semibold ${conditionClass(
                        zoneCondition.condition
                      )}`}
                    >
                      {zoneCondition.condition}
                    </p>

                    <p className="text-xs text-gray-500">
                      Risk: {zoneRisk.score ?? 0}/100
                    </p>

                  </div>

                </div>


                {/* Sensor values */}

                <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mt-4">

                  <div>
                    <p className="text-xs text-gray-500">
                      Pressure
                    </p>

                    <p className="text-sm font-semibold">
                      {zone.sensor_data?.pressure} bar
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Flow
                    </p>

                    <p className="text-sm font-semibold">
                      {zone.sensor_data?.flow} L/min
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Acoustic
                    </p>

                    <p className="text-sm font-semibold">
                      {zone.sensor_data?.acoustic}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      pH
                    </p>

                    <p className="text-sm font-semibold">
                      {zone.sensor_data?.ph}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      TDS
                    </p>

                    <p className="text-sm font-semibold">
                      {zone.sensor_data?.tds}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Turbidity
                    </p>

                    <p className="text-sm font-semibold">
                      {zone.sensor_data?.turbidity} NTU
                    </p>
                  </div>

                </div>


                {/* Explanation */}

                {zoneCondition.reason && (
                  <div className="mt-4">

                    <p className="text-xs text-gray-500">
                      Why HydroIQ?
                    </p>

                    <p className="text-sm text-gray-300 mt-1">
                      {zoneCondition.reason}
                    </p>

                  </div>
                )}


                {/* Recommended action */}

                <div className="mt-3">

                  <p className="text-xs text-gray-500">
                    Recommended Action
                  </p>

                  <p className="text-sm text-gray-300 mt-1">
                    {getAction(zone)}
                  </p>

                </div>

              </div>
            );
          })}

        </div>

      </div>

    </div>
  );
}