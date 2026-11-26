import { useCallback, useEffect, useState } from 'react';
import { Calendar, Clock, Menu, Radio, WifiOff } from 'lucide-react';
import type {
  DataSourceMode,
  MaintenanceRecord,
  NavSection,
  SensorSettings,
  SystemStatePayload,
  TelemetryPoint,
  TimeRangeFilter,
} from './types/airskin';
import {
  buildClientSimulationPoint,
  createInitialClientState,
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
import { AnalisisDataPage } from './pages/AnalisisDataPage';
import { PemeliharaanFilterPage } from './pages/PemeliharaanFilterPage';
import { LaporanPage } from './pages/LaporanPage';
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

  // Jam & tanggal real-time di header atas
  useEffect(() => {
    const timer = window.setInterval(() => setNowClock(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const fetchState = useCallback(async () => {
    try {
      const resp = await fetch('/api/system/state');
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

  // Step Simulasi Sistem tiap 3 detik saat simulasi aktif & tidak dijeda
  useEffect(() => {
    if (!state.simulation.running || state.simulation.paused) return;
    const stepTimer = window.setInterval(async () => {
      if (backendAvailable) {
        try {
          await fetch('/api/simulation/step', { method: 'POST' });
          await fetchState();
          return;
        } catch {
          // lanjut ke pembaruan lokal
        }
      }

      setState((prev) => {
        if (!prev.simulation.running || prev.simulation.paused) return prev;
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
          simulation: {
            ...prev.simulation,
            elapsedSeconds: prev.simulation.elapsedSeconds + 3,
          },
        };
      });
    }, 3000);
    return () => window.clearInterval(stepTimer);
  }, [state.simulation.running, state.simulation.paused, backendAvailable, fetchState]);

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
    resume?: boolean;
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
          paused: false,
          initialPm25Inlet: params.initialPm25Inlet,
          initialPm10Inlet: params.initialPm10Inlet,
          efficiencyPm25Pct: params.efficiencyPm25Pct,
          efficiencyPm10Pct: params.efficiencyPm10Pct,
          startedAt: nowIso,
          elapsedSeconds: 0,
        },
        deviceStatus: {
          ...prev.deviceStatus,
          fanStatus: prev.deviceConnected ? 'Aktif' : 'Siaga',
        },
      }));
    } finally {
      setBusy(false);
    }
  };

  const handlePauseSimulation = async () => {
    setBusy(true);
    try {
      if (backendAvailable) {
        const resp = await fetch('/api/simulation/pause', { method: 'POST' });
        if (resp.ok) {
          await fetchState();
          return;
        }
      }
      setState((prev) => ({
        ...prev,
        simulation: { ...prev.simulation, running: false, paused: true },
        deviceStatus: {
          ...prev.deviceStatus,
          fanStatus: prev.deviceConnected ? 'Aktif' : 'Terputus',
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
          paused: false,
          initialPm25Inlet: 62.0,
          initialPm10Inlet: 98.0,
          efficiencyPm25Pct: 45.0,
          efficiencyPm10Pct: 55.0,
          startedAt: seeded[0]?.timestamp || new Date().toISOString(),
          elapsedSeconds: 0,
        },
        deviceStatus: {
          ...prev.deviceStatus,
          fanStatus: prev.deviceConnected ? 'Aktif' : 'Terputus',
        },
      }));
    } finally {
      setBusy(false);
    }
  };

  const handleAddMaintenanceRecord = async (
    payload: Omit<MaintenanceRecord, 'id' | 'tanggal'>,
  ) => {
    setBusy(true);
    try {
      if (backendAvailable) {
        const resp = await fetch('/api/maintenance/record', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (resp.ok) {
          await fetchState();
          return;
        }
      }
      const nowIso = new Date().toISOString();
      const rec: MaintenanceRecord = {
        ...payload,
        id: `mnt-local-${Date.now()}`,
        tanggal: nowIso,
      };
      setState((prev) => ({
        ...prev,
        maintenanceRecords: [rec, ...prev.maintenanceRecords],
        lastFilterInspectionAt:
          payload.jenis === 'pemeriksaan' ? nowIso : prev.lastFilterInspectionAt,
      }));
    } finally {
      setBusy(false);
    }
  };

  const handleMarkFilterInspected = async () => {
    setBusy(true);
    try {
      if (backendAvailable) {
        const resp = await fetch('/api/maintenance/inspect', { method: 'POST' });
        if (resp.ok) {
          await fetchState();
          return;
        }
      }
      const nowIso = new Date().toISOString();
      const rec: MaintenanceRecord = {
        id: `mnt-local-${Date.now()}`,
        tanggal: nowIso,
        komponen: 'Media Serabut Kelapa',
        tindakan: 'Pemeriksaan Fisik Filter & Lapisan Nonwoven',
        catatan: 'Filter telah diperiksa secara visual untuk memastikan susunan media tetap baik.',
        petugas: 'Operator Pemantauan',
        jenis: 'pemeriksaan',
      };
      setState((prev) => ({
        ...prev,
        lastFilterInspectionAt: nowIso,
        maintenanceRecords: [rec, ...prev.maintenanceRecords],
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
      setState((prev) => ({
        ...prev,
        connectionState: prev.deviceConnected ? 'Terhubung' : 'Menunggu koneksi',
        deviceStatus: {
          ...prev.deviceStatus,
          connectionState: prev.deviceConnected ? 'Terhubung' : 'Menunggu koneksi',
          dataTransmissionStatus: prev.deviceConnected ? 'Mengalir' : 'Menunggu',
        },
      }));
    } finally {
      setBusy(false);
    }
  };

  const handleSaveSettings = async (settings: SensorSettings) => {
    setBusy(true);
    try {
      if (backendAvailable) {
        const resp = await fetch('/api/device/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings),
        });
        if (resp.ok) {
          await fetchState();
          return;
        }
      }
      setState((prev) => ({
        ...prev,
        sensorSettings: settings,
        deviceStatus: { ...prev.deviceStatus, mqttTopic: settings.topikMqtt },
      }));
    } finally {
      setBusy(false);
    }
  };

  const handleSendTestTelemetry = async (payload: {
    pm25Inlet: number;
    pm25Outlet: number;
    pm10Inlet: number;
    pm10Outlet: number;
  }) => {
    setBusy(true);
    try {
      if (backendAvailable) {
        const resp = await fetch('/api/telemetry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (resp.ok) {
          await fetchState();
          return;
        }
      }
      const nowIso = new Date().toISOString();
      const pt: TelemetryPoint = {
        id: `esp-local-${Date.now()}`,
        timestamp: nowIso,
        pm25Inlet: Number(payload.pm25Inlet.toFixed(1)),
        pm25Outlet: Number(payload.pm25Outlet.toFixed(1)),
        pm10Inlet: Number(payload.pm10Inlet.toFixed(1)),
        pm10Outlet: Number(payload.pm10Outlet.toFixed(1)),
        source: 'esp32',
      };
      setState((prev) => ({
        ...prev,
        dataSourceMode: 'aktual',
        deviceConnected: true,
        connectionState: 'Terhubung',
        lastUpdatedAt: nowIso,
        liveDurationSeconds: prev.liveDurationSeconds + 5,
        liveTelemetry: [...prev.liveTelemetry, pt].slice(-500),
        deviceStatus: {
          ...prev.deviceStatus,
          connectionState: 'Terhubung',
          esp32Connected: true,
          pmSensorConnected: true,
          fanStatus: 'Aktif',
          dataTransmissionStatus: 'Mengalir',
          lastDataReceived: nowIso,
        },
      }));
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
        liveDurationSeconds: 0,
        deviceStatus: {
          ...prev.deviceStatus,
          connectionState: 'Terputus',
          esp32Connected: false,
          pmSensorConnected: false,
          fanStatus: 'Terputus',
          dataTransmissionStatus: 'Terputus',
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
                <h1 className="font-display text-base sm:text-lg font-semibold text-[#103B66] truncate">
                  AIRSKIN COIR
                </h1>
                <p className="text-[11px] text-[#176FAF] truncate">
                  Sistem Pemantauan Filtrasi Udara Berbasis IoT
                </p>
              </div>
            </div>

            {/* Tanggal, Jam, & Status Koneksi */}
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
                      : state.connectionState === 'Menunggu koneksi'
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
                onNavigate={setActiveSection}
              />
            )}
            {activeSection === 'pemantauan' && (
              <PemantauanUdaraPage
                state={state}
                timeRange={timeRange}
                onChangeTimeRange={setTimeRange}
              />
            )}
            {activeSection === 'panel' && <PanelFiltrasiPage state={state} />}
            {activeSection === 'simulasi' && (
              <SimulasiSistemPage
                state={state}
                onStartSimulation={handleStartSimulation}
                onPauseSimulation={handlePauseSimulation}
                onResetSimulation={handleResetSimulation}
                busy={busy}
              />
            )}
            {activeSection === 'kinerja' && <KinerjaPenyaringanPage state={state} />}
            {activeSection === 'analisis' && <AnalisisDataPage state={state} />}
            {activeSection === 'pemeliharaan' && (
              <PemeliharaanFilterPage
                state={state}
                onAddRecord={handleAddMaintenanceRecord}
                onMarkInspected={handleMarkFilterInspected}
                busy={busy}
              />
            )}
            {activeSection === 'laporan' && <LaporanPage state={state} />}
            {activeSection === 'pengaturan' && (
              <PengaturanPerangkatPage
                state={state}
                onRequestConnect={handleRequestConnect}
                onRefreshData={fetchState}
                onSaveSettings={handleSaveSettings}
                onSendTestTelemetry={handleSendTestTelemetry}
                onDisconnectDevice={handleDisconnectDevice}
                busy={busy}
              />
            )}
          </div>
        </main>

        {/* Footer Tagline */}
        <footer className="border-t border-[#CBE7FA] bg-white/75 px-4 sm:px-6 lg:px-8 py-3">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs text-[#103B66]/70">
            <span>AIRSKIN COIR — Pantau Udara, Optimalkan Filtrasi, Bangun Lingkungan Lebih Baik.</span>
            <span className="font-mono text-[11px]">Dashboard Prototipe IoT</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
