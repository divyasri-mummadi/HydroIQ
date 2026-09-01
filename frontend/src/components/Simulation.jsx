import React, { useEffect, useState } from 'react';
import {
  Brain,
  Activity,
  Play,
  RotateCcw,
  AlertTriangle,
  Users,
  Droplets,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';

import { fetchLatestSensorData } from '../api';

export default function Simulation() {
  const [sensorData, setSensorData] = useState(null);

  const [zone, setZone] = useState('Zone_A');
  const [incidentType, setIncidentType] = useState('Major Pipeline Leak');

  const [simulated, setSimulated] = useState(false);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const getData = async () => {
      try {
        const data = await fetchLatestSensorData();

        if (data) {
          const latest =
            data?.zones?.[0] ||
            data;

          setSensorData(latest);

          if (latest.zone) {
            setZone(latest.zone);
          }
        }
      } catch (error) {
        console.error('Simulation sensor error:', error);
      }
    };

    getData();

    const interval = setInterval(getData, 3000);

    return () => clearInterval(interval);
  }, []);

  const pressure = Number(sensorData?.pressure ?? 2.55);
  const flow = Number(sensorData?.flow ?? 116);
  const acoustic = Number(sensorData?.acoustic ?? 1.47);

  const simulatedPressure = Math.max(
    0.8,
    pressure * 0.6
  );

  const simulatedFlow = flow * 1.1;
  const simulatedAcoustic = acoustic * 2.2;

  const waterLoss = Math.round(simulatedFlow * 24 * 6.6);
  const population = 2300;

  const runSimulation = () => {
    setRunning(true);

    setTimeout(() => {
      setSimulated(true);
      setRunning(false);
    }, 1200);
  };

  const resetSimulation = () => {
    setSimulated(false);
    setRunning(false);
  };

  const getPriority = () => {
    if (incidentType === 'Major Pipeline Leak') {
      return 'P1';
    }

    if (incidentType === 'Pressure Drop') {
      return 'P2';
    }

    return 'P3';
  };

  const priority = getPriority();

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-start">

        <div className="flex items-start gap-4">

          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30">
            <Brain className="w-8 h-8 text-purple-400" />
          </div>

          <div>
            <h2 className="text-3xl font-bold">
              Digital Twin Simulation
            </h2>

            <p className="text-sm text-gray-400 mt-1">
              Explore network outcomes before taking real-world action
            </p>
          </div>

        </div>

        <span className="px-3 py-2 rounded-lg text-xs font-semibold text-purple-300 bg-purple-500/10 border border-purple-500/30">
          SIMULATION MODE
        </span>

      </div>


      {/* INTRO */}
      <div className="p-6 rounded-xl bg-purple-500/5 border border-purple-500/30">

        <div className="flex items-start gap-4">

          <div className="p-3 rounded-lg bg-purple-500/10">
            <Zap className="w-6 h-6 text-purple-400" />
          </div>

          <div>

            <h3 className="text-lg font-bold">
              What if something goes wrong?
            </h3>

            <p className="text-sm text-gray-400 mt-1 max-w-4xl leading-relaxed">
              HydroIQ can simulate a network incident without changing
              your real sensor data. Select a zone, choose an incident,
              and see the predicted operational impact.
            </p>

          </div>

        </div>

      </div>


      {/* CONFIGURATION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 bg-cardBg p-6 rounded-xl border border-gray-800">

          <div className="flex items-center gap-2 mb-6">

            <Activity className="w-5 h-5 text-accentTeal" />

            <h3 className="text-lg font-bold">
              Configure Incident
            </h3>

          </div>


          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* ZONE */}
            <div>

              <label className="text-xs text-gray-500 uppercase">
                Target Zone
              </label>

              <select
                value={zone}
                onChange={(e) => {
                  setZone(e.target.value);
                  setSimulated(false);
                }}
                className="w-full mt-2 px-4 py-3 bg-darkBg border border-gray-700 rounded-lg text-white outline-none focus:border-accentTeal"
              >
                <option value="Zone_A">Zone_A</option>
                <option value="Zone_B">Zone_B</option>
                <option value="Zone_C">Zone_C</option>
                <option value="Zone_D">Zone_D</option>
                <option value="Zone_F">Zone_F</option>
              </select>

            </div>


            {/* INCIDENT */}
            <div>

              <label className="text-xs text-gray-500 uppercase">
                Incident Type
              </label>

              <select
                value={incidentType}
                onChange={(e) => {
                  setIncidentType(e.target.value);
                  setSimulated(false);
                }}
                className="w-full mt-2 px-4 py-3 bg-darkBg border border-gray-700 rounded-lg text-white outline-none focus:border-accentTeal"
              >
                <option>
                  Major Pipeline Leak
                </option>

                <option>
                  Pressure Drop
                </option>

                <option>
                  Flow Anomaly
                </option>

                <option>
                  Sensor Failure
                </option>

              </select>

            </div>

          </div>


          {/* BUTTON */}
          <button
            onClick={runSimulation}
            disabled={running}
            className="w-full mt-6 py-4 rounded-xl bg-accentTeal text-black font-bold hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-60"
          >

            {running ? (
              <>
                <Activity className="w-5 h-5 animate-pulse" />
                SIMULATION RUNNING
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                SIMULATE INCIDENT
              </>
            )}

          </button>


          {simulated && (
            <button
              onClick={resetSimulation}
              className="w-full mt-3 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 transition flex items-center justify-center gap-2 text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Simulation
            </button>
          )}

        </div>


        {/* SELECTED ZONE */}
        <div className="bg-cardBg p-6 rounded-xl border border-gray-800">

          <div className="flex items-center gap-2">

            <div className="p-2 rounded-lg bg-accentBlue/10">
              <Activity className="w-5 h-5 text-accentBlue" />
            </div>

            <h3 className="font-bold">
              Selected Zone
            </h3>

          </div>


          <p className="text-3xl font-bold mt-6">
            {zone}
          </p>

          <p className="text-sm text-gray-500 mt-1">
            {sensorData?.device_id || 'ESP32_Node_1'}
          </p>


          <div className="mt-6 pt-5 border-t border-gray-800">

            <p className="text-xs text-gray-500 uppercase">
              Current State
            </p>

            <p className="text-accentTeal font-bold mt-2">
              MONITORED
            </p>

          </div>

        </div>

      </div>


      {/* SCENARIO */}
      <div className="bg-cardBg p-6 rounded-xl border border-gray-800">

        <div className="flex justify-between items-start mb-6">

          <div>
            <h3 className="text-xl font-bold">
              Network Scenario
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              {incidentType}
            </p>
          </div>


          {simulated && (
            <span className="px-3 py-2 rounded-lg text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/30">
              ⚠ INCIDENT SIMULATED
            </span>
          )}

        </div>


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">


          {/* BEFORE */}
          <div className="p-5 rounded-xl bg-darkBg border border-gray-800">

            <p className="text-xs font-semibold text-gray-500">
              BEFORE
            </p>

            <div className="flex items-center gap-3 mt-5">

              <span className="w-4 h-4 rounded-full bg-accentTeal" />

              <span className="font-bold">
                {zone}
              </span>

            </div>


            <div className="space-y-3 mt-6">

              <Metric
                label="Pressure"
                value={pressure.toFixed(2)}
                unit="bar"
              />

              <Metric
                label="Flow"
                value={flow.toFixed(1)}
                unit="L/min"
              />

              <Metric
                label="Acoustic"
                value={acoustic.toFixed(2)}
                unit="a.u."
              />

            </div>

          </div>


          {/* INCIDENT */}
          <div className="p-5 rounded-xl bg-red-500/5 border border-red-500/30">

            <p className="text-xs font-semibold text-red-400">
              INCIDENT
            </p>

            <div className="flex items-center gap-3 mt-5">

              <span className="w-4 h-4 rounded-full bg-red-500 animate-pulse" />

              <span className="font-bold">
                {incidentType}
              </span>

            </div>


            <p className="text-sm text-gray-400 mt-6 leading-relaxed">
              Simulated pressure drop combined with abnormal
              acoustic and flow behaviour.
            </p>


            <div className="mt-5 flex items-center gap-2 text-red-400 text-sm font-semibold">

              <TrendingDown className="w-4 h-4" />

              Network stress increasing

            </div>

          </div>


          {/* AFTER */}
          <div
            className={`p-5 rounded-xl border ${
              simulated
                ? 'bg-red-500/5 border-red-500/30'
                : 'bg-orange-500/5 border-orange-500/30'
            }`}
          >

            <p className="text-xs font-semibold text-orange-400">
              AFTER SIMULATION
            </p>


            {!simulated ? (

              <>
                <div className="flex items-center gap-3 mt-5">

                  <span className="w-4 h-4 rounded-full bg-gray-600" />

                  <span className="font-bold">
                    Waiting
                  </span>

                </div>

                <p className="text-sm text-gray-400 mt-6">
                  Run the simulation to see the predicted impact.
                </p>
              </>

            ) : (

              <>
                <div className="flex items-center gap-3 mt-5">

                  <span className="w-4 h-4 rounded-full bg-red-500 animate-pulse" />

                  <span className="font-bold text-red-400">
                    CRITICAL
                  </span>

                </div>


                <div className="grid grid-cols-2 gap-3 mt-6">

                  <MiniMetric
                    label="Pressure"
                    value={`${simulatedPressure.toFixed(2)} bar`}
                    down
                  />

                  <MiniMetric
                    label="Flow"
                    value={`${simulatedFlow.toFixed(1)} L/min`}
                    up
                  />

                  <MiniMetric
                    label="Acoustic"
                    value={simulatedAcoustic.toFixed(2)}
                    up
                  />

                  <MiniMetric
                    label="Priority"
                    value={priority}
                  />

                </div>

              </>

            )}

          </div>

        </div>

      </div>


      {/* IMPACT */}
      {simulated && (

        <div className="space-y-5">

          <div>

            <h3 className="text-xl font-bold">
              Predicted Impact
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              What HydroIQ expects if this incident occurs
            </p>

          </div>


          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* WATER LOSS */}
            <ImpactCard
              icon={Droplets}
              title="Estimated Water Loss"
              value={`${waterLoss.toLocaleString()} L/day`}
              description="Expected daily network loss"
            />


            {/* POPULATION */}
            <ImpactCard
              icon={Users}
              title="Population Affected"
              value={`~${population.toLocaleString()}`}
              description="Residents potentially impacted"
            />


            {/* PRIORITY */}
            <ImpactCard
              icon={ShieldAlert}
              title="Response Priority"
              value={priority}
              description="Immediate operator attention"
              danger
            />

          </div>


          {/* DECISION SUPPORT */}
          <div className="p-6 rounded-xl bg-accentTeal/5 border border-accentTeal/20">

            <div className="flex items-start gap-4">

              <div className="p-3 rounded-lg bg-accentTeal/10">

                <Brain className="w-6 h-6 text-accentTeal" />

              </div>


              <div className="flex-1">

                <h3 className="font-bold text-lg">
                  AI Recommended Action
                </h3>

                <p className="text-sm text-gray-300 mt-2 leading-relaxed">

                  Isolate {zone} and dispatch a repair crew.
                  Pressure and acoustic signatures indicate a
                  potentially serious pipeline failure. Immediate
                  isolation can reduce expected water loss and
                  protect affected residents.

                </p>


                <div className="flex flex-wrap gap-3 mt-5">

                  <span className="px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-xs">
                    Before → Incident → Impact
                  </span>

                  <span className="px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-xs">
                    Priority {priority}
                  </span>

                  <span className="px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-xs">
                    Decision Support
                  </span>

                </div>

              </div>

            </div>

          </div>

        </div>

      )}


      {/* FOOTER */}
      <div className="flex items-center justify-between text-xs text-gray-600 pt-2">

        <span>
          Simulation does not modify real sensor telemetry.
        </span>

        <span>
          HydroIQ Digital Twin
        </span>

      </div>

    </div>
  );
}


/* ----------------------------- */
/* SMALL METRIC COMPONENT */
/* ----------------------------- */

function Metric({ label, value, unit }) {
  return (
    <div className="flex justify-between items-center">

      <span className="text-sm text-gray-500">
        {label}
      </span>

      <span className="font-semibold">
        {value}{' '}
        <span className="text-xs text-gray-500">
          {unit}
        </span>
      </span>

    </div>
  );
}


/* ----------------------------- */
/* MINI METRIC */
/* ----------------------------- */

function MiniMetric({ label, value, up, down }) {
  return (
    <div className="p-3 rounded-lg bg-darkBg border border-gray-800">

      <p className="text-xs text-gray-500">
        {label}
      </p>

      <div className="flex items-center gap-1 mt-1">

        <span className="font-bold text-sm">
          {value}
        </span>

        {up && (
          <TrendingUp className="w-3 h-3 text-red-400" />
        )}

        {down && (
          <TrendingDown className="w-3 h-3 text-red-400" />
        )}

      </div>

    </div>
  );
}


/* ----------------------------- */
/* IMPACT CARD */
/* ----------------------------- */

function ImpactCard({
  icon: Icon,
  title,
  value,
  description,
  danger,
}) {
  return (
    <div
      className={`p-5 rounded-xl border ${
        danger
          ? 'border-red-500/30 bg-red-500/5'
          : 'border-gray-800 bg-cardBg'
      }`}
    >

      <div className="flex items-center gap-3">

        <div
          className={`p-2 rounded-lg ${
            danger
              ? 'bg-red-500/10'
              : 'bg-accentTeal/10'
          }`}
        >

          <Icon
            className={`w-5 h-5 ${
              danger
                ? 'text-red-400'
                : 'text-accentTeal'
            }`}
          />

        </div>

        <p className="text-sm text-gray-400">
          {title}
        </p>

      </div>


      <p
        className={`text-2xl font-bold mt-5 ${
          danger
            ? 'text-red-400'
            : 'text-white'
        }`}
      >
        {value}
      </p>


      <p className="text-xs text-gray-500 mt-2">
        {description}
      </p>

    </div>
  );
}