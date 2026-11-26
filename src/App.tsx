import { useCallback, useEffect, useState } from 'react';
import { ArrowLeftRight, Clock, Menu, Radio, WifiOff } from 'lucide-react';
import type {
  DashboardMode,
  NavSection,
  SystemStatePayload,
  TimeRangeFilter,
} from './types/airskin';
import { formatTimestamp } from './utils/airskinMetrics';
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
  const [state, setState] = useState<SystemStatePayload | null>(null);
  const [busy, setBusy] = useState(false);

  const fetchState = useCallback(async () => {
    try {
      const resp = await fetch('/api/system/state');
      if (resp.ok) {
        const data = (await resp.json()) as SystemStatePayload;
        setState(data);
      }
    } catch {
      // ignore transient network errors during poll
    }
  }, []);

  useEffect(() => {
    fetchState();
    const poll = window.setInterval(fetchState, 3000);
    return () => window.clearInterval(poll);
  }, [fetchState]);

  useEffect(() => {
    if (!state?.simulation.running) return;
    const stepTimer = window.setInterval(async () => {
      try {
        await fetch('/api/simulation/step', { method: 'POST' });
        await fetchState();
      } catch {
        // ignore transient error
      }
    }, 3000);
    return () => window.clearInterval(stepTimer);
  }, [state?.simulation.running, fetchState]);

  const handleToggleMode = async () => {
    if (!state || busy) return;
    const nextMode: DashboardMode = state.mode === 'simulation' ? 'live' : 'simulation';
    setBusy(true);
    try {
      await fetch('/api/system/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: nextMode }),
      });
      await fetchState();
    } finally {
      setBusy(false);
    }
  };

  const handleStartSimulation = async (pm25: number, pm10: number) => {
    setBusy(true);
    try {
      await fetch('/api/simulation/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initialPm25Inlet: pm25,
          initialPm10Inlet: pm10,
        }),
      });
      await fetchState();
    } finally {
      setBusy(false);
    }
  };

  const handleResetSimulation = async () => {
    setBusy(true);
    try {
      await fetch('/api/simulation/reset', { method: 'POST' });
      await fetchState();
    } finally {
      setBusy(false);
    }
  };

  if (!state) {
    return (
      <div className="min-h-screen bg-[#EAF6FF] flex items-center justify-center p-6">
        <div className="airskin-card px-8 py-6 flex items-center gap-4">
          <BrandLogo className="w-10 h-10 animate-pulse" />
          <div>
            <p className="font-display font-semibold text-[#103B66]">AIRSKIN COIR</p>
            <p className="text-xs text-[#176FAF]">Memuat sistem pemantauan kualitas udara...</p>
          </div>
        </div>
      </div>
    );
  }

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
              {/* Device Connection Indicator */}
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

              {/* Mode Indicator */}
              <div
                className={`text-xs font-mono font-semibold px-2.5 py-1.5 rounded-lg border ${
                  isSimulation
                    ? 'bg-[#FCF7EC] border-[#D7B978] text-[#7A5E1B]'
                    : 'bg-[#EFF9F4] border-[#72B89A] text-[#2F6F54]'
                }`}
              >
                {isSimulation ? 'Simulation' : 'Live Data'}
              </div>

              {/* Last Updated Timestamp */}
              <div className="hidden md:flex items-center gap-1.5 text-xs text-[#103B66]/75 font-mono tabular-nums px-2.5 py-1.5 rounded-lg bg-[#F5FAFF] border border-[#DCEEFB]">
                <Clock className="w-3.5 h-3.5 text-[#176FAF]" />
                <span>Update: {formatTimestamp(state.lastUpdatedAt)}</span>
              </div>

              {/* Mode Toggle Button */}
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
              <DevicesPage state={state} onRefreshState={fetchState} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
