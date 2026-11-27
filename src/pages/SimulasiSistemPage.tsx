import React, { useEffect, useState } from 'react';
import { AlertTriangle, Play, RotateCcw, Sliders } from 'lucide-react';
import type { SystemStatePayload } from '../types/airskin';
import { avgField, calcRemovalEfficiency } from '../utils/airskinMetrics';
import { WorkingMechanismDiagram } from '../components/WorkingMechanismDiagram';
import { BeforeAfterBarChart } from '../components/BeforeAfterBarChart';

interface SimulasiSistemPageProps {
  state: SystemStatePayload;
  onStartSimulation: (params: {
    initialPm25Inlet: number;
    initialPm10Inlet: number;
    efficiencyPm25Pct: number;
    efficiencyPm10Pct: number;
  }) => Promise<void>;
  onResetSimulation: () => Promise<void>;
  busy: boolean;
}

export const SimulasiSistemPage: React.FC<SimulasiSistemPageProps> = ({
  state,
  onStartSimulation,
  onResetSimulation,
  busy,
}) => {
  const [pm25Input, setPm25Input] = useState(String(state.simulation.initialPm25Inlet));
  const [pm10Input, setPm10Input] = useState(String(state.simulation.initialPm10Inlet));
  const [effPm25Input, setEffPm25Input] = useState(String(state.simulation.efficiencyPm25Pct));
  const [effPm10Input, setEffPm10Input] = useState(String(state.simulation.efficiencyPm10Pct));

  useEffect(() => {
    setPm25Input(String(state.simulation.initialPm25Inlet));
    setPm10Input(String(state.simulation.initialPm10Inlet));
    setEffPm25Input(String(state.simulation.efficiencyPm25Pct));
    setEffPm10Input(String(state.simulation.efficiencyPm10Pct));
  }, [
    state.simulation.initialPm25Inlet,
    state.simulation.initialPm10Inlet,
    state.simulation.efficiencyPm25Pct,
    state.simulation.efficiencyPm10Pct,
  ]);

  const series = state.simulationTelemetry;
  const latest = series.length > 0 ? series[series.length - 1] : null;
  const avgPm25In = avgField(series, (p) => p.pm25Inlet);
  const avgPm25Out = avgField(series, (p) => p.pm25Outlet);
  const avgPm10In = avgField(series, (p) => p.pm10Inlet);
  const avgPm10Out = avgField(series, (p) => p.pm10Outlet);

  const latestEff25 = latest ? calcRemovalEfficiency(latest.pm25Inlet, latest.pm25Outlet) : null;
  const latestEff10 = latest ? calcRemovalEfficiency(latest.pm10Inlet, latest.pm10Outlet) : null;

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    await onStartSimulation({
      initialPm25Inlet: Math.max(2, Math.min(1000, Number(pm25Input) || 62)),
      initialPm10Inlet: Math.max(4, Math.min(1500, Number(pm10Input) || 98)),
      efficiencyPm25Pct: Math.max(0, Math.min(99, Number(effPm25Input) || 45)),
      efficiencyPm10Pct: Math.max(0, Math.min(99, Number(effPm10Input) || 55)),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-[#103B66]">
            Simulasi Sistem
          </h2>
          <p className="text-xs sm:text-sm text-[#176FAF]/90 mt-0.5">
            Simulasi interaktif aliran udara dan perubahan konsentrasi partikulat melewati filter.
          </p>
        </div>

        <span className="font-mono text-xs font-semibold uppercase px-3 py-1.5 rounded-lg border-2 border-[#D7B978] bg-[#FCF7EC] text-[#6E541D]">
          DATA SIMULASI
        </span>
      </div>

      <div className="rounded-xl border border-[#D7B978] bg-[#FCF7EC] px-4 py-2.5 flex items-center gap-2.5 text-xs text-[#6E541D]">
        <AlertTriangle className="w-4 h-4 shrink-0 text-[#B8923E]" />
        <span>
          <strong className="font-mono uppercase">DATA SIMULASI:</strong> Hasil simulasi bersifat ilustratif dan terpisah dari data aktual sensor.
        </span>
      </div>

      {/* Animasi Aliran Udara Melewati Filter */}
      <WorkingMechanismDiagram animateFlow={state.simulation.running} />

      {/* Input Parameter & Hasil Perbandingan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <form onSubmit={handleStart} className="lg:col-span-5 airskin-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#176FAF]" />
            <h3 className="text-base font-semibold text-[#103B66]">
              Parameter Simulasi
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <label className="block space-y-1">
              <span className="text-xs font-medium text-[#103B66]">PM2.5 Awal (µg/m³)</span>
              <input
                type="number"
                min={2}
                max={1000}
                step="0.5"
                value={pm25Input}
                onChange={(e) => setPm25Input(e.target.value)}
                className="w-full rounded-xl border border-[#B9E0F8] bg-[#F8FCFF] px-3 py-2 font-mono text-sm text-[#103B66] tabular-nums"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-medium text-[#103B66]">PM10 Awal (µg/m³)</span>
              <input
                type="number"
                min={4}
                max={1500}
                step="0.5"
                value={pm10Input}
                onChange={(e) => setPm10Input(e.target.value)}
                className="w-full rounded-xl border border-[#B9E0F8] bg-[#F8FCFF] px-3 py-2 font-mono text-sm text-[#103B66] tabular-nums"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-medium text-[#103B66]">Efisiensi PM2.5 (%)</span>
              <input
                type="number"
                min={0}
                max={99}
                step="1"
                value={effPm25Input}
                onChange={(e) => setEffPm25Input(e.target.value)}
                className="w-full rounded-xl border border-[#B9E0F8] bg-[#F8FCFF] px-3 py-2 font-mono text-sm text-[#103B66] tabular-nums"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-medium text-[#103B66]">Efisiensi PM10 (%)</span>
              <input
                type="number"
                min={0}
                max={99}
                step="1"
                value={effPm10Input}
                onChange={(e) => setEffPm10Input(e.target.value)}
                className="w-full rounded-xl border border-[#B9E0F8] bg-[#F8FCFF] px-3 py-2 font-mono text-sm text-[#103B66] tabular-nums"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#176FAF] hover:bg-[#103B66] text-white text-xs font-semibold transition-colors disabled:opacity-60"
            >
              <Play className="w-3.5 h-3.5" />
              Mulai Simulasi
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={onResetSimulation}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#B9E0F8] bg-white hover:bg-[#EAF6FF] text-[#103B66] text-xs font-semibold transition-colors disabled:opacity-60"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>

          {/* Ringkasan Singkat Hasil Simulasi */}
          <div className="rounded-xl bg-[#F5FAFF] border border-[#DCEEFB] p-3.5 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[#103B66]/65 block">PM2.5 Keluar</span>
              <span className="font-bold text-[#2F6F54] tabular-nums">
                {latest?.pm25Outlet ?? '--'} µg/m³ ({latestEff25 ?? '--'}%)
              </span>
            </div>
            <div>
              <span className="text-[#103B66]/65 block">PM10 Keluar</span>
              <span className="font-bold text-[#2F6F54] tabular-nums">
                {latest?.pm10Outlet ?? '--'} µg/m³ ({latestEff10 ?? '--'}%)
              </span>
            </div>
          </div>
        </form>

        <div className="lg:col-span-7">
          <BeforeAfterBarChart
            avgPm25Inlet={avgPm25In}
            avgPm25Outlet={avgPm25Out}
            avgPm10Inlet={avgPm10In}
            avgPm10Outlet={avgPm10Out}
            isSimulated
            hasData={series.length > 0}
          />
        </div>
      </div>
    </div>
  );
};
