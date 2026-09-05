import React, { useEffect, useState } from 'react';

const API_BASE = 'http://127.0.0.1:8001';

const QUICK_ACTIONS = [
  {
    title: 'Highest risk',
    question: 'Which zone currently has the highest risk and why?',
  },
  {
    title: 'Leak analysis',
    question: 'Explain the current leak situation in the network.',
  },
  {
    title: 'Sensor health',
    question: 'Which sensors look unhealthy or suspicious?',
  },
  {
    title: 'Water quality',
    question: 'Are there any current water quality concerns?',
  },
];

function getCondition(zone) {
  return (
    zone?.stage ||
    zone?.condition?.condition ||
    zone?.condition ||
    'NORMAL'
  );
}

function getRisk(zone) {
  return Number(
    zone?.risk?.score ??
      zone?.risk?.wrs ??
      zone?.wrs ??
      0
  );
}

function getSensorValue(zone, field) {
  const direct = zone?.[field];

  if (direct !== undefined && direct !== null) {
    return direct;
  }

  const sensor = zone?.sensor_data;

  if (sensor?.[field] !== undefined && sensor?.[field] !== null) {
    return sensor[field];
  }

  const filtered = zone?.filtered_sensor_data;

  if (
    filtered?.[field] !== undefined &&
    filtered?.[field] !== null
  ) {
    return filtered[field];
  }

  return '--';
}

function getPriority(zone) {
  return (
    zone?.priority?.priority ||
    zone?.priority ||
    null
  );
}

function getPriorityScore(zone) {
  return Number(
    zone?.priority?.score ??
      getRisk(zone)
  );
}

function getLeakZones(zones) {
  return zones.filter((zone) => {
    return (
      getCondition(zone) === 'LEAK' ||
      zone?.leak?.leak_detected === true
    );
  });
}

function getQualityZones(zones) {
  return zones.filter(
    (zone) => getCondition(zone) === 'WATER_QUALITY'
  );
}

function getFaultZones(zones) {
  return zones.filter(
    (zone) => getCondition(zone) === 'SENSOR_FAULT'
  );
}

function getAnomalyZones(zones) {
  return zones.filter(
    (zone) => getCondition(zone) === 'EARLY_ANOMALY'
  );
}

function generateAIResponse(message, analytics) {
  const text = message.toLowerCase().trim();

  const zones = Array.isArray(analytics?.zones)
    ? analytics.zones
    : [];

  if (!zones.length) {
    return 'Live HydroIQ analytics are currently unavailable.';
  }

  const leaks = getLeakZones(zones);
  const quality = getQualityZones(zones);
  const faults = getFaultZones(zones);
  const anomalies = getAnomalyZones(zones);

  const highest = [...zones].sort(
    (a, b) => getRisk(b) - getRisk(a)
  )[0];

  const highestZone = highest?.zone || 'Unknown';
  const highestRisk = getRisk(highest);
  const highestCondition = getCondition(highest);

  // ----------------------------------------------------------
  // WHAT IS A LEAK
  // ----------------------------------------------------------

  if (
    text.includes('what is a leak') ||
    (text.includes('what') && text.includes('leak'))
  ) {
    return (
      'A pipeline leak is an abnormal loss of water from the network. ' +
      'HydroIQ detects it by combining pressure drop, increased flow ' +
      'and acoustic evidence. A strong leak signal should trigger ' +
      'immediate inspection and, where required, isolation of the ' +
      'affected zone.'
    );
  }

  // ----------------------------------------------------------
  // HIGHEST RISK
  // ----------------------------------------------------------

  if (
    text.includes('highest risk') ||
    text.includes('most risky') ||
    text.includes('maximum risk')
  ) {
    let response =
      `${highestZone} currently has the highest network risk ` +
      `with a WRS of ${highestRisk}/100. ` +
      `Current condition: ${highestCondition}. `;

    if (highestCondition === 'LEAK') {
      const pressure = getSensorValue(
        highest,
        'pressure'
      );

      const flow = getSensorValue(
        highest,
        'flow'
      );

      const acoustic = getSensorValue(
        highest,
        'acoustic'
      );

      response +=
        `The main concern is a detected leak. ` +
        `Pressure is ${pressure} bar, flow is ${flow} L/min ` +
        `and acoustic amplitude is ${acoustic}. ` +
        `Immediate inspection and isolation is recommended.`;
    } else if (highestCondition === 'WATER_QUALITY') {
      response +=
        'The main concern is water quality. ' +
        `pH is ${getSensorValue(highest, 'ph')}, ` +
        `TDS is ${getSensorValue(highest, 'tds')} ppm and ` +
        `turbidity is ${getSensorValue(highest, 'turbidity')} NTU. ` +
        'Verify the readings and inspect the affected zone.';
    } else if (highestCondition === 'SENSOR_FAULT') {
      response +=
        'The main concern is sensor reliability. ' +
        'Inspect or recalibrate the affected sensor and validate ' +
        'its readings against nearby nodes.';
    } else if (highestCondition === 'EARLY_ANOMALY') {
      response +=
        'The zone shows an early network anomaly. ' +
        'Preventive inspection is recommended before the condition develops further.';
    } else {
      response +=
        'The zone is currently operating normally. ' +
        'Continue routine monitoring.';
    }

    return response;
  }

  // ----------------------------------------------------------
  // LEAK
  // ----------------------------------------------------------

  if (
    text.includes('leak') ||
    text.includes('leaks') ||
    text.includes('leak situation')
  ) {
    if (!leaks.length) {
      return (
        'No active pipeline leak is currently detected across ' +
        'the monitored zones.'
      );
    }

    return leaks
      .map((zone) => {
        const pressure = getSensorValue(
          zone,
          'pressure'
        );

        const flow = getSensorValue(
          zone,
          'flow'
        );

        const acoustic = getSensorValue(
          zone,
          'acoustic'
        );

        return (
          `${zone.zone} currently shows a pipeline leak. ` +
          `Pressure is ${pressure} bar, flow is ${flow} L/min ` +
          `and acoustic amplitude is ${acoustic}. ` +
          'Immediate inspection and isolation is recommended.'
        );
      })
      .join('\n\n');
  }

  // ----------------------------------------------------------
  // WATER QUALITY
  // ----------------------------------------------------------

  if (
    text.includes('water quality') ||
    text.includes('quality issue') ||
    text.includes('quality concern') ||
    text.includes('water-quality')
  ) {
    if (!quality.length) {
      return (
        'No active water-quality concern is currently detected ' +
        'across the monitored zones.'
      );
    }

    return quality
      .map((zone) => {
        return (
          `${zone.zone} currently shows a water-quality concern. ` +
          `pH is ${getSensorValue(zone, 'ph')}, ` +
          `TDS is ${getSensorValue(zone, 'tds')} ppm and ` +
          `turbidity is ${getSensorValue(zone, 'turbidity')} NTU. ` +
          'Verify the readings and inspect the zone.'
        );
      })
      .join('\n\n');
  }

  // ----------------------------------------------------------
  // SENSOR HEALTH
  // ----------------------------------------------------------

  if (
    text.includes('sensor health') ||
    text.includes('unhealthy sensor') ||
    text.includes('sensor fault') ||
    text.includes('suspicious sensor')
  ) {
    if (!faults.length) {
      return (
        'No active sensor fault is currently reported by ' +
        'the HydroIQ analytics engine.'
      );
    }

    return (
      `Sensor fault detected in ${faults
        .map((zone) => zone.zone)
        .join(', ')}. ` +
      'Inspect or recalibrate the affected sensor and validate ' +
      'its readings against nearby nodes.'
    );
  }

  // ----------------------------------------------------------
  // ANOMALY
  // ----------------------------------------------------------

  if (
    text.includes('anomaly') ||
    text.includes('early warning') ||
    text.includes('early anomaly')
  ) {
    if (!anomalies.length) {
      return (
        'No early network anomaly is currently detected.'
      );
    }

    return (
      `${anomalies
        .map((zone) => zone.zone)
        .join(', ')} currently show an early network anomaly. ` +
      'Preventive inspection is recommended before the condition ' +
      'develops further.'
    );
  }

  // ----------------------------------------------------------
  // OPERATIONAL BRIEFING
  // ----------------------------------------------------------

  if (
    text.includes('briefing') ||
    text.includes('operational') ||
    text.includes('network status') ||
    text.includes('current status') ||
    text.includes('network summary')
  ) {
    const networkRisk = Number(
      analytics?.network?.risk_score ??
        Math.max(...zones.map(getRisk))
    );

    const activeAlerts =
      analytics?.network?.active_alerts ??
      analytics?.alerts?.length ??
      zones.filter(
        (zone) => getCondition(zone) !== 'NORMAL'
      ).length;

    let response =
      `HydroIQ is currently monitoring ${zones.length} zones. ` +
      `Network risk is ${networkRisk}/100 with ` +
      `${activeAlerts} active alert(s). `;

    if (leaks.length) {
      response +=
        `Leak concern: ${leaks
          .map((zone) => zone.zone)
          .join(', ')}. `;
    }

    if (quality.length) {
      response +=
        `Water-quality concern: ${quality
          .map((zone) => zone.zone)
          .join(', ')}. `;
    }

    if (faults.length) {
      response +=
        `Sensor fault: ${faults
          .map((zone) => zone.zone)
          .join(', ')}. `;
    }

    if (anomalies.length) {
      response +=
        `Early anomaly: ${anomalies
          .map((zone) => zone.zone)
          .join(', ')}. `;
    }

    if (
      !leaks.length &&
      !quality.length &&
      !faults.length &&
      !anomalies.length
    ) {
      response +=
        'All monitored zones are currently operating normally.';
    }

    return response;
  }

  // ----------------------------------------------------------
  // MAINTENANCE
  // ----------------------------------------------------------

  if (
    text.includes('maintenance') ||
    text.includes('what should') ||
    text.includes('what action') ||
    text.includes('recommend')
  ) {
    const priorityZones = [...zones]
      .filter(
        (zone) =>
          getCondition(zone) !== 'NORMAL' ||
          getRisk(zone) >= 35
      )
      .sort(
        (a, b) =>
          getPriorityScore(b) -
          getPriorityScore(a)
      );

    if (!priorityZones.length) {
      return (
        'No immediate maintenance action is required. ' +
        'Continue routine monitoring.'
      );
    }

    return priorityZones
      .map((zone) => {
        const condition = getCondition(zone);
        const priority = getPriority(zone);

        let action = 'Continue routine monitoring.';

        if (condition === 'LEAK') {
          action =
            'Immediately inspect and isolate the affected zone.';
        } else if (condition === 'WATER_QUALITY') {
          action =
            'Verify water-quality readings and inspect the zone.';
        } else if (condition === 'SENSOR_FAULT') {
          action =
            'Inspect or recalibrate the affected sensor.';
        } else if (condition === 'EARLY_ANOMALY') {
          action =
            'Perform preventive inspection before the condition develops.';
        }

        return (
          `${zone.zone}: ${condition}, WRS ${getRisk(zone)}/100` +
          `${priority ? `, ${priority}` : ''}. ${action}`
        );
      })
      .join('\n\n');
  }

  // ----------------------------------------------------------
  // DEFAULT
  // ----------------------------------------------------------

  return (
    'I can analyze the live HydroIQ network. Try asking: ' +
    '"Which zone has the highest risk?", ' +
    '"Explain the current leak situation", ' +
    '"Are there any water quality concerns?", ' +
    '"Which sensors look unhealthy?", or ' +
    '"Give me an operational briefing."'
  );
}

function AIInsights() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text:
        'Hello. I am HydroIQ Intelligence Copilot. I can analyze network risk, leaks, sensor health, water quality, and maintenance priorities.',
    },
  ]);

  const [input, setInput] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] =
    useState(true);

  useEffect(() => {
    loadAnalytics();

    const interval = setInterval(
      loadAnalytics,
      5000
    );

    return () => clearInterval(interval);
  }, []);

  async function loadAnalytics() {
    try {
      const response = await fetch(
        `${API_BASE}/analytics/latest`
      );

      if (!response.ok) {
        throw new Error(
          'Analytics request failed'
        );
      }

      const data = await response.json();

      setAnalytics(data);
    } catch (error) {
      console.error(
        'HydroIQ analytics error:',
        error
      );
    } finally {
      setAnalyticsLoading(false);
    }
  }

  function sendMessage(customMessage = null) {
    const message = (
      customMessage ?? input
    ).trim();

    if (!message || loading) {
      return;
    }

    setMessages((previous) => [
      ...previous,
      {
        role: 'user',
        text: message,
      },
    ]);

    setInput('');
    setLoading(true);

    // Small delay so the UI shows the AI thinking state.
    setTimeout(() => {
      const response = generateAIResponse(
        message,
        analytics
      );

      setMessages((previous) => [
        ...previous,
        {
          role: 'assistant',
          text: response,
        },
      ]);

      setLoading(false);
    }, 350);
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage();
  }

  function handleKeyDown(event) {
    if (
      event.key === 'Enter' &&
      !event.shiftKey
    ) {
      event.preventDefault();
      sendMessage();
    }
  }

  const zoneCount =
    analytics?.zones?.length || 0;

  const alertCount =
    analytics?.network?.active_alerts ??
    analytics?.alerts?.length ??
    analytics?.zones?.filter(
      (zone) =>
        getCondition(zone) !== 'NORMAL'
    ).length ??
    0;

  return (
    <div className="min-h-screen bg-darkBg text-white px-6 py-6 lg:px-8">

      {/* HEADER */}
      <div className="mb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div>
            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-400/20">
                <span className="text-xl">
                  ✦
                </span>
              </div>

              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  AI Insights
                </h1>

                <p className="text-sm text-gray-400">
                  HydroIQ Intelligence Copilot
                </p>
              </div>

            </div>
          </div>

          <div className="flex items-center gap-4">

            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2">
              <div className="text-[10px] uppercase tracking-wider text-gray-500">
                Live zones
              </div>

              <div className="text-sm font-medium">
                {analyticsLoading
                  ? '—'
                  : zoneCount}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2">
              <div className="text-[10px] uppercase tracking-wider text-gray-500">
                Active alerts
              </div>

              <div className="text-sm font-medium">
                {analyticsLoading
                  ? '—'
                  : alertCount}
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />

              <span className="text-xs text-emerald-300">
                Live Intelligence
              </span>
            </div>

          </div>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">

        {/* CHAT */}
        <section className="flex min-h-[680px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">

          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">

            <div>
              <h2 className="text-sm font-semibold">
                Intelligence Copilot
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Ask questions about the current water network.
              </p>
            </div>

            <div className="rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-3 py-1.5 text-[10px] uppercase tracking-wider text-cyan-300">
              HydroIQ AI
            </div>

          </div>

          {/* MESSAGES */}
          <div className="flex-1 space-y-5 overflow-y-auto p-5">

            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex ${
                  message.role === 'user'
                    ? 'justify-end'
                    : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-cyan-500/10 border border-cyan-400/20'
                      : 'bg-white/[0.04] border border-white/10'
                  }`}
                >

                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                      {message.role === 'user'
                        ? 'Operator'
                        : 'HydroIQ AI'}
                    </span>
                  </div>

                  <div
                    className={`whitespace-pre-wrap text-sm leading-6 ${
                      message.error
                        ? 'text-red-300'
                        : 'text-gray-200'
                    }`}
                  >
                    {message.text}
                  </div>

                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">

                  <div className="flex items-center gap-2">

                    <span className="text-xs text-gray-400">
                      HydroIQ AI is analyzing
                    </span>

                    <span className="flex gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" />

                      <span
                        className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400"
                        style={{
                          animationDelay:
                            '120ms',
                        }}
                      />

                      <span
                        className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400"
                        style={{
                          animationDelay:
                            '240ms',
                        }}
                      />
                    </span>

                  </div>

                </div>
              </div>
            )}

          </div>

          {/* QUICK ACTIONS */}
          <div className="border-t border-white/10 px-5 pt-4">

            <div className="mb-2 text-[10px] uppercase tracking-wider text-gray-500">
              Quick analysis
            </div>

            <div className="flex flex-wrap gap-2">

              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.title}
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    sendMessage(
                      action.question
                    )
                  }
                  className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-gray-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/5 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {action.title}
                </button>
              ))}

            </div>
          </div>

          {/* INPUT */}
          <form
            onSubmit={handleSubmit}
            className="p-5"
          >
            <div className="flex items-end gap-3 rounded-xl border border-white/10 bg-black/20 p-2 focus-within:border-cyan-400/30">

              <textarea
                value={input}
                onChange={(event) =>
                  setInput(event.target.value)
                }
                onKeyDown={handleKeyDown}
                placeholder="Ask HydroIQ about the network..."
                rows={2}
                disabled={loading}
                className="min-h-[48px] flex-1 resize-none bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-gray-600 disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={
                  !input.trim() ||
                  loading
                }
                className="rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-medium text-black transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-30"
              >
                {loading ? '...' : 'Ask'}
              </button>

            </div>

            <div className="mt-2 text-[10px] text-gray-600">
              Press Enter to send · Shift + Enter for a new line
            </div>
          </form>

        </section>

        {/* RIGHT SIDEBAR */}
        <aside className="space-y-4">

          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">

            <div className="mb-4">

              <div className="text-sm font-semibold">
                Live Network Context
              </div>

              <div className="mt-1 text-xs text-gray-500">
                Context automatically supplied to the AI.
              </div>

            </div>

            <div className="space-y-3">

              <ContextRow
                label="Data connection"
                value={
                  analytics
                    ? 'Connected'
                    : 'Unavailable'
                }
                status={Boolean(analytics)}
              />

              <ContextRow
                label="Monitored zones"
                value={
                  analyticsLoading
                    ? 'Loading...'
                    : zoneCount
                }
              />

              <ContextRow
                label="Active alerts"
                value={
                  analyticsLoading
                    ? 'Loading...'
                    : alertCount
                }
              />

              <ContextRow
                label="Analytics refresh"
                value="5 seconds"
              />

            </div>

          </div>

          {/* CAPABILITIES */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">

            <div className="mb-4 text-sm font-semibold">
              AI Capabilities
            </div>

            <div className="space-y-3">

              <Capability
                icon="◈"
                title="Leak Detection"
                description="Explain leak evidence and risk."
              />

              <Capability
                icon="◉"
                title="Water Quality"
                description="Interpret pH, TDS and turbidity."
              />

              <Capability
                icon="◇"
                title="Sensor Health"
                description="Identify suspicious sensor behavior."
              />

              <Capability
                icon="△"
                title="Risk Analysis"
                description="Explain network and zone risk."
              />

              <Capability
                icon="⚙"
                title="Maintenance"
                description="Suggest practical operator actions."
              />

            </div>

          </div>

          {/* SAFETY */}
          <div className="rounded-2xl border border-amber-400/10 bg-amber-400/[0.03] p-5">

            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-300">
              Operator Note
            </div>

            <p className="text-xs leading-5 text-gray-500">
              AI recommendations are decision support. Always
              verify critical conditions against live sensor data
              and field procedures before taking action.
            </p>

          </div>

        </aside>

      </div>
    </div>
  );
}

function ContextRow({
  label,
  value,
  status,
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5">

      <span className="text-xs text-gray-500">
        {label}
      </span>

      <div className="flex items-center gap-2">

        {typeof status === 'boolean' && (
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              status
                ? 'bg-emerald-400'
                : 'bg-red-400'
            }`}
          />
        )}

        <span className="text-xs font-medium text-gray-300">
          {value}
        </span>

      </div>
    </div>
  );
}

function Capability({
  icon,
  title,
  description,
}) {
  return (
    <div className="flex gap-3">

      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-xs text-cyan-300">
        {icon}
      </div>

      <div>

        <div className="text-xs font-medium text-gray-300">
          {title}
        </div>

        <div className="mt-0.5 text-[11px] leading-4 text-gray-600">
          {description}
        </div>

      </div>

    </div>
  );
}

export default AIInsights;