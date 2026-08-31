import React, { useEffect, useState } from 'react';
import { fetchLatestAnalytics } from '../api';
import {
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Activity,
  ShieldAlert
} from 'lucide-react';

export default function LeakLocalization() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);

  const getData = async () => {
    try {
      const analytics = await fetchLatestAnalytics();

      if (analytics && analytics.zones) {
        setZones(analytics.zones);
      }
    } catch (error) {
      console.error('Localization error:', error);
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
        <p className="text-gray-400">
          Analyzing network conditions...
        </p>
      </div>
    );
  }

  if (!zones.length) {
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

  // --------------------------------------------------
  // FIND MOST IMPORTANT CURRENT CONDITION
  // --------------------------------------------------

  const priority = {
    LEAK: 4,
    SENSOR_FAULT: 3,
    WATER_QUALITY: 3,
    EARLY_ANOMALY: 2,
    NORMAL: 1
  };

  const affectedZone = [...zones].sort((a, b) => {
    const aCondition =
      a.condition?.condition || a.stage || 'NORMAL';

    const bCondition =
      b.condition?.condition || b.stage || 'NORMAL';

    return (
      (priority[bCondition] || 0) -
      (priority[aCondition] || 0)
    );
  })[0];

  const condition =
    affectedZone?.condition?.condition ||
    affectedZone?.stage ||
    'NORMAL';

  const severity =
    affectedZone?.condition?.severity ||
    'LOW';

  const reason =
    affectedZone?.condition?.reason ||
    affectedZone?.leak?.reason ||
    'Network readings are within the expected operating range.';

  const confidence =
    affectedZone?.leak?.confidence != null
      ? Math.round(affectedZone.leak.confidence * 100)
      : 0;

  const riskScore =
    affectedZone?.risk?.score || 0;

  const deviceId =
    affectedZone?.device_id || 'N/A';

  const zoneName =
    affectedZone?.zone || 'N/A';

  const isLeak = condition === 'LEAK';
  const isAnomaly = condition === 'EARLY_ANOMALY';
  const isFault = condition === 'SENSOR_FAULT';
  const isQuality = condition === 'WATER_QUALITY';


  // --------------------------------------------------
  // CONDITION DISPLAY
  // --------------------------------------------------

  let conditionLabel = 'NETWORK NORMAL';
  let conditionColor = 'text-accentTeal';
  let conditionBg = 'bg-accentTeal/10';
  let conditionBorder = 'border-accentTeal/30';

  if (isLeak) {
    conditionLabel = 'LEAK DETECTED';
    conditionColor = 'text-red-400';
    conditionBg = 'bg-red-500/10';
    conditionBorder = 'border-red-500/30';
  } else if (isAnomaly) {
    conditionLabel = 'EARLY ANOMALY';
    conditionColor = 'text-warningOrange';
    conditionBg = 'bg-orange-500/10';
    conditionBorder = 'border-orange-500/30';
  } else if (isFault) {
    conditionLabel = 'SENSOR FAULT';
    conditionColor = 'text-warningOrange';
    conditionBg = 'bg-orange-500/10';
    conditionBorder = 'border-orange-500/30';
  } else if (isQuality) {
    conditionLabel = 'WATER QUALITY ALERT';
    conditionColor = 'text-warningOrange';
    conditionBg = 'bg-orange-500/10';
    conditionBorder = 'border-orange-500/30';
  }


  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}

      <div className="flex justify-between items-center">

        <div>

          <h2 className="text-2xl font-bold">
            Leak Localization
          </h2>

          <p className="text-sm text-gray-400 mt-1">
            Multi-zone network condition analysis
          </p>

        </div>

        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold border ${conditionBg} ${conditionColor} ${conditionBorder}`}
        >
          ● {conditionLabel}
        </span>

      </div>


      {/* CURRENT CONDITION */}

      <div
        className={`p-6 rounded-xl border ${conditionBg} ${conditionBorder}`}
      >

        <div className="flex items-center gap-3 mb-5">

          {isLeak ? (
            <AlertTriangle className={`w-7 h-7 ${conditionColor}`} />
          ) : isAnomaly ? (
            <Activity className={`w-7 h-7 ${conditionColor}`} />
          ) : isFault || isQuality ? (
            <ShieldAlert className={`w-7 h-7 ${conditionColor}`} />
          ) : (
            <CheckCircle2 className={`w-7 h-7 ${conditionColor}`} />
          )}

          <div>

            <p className="text-sm text-gray-400">
              Current Network Condition
            </p>

            <h3 className={`text-2xl font-bold ${conditionColor}`}>
              {conditionLabel}
            </h3>

          </div>

        </div>


        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

          {/* ZONE */}

          <div className="bg-gray-900/40 p-4 rounded-lg">

            <p className="text-sm text-gray-400">
              Zone
            </p>

            <p className={`text-xl font-bold mt-1 ${conditionColor}`}>
              {zoneName}
            </p>

          </div>


          {/* DEVICE */}

          <div className="bg-gray-900/40 p-4 rounded-lg">

            <p className="text-sm text-gray-400">
              Device
            </p>

            <p className="text-lg font-bold mt-1 font-mono">
              {deviceId}
            </p>

          </div>


          {/* SEVERITY */}

          <div className="bg-gray-900/40 p-4 rounded-lg">

            <p className="text-sm text-gray-400">
              Severity
            </p>

            <p className={`text-xl font-bold mt-1 ${conditionColor}`}>
              {severity}
            </p>

          </div>


          {/* RISK */}

          <div className="bg-gray-900/40 p-4 rounded-lg">

            <p className="text-sm text-gray-400">
              Network Risk
            </p>

            <p
              className={`text-xl font-bold mt-1 ${
                riskScore >= 70
                  ? 'text-red-400'
                  : riskScore >= 40
                  ? 'text-warningOrange'
                  : 'text-accentTeal'
              }`}
            >
              {riskScore}/100
            </p>

          </div>

        </div>

      </div>


      {/* NETWORK ZONE MAP */}

      <div className="bg-cardBg p-5 rounded-xl border border-gray-800">

        <h3 className="text-lg font-semibold mb-5">
          Network Zone Map
        </h3>

        <div className="relative bg-gray-900/50 rounded-xl p-8 min-h-[300px] overflow-hidden">

          {/* PIPELINE */}

          <div className="absolute top-1/2 left-10 right-10 h-2 bg-gray-700 rounded-full" />


          <div className="relative flex justify-between items-center h-full min-h-[220px]">

            {zones.map((zoneData) => {

              const zoneCondition =
                zoneData.condition?.condition ||
                zoneData.stage ||
                'NORMAL';

              const leak =
                zoneCondition === 'LEAK';

              const anomaly =
                zoneCondition === 'EARLY_ANOMALY';

              const warning =
                zoneCondition === 'SENSOR_FAULT' ||
                zoneCondition === 'WATER_QUALITY';

              return (

                <div
                  key={zoneData.zone}
                  className="flex flex-col items-center z-10"
                >

                  {/* NODE */}

                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center border-4 ${
                      leak
                        ? 'bg-red-500/20 border-red-400'
                        : anomaly
                        ? 'bg-orange-500/20 border-orange-400'
                        : warning
                        ? 'bg-yellow-500/20 border-yellow-400'
                        : 'bg-gray-800 border-gray-600'
                    }`}
                  >

                    {leak ? (

                      <AlertTriangle className="w-7 h-7 text-red-400" />

                    ) : anomaly ? (

                      <Activity className="w-7 h-7 text-warningOrange" />

                    ) : warning ? (

                      <ShieldAlert className="w-7 h-7 text-warningOrange" />

                    ) : (

                      <CheckCircle2 className="w-7 h-7 text-accentTeal" />

                    )}

                  </div>


                  {/* ZONE */}

                  <p
                    className={`mt-3 text-sm font-semibold ${
                      leak
                        ? 'text-red-400'
                        : anomaly || warning
                        ? 'text-warningOrange'
                        : 'text-gray-400'
                    }`}
                  >
                    {zoneData.zone}
                  </p>


                  {/* STATUS */}

                  <p
                    className={`text-xs mt-1 ${
                      leak
                        ? 'text-red-400'
                        : anomaly || warning
                        ? 'text-warningOrange'
                        : 'text-accentTeal'
                    }`}
                  >
                    {zoneCondition.replace('_', ' ')}
                  </p>

                </div>

              );

            })}

          </div>

        </div>

      </div>


      {/* ZONE ANALYSIS */}

      <div className="bg-cardBg p-5 rounded-xl border border-gray-800">

        <h3 className="text-lg font-semibold mb-5">
          Zone Analysis
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {zones.map((zoneData) => {

            const zoneCondition =
              zoneData.condition?.condition ||
              zoneData.stage ||
              'NORMAL';

            const zoneRisk =
              zoneData.risk?.score || 0;

            const zoneLeak =
              zoneCondition === 'LEAK';

            const zoneAnomaly =
              zoneCondition === 'EARLY_ANOMALY';

            return (

              <div
                key={zoneData.zone}
                className={`p-4 rounded-lg border ${
                  zoneLeak
                    ? 'bg-red-500/5 border-red-500/30'
                    : zoneAnomaly
                    ? 'bg-orange-500/5 border-orange-500/30'
                    : 'bg-gray-900/40 border-gray-800'
                }`}
              >

                <div className="flex justify-between items-center">

                  <div>

                    <p className="text-sm text-gray-400">
                      {zoneData.zone}
                    </p>

                    <p className="font-bold mt-1">
                      {zoneData.device_id}
                    </p>

                  </div>


                  <span
                    className={`text-xs font-semibold ${
                      zoneLeak
                        ? 'text-red-400'
                        : zoneAnomaly
                        ? 'text-warningOrange'
                        : 'text-accentTeal'
                    }`}
                  >
                    ● {zoneCondition.replace('_', ' ')}
                  </span>

                </div>


                <div className="grid grid-cols-3 gap-3 mt-4">

                  <div>

                    <p className="text-xs text-gray-500">
                      Pressure
                    </p>

                    <p className="font-semibold">
                      {zoneData.sensor_data?.pressure}
                      <span className="text-xs text-gray-500 ml-1">
                        bar
                      </span>
                    </p>

                  </div>


                  <div>

                    <p className="text-xs text-gray-500">
                      Flow
                    </p>

                    <p className="font-semibold">
                      {zoneData.sensor_data?.flow}
                      <span className="text-xs text-gray-500 ml-1">
                        L/min
                      </span>
                    </p>

                  </div>


                  <div>

                    <p className="text-xs text-gray-500">
                      Risk
                    </p>

                    <p
                      className={`font-semibold ${
                        zoneRisk >= 70
                          ? 'text-red-400'
                          : zoneRisk >= 40
                          ? 'text-warningOrange'
                          : 'text-accentTeal'
                      }`}
                    >
                      {zoneRisk}/100
                    </p>

                  </div>

                </div>

              </div>

            );

          })}

        </div>

      </div>


      {/* EVIDENCE */}

      <div className="bg-cardBg p-5 rounded-xl border border-gray-800">

        <h3 className="text-lg font-semibold mb-5">
          {isLeak
            ? `Leak Evidence — ${zoneName}`
            : `Condition Evidence — ${zoneName}`}
        </h3>


        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">


          {/* PRESSURE */}

          <div className="bg-gray-900/40 p-4 rounded-lg">

            <p className="text-sm text-gray-400">
              Pressure
            </p>

            <p className="text-2xl font-bold text-accentBlue mt-2">

              {affectedZone.sensor_data?.pressure}

              <span className="text-sm text-gray-500 ml-1">
                bar
              </span>

            </p>

          </div>


          {/* FLOW */}

          <div className="bg-gray-900/40 p-4 rounded-lg">

            <p className="text-sm text-gray-400">
              Flow Rate
            </p>

            <p className="text-2xl font-bold text-accentTeal mt-2">

              {affectedZone.sensor_data?.flow}

              <span className="text-sm text-gray-500 ml-1">
                L/min
              </span>

            </p>

          </div>


          {/* ACOUSTIC */}

          <div className="bg-gray-900/40 p-4 rounded-lg">

            <p className="text-sm text-gray-400">
              Acoustic Signal
            </p>

            <p className="text-2xl font-bold text-warningOrange mt-2">
              {affectedZone.sensor_data?.acoustic}
            </p>

          </div>

        </div>

      </div>


      {/* EXPLANATION */}

      <div className="bg-cardBg p-5 rounded-xl border border-gray-800">

        <div className="flex items-center gap-2 mb-3">

          <AlertTriangle className="w-5 h-5 text-warningOrange" />

          <h3 className="text-lg font-semibold">
            Analysis
          </h3>

        </div>

        <p className="text-sm text-gray-300 leading-relaxed">
          {reason}
        </p>

        {isAnomaly && (

          <p className="text-sm text-warningOrange mt-3">
            ⚠️ Early warning detected in{' '}
            <strong>{zoneName}</strong>.
            HydroIQ recommends continued monitoring before
            the condition develops into a critical event.
          </p>

        )}

        {isLeak && (

          <p className="text-sm text-red-400 mt-3">
            🚨 Leak localized to{' '}
            <strong>{zoneName}</strong>.
            Multiple sensor indicators support the leak
            detection.
          </p>

        )}

      </div>

    </div>
  );
}