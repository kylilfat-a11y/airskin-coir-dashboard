import React, { useCallback, useEffect, useState } from 'react';
import { Menu, RefreshCw } from 'lucide-react';
import type {
  FilterConfigKey,
  MaintenanceStatus,
  NavSection,
  SystemConfig,
  SystemStatePayload,
} from './types/airskin';
import { Sidebar } from './components/Sidebar';
import { OverviewPage } from './pages/OverviewPage';
import { LiveMonitoringPage } from './pages/LiveMonitoringPage';
import { FacadePanelsPage } from './pages/FacadePanelsPage';
import { AirQualityAnalyticsPage } from './pages/AirQualityAnalyticsPage';
import { FilterPerformancePage } from './pages/FilterPerformancePage';
import { MaintenancePage } from './pages/MaintenancePage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  const [activeSection, setActiveSection] = useState<NavSection>('ringkasan');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [systemState, setSystemState] = useState<SystemStatePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nowClock, setNowClock] = useState(() => new Date());

  const fetchState = useCallback(async () => {
    try {
      const resp = await fetch('/api/system/state');
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }
      const data = (await resp.json()) as SystemStatePayload;
      setSystemState(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal terhubung ke server telemetri');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  useEffect(() => {
    const timer = window.setInterval(() => setNowClock(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const intervalMs = (systemState?.config.refreshIntervalSec ?? 10) * 1000;
    const poller = window.setInterval(fetchState, intervalMs);
    return () => window.clearInterval(poller);
  }, [fetchState, systemState?.config.refreshIntervalSec]);

  async function handleToggleMode(mode: 'menunggu_koneksi' | 'data_simulasi') {
    await fetch('/api/system/mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    });
    await fetchState();
  }

  async function handleSendTestPacket(payload: {
    pm25Inlet: number;
    pm25Outlet: number | null;
    pm10Inlet: number;
    pm10Outlet: number | null;
  }) {
    await fetch('/api/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        panelId: systemState?.config.activePanelId || 'AC-01',
      }),
    });
    await fetchState();
  }

  async function handleSaveConfig(patch: Partial<SystemConfig>) {
    await fetch('/api/system/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    await fetchState();
  }

  async function handleAddTrial(trial: {
    configKey: FilterConfigKey;
    pm25Inlet: number;
    pm25Outlet: number;
    pm10Inlet: number;
    pm10Outlet: number;
    notes: string;
  }) {
    await fetch('/api/experiments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trial),
    });
    await fetchState();
  }

  async function handleLoadSampleTrials() {
    await fetch('/api/experiments/load-sample', { method: 'POST' });
    await fetchState();
  }

  async function handleClearTrials() {
    await fetch('/api/experiments', { method: 'DELETE' });
    await fetchState();
  }

  async function handleAddMaintenance(record: {
    panelId: string;
    inspector: string;
    recordType: 'Pemeriksaan Rutin' | 'Penggantian Media' | 'Audit Kelembapan & Casing';
    coirCondition: string;
    nonwovenCondition: string;
    status: MaintenanceStatus;
    notes: string;
  }) {
    await fetch('/api/maintenance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    await fetchState();
  }

  const formattedDate = nowClock.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const formattedTime = nowClock.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const statusKoneksi =
    systemState?.mode === 'terhubung_esp32'
      ? 'Terhubung'
      : systemState?.mode === 'data_simulasi'
        ? 'DATA SIMULASI (Menunggu Koneksi)'
        : 'Menunggu koneksi';

  return (
    <div className="min-h-screen flex bg-[#EAF6FF] text-[#103B66]">
      <Sidebar
        activeSection={activeSection}
        onNavigate={setActiveSection}
        mode={systemState?.mode || 'menunggu_koneksi'}
        connectionState={systemState?.connectionState || 'Menunggu koneksi'}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Atas: Nama Aplikasi, Tanggal, Jam, Status Koneksi */}
        <header className="sticky top-0 z-30 border-b border-[#B9E0F8] bg-white/95 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="rounded-lg p-1.5 text-[#103B66] hover:bg-[#EAF6FF] lg:hidden"
                aria-label="Buka menu navigasi"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#103B66]/80">
                <span className="font-[Poppins] font-semibold text-sm text-[#103B66]">
                  AIRSKIN COIR
                </span>
                <span aria-hidden="true" className="text-[#82C5EF] hidden sm:inline">·</span>
                <span className="hidden sm:inline text-[#176FAF] font-medium">
                  Sistem Pemantauan Filtrasi Udara Berbasis IoT
                </span>
                <span aria-hidden="true" className="text-[#82C5EF]">·</span>
                <span className="font-mono tabular-nums text-[#103B66]">
                  {formattedDate} · {formattedTime}
                </span>
                <span aria-hidden="true" className="text-[#82C5EF] hidden md:inline">·</span>
                <span
                  className={`font-semibold hidden md:inline ${
                    systemState?.mode === 'terhubung_esp32'
                      ? 'text-[#458B6D]'
                      : systemState?.mode === 'data_simulasi'
                        ? 'text-[#A68338]'
                        : 'text-[#176FAF]'
                  }`}
                >
                  Status: {statusKoneksi}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={fetchState}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#B9E0F8] bg-[#F5FAFF] px-3 py-1.5 text-xs font-medium text-[#176FAF] hover:bg-[#EAF6FF] transition-colors whitespace-nowrap shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Perbarui
            </button>
          </div>
        </header>

        {/* Konten Utama Berdasarkan Menu Terpilih */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-[1360px] w-full mx-auto">
          {loading && !systemState ? (
            <div className="space-y-4">
              <div className="h-10 w-64 rounded-xl bg-[#D7ECFB] animate-pulse" />
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-32 rounded-2xl bg-[#D7ECFB] animate-pulse" />
                ))}
              </div>
              <div className="h-64 w-full rounded-2xl bg-[#D7ECFB] animate-pulse" />
            </div>
          ) : error && !systemState ? (
            <div className="airskin-card p-6 text-center space-y-3">
              <p className="font-[Poppins] text-base font-semibold text-[#103B66]">
                Layanan Telemetri Tidak Terjangkau
              </p>
              <p className="text-xs text-[#103B66]/70">{error}</p>
              <button
                type="button"
                onClick={fetchState}
                className="rounded-xl bg-[#176FAF] px-4 py-2 text-xs font-medium text-white"
              >
                Coba Hubungkan Ulang
              </button>
            </div>
          ) : systemState ? (
            <>
              {activeSection === 'ringkasan' && (
                <OverviewPage
                  state={systemState}
                  onNavigate={setActiveSection}
                  onToggleMode={handleToggleMode}
                />
              )}
              {activeSection === 'pemantauan' && (
                <LiveMonitoringPage
                  state={systemState}
                  onToggleMode={handleToggleMode}
                  onSendTestPacket={handleSendTestPacket}
                />
              )}
              {activeSection === 'panel' && <FacadePanelsPage state={systemState} />}
              {activeSection === 'kinerja' && (
                <FilterPerformancePage
                  state={systemState}
                  onAddTrial={handleAddTrial}
                  onLoadSampleTrials={handleLoadSampleTrials}
                  onClearTrials={handleClearTrials}
                />
              )}
              {activeSection === 'analisis' && <AirQualityAnalyticsPage state={systemState} />}
              {activeSection === 'pemeliharaan' && (
                <MaintenancePage
                  state={systemState}
                  onAddRecord={handleAddMaintenance}
                />
              )}
              {activeSection === 'laporan' && <ReportsPage state={systemState} />}
              {activeSection === 'pengaturan' && (
                <SettingsPage
                  state={systemState}
                  onSaveConfig={handleSaveConfig}
                  onRefreshState={fetchState}
                  onSendTestPacket={handleSendTestPacket}
                />
              )}
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}
