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
import type { DataSourceMode, DeviceConnectionState, NavSection } from '../types/airskin';
import { BrandLogo } from './BrandLogo';

interface SidebarProps {
  activeSection: NavSection;
  onNavigate: (section: NavSection) => void;
  mode: DataSourceMode;
  connectionState: DeviceConnectionState;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS: Array<{
  id: NavSection;
  label: string;
  icon: React.FC<{ className?: string }>;
}> = [
  { id: 'ringkasan', label: 'Ringkasan', icon: LayoutDashboard },
  { id: 'pemantauan', label: 'Pemantauan Udara', icon: Activity },
  { id: 'panel', label: 'Panel Filtrasi', icon: Building2 },
  { id: 'kinerja', label: 'Kinerja Penyaringan', icon: SlidersHorizontal },
  { id: 'analisis', label: 'Analisis Data', icon: BarChart3 },
  { id: 'pemeliharaan', label: 'Pemeliharaan Filter', icon: ClipboardCheck },
  { id: 'laporan', label: 'Laporan', icon: FileSpreadsheet },
  { id: 'pengaturan', label: 'Pengaturan Perangkat', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onNavigate,
  mode,
  connectionState,
  mobileOpen,
  onCloseMobile,
}) => {
  const isConnected = connectionState === 'Terhubung';

  const statusText =
    mode === 'terhubung_esp32'
      ? 'Terhubung (ESP32)'
      : mode === 'data_simulasi'
        ? 'DATA SIMULASI'
        : 'Menunggu koneksi';

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#103B66]/50 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[268px] flex-col bg-[#103B66] text-white transition-transform duration-200 ease-out lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Navigasi Utama"
      >
        {/* Logo & Identitas Aplikasi */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
          <div className="flex items-center gap-3 min-w-0">
            <BrandLogo className="w-9 h-9 shrink-0" />
            <div className="min-w-0">
              <div className="font-[Poppins] text-base font-semibold tracking-tight text-white whitespace-nowrap">
                AIRSKIN COIR
              </div>
              <div className="text-[11px] text-[#B9E0F8]/85 leading-tight">
                Pemantauan Filtrasi IoT
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-lg p-1.5 text-[#B9E0F8] hover:bg-white/10 lg:hidden"
            aria-label="Tutup menu navigasi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 8 Menu Navigasi */}
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
                    : 'text-[#EAF6FF]/85 hover:bg-[#176FAF]/55 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#82C5EF]'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Status Koneksi ESP32 & Profil Operator */}
        <div className="border-t border-white/10 px-4 py-4 space-y-3.5 bg-[#0C2F52]/65">
          <button
            type="button"
            onClick={() => {
              onNavigate('pengaturan');
              onCloseMobile();
            }}
            className="w-full flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-left hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {isConnected ? (
                <Wifi className="w-4 h-4 shrink-0 text-[#72B89A]" />
              ) : (
                <WifiOff
                  className={`w-4 h-4 shrink-0 ${
                    mode === 'data_simulasi' ? 'text-[#D7B978]' : 'text-[#B9E0F8]/75'
                  }`}
                />
              )}
              <div className="min-w-0">
                <div className="text-xs font-medium text-white truncate">{statusText}</div>
                <div className="text-[11px] font-mono text-[#B9E0F8]/75 truncate">
                  ESP32-WROOM-32E
                </div>
              </div>
            </div>
          </button>

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
              <div className="text-[11px] text-[#B9E0F8]/75 truncate">Operator Sistem IoT</div>
            </div>
          </div>

          <div className="flex items-center justify-between px-1 pt-1 border-t border-white/10 text-[11px] text-[#B9E0F8]/65">
            <span>Dashboard Prototipe</span>
            <span className="font-mono">AC-SYS</span>
          </div>
        </div>
      </aside>
    </>
  );
};
