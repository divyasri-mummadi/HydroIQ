import React from 'react';
import {
  Activity,
  Droplet,
  Shield,
  Cpu,
  AlertTriangle,
  MapPin,
  Bell,
  Brain,
  Sparkles,
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const monitorItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: Activity,
    },
    {
      id: 'network-map',
      label: 'Network Map',
      icon: MapPin,
    },
    {
      id: 'leak-detection',
      label: 'Leak Detection',
      icon: AlertTriangle,
    },
    {
      id: 'water-quality',
      label: 'Water Quality',
      icon: Droplet,
    },
    {
      id: 'alerts',
      label: 'Alerts',
      icon: Bell,
    },
  ];

  const intelligenceItems = [
    {
      id: 'maintenance',
      label: 'Risk & Maintenance',
      icon: Shield,
    },
    {
      id: 'ai-insights',
      label: 'AI Insights',
      icon: Sparkles,
    },
    {
      id: 'leak-localization',
      label: 'Leak Localization',
      icon: MapPin,
    },
  ];

  const systemItems = [
    {
      id: 'sensors',
      label: 'Sensors & Devices',
      icon: Cpu,
    },
    {
      id: 'simulation',
      label: 'Digital Twin',
      icon: Brain,
    },
  ];

  const renderItems = (items) =>
    items.map((item) => {
      const Icon = item.icon;

      return (
        <button
          key={item.id}
          onClick={() => setActiveTab(item.id)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
            activeTab === item.id
              ? 'bg-accentTeal/10 text-accentTeal border-l-4 border-accentTeal'
              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
          }`}
        >
          <Icon className="w-4 h-4" />
          {item.label}
        </button>
      );
    });

  return (
    <div className="w-64 bg-cardBg min-h-screen p-4 border-r border-gray-800">

      {/* BRAND */}
      <div className="flex items-center gap-2 mb-8 px-2">
        <Droplet className="text-accentTeal w-8 h-8" />

        <div>
          <h1 className="font-bold text-lg tracking-wide">
            HydroIQ
          </h1>

          <p className="text-xs text-gray-400">
            BY CODYSSEY
          </p>
        </div>
      </div>

      <nav className="space-y-6">

        {/* MONITOR */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase px-3 mb-2">
            Monitor
          </p>

          <div className="space-y-1">
            {renderItems(monitorItems)}
          </div>
        </div>

        {/* INTELLIGENCE */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase px-3 mb-2">
            Intelligence
          </p>

          <div className="space-y-1">
            {renderItems(intelligenceItems)}
          </div>
        </div>

        {/* SYSTEM */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase px-3 mb-2">
            System
          </p>

          <div className="space-y-1">
            {renderItems(systemItems)}
          </div>
        </div>

      </nav>
    </div>
  );
}