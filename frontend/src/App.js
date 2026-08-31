import React, { useState } from 'react';

import Sidebar from './components/Sidebar';
import Overview from './components/Overview';
import Maintenance from './components/Maintenance';
import Sensors from './components/Sensors';
import Alerts from './components/Alerts';
import LeakLocalization from './components/LeakLocalization';

function App() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="flex min-h-screen bg-darkBg text-white">

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="flex-1">

        {activeTab === 'overview' && (
          <Overview />
        )}

        {activeTab === 'maintenance' && (
          <Maintenance />
        )}

        {activeTab === 'sensors' && (
          <Sensors />
        )}

        {activeTab === 'alerts' && (
          <Alerts />
        )}

        {activeTab === 'leak-localization' && (
          <LeakLocalization />
        )}

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

      </main>

    </div>
  );
}

export default App;