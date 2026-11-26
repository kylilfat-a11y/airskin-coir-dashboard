import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Pause,
  Play,
  RotateCcw,
  Sliders,
  Wind,
} from 'lucide-react';
import type { SystemStatePayload } from '../types/airskin';
import { avgField, calcRemovalEfficiency } from '../utils/airskinMetrics';
import { WorkingMechanismDiagram } from '../components/WorkingMechanismDiagram';
import { InteractiveTrendChart } from '../components/InteractiveTrendChart';
import { BeforeAfterBarChart } from '../components/BeforeAfterBarChart';

interface SimulasiSistemPageProps {
  state: SystemStatePayload;
  onStartSimulation: (params: {
    initialPm25Inlet: number;
    initialPm10Inlet: number;
    efficiencyPm25Pct: number;
    efficiencyPm10Pct: number;
    resume?: boolean;
  }) => Promise<void>;
  onPauseSimulation: () => Promise<void>;
  onResetSimulation: () => Promise<void>;
  busy: boolean;
}

export const SimulasiSistemPage: React.FC<SimulasiSistemPageProps> = ({
  state,
  onStartSimulation,
  onPauseSimulation,
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

  const isFlowActive = state.simulation.running && !state.simulation.paused;

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    const pm25 = Math.max(2, Math.min(1000, Number(pm25Input) || 62));
    const pm10 = Math.max(4, Math.min(1500, Number(pm10Input) || 98));
    const eff25 = Math.max(0, Math.min(99, Number(effPm25Input) || 45));
    const eff10 = Math.max(0, Math.min(99, Number(effPm10Input) || 55));

    await onStartSimulation({
      initialPm25Inlet: pm25,
      initialPm10Inlet: pm10,
      efficiencyPm25Pct: eff25,
      efficiencyPm10Pct: eff10,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold text-[#103B66]">
          Simulasi Sistem Filtrasi
        </h2>
        <p className="text-xs sm:text-sm text-[#176FAF]/90 mt-0.5">
          Gambaran interaktif cara kerja panel AIRSKIN COIR menyaring partikulat udara serta simulasi perubahan konsentrasi PM2.5 dan PM10.
        </p>
      </div>

      {/* Label Permanen Status Data Simulasi */}
      <div className="rounded-xl border-2 border-[#D7B978] bg-[#FCF7EC] px-4 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="w-5 h-5 text-[#B8923E] shrink-0" />
          <div>
            <p className="font-mono text-xs sm:text-sm font-bold uppercase tracking-wider text-[#6E541D]">
              DATA SIMULASI — BUKAN HASIL PENGUKURAN SENSOR AKTUAL.
            </p>
            <p className="text-xs text-[#6E541D]/90 mt-0.5">
              Parameter efisiensi di bawah dapat diubah untuk keperluan demonstrasi matematis dan bukan merupakan efisiensi teruji prototipe.
            </p>
          </div>
        </div>
        <span className="font-mono text-xs px-2.5 py-1 rounded bg-white border border-[#D7B978] text-[#6E541D]">
          {isFlowActive
            ? 'Simulasi Berjalan'
            : state.simulation.paused
              ? 'Simulasi Dijeda'
              : 'Simulasi Siaga'}
        </span>
      </div>

      {/* A. Simulasi Alur Kerja Filtrasi */}
      <WorkingMechanismDiagram animateFlow={isFlowActive} />

      {/* B. Simulasi Perubahan Kualitas Udara */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5" aria-labelledby="sim-input-heading">
        <form onSubmit={handleStart} className="lg:col-span-5 airskin-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#176FAF]" />
            <h3 id="sim-input-heading" className="font-display text-base font-semibold text-[#103B66]">
              B. Simulasi Perubahan Kualitas Udara
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <label className="block space-y-1">
              <span className="text-xs font-medium text-[#103B66]">
                Konsentrasi Awal PM2.5 (µg/m³)
              </span>
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
              <span className="text-xs font-medium text-[#103B66]">
                Konsentrasi Awal PM10 (µg/m³)
              </span>
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
              <span className="text-xs font-medium text-[#103B66]">
                Efisiensi Simulasi PM2.5 (%)
              </span>
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
              <span className="text-xs font-medium text-[#103B66]">
                Efisiensi Simulasi PM10 (%)
              </span>
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
              disabled={busy || !isFlowActive}
              onClick={onPauseSimulation}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#D7B978] bg-[#FCF7EC] hover:bg-[#F6EBD0] text-[#6E541D] text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <Pause className="w-3.5 h-3.5" />
              Jeda Simulasi
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

          <div className="rounded-xl bg-[#F5FAFF] border border-[#DCEEFB] p-3 text-[11px] font-mono text-[#103B66]/80">
            Rumus: Konsentrasi Keluar = Konsentrasi Masuk × (1 − Efisiensi Simulasi)
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
      </section>

      {/* Grafik Perubahan Konsentrasi */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <InteractiveTrendChart
          title="Grafik Simulasi Perubahan PM2.5"
          subtitle="Perubahan konsentrasi PM2.5 sebelum dan sesudah filtrasi berdasarkan parameter simulasi."
          points={series}
          metric="pm25"
          isSimulated
        />
        <InteractiveTrendChart
          title="Grafik Simulasi Perubahan PM10"
          subtitle="Perubahan konsentrasi PM10 sebelum dan sesudah filtrasi berdasarkan parameter simulasi."
          points={series}
          metric="pm10"
          isSimulated
        />
      </div>

      {/* Ringkasan Hasil Simulasi */}
      <section className="airskin-card p-5 space-y-4" aria-labelledby="sim-summary-heading">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 id="sim-summary-heading" className="font-display text-base font-semibold text-[#103B66]">
            Ringkasan Hasil Simulasi
          </h3>
          <span className="font-mono text-[11px] uppercase px-2 py-0.5 rounded bg-[#D7B978]/20 text-[#8A6D2E] border border-[#D7B978]/45">
            DATA SIMULASI
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="rounded-xl bg-[#F5FAFF] border border-[#DCEEFB] p-3.5">
            <span className="text-[11px] text-[#103B66]/65 block">PM2.5 Sebelum Filtrasi</span>
            <p className="font-mono text-lg font-semibold text-[#176FAF] tabular-nums mt-1">
              {latest?.pm25Inlet ?? '--'} µg/m³
            </p>
          </div>
          <div className="rounded-xl bg-[#F5FAFF] border border-[#DCEEFB] p-3.5">
            <span className="text-[11px] text-[#103B66]/65 block">PM2.5 Setelah Filtrasi</span>
            <p className="font-mono text-lg font-semibold text-[#2F6F54] tabular-nums mt-1">
              {latest?.pm25Outlet ?? '--'} µg/m³
            </p>
          </div>
          <div className="rounded-xl bg-[#F5FAFF] border border-[#DCEEFB] p-3.5">
            <span className="text-[11px] text-[#103B66]/65 block">PM10 Sebelum Filtrasi</span>
            <p className="font-mono text-lg font-semibold text-[#176FAF] tabular-nums mt-1">
              {latest?.pm10Inlet ?? '--'} µg/m³
            </p>
          </div>
          <div className="rounded-xl bg-[#F5FAFF] border border-[#DCEEFB] p-3.5">
            <span className="text-[11px] text-[#103B66]/65 block">PM10 Setelah Filtrasi</span>
            <p className="font-mono text-lg font-semibold text-[#2F6F54] tabular-nums mt-1">
              {latest?.pm10Outlet ?? '--'} µg/m³
            </p>
          </div>
          <div className="rounded-xl bg-[#F5FAFF] border border-[#DCEEFB] p-3.5 col-span-2 sm:col-span-1">
            <span className="text-[11px] text-[#103B66]/65 block">Estimasi Penurunan</span>
            <p className="font-mono text-sm font-semibold text-[#103B66] tabular-nums mt-1">
              PM2.5: {latestEff25 ?? '--'}% • PM10: {latestEff10 ?? '--'}%
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-[#B9E0F8] bg-[#EAF6FF]/75 px-4 py-3.5 flex items-start gap-3">
          <Wind className="w-4 h-4 text-[#176FAF] shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-[#103B66] leading-relaxed">
            Pada simulasi ini, konsentrasi partikulat setelah melewati panel AIRSKIN COIR mengalami penurunan menjadi {latest?.pm25Outlet ?? '--'} µg/m³ (PM2.5) dan {latest?.pm10Outlet ?? '--'} µg/m³ (PM10) berdasarkan parameter efisiensi yang dipilih ({state.simulation.efficiencyPm25Pct}% dan {state.simulation.efficiencyPm10Pct}%). Hasil ini merupakan ilustrasi matematis dan belum mewakili hasil pengujian fisik prototipe.
          </p>
        </div>
      </section>
    </div>
  );
};
