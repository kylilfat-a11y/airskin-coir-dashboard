import React from 'react';
import {
  Activity,
  BarChart3,
  FileSpreadsheet,
  Gauge,
  Layers,
  LayoutDashboard,
  PlayCircle,
  Settings,
  Wrench,
  X,
} from 'lucide-react';
import type { ConnectionState, DataSourceMode, NavSection } from '../types/airskin';
import { BrandLogo } from './BrandLogo';
import engineerAvatar from '../assets/images/user_profile_engineer_1795694950742.jpg';

interface SidebarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  connectionState: ConnectionState;
  dataSourceMode: DataSourceMode;
  mobileOpen: boolean;
  desktopVisible: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS: {
  id: NavSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'ringkasan', label: 'Ringkasan', icon: LayoutDashboard },
  { id: 'pemantauan', label: 'Pemantauan Udara', icon: Activity },
  { id: 'panel', label: 'Panel Filtrasi', icon: Layers },
  { id: 'simulasi', label: 'Simulasi Sistem', icon: PlayCircle },
  { id: 'kinerja', label: 'Kinerja Penyaringan', icon: Gauge },
  { id: 'analisis', label: 'Analisis Data', icon: BarChart3 },
  { id: 'pemeliharaan', label: 'Pemeliharaan Filter', icon: Wrench },
  { id: 'laporan', label: 'Laporan', icon: FileSpreadsheet },
  { id: 'pengaturan', label: 'Pengaturan Perangkat', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  connectionState,
  dataSourceMode,
  mobileOpen,
  desktopVisible,
  onCloseMobile,
}) => {
  const statusColor =
    connectionState === 'Terhubung'
      ? 'text-[#72B89A]'
      : connectionState === 'Menunggu koneksi'
        ? 'text-[#82C5EF]'
        : 'text-[#D7B978]';

  const statusDot =
    connectionState === 'Terhubung'
      ? 'bg-[#72B89A]'
      : connectionState === 'Menunggu koneksi'
        ? 'bg-[#82C5EF] animate-pulse'
        : 'bg-[#D7B978]';

  const sidebarBody = (
    <aside className="flex h-full w-72 flex-col bg-[#103B66] text-white border-r border-[#176FAF]/40 select-none">
      {/* Identitas Aplikasi */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3 min-w-0">
          <BrandLogo className="w-10 h-10 shrink-0" />
          <div className="min-w-0">
            <p className="font-display text-base font-semibold tracking-wide text-white truncate">
              AIRSKIN COIR
            </p>
            <p className="text-[11px] leading-tight text-[#B9E0F8]/90 truncate">
              Sistem Pemantauan Filtrasi Udara
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-[#B9E0F8] hover:bg-white/10 hover:text-white transition-colors"
          aria-label="Tutup menu navigasi"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Menu Navigasi */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Navigasi Utama">
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
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all ${
                active
                  ? 'bg-[#429EDB] text-white shadow-sm'
                  : 'text-[#B9E0F8] hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-[#82C5EF]'}`} />
              <span className="text-sm font-medium leading-tight truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Status Perangkat & Profil Ringkas */}
      <div className="px-4 py-4 border-t border-white/10 space-y-3 bg-[#0D3156]">
        <div className="rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#B9E0F8]">Status ESP32</span>
            <span className={`font-medium flex items-center gap-1.5 ${statusColor}`}>
              <span className={`w-2 h-2 rounded-full ${statusDot}`} />
              {connectionState}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#B9E0F8]">Sumber Data</span>
            <span className="font-mono text-[11px] text-white">
              {dataSourceMode === 'aktual' ? 'Sensor Aktual' : 'DATA SIMULASI'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 px-1">
          <img
            src={engineerAvatar}
            alt="Operator Pemantauan"
            referrerPolicy="no-referrer"
            className="w-9 h-9 rounded-lg object-cover border border-[#82C5EF]/40 shrink-0"
          />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">Operator Fasad</p>
            <p className="text-[11px] text-[#82C5EF] truncate">Panel Prototipe Dashboard</p>
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {desktopVisible && (
        <div className="hidden lg:block lg:shrink-0 h-screen sticky top-0">{sidebarBody}</div>
      )}
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
