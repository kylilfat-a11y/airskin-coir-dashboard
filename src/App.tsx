import { useCallback, useEffect, useState } from 'react';
import { ArrowLeftRight, Clock, Menu, Radio, WifiOff } from 'lucide-react';
import type {
  DashboardMode,
  NavSection,
  SystemStatePayload,
  TelemetryPoint,
  TimeRangeFilter,
} from './types/airskin';
import { formatTimestamp } from './utils/airskinMetrics';
import {
  buildClientSimulationPoint,
  createInitialClientState,
  parseJsonIfAvailable,
  seedClientSimulation,
} from './utils/clientFallbackState';
import { BrandLogo } from './components/BrandLogo';
import { Sidebar } from './components/Sidebar';
import { OverviewPage } from './pages/OverviewPage';
import { VisualizationPage } from './pages/VisualizationPage';
import { MechanismPage } from './pages/MechanismPage';
import { SimulationPage } from './pages/SimulationPage';
import { BenchmarkPage } from './pages/BenchmarkPage';
import { DevicesPage } from './pages/DevicesPage';

export default function App() {
  const [activeSection, setActiveSection] = useState<NavSection>('overview');
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>('15m');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [state, setState] = useState<SystemStatePayload>(() => createInitialClientState());
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

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

  useEffect(() => {
    if (!state.simulation.running) return;
    const stepTimer = window.setInterval(async () => {
      if (backendAvailable) {
        try {
          await fetch('/api/simulation/step', { method: 'POST' });
          await fetchState();
          return;
        } catch {
          // fallback to local step if connection drops
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
          nowIso,
        );
        const nextSeries = [...prev.simulationTelemetry, pt].slice(-240);
        return {
          ...prev,
          lastUpdatedAt: prev.mode === 'simulation' ? nowIso : prev.lastUpdatedAt,
          simulationTelemetry: nextSeries,
          simulation: {
            ...prev.simulation,
            elapsedSeconds: prev.simulation.elapsedSeconds + 3,
          },
        };
      });
    }, 3000);
    return () => window.clearInterval(stepTimer);
  }, [state.simulation.running, backendAvailable, fetchState]);

  const handleToggleMode = async () => {
    if (busy) return;
    const nextMode: DashboardMode = state.mode === 'simulation' ? 'live' : 'simulation';
    setBusy(true);
    try {
      if (backendAvailable) {
        const resp = await fetch('/api/system/mode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: nextMode }),
        });
        if (resp.ok) {
          await fetchState();
          return;
        }
      }
      setState((prev) => ({
        ...prev,
        mode: nextMode,
        lastUpdatedAt:
          nextMode === 'live'
            ? prev.deviceStatus.lastDataReceived
            : prev.simulationTelemetry[prev.simulationTelemetry.length - 1]?.timestamp || null,
      }));
    } finally {
      setBusy(false);
    }
  };

  const handleStartSimulation = async (pm25: number, pm10: number) => {
    setBusy(true);
    try {
      if (backendAvailable) {
        const resp = await fetch('/api/simulation/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            initialPm25Inlet: pm25,
            initialPm10Inlet: pm10,
          }),
        });
        if (resp.ok) {
          await fetchState();
          return;
        }
      }

      const nowIso = new Date().toISOString();
      const firstPt = buildClientSimulationPoint(0, pm25, pm10, nowIso);
      setState((prev) => ({
        ...prev,
        mode: 'simulation',
        lastUpdatedAt: nowIso,
        simulationTelemetry: [firstPt],
        simulation: {
          running: true,
          initialPm25Inlet: pm25,
          initialPm10Inlet: pm10,
          startedAt: nowIso,
          elapsedSeconds: 0,
        },
        deviceStatus: {
          ...prev.deviceStatus,
          fanStatus: prev.deviceConnected ? 'Active' : 'Standby',
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
      const seeded = seedClientSimulation(58.0, 92.0);
      const nowIso = seeded[seeded.length - 1]?.timestamp || new Date().toISOString();
      setState((prev) => ({
        ...prev,
        lastUpdatedAt: prev.mode === 'simulation' ? nowIso : prev.lastUpdatedAt,
        simulationTelemetry: seeded,
        simulation: {
          running: false,
          initialPm25Inlet: 58.0,
          initialPm10Inlet: 92.0,
          startedAt: nowIso,
          elapsedSeconds: 0,
        },
        deviceStatus: {
          ...prev.deviceStatus,
          fanStatus: prev.deviceConnected ? 'Active' : 'Disconnected',
        },
      }));
    } finally {
      setBusy(false);
    }
  };

  const handleLocalTelemetryPacket = (packet: {
    pm25Inlet: number;
    pm25Outlet: number | null;
    pm10Inlet: number;
    pm10Outlet: number | null;
  }) => {
    const nowIso = new Date().toISOString();
    const pt: TelemetryPoint = {
      id: `esp-local-${Date.now()}`,
      timestamp: nowIso,
      pm25Inlet: Number(packet.pm25Inlet.toFixed(1)),
      pm25Outlet: packet.pm25Outlet !== null ? Number(packet.pm25Outlet.toFixed(1)) : null,
      pm10Inlet: Number(packet.pm10Inlet.toFixed(1)),
      pm10Outlet: packet.pm10Outlet !== null ? Number(packet.pm10Outlet.toFixed(1)) : null,
      source: 'esp32',
    };
    setState((prev) => ({
      ...prev,
      mode: 'live',
      deviceConnected: true,
      lastUpdatedAt: nowIso,
      liveDurationSeconds: prev.liveDurationSeconds + 3,
      liveTelemetry: [...prev.liveTelemetry, pt].slice(-500),
      deviceStatus: {
        ...prev.deviceStatus,
        esp32Connected: true,
        pmSensorConnected: true,
        fanStatus: 'Active',
        dataTransmissionStatus: 'Streaming',
        lastDataReceived: nowIso,
      },
    }));
  };

  const handleLocalDisconnect = () => {
    setState((prev) => ({
      ...prev,
      deviceConnected: false,
      liveDurationSeconds: 0,
      liveTelemetry: [],
      lastUpdatedAt:
        prev.mode === 'live'
          ? null
          : prev.simulationTelemetry[prev.simulationTelemetry.length - 1]?.timestamp || null,
      deviceStatus: {
        ...prev.deviceStatus,
        esp32Connected: false,
        pmSensorConnected: false,
        fanStatus: 'Disconnected',
        dataTransmissionStatus: 'Disconnected',
        lastDataReceived: null,
      },
    }));
  };

  const isSimulation = state.mode === 'simulation';

  return (
    <div className="min-h-screen bg-[#EAF6FF] text-[#103B66] flex">
      <Sidebar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        deviceConnected={state.deviceConnected}
        mode={state.mode}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Dashboard Header */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-[#CBE7FA] px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            {/* Brand + Title */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 rounded-xl border border-[#B9E0F8] text-[#103B66] hover:bg-[#EAF6FF]"
                aria-label="Buka menu navigasi"
              >
                <Menu className="w-5 h-5" />
              </button>
              <BrandLogo className="w-9 h-9 shrink-0 lg:hidden" />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-display text-sm font-bold tracking-wide text-[#176FAF] lg:hidden">
                    AIRSKIN COIR
                  </span>
                  <h1 className="font-display text-base sm:text-lg font-semibold text-[#103B66] truncate">
                    Smart Air Quality Monitoring
                  </h1>
                </div>
                <p className="text-[11px] text-[#103B66]/65 truncate">
                  Prototipe Fasad Filtrasi Udara: Serat Kapuk • Jerami Padi • Nonwoven Depan-Belakang
                </p>
              </div>
            </div>

            {/* Status Indicators & Mode Switch */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-[#D4ECFC] bg-[#F8FCFF]">
                {state.deviceConnected ? (
                  <Radio className="w-3.5 h-3.5 text-[#2F6F54]" />
                ) : (
                  <WifiOff className="w-3.5 h-3.5 text-[#9B7A2C]" />
                )}
                <span className="text-[#103B66]/70 hidden sm:inline">Perangkat:</span>
                <span
                  className={`font-semibold ${
                    state.deviceConnected ? 'text-[#2F6F54]' : 'text-[#8A6D2E]'
                  }`}
                >
                  {state.deviceConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>

              <div
                className={`text-xs font-mono font-semibold px-2.5 py-1.5 rounded-lg border ${
                  isSimulation
                    ? 'bg-[#FCF7EC] border-[#D7B978] text-[#7A5E1B]'
                    : 'bg-[#EFF9F4] border-[#72B89A] text-[#2F6F54]'
                }`}
              >
                {isSimulation ? 'Simulation' : 'Live Data'}
              </div>

              <div className="hidden md:flex items-center gap-1.5 text-xs text-[#103B66]/75 font-mono tabular-nums px-2.5 py-1.5 rounded-lg bg-[#F5FAFF] border border-[#DCEEFB]">
                <Clock className="w-3.5 h-3.5 text-[#176FAF]" />
                <span>Update: {formatTimestamp(state.lastUpdatedAt)}</span>
              </div>

              <button
                type="button"
                disabled={busy}
                onClick={handleToggleMode}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#176FAF] hover:bg-[#103B66] text-white text-xs font-semibold transition-colors disabled:opacity-60"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>
                  {isSimulation ? 'Ke Live IoT Mode' : 'Ke Simulation Mode'}
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto">
            {activeSection === 'overview' && (
              <OverviewPage
                state={state}
                timeRange={timeRange}
                onChangeTimeRange={setTimeRange}
                onNavigate={setActiveSection}
              />
            )}
            {activeSection === 'visualization' && (
              <VisualizationPage
                state={state}
                timeRange={timeRange}
                onChangeTimeRange={setTimeRange}
              />
            )}
            {activeSection === 'mechanism' && <MechanismPage state={state} />}
            {activeSection === 'simulation' && (
              <SimulationPage
                state={state}
                onStartSimulation={handleStartSimulation}
                onResetSimulation={handleResetSimulation}
                busy={busy}
              />
            )}
            {activeSection === 'benchmark' && <BenchmarkPage />}
            {activeSection === 'devices' && (
              <DevicesPage
                state={state}
                backendAvailable={backendAvailable === true}
                onRefreshState={fetchState}
                onLocalTelemetryPacket={handleLocalTelemetryPacket}
                onLocalDisconnect={handleLocalDisconnect}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
