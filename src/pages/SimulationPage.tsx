import React, { useEffect, useState } from 'react';
import { AlertTriangle, Play, RotateCcw, Sliders } from 'lucide-react';
import type { SystemStatePayload } from '../types/airskin';
import { computePerformanceSummary } from '../utils/airskinMetrics';
import { InteractiveTrendChart } from '../components/InteractiveTrendChart';
import { WorkingMechanismDiagram } from '../components/WorkingMechanismDiagram';

interface SimulationPageProps {
  state: SystemStatePayload;
  onStartSimulation: (pm25: number, pm10: number) => Promise<void>;
  onResetSimulation: () => Promise<void>;
  busy: boolean;
}

export const SimulationPage: React.FC<SimulationPageProps> = ({
  state,
  onStartSimulation,
  onResetSimulation,
  busy,
}) => {
  const [pm25Input, setPm25Input] = useState<string>(
    String(state.simulation.initialPm25Inlet),
  );
  const [pm10Input, setPm10Input] = useState<string>(
    String(state.simulation.initialPm10Inlet),
  );

  useEffect(() => {
    setPm25Input(String(state.simulation.initialPm25Inlet));
    setPm10Input(String(state.simulation.initialPm10Inlet));
  }, [state.simulation.initialPm25Inlet, state.simulation.initialPm10Inlet]);

  const summary = computePerformanceSummary(
    'simulation',
    state.deviceConnected,
    state.liveTelemetry,
    state.simulationTelemetry,
    state.liveDurationSeconds,
    state.simulation.elapsedSeconds,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pm25 = Math.max(5, Math.min(1000, Number(pm25Input) || 58));
    const pm10 = Math.max(10, Math.min(1500, Number(pm10Input) || 92));
    await onStartSimulation(pm25, pm10);
  };

  return (
    <div className="space-y-6">
      {/* Permanent Mandatory Simulation Header Label */}
      <div className="rounded-xl border-2 border-[#D7B978] bg-[#FCF7EC] px-4 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="w-5 h-5 text-[#B8923E] shrink-0" />
          <div>
            <p className="font-mono text-xs sm:text-sm font-bold uppercase tracking-wider text-[#6E541D]">
              SIMULATION — NOT REAL SENSOR DATA
            </p>
            <p className="text-xs text-[#6E541D]/90 mt-0.5">
              Mode ini hanya menampilkan ilustrasi perubahan konsentrasi dan tidak menggunakan angka literatur sebagai efisiensi otomatis AIRSKIN COIR.
            </p>
          </div>
        </div>
        <span className="font-mono text-xs px-2.5 py-1 rounded bg-white border border-[#D7B978] text-[#6E541D]">
          {state.simulation.running ? 'Simulasi Berjalan' : 'Simulasi Siaga'}
        </span>
      </div>

      {/* Simulation Controls & Live Efficiency Readout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-5 airskin-card p-5 space-y-4"
        >
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#176FAF]" />
            <h2 className="font-display text-base font-semibold text-[#103B66]">
              Parameter Input Simulasi
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[#103B66]">
                Konsentrasi Awal PM2.5 (µg/m³)
              </span>
              <input
                type="number"
                min={5}
                max={1000}
                step="0.5"
                value={pm25Input}
                onChange={(e) => setPm25Input(e.target.value)}
                className="w-full rounded-xl border border-[#B9E0F8] bg-[#F8FCFF] px-3.5 py-2.5 font-mono text-sm text-[#103B66] focus:outline-none focus:border-[#176FAF] tabular-nums"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[#103B66]">
                Konsentrasi Awal PM10 (µg/m³)
              </span>
              <input
                type="number"
                min={10}
                max={1500}
                step="0.5"
                value={pm10Input}
                onChange={(e) => setPm10Input(e.target.value)}
                className="w-full rounded-xl border border-[#B9E0F8] bg-[#F8FCFF] px-3.5 py-2.5 font-mono text-sm text-[#103B66] focus:outline-none focus:border-[#176FAF] tabular-nums"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#176FAF] hover:bg-[#103B66] text-white text-xs font-semibold transition-colors disabled:opacity-60"
            >
              <Play className="w-3.5 h-3.5" />
              Start Simulation
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={onResetSimulation}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#B9E0F8] bg-white hover:bg-[#EAF6FF] text-[#103B66] text-xs font-semibold transition-colors disabled:opacity-60"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Simulation
            </button>
          </div>

          <p className="text-[11px] text-[#103B66]/70 leading-relaxed border-t border-[#E6F3FC] pt-3">
            Rumus yang dihitung: Removal Efficiency = ((Concentration Inlet - Concentration Outlet) / Concentration Inlet) × 100%. Seluruh hasil diberi label SIMULATED DATA.
          </p>
        </form>

        {/* Computed Simulation Metrics */}
        <div className="lg:col-span-7 airskin-card p-5 flex flex-col justify-between space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-base font-semibold text-[#103B66]">
              Hasil Perhitungan Simulasi (Ilustratif)
            </h3>
            <span className="font-mono text-[11px] uppercase px-2 py-0.5 rounded bg-[#D7B978]/20 text-[#8A6D2E] border border-[#D7B978]/45">
              SIMULATED DATA
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-[#F5FAFF] border border-[#DCEEFB] p-3.5">
              <span className="text-[11px] text-[#103B66]/65 block">PM2.5 Inlet</span>
              <span className="font-mono text-xl font-semibold text-[#176FAF] tabular-nums">
                {summary.latestPoint?.pm25Inlet ?? '--'}
              </span>
              <span className="text-[11px] text-[#103B66]/60 block">µg/m³</span>
            </div>
            <div className="rounded-xl bg-[#F5FAFF] border border-[#DCEEFB] p-3.5">
              <span className="text-[11px] text-[#103B66]/65 block">PM2.5 Outlet</span>
              <span className="font-mono text-xl font-semibold text-[#2F6F54] tabular-nums">
                {summary.latestPoint?.pm25Outlet ?? '--'}
              </span>
              <span className="text-[11px] text-[#103B66]/60 block">
                Eff: {summary.latestPm25Reduction ?? '--'}%
              </span>
            </div>
            <div className="rounded-xl bg-[#F5FAFF] border border-[#DCEEFB] p-3.5">
              <span className="text-[11px] text-[#103B66]/65 block">PM10 Inlet</span>
              <span className="font-mono text-xl font-semibold text-[#176FAF] tabular-nums">
                {summary.latestPoint?.pm10Inlet ?? '--'}
              </span>
              <span className="text-[11px] text-[#103B66]/60 block">µg/m³</span>
            </div>
            <div className="rounded-xl bg-[#F5FAFF] border border-[#DCEEFB] p-3.5">
              <span className="text-[11px] text-[#103B66]/65 block">PM10 Outlet</span>
              <span className="font-mono text-xl font-semibold text-[#2F6F54] tabular-nums">
                {summary.latestPoint?.pm10Outlet ?? '--'}
              </span>
              <span className="text-[11px] text-[#103B66]/60 block">
                Eff: {summary.latestPm10Reduction ?? '--'}%
              </span>
            </div>
          </div>

          <p className="text-xs text-[#103B66]/85 bg-[#EAF6FF]/75 border border-[#B9E0F8] rounded-xl px-4 py-3 leading-relaxed">
            {summary.narrative}
          </p>
        </div>
      </div>

      {/* Airflow Animation Through Layers */}
      <WorkingMechanismDiagram animateFlow={state.simulation.running} compact />

      {/* Concentration Change Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <InteractiveTrendChart
          title="Perubahan Konsentrasi PM2.5 (Simulasi)"
          subtitle="Ilustrasi konsentrasi sisi inlet dan outlet selama simulasi berjalan."
          points={state.simulationTelemetry}
          metric="pm25"
          isSimulated
        />
        <InteractiveTrendChart
          title="Perubahan Konsentrasi PM10 (Simulasi)"
          subtitle="Ilustrasi konsentrasi partikel PM10 sebelum dan sesudah lapisan filter."
          points={state.simulationTelemetry}
          metric="pm10"
          isSimulated
        />
      </div>
    </div>
  );
};
