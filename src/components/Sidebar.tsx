import React from 'react';
import {
  Activity,
  BarChart3,
  Building2,
  ClipboardCheck,
  FileSpreadsheet,
  LayoutDashboard,
  Settings,
  SlidersHorizontal,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import type { DataSourceMode, NavSection } from '../types/airskin';
import { BrandLogo } from './BrandLogo';

interface SidebarProps {
  activeSection: NavSection;
  onNavigate: (section: NavSection) => void;
  mode: DataSourceMode;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS: Array<{
  id: NavSection;
  label: string;
  icon: React.FC<{ className?: string }>;
}> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'live', label: 'Live Monitoring', icon: Activity },
  { id: 'panels', label: 'Facade Panels', icon: Building2 },
  { id: 'analytics', label: 'Air Quality Analytics', icon: BarChart3 },
  { id: 'performance', label: 'Filter Performance', icon: SlidersHorizontal },
  { id: 'maintenance', label: 'Maintenance', icon: ClipboardCheck },
  { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onNavigate,
  mode,
  mobileOpen,
  onCloseMobile,
}) => {
  const isConnected = mode === 'live_esp32' || mode === 'demo_simulation';

  const statusText =
    mode === 'live_esp32'
      ? 'ESP32 Connected'
      : mode === 'demo_simulation'
        ? 'Demo Simulation'
        : 'Awaiting ESP32';

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#103B66]/50 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col bg-[#103B66] text-white transition-transform duration-200 ease-out lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Primary Navigation"
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
          <div className="flex items-center gap-3 min-w-0">
            <BrandLogo className="w-9 h-9 shrink-0" />
            <div className="min-w-0">
              <div className="font-[Poppins] text-base font-semibold tracking-tight text-white whitespace-nowrap">
                AIRSKIN COIR
              </div>
              <div className="text-[11px] text-[#B9E0F8]/80 truncate">
                Smart Facades · Cleaner Air
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-lg p-1.5 text-[#B9E0F8] hover:bg-white/10 lg:hidden"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onNavigate(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#82C5EF] ${
                  isActive
                    ? 'bg-[#429EDB] text-white shadow-sm'
                    : 'text-[#EAF6FF]/80 hover:bg-[#176FAF]/50 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#82C5EF]'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Status, Profile & Version */}
        <div className="border-t border-white/10 px-4 py-4 space-y-3.5 bg-[#0C2F52]/60">
          {/* Device connection status */}
          <button
            type="button"
            onClick={() => {
              onNavigate('settings');
              onCloseMobile();
            }}
            className="w-full flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-left hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {isConnected ? (
                <Wifi
                  className={`w-4 h-4 shrink-0 ${
                    mode === 'live_esp32' ? 'text-[#72B89A]' : 'text-[#D7B978]'
                  }`}
                />
              ) : (
                <WifiOff className="w-4 h-4 shrink-0 text-[#B9E0F8]/70" />
              )}
              <div className="min-w-0">
                <div className="text-xs font-medium text-white truncate">{statusText}</div>
                <div className="text-[11px] font-mono text-[#B9E0F8]/75 truncate">
                  ESP32-WROOM-32E
                </div>
              </div>
            </div>
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-3 px-1">
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-[#429EDB]/50 bg-[#176FAF] shrink-0">
              <img
                src="/src/assets/images/user_profile_engineer_1795694950742.jpg"
                alt="Kaylilla Faticha"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white truncate">Kaylilla Faticha</div>
              <div className="text-[11px] text-[#B9E0F8]/75 truncate">Environmental Systems Lead</div>
            </div>
          </div>

          <div className="flex items-center justify-between px-1 pt-1 border-t border-white/10 text-[11px] text-[#B9E0F8]/65">
            <span>Prototype Dashboard</span>
            <span className="font-mono">AC-SYS</span>
          </div>
        </div>
      </aside>
    </>
  );
};
