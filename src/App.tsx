import { useCallback, useEffect, useState } from 'react';
import { Calendar, Clock, Menu, Radio, WifiOff } from 'lucide-react';
import type {
  DataSourceMode,
  NavSection,
  SystemStatePayload,
  TimeRangeFilter,
} from './types/airskin';
import {
  buildClientSimulationPoint,
  createInitialClientState,
  fetchWithTimeout,
  parseJsonIfAvailable,
  seedClientSimulation,
} from './utils/clientFallbackState';
import { BrandLogo } from './components/BrandLogo';
import { Sidebar } from './components/Sidebar';
import { RingkasanPage } from './pages/RingkasanPage';
import { PemantauanUdaraPage } from './pages/PemantauanUdaraPage';
import { PanelFiltrasiPage } from './pages/PanelFiltrasiPage';
import { SimulasiSistemPage } from './pages/SimulasiSistemPage';
import { KinerjaPenyaringanPage } from './pages/KinerjaPenyaringanPage';
import { PengaturanPerangkatPage } from './pages/PengaturanPerangkatPage';

export default function App() {
  const [activeSection, setActiveSection] = useState<NavSection>('ringkasan');
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>('24h');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [state, setState] = useState<SystemStatePayload>(() => createInitialClientState());
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [nowClock, setNowClock] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNowClock(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const fetchState = useCallback(async () => {
    try {
      const resp = await fetchWithTimeout('/api/system/state');
      const data = await parseJsonIfAvailable<SystemStatePayload>(resp);
      if (data) {
        setBackendAvailable(true);
        setState(data);
      } else {
        setBackendAvailable(false);
      }
    } catch {
      setBackendAvailable(false);
    }
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  useEffect(() => {
    if (backendAvailable !== true) return;
    const poll = window.setInterval(fetchState, 3000);
    return () => window.clearInterval(poll);
  }, [backendAvailable, fetchState]);

  useEffect(() => {
    if (!state.simulation.running) return;
    const stepTimer = window.setInterval(async () => {
      if (backendAvailable) {
        try {
          await fetchWithTimeout('/api/simulation/step', { method: 'POST' });
          await fetchState();
          return;
        } catch {
          // lanjut ke pembaruan lokal agar simulasi tidak berhenti
        }
      }

      setState((prev) => {
        if (!prev.simulation.running) return prev;
        const idx = prev.simulationTelemetry.length;
        const nowIso = new Date().toISOString();
        const pt = buildClientSimulationPoint(
          idx,
          prev.simulation.initialPm25Inlet,
          prev.simulation.initialPm10Inlet,
          prev.simulation.efficiencyPm25Pct,
          prev.simulation.efficiencyPm10Pct,
          nowIso,
        );
        return {
          ...prev,
          lastUpdatedAt: prev.dataSourceMode === 'simulasi' ? nowIso : prev.lastUpdatedAt,
          simulationTelemetry: [...prev.simulationTelemetry, pt].slice(-240),
        };
      });
    }, 3000);
    return () => window.clearInterval(stepTimer);
  }, [state.simulation.running, backendAvailable, fetchState]);

  const handleToggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setMobileOpen((prev) => !prev);
    } else {
      setDesktopSidebarOpen((prev) => !prev);
    }
  };

  const handleChangeDataSource = async (mode: DataSourceMode) => {
    setBusy(true);
    try {
      if (backendAvailable) {
        const resp = await fetch('/api/system/mode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dataSourceMode: mode }),
        });
        if (resp.ok) {
          await fetchState();
          return;
        }
      }
      setState((prev) => ({ ...prev, dataSourceMode: mode }));
    } finally {
      setBusy(false);
    }
  };

  const handleStartSimulation = async (params: {
    initialPm25Inlet: number;
    initialPm10Inlet: number;
    efficiencyPm25Pct: number;
    efficiencyPm10Pct: number;
  }) => {
    setBusy(true);
    try {
      if (backendAvailable) {
        const resp = await fetch('/api/simulation/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        });
        if (resp.ok) {
          await fetchState();
          return;
        }
      }
      const nowIso = new Date().toISOString();
      const pt = buildClientSimulationPoint(
        0,
        params.initialPm25Inlet,
        params.initialPm10Inlet,
        params.efficiencyPm25Pct,
        params.efficiencyPm10Pct,
        nowIso,
      );
      setState((prev) => ({
        ...prev,
        simulationTelemetry: [pt],
        simulation: {
          running: true,
          initialPm25Inlet: params.initialPm25Inlet,
          initialPm10Inlet: params.initialPm10Inlet,
          efficiencyPm25Pct: params.efficiencyPm25Pct,
          efficiencyPm10Pct: params.efficiencyPm10Pct,
          startedAt: nowIso,
        },
      }));
    } finally {
      setBusy(false);
    }
  };

  const handleResetSimulation = async () => {
    setBusy(true);
    try {
      if (backendAvailable) {
        const resp = await fetch('/api/simulation/reset', { method: 'POST' });
        if (resp.ok) {
          await fetchState();
          return;
        }
      }
      const seeded = seedClientSimulation(62.0, 98.0, 45.0, 55.0);
      setState((prev) => ({
        ...prev,
        simulationTelemetry: seeded,
        simulation: {
          running: false,
          initialPm25Inlet: 62.0,
          initialPm10Inlet: 98.0,
          efficiencyPm25Pct: 45.0,
          efficiencyPm10Pct: 55.0,
          startedAt: seeded[0]?.timestamp || new Date().toISOString(),
        },
      }));
    } finally {
      setBusy(false);
    }
  };

  const handleRequestConnect = async () => {
    setBusy(true);
    try {
      if (backendAvailable) {
        const resp = await fetch('/api/device/connect-request', { method: 'POST' });
        if (resp.ok) {
          await fetchState();
          return;
        }
      }
      setState((prev) => {
        const nextStatus = prev.deviceConnected ? 'Terhubung' : 'Menunggu Koneksi';
        return {
          ...prev,
          connectionState: nextStatus,
          deviceStatus: {
            ...prev.deviceStatus,
            esp32Status: nextStatus,
            sensorPmStatus: nextStatus,
            kipasAcStatus: nextStatus,
          },
        };
      });
    } finally {
      setBusy(false);
    }
  };

  const handleDisconnectDevice = async () => {
    setBusy(true);
    try {
      if (backendAvailable) {
        await fetch('/api/device/disconnect', { method: 'POST' });
        await fetchState();
        return;
      }
      setState((prev) => ({
        ...prev,
        deviceConnected: false,
        connectionState: 'Terputus',
        liveTelemetry: [],
        deviceStatus: {
          esp32Status: 'Terputus',
          sensorPmStatus: 'Terputus',
          kipasAcStatus: 'Terputus',
          lastDataReceived: null,
        },
      }));
    } finally {
      setBusy(false);
    }
  };

  const tanggalStr = nowClock.toLocaleDateString('id-ID', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const jamStr = nowClock.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="min-h-screen bg-[#EAF6FF] text-[#103B66] flex">
      <Sidebar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        connectionState={state.connectionState}
        dataSourceMode={state.dataSourceMode}
        mobileOpen={mobileOpen}
        desktopVisible={desktopSidebarOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Header Atas */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-[#CBE7FA] px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={handleToggleSidebar}
                className="p-2 rounded-xl border border-[#B9E0F8] text-[#103B66] hover:bg-[#EAF6FF] transition-colors"
                aria-label="Buka atau tutup menu navigasi"
              >
                <Menu className="w-5 h-5" />
              </button>
              <BrandLogo className="w-9 h-9 shrink-0 lg:hidden" />
              <div className="min-w-0">
                <h1 className="font-display text-base sm:text-lg font-bold text-[#103B66] truncate">
                  AIRSKIN COIR
                </h1>
                <p className="text-[11px] text-[#176FAF] truncate">
                  Sistem Pemantauan Filtrasi Udara Berbasis IoT
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#103B66]/80 font-mono tabular-nums px-2.5 py-1.5 rounded-lg bg-[#F5FAFF] border border-[#DCEEFB]">
                <Calendar className="w-3.5 h-3.5 text-[#176FAF]" />
                <span>{tanggalStr}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#103B66]/85 font-mono tabular-nums px-2.5 py-1.5 rounded-lg bg-[#F5FAFF] border border-[#DCEEFB]">
                <Clock className="w-3.5 h-3.5 text-[#176FAF]" />
                <span>{jamStr}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-[#D4ECFC] bg-[#F8FCFF]">
                {state.connectionState === 'Terhubung' ? (
                  <Radio className="w-3.5 h-3.5 text-[#2F6F54]" />
                ) : (
                  <WifiOff className="w-3.5 h-3.5 text-[#9B7A2C]" />
                )}
                <span className="text-[#103B66]/70 hidden md:inline">Koneksi:</span>
                <span
                  className={`font-semibold ${
                    state.connectionState === 'Terhubung'
                      ? 'text-[#2F6F54]'
                      : state.connectionState === 'Menunggu Koneksi'
                        ? 'text-[#176FAF]'
                        : 'text-[#8A6D2E]'
                  }`}
                >
                  {state.connectionState}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Konten Utama */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto">
            {activeSection === 'ringkasan' && (
              <RingkasanPage
                state={state}
                onChangeDataSource={handleChangeDataSource}
              />
            )}
            {activeSection === 'pemantauan' && (
              <PemantauanUdaraPage
                state={state}
                timeRange={timeRange}
                onChangeTimeRange={setTimeRange}
              />
            )}
            {activeSection === 'panel' && <PanelFiltrasiPage />}
            {activeSection === 'simulasi' && (
              <SimulasiSistemPage
                state={state}
                onStartSimulation={handleStartSimulation}
                onResetSimulation={handleResetSimulation}
                busy={busy}
              />
            )}
            {activeSection === 'kinerja' && <KinerjaPenyaringanPage state={state} />}
            {activeSection === 'pengaturan' && (
              <PengaturanPerangkatPage
                state={state}
                onRequestConnect={handleRequestConnect}
                onRefreshData={fetchState}
                onDisconnectDevice={handleDisconnectDevice}
                busy={busy}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
