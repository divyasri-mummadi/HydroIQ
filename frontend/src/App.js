import React, { useState } from 'react';

import Sidebar from './components/Sidebar';

import NetworkHealth from './components/NetworkHealth';

import Overview from './components/Overview';
import Maintenance from './components/Maintenance';
import Sensors from './components/Sensors';
import Alerts from './components/Alerts';
import LeakLocalization from './components/LeakLocalization';
import Simulation from './components/Simulation';
import NetworkMap from './components/NetworkMap';
import LeakDetection from './components/LeakDetection';
import WaterQuality from './components/WaterQuality';
import AIInsights from './components/AIInsights';


function App() {

  const [activeTab, setActiveTab] =
    useState('overview');


  return (
    <div
      className="
        flex
        min-h-screen
        bg-darkBg
        text-white
      "
    >

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />


      <main
        className="
          flex-1
          min-w-0
        "
      >

        {activeTab === 'overview' && (

          <>
            <NetworkHealth />

            <Overview />
          </>

        )}


        {activeTab === 'network-map' && (
          <NetworkMap />
        )}


        {activeTab === 'leak-detection' && (
          <LeakDetection />
        )}


        {activeTab === 'leak-localization' && (
          <LeakLocalization />
        )}


        {activeTab === 'water-quality' && (
          <WaterQuality />
        )}


        {activeTab === 'alerts' && (
          <Alerts />
        )}


        {activeTab === 'maintenance' && (
          <Maintenance />
        )}


        {activeTab === 'sensors' && (
          <Sensors />
        )}


        {activeTab === 'ai-insights' && (
          <AIInsights />
        )}


        {activeTab === 'simulation' && (
          <Simulation />
        )}

      </main>

    </div>
  );
}


export default App;