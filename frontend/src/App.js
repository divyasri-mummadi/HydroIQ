import React, { useState } from 'react';

import Sidebar from './components/Sidebar';
import Overview from './components/Overview';
import Maintenance from './components/Maintenance';
import Sensors from './components/Sensors';
import Alerts from './components/Alerts';
import LeakLocalization from './components/LeakLocalization';
import Simulation from './components/Simulation';
import NetworkMap from './components/NetworkMap';
import LeakDetection from './components/LeakDetection';
import WaterQuality from './components/WaterQuality';

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
  <NetworkMap />
)}

        {/* LEAK DETECTION */}
        {activeTab === 'leak-detection' && (
  <LeakDetection />
)}
        {/* LEAK LOCALIZATION */}
        {activeTab === 'leak-localization' && (
          <LeakLocalization />
        )}

        {/* WATER QUALITY */}
        {activeTab === 'water-quality' && (
  <WaterQuality />
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