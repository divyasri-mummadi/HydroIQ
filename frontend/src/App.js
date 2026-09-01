import React, { useState } from 'react';

import Sidebar from './components/Sidebar';
import Overview from './components/Overview';
import Maintenance from './components/Maintenance';
import Sensors from './components/Sensors';
import Alerts from './components/Alerts';
import LeakLocalization from './components/LeakLocalization';
import Simulation from './components/Simulation';

function App() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="flex min-h-screen bg-darkBg text-white">

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="flex-1 min-w-0">

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <Overview />
        )}

        {/* NETWORK MAP */}
        {activeTab === 'network-map' && (
          <div className="p-6">
            <h2 className="text-2xl font-bold">
              Network Map
            </h2>

            <p className="text-gray-400 mt-2">
              Live pipeline network topology
            </p>
          </div>
        )}

        {/* LEAK DETECTION */}
        {activeTab === 'leak-detection' && (
          <div className="p-6">
            <h2 className="text-2xl font-bold">
              Leak Detection
            </h2>

            <p className="text-gray-400 mt-2">
              Multi-sensor pipeline leak analysis
            </p>
          </div>
        )}

        {/* LEAK LOCALIZATION */}
        {activeTab === 'leak-localization' && (
          <LeakLocalization />
        )}

        {/* WATER QUALITY */}
        {activeTab === 'water-quality' && (
          <div className="p-6">
            <h2 className="text-2xl font-bold">
              Water Quality
            </h2>

            <p className="text-gray-400 mt-2">
              Water quality monitoring across the network
            </p>
          </div>
        )}

        {/* ALERTS */}
        {activeTab === 'alerts' && (
          <Alerts />
        )}

        {/* MAINTENANCE */}
        {activeTab === 'maintenance' && (
          <Maintenance />
        )}

        {/* SENSORS */}
        {activeTab === 'sensors' && (
          <Sensors />
        )}

        {/* DIGITAL TWIN */}
        {activeTab === 'simulation' && (
          <Simulation />
        )}

      </main>

    </div>
  );
}

export default App;