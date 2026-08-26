import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Overview from './components/Overview';
import Maintenance from './components/Maintenance';

function App() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="flex min-h-screen bg-darkBg text-white">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1">
        {activeTab === 'overview' && <Overview />}
        {activeTab === 'maintenance' && <Maintenance />}
        {(activeTab !== 'overview' && activeTab !== 'maintenance') && (
          <div className="p-6">
            <h2 className="text-xl font-bold capitalize">{activeTab} Interface</h2>
            <p className="text-gray-400 mt-2">Listening for ESP32 live stream data...</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
