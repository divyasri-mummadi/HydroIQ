import React, { useEffect, useState } from 'react';

const API_BASE = 'http://127.0.0.1:8001';

const QUICK_ACTIONS = [
  {
    title: 'Network briefing',
    question:
      'Give me a concise operational briefing of the current HydroIQ network.',
  },
  {
    title: 'Highest risk',
    question:
      'Which zone currently has the highest risk and why? Explain the evidence.',
  },
  {
    title: 'Leak analysis',
    question:
      'Analyze the current leak situation. Separate confirmed evidence from possible explanations.',
  },
  {
    title: 'Trend analysis',
    question:
      'What important sensor trends have changed recently and what could they indicate?',
  },
  {
    title: 'Sensor health',
    question:
      'Which sensors look unhealthy, unstable, or suspicious? Distinguish sensor faults from physical leaks.',
  },
  {
    title: 'Water quality',
    question:
      'Are there any current water quality concerns? Explain which measurements matter.',
  },
  {
    title: 'Maintenance',
    question:
      'What should the operator prioritize for maintenance right now and why?',
  },
];


function AIInsights() {

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text:
        'Hello. I am HydroIQ Intelligence Copilot. I can analyze live network conditions, historical sensor trends, leaks, sensor health, water quality, risk, and maintenance priorities.',
    },
  ]);

  const [input, setInput] = useState('');

  const [analytics, setAnalytics] = useState(null);

  const [history, setHistory] = useState(null);

  const [loading, setLoading] = useState(false);

  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  const [historyLoading, setHistoryLoading] = useState(true);


  // ============================================================
  // LIVE DATA
  // ============================================================

  useEffect(() => {

    loadHydroIQData();

    const interval = setInterval(
      loadHydroIQData,
      5000
    );

    return () => clearInterval(interval);

  }, []);


  async function loadHydroIQData() {

    await Promise.all([
      loadAnalytics(),
      loadHistory(),
    ]);

  }


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


  async function loadHistory() {

    try {

      const response = await fetch(
        `${API_BASE}/sensors/history`
      );

      if (!response.ok) {
        throw new Error(
          'Sensor history request failed'
        );
      }

      const data = await response.json();

      setHistory(data);

    } catch (error) {

      console.error(
        'HydroIQ history error:',
        error
      );

    } finally {

      setHistoryLoading(false);

    }

  }


  // ============================================================
  // AI CONTEXT
  // ============================================================

  function buildContext() {

    if (!analytics && !history) {

      return {
        data_available: false,
        message:
          'Live HydroIQ analytics and sensor history are currently unavailable.',
      };

    }

    return {

      data_available: true,

      current_network:
        analytics?.network || {},

      current_zones:
        analytics?.zones || [],

      current_alerts:
        analytics?.alerts || [],

      current_risk:
        analytics?.risk || {},

      current_water_quality:
        analytics?.water_quality || {},

      sensor_history:
        history || {},

      trend_analysis_available:
        Boolean(history),

      ai_capabilities: [
        'current state analysis',
        'historical trend analysis',
        'leak reasoning',
        'sensor fault reasoning',
        'water quality analysis',
        'risk analysis',
        'maintenance prioritization',
      ],

      reasoning_rules: [
        'Compare historical readings with current readings.',
        'Look for persistent trends rather than isolated spikes.',
        'Separate sensor faults from physical leaks.',
        'Use multiple signals together when evaluating leak evidence.',
        'Do not claim a trend when historical evidence is insufficient.',
      ],
    };

  }


  // ============================================================
  // SEND MESSAGE
  // ============================================================

  async function sendMessage(
    customMessage = null
  ) {

    const message =
      (customMessage ?? input).trim();

    if (!message || loading) {
      return;
    }


    const updatedMessages = [
      ...messages,
      {
        role: 'user',
        text: message,
      },
    ];


    setMessages(updatedMessages);

    setInput('');

    setLoading(true);


    try {

      const response = await fetch(
        `${API_BASE}/ai/chat`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({

            message,

            context:
              buildContext(),

            conversation:
              updatedMessages
                .slice(-8)
                .map((item) => ({
                  role: item.role,
                  text: item.text,
                })),

          }),

        }
      );


      if (!response.ok) {

        throw new Error(
          `AI request failed: ${response.status}`
        );

      }


      const data =
        await response.json();


      setMessages((previous) => [

        ...previous,

        {
          role: 'assistant',

          text:
            data.response ||
            'The AI assistant did not return a response.',
        },

      ]);


    } catch (error) {

      console.error(
        'HydroIQ AI error:',
        error
      );


      setMessages((previous) => [

        ...previous,

        {
          role: 'assistant',

          text:
            'I could not reach the HydroIQ AI service. Please check that the backend is running.',

          error: true,
        },

      ]);

    } finally {

      setLoading(false);

    }

  }


  // ============================================================
  // INPUT
  // ============================================================

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


  // ============================================================
  // LIVE COUNTERS
  // ============================================================

  const zoneCount =
    analytics?.zones?.length || 0;

  const alertCount =
    analytics?.alerts?.length || 0;


  const trendAvailable =
    Boolean(history);


  // ============================================================
  // UI
  // ============================================================

  return (

    <div className="min-h-screen bg-darkBg text-white px-6 py-6 lg:px-8">


      {/* ========================================================
          HEADER
      ======================================================== */}

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


          {/* STATUS */}

          <div className="flex flex-wrap items-center gap-3">


            <StatusCard
              label="Live zones"
              value={
                analyticsLoading
                  ? '—'
                  : zoneCount
              }
            />


            <StatusCard
              label="Active alerts"
              value={
                analyticsLoading
                  ? '—'
                  : alertCount
              }
            />


            <StatusCard
              label="Trend data"
              value={
                historyLoading
                  ? '—'
                  : trendAvailable
                    ? 'Available'
                    : 'Unavailable'
              }
            />


            <div className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-2">

              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />

              <span className="text-xs text-emerald-300">
                Live Intelligence
              </span>

            </div>

          </div>

        </div>

      </div>


      {/* ========================================================
          MAIN GRID
      ======================================================== */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">


        {/* ======================================================
            CHAT
        ====================================================== */}

        <section className="flex min-h-[700px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">


          {/* CHAT HEADER */}

          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">

            <div>

              <h2 className="text-sm font-semibold">
                Intelligence Copilot
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Live telemetry + historical trends + operational reasoning
              </p>

            </div>


            <div className="rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-3 py-1.5 text-[10px] uppercase tracking-wider text-cyan-300">
              Gemini
            </div>

          </div>


          {/* MESSAGES */}

          <div className="flex-1 space-y-5 overflow-y-auto p-5">

            {messages.map(
              (message, index) => (

                <div
                  key={`${message.role}-${index}`}
                  className={`flex ${
                    message.role === 'user'
                      ? 'justify-end'
                      : 'justify-start'
                  }`}
                >

                  <div
                    className={`max-w-[88%] rounded-2xl px-4 py-3 ${
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

              )
            )}


            {/* THINKING */}

            {loading && (

              <div className="flex justify-start">

                <div className="rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.03] px-4 py-3">

                  <div className="flex items-center gap-3">

                    <span className="text-xs text-gray-400">
                      HydroIQ AI is reasoning over live and historical data
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

              {QUICK_ACTIONS.map(
                (action) => (

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

                )
              )}

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
                  setInput(
                    event.target.value
                  )
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

                {loading
                  ? '...'
                  : 'Ask'}

              </button>

            </div>


            <div className="mt-2 text-[10px] text-gray-600">
              Enter to send · Shift + Enter for a new line
            </div>

          </form>

        </section>


        {/* ======================================================
            RIGHT SIDEBAR
        ====================================================== */}

        <aside className="space-y-4">


          {/* LIVE CONTEXT */}

          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">

            <div className="mb-4">

              <div className="text-sm font-semibold">
                Live Network Context
              </div>

              <div className="mt-1 text-xs text-gray-500">
                The AI receives current analytics and sensor history.
              </div>

            </div>


            <div className="space-y-3">


              <ContextRow
                label="Analytics"
                value={
                  analytics
                    ? 'Connected'
                    : 'Unavailable'
                }
                status={
                  Boolean(analytics)
                }
              />


              <ContextRow
                label="Sensor history"
                value={
                  history
                    ? 'Available'
                    : 'Unavailable'
                }
                status={
                  Boolean(history)
                }
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
                label="Context refresh"
                value="5 seconds"
              />

            </div>

          </div>


          {/* INTELLIGENCE ENGINE */}

          <div className="rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.025] p-5">

            <div className="mb-4">

              <div className="text-sm font-semibold">
                Intelligence Engine
              </div>

              <div className="mt-1 text-xs text-gray-500">
                HydroIQ reasoning capabilities
              </div>

            </div>


            <div className="space-y-3">

              <Capability
                icon="◈"
                title="Multi-Signal Leak Reasoning"
                description="Combines pressure, flow, acoustic and ML evidence."
              />


              <Capability
                icon="↗"
                title="Trend Detection"
                description="Compares historical behavior with current readings."
              />


              <Capability
                icon="◇"
                title="Fault Separation"
                description="Distinguishes sensor faults from physical incidents."
              />


              <Capability
                icon="◉"
                title="Water Quality"
                description="Reasons across pH, TDS and turbidity."
              />


              <Capability
                icon="△"
                title="Risk Reasoning"
                description="Explains why a zone is high or low risk."
              />


              <Capability
                icon="⚙"
                title="Maintenance Guidance"
                description="Prioritizes practical operator actions."
              />

            </div>

          </div>


          {/* ANALYSIS MODES */}

          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">

            <div className="mb-4">

              <div className="text-sm font-semibold">
                Analysis Modes
              </div>

            </div>


            <div className="grid grid-cols-2 gap-2">

              <Mode
                title="Live"
                description="Current state"
              />

              <Mode
                title="Trend"
                description="Historical change"
              />

              <Mode
                title="Incident"
                description="Problem analysis"
              />

              <Mode
                title="Risk"
                description="Priority"
              />

              <Mode
                title="Quality"
                description="Water health"
              />

              <Mode
                title="Maintenance"
                description="Action plan"
              />

            </div>

          </div>


          {/* OPERATOR NOTE */}

          <div className="rounded-2xl border border-amber-400/10 bg-amber-400/[0.03] p-5">

            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-300">
              Operator Note
            </div>

            <p className="text-xs leading-5 text-gray-500">
              AI recommendations are decision support. Verify critical
              conditions against live telemetry and field procedures
              before taking operational action.
            </p>

          </div>

        </aside>

      </div>

    </div>

  );

}


// ============================================================
// UI HELPERS
// ============================================================

function StatusCard({
  label,
  value,
}) {

  return (

    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2">

      <div className="text-[10px] uppercase tracking-wider text-gray-500">
        {label}
      </div>

      <div className="text-sm font-medium">
        {value}
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


function Mode({
  title,
  description,
}) {

  return (

    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5">

      <div className="text-[11px] font-medium text-gray-300">
        {title}
      </div>

      <div className="mt-0.5 text-[9px] text-gray-600">
        {description}
      </div>

    </div>

  );

}


export default AIInsights;