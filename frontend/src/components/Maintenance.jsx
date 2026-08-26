import React, { useState } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function Maintenance() {
  const [dispatched, setDispatched] = useState({});

  const handleDispatch = (id) => {
    setDispatched((prev) => ({ ...prev, [id]: true }));
  };

  const queues = [
    { id: 'SEG-014', zone: 'Zone A', wrs: 89, issue: 'Confirmed leak', impact: '2,300 res. · 18.4k L/day' },
    { id: 'SEG-041', zone: 'Zone F', wrs: 76, issue: 'Turbidity anomaly (>4.8 NTU)', impact: '1,150 res. · Quality risk' },
  ];

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Risk & Maintenance Prioritization</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-cardBg p-5 rounded-xl border border-gray-800">
          <h3 className="text-md font-semibold mb-4">WRS Queue</h3>
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-800/50 text-gray-400 text-xs">
              <tr>
                <th className="p-3">Segment</th>
                <th className="p-3">Zone</th>
                <th className="p-3">WRS</th>
                <th className="p-3">Issue</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {queues.map((item) => (
                <tr key={item.id}>
                  <td className="p-3 font-mono text-accentBlue font-bold">{item.id}</td>
                  <td className="p-3">{item.zone}</td>
                  <td className="p-3 font-bold text-alertRed">{item.wrs}</td>
                  <td className="p-3">{item.issue}</td>
                  <td className="p-3">
                    {dispatched[item.id] ? (
                      <span className="flex items-center gap-1 text-accentTeal text-xs font-semibold">
                        <CheckCircle2 className="w-4 h-4" /> Dispatched
                      </span>
                    ) : (
                      <button
                        onClick={() => handleDispatch(item.id)}
                        className="px-3 py-1 bg-accentBlue hover:bg-blue-600 font-semibold rounded text-xs transition"
                      >
                        Dispatch Crew
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-cardBg p-5 rounded-xl border border-gray-800">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="text-accentTeal w-5 h-5" />
            <h3 className="text-md font-semibold">AI Decision Logic</h3>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed bg-darkBg p-3 rounded-lg border border-gray-800">
            SEG-014 prioritized first because pressure drop down to <strong>2.6 bar</strong> matched high acoustic correlation, triggering high Water Risk Score (89).
          </p>
        </div>
      </div>
    </div>
  );
}