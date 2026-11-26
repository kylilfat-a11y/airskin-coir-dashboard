import React from 'react';
import {
  Activity,
  BookOpen,
  Cpu,
  Layers,
  LayoutDashboard,
  PlayCircle,
  X,
} from 'lucide-react';
import type { DashboardMode, NavSection } from '../types/airskin';
import { BrandLogo } from './BrandLogo';
import engineerAvatar from '../assets/images/user_profile_engineer_1795694950742.jpg';

interface SidebarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  deviceConnected: boolean;
  mode: DashboardMode;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS: { id: NavSection; label: string; sublabel: string; icon: React.ComponentType<{ className?: string }> }[] = [
  {
    id: 'overview',
    label: 'Ringkasan Kualitas Udara',
    sublabel: 'Air Quality Overview',
    icon: LayoutDashboard,
  },
  {
    id: 'visualization',
    label: 'Visualisasi Udara',
    sublabel: 'Air Quality Visualization',
    icon: Activity,
  },
  {
    id: 'mechanism',
    label: 'Mekanisme Kerja',
    sublabel: 'Working Mechanism',
    icon: Layers,
  },
  {
    id: 'simulation',
    label: 'Mode Simulasi',
    sublabel: 'Simulation Mode',
    icon: PlayCircle,
  },
  {
    id: 'benchmark',
    label: 'Benchmark Literatur',
    sublabel: 'Literature Benchmark',
    icon: BookOpen,
  },
  {
    id: 'devices',
    label: 'Status Perangkat & Sensor',
    sublabel: 'Device & Sensor Status',
    icon: Cpu,
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  deviceConnected,
  mode,
  mobileOpen,
  onCloseMobile,
}) => {
  const sidebarBody = (
    <aside className="flex h-full w-72 flex-col bg-[#103B66] text-white border-r border-[#176FAF]/40 select-none">
      {/* Brand Block */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3 min-w-0">
          <BrandLogo className="w-10 h-10 shrink-0" />
          <div className="min-w-0">
            <p className="font-display text-base font-semibold tracking-wide text-white truncate">
              AIRSKIN COIR
            </p>
            <p className="text-[11px] leading-tight text-[#B9E0F8]/90 truncate">
              Smart Air Filtration System
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-[#B9E0F8] hover:bg-white/10 hover:text-white transition-colors"
          aria-label="Tutup navigasi"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5" aria-label="Navigasi Utama">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectSection(item.id);
                onCloseMobile();
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all ${
                active
                  ? 'bg-[#429EDB] text-white shadow-sm'
                  : 'text-[#B9E0F8] hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-[#82C5EF]'}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-tight truncate">{item.label}</p>
                <p className={`text-[11px] leading-tight mt-0.5 truncate ${active ? 'text-white/85' : 'text-[#82C5EF]/75'}`}>
                  {item.sublabel}
                </p>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Bottom Device Status & Prototype Profile */}
      <div className="px-4 py-4 border-t border-white/10 space-y-3 bg-[#0D3156]">
        <div className="rounded-xl border border-white/15 bg-white/5 px-3.5 py-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#B9E0F8]">Perangkat ESP32</span>
            <span
              className={`font-medium flex items-center gap-1.5 ${
                deviceConnected ? 'text-[#72B89A]' : 'text-[#D7B978]'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  deviceConnected ? 'bg-[#72B89A]' : 'bg-[#D7B978]'
                }`}
              />
              {deviceConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#B9E0F8]">Mode Aktif</span>
            <span className="font-mono text-[11px] text-white">
              {mode === 'live' ? 'Live Data' : 'Simulation'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 px-1">
          <img
            src={engineerAvatar}
            alt="Tim Riset AIRSKIN COIR"
            referrerPolicy="no-referrer"
            className="w-9 h-9 rounded-lg object-cover border border-[#82C5EF]/40 shrink-0"
          />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">Tim Riset Fasad</p>
            <p className="text-[11px] text-[#82C5EF] truncate">Kapuk • Jerami Padi • Nonwoven</p>
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden lg:block lg:shrink-0 h-screen sticky top-0">{sidebarBody}</div>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#103B66]/55 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full">{sidebarBody}</div>
        </div>
      )}
    </>
  );
};
