import React, { useEffect, useState } from 'react';

const API_BASE = 'http://127.0.0.1:8000';

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

function AIInsights() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hello. I am HydroIQ Intelligence Copilot. I can analyze network risk, leaks, sensor health, water quality, and maintenance priorities.',
    },
  ]);

  const [input, setInput] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();

    const interval = setInterval(loadAnalytics, 5000);

    return () => clearInterval(interval);
  }, []);

  async function loadAnalytics() {
    try {
      const response = await fetch(`${API_BASE}/analytics/latest`);

      if (!response.ok) {
        throw new Error('Analytics request failed');
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('HydroIQ analytics error:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  }

  function buildContext() {
    if (!analytics) {
      return {
        data_available: false,
        message: 'Live HydroIQ analytics are currently unavailable.',
      };
    }

    return {
      data_available: true,
      network: analytics.network || {},
      zones: analytics.zones || [],
      alerts: analytics.alerts || [],
      risk: analytics.risk || {},
      water_quality: analytics.water_quality || {},
    };
  }

  async function sendMessage(customMessage = null) {
    const message = (customMessage ?? input).trim();

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

    try {
      const response = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          context: buildContext(),
        }),
      });

      if (!response.ok) {
        throw new Error(`AI request failed: ${response.status}`);
      }

      const data = await response.json();

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
      console.error('HydroIQ AI error:', error);

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

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage();
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  const zoneCount = analytics?.zones?.length || 0;
  const alertCount = analytics?.alerts?.length || 0;

  return (
    <div className="min-h-screen bg-darkBg text-white px-6 py-6 lg:px-8">

      {/* HEADER */}
      <div className="mb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-400/20">
                <span className="text-xl">✦</span>
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

          {/* LIVE STATUS */}
          <div className="flex items-center gap-4">

            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2">
              <div className="text-[10px] uppercase tracking-wider text-gray-500">
                Live zones
              </div>

              <div className="text-sm font-medium">
                {analyticsLoading ? '—' : zoneCount}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2">
              <div className="text-[10px] uppercase tracking-wider text-gray-500">
                Active alerts
              </div>

              <div className="text-sm font-medium">
                {analyticsLoading ? '—' : alertCount}
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

        {/* CHAT PANEL */}
        <section className="flex min-h-[680px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">

          {/* CHAT HEADER */}
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
              Gemini
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

            {/* THINKING INDICATOR */}
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
                        style={{ animationDelay: '120ms' }}
                      />
                      <span
                        className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400"
                        style={{ animationDelay: '240ms' }}
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
                  onClick={() => sendMessage(action.question)}
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
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask HydroIQ about the network..."
                rows={2}
                disabled={loading}
                className="min-h-[48px] flex-1 resize-none bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-gray-600 disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={!input.trim() || loading}
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

          {/* LIVE CONTEXT */}
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
                value={analytics ? 'Connected' : 'Unavailable'}
                status={Boolean(analytics)}
              />

              <ContextRow
                label="Monitored zones"
                value={analyticsLoading ? 'Loading...' : zoneCount}
              />

              <ContextRow
                label="Active alerts"
                value={analyticsLoading ? 'Loading...' : alertCount}
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
              AI recommendations are decision support. Always verify
              critical conditions against live sensor data and field
              procedures before taking action.
            </p>

          </div>

        </aside>

      </div>
    </div>
  );
}


function ContextRow({ label, value, status }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5">

      <span className="text-xs text-gray-500">
        {label}
      </span>

      <div className="flex items-center gap-2">

        {typeof status === 'boolean' && (
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              status ? 'bg-emerald-400' : 'bg-red-400'
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


function Capability({ icon, title, description }) {
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