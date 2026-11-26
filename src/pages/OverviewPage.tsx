import React from 'react';
import {
  Activity,
  ArrowRight,
  Building2,
  Droplets,
  Filter,
  Gauge,
  Leaf,
  TrendingDown,
  Wind,
} from 'lucide-react';
import type { NavSection, SystemStatePayload } from '../types/airskin';
import { SparklineChart } from '../components/SparklineChart';
import { FutureBuildingNetwork } from '../components/FutureBuildingNetwork';

interface OverviewPageProps {
  state: SystemStatePayload;
  onNavigate: (section: NavSection) => void;
  onToggleMode: (mode: 'hardware_standby' | 'demo_simulation') => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  state,
  onNavigate,
  onToggleMode,
}) => {
  const { telemetry, config, mode } = state;
  const unit = config.measurementUnit;
  const scale = unit === 'mg/m³' ? 0.001 : 1;
  const dec = unit === 'mg/m³' ? 3 : 1;

  const latest = telemetry.length > 0 ? telemetry[telemetry.length - 1] : null;
  const prev = telemetry.length > 1 ? telemetry[telemetry.length - 2] : null;

  const pm25InValues = telemetry
    .map((t) => (t.pm25Inlet !== null ? t.pm25Inlet * scale : null))
    .filter((v): v is number => v !== null);
  const pm25OutValues = config.hasOutletSensor
    ? telemetry
        .map((t) => (t.pm25Outlet !== null ? t.pm25Outlet * scale : null))
        .filter((v): v is number => v !== null)
    : [];
  const pm10InValues = telemetry
    .map((t) => (t.pm10Inlet !== null ? t.pm10Inlet * scale : null))
    .filter((v): v is number => v !== null);

  const effValues = config.hasOutletSensor
    ? telemetry
        .filter((t) => t.pm25Inlet !== null && t.pm25Inlet > 0 && t.pm25Outlet !== null)
        .map((t) => (((t.pm25Inlet as number) - (t.pm25Outlet as number)) / (t.pm25Inlet as number)) * 100)
    : [];

  const latestPm25In = latest?.pm25Inlet !== null && latest?.pm25Inlet !== undefined ? latest.pm25Inlet * scale : null;
  const latestPm25Out =
    config.hasOutletSensor && latest?.pm25Outlet !== null && latest?.pm25Outlet !== undefined
      ? latest.pm25Outlet * scale
      : null;
  const latestPm10 = latest?.pm10Inlet !== null && latest?.pm10Inlet !== undefined ? latest.pm10Inlet * scale : null;
  const latestEff =
    latestPm25In !== null && latestPm25In > 0 && latestPm25Out !== null
      ? ((latestPm25In - latestPm25Out) / latestPm25In) * 100
      : null;

  const pm25InDelta =
    latest && prev && latest.pm25Inlet !== null && prev.pm25Inlet !== null
      ? (latest.pm25Inlet - prev.pm25Inlet) * scale
      : null;

  const pm10Delta =
    latest && prev && latest.pm10Inlet !== null && prev.pm10Inlet !== null
      ? (latest.pm10Inlet - prev.pm10Inlet) * scale
      : null;

  return (
    <div className="space-y-6">
      {/* Page Title & Mode Switch */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-[Poppins] text-2xl sm:text-3xl font-semibold tracking-tight text-[#103B66] text-balance">
            Air Quality Overview
          </h1>
          <p className="mt-1 text-sm text-[#103B66]/75">
            Monitor your building-integrated filtration system in one place.
          </p>
        </div>

        {/* Mode Selector (clearly distinguishes Standby vs Demo Simulation vs Live) */}
        <div className="flex items-center gap-1 rounded-xl border border-[#B9E0F8] bg-white p-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onToggleMode('hardware_standby')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              mode !== 'demo_simulation'
                ? 'bg-[#176FAF] text-white'
                : 'text-[#103B66]/75 hover:bg-[#EAF6FF]'
            }`}
          >
            {mode === 'live_esp32' ? 'Live ESP32 Stream' : 'Hardware Standby'}
          </button>
          <button
            type="button"
            onClick={() => onToggleMode('demo_simulation')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              mode === 'demo_simulation'
                ? 'bg-[#D7B978] text-[#103B66] font-semibold'
                : 'text-[#103B66]/75 hover:bg-[#EAF6FF]'
            }`}
          >
            Demo Simulation
          </button>
        </div>
      </div>

      {/* Explicit Demo Notice when active */}
      {mode === 'demo_simulation' && (
        <div className="rounded-xl border border-[#D7B978] bg-[#FDF8EC] px-4 py-2.5 text-xs text-[#103B66] flex flex-wrap items-center justify-between gap-2">
          <span>
            <strong>Demo Mode — Simulated Data:</strong> Values shown below are synthetic preview curves for demonstration and are not experimental measurements.
          </span>
          <button
            type="button"
            onClick={() => onToggleMode('hardware_standby')}
            className="text-xs font-semibold text-[#176FAF] underline underline-offset-2 hover:text-[#103B66] whitespace-nowrap"
          >
            Return to Hardware Standby
          </button>
        </div>
      )}

      {/* Hero Section */}
      <section className="airskin-card overflow-hidden bg-gradient-to-br from-[#FFFFFF] via-[#F4FAFF] to-[#E1F2FD]">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between gap-6">
            <div className="space-y-3">
              <div className="text-xs font-semibold tracking-wide text-[#176FAF]">
                AIRSKIN COIR · Building-Integrated Bio-Filtration
              </div>
              <h2 className="font-[Poppins] text-2xl sm:text-3xl font-semibold leading-tight text-[#103B66] text-balance">
                Your Building, Smarter and Cleaner.
              </h2>
              <p className="text-sm leading-relaxed text-[#103B66]/80 max-w-xl">
                Monitor particulate matter and evaluate the performance of your AIRSKIN COIR filtration modules.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('live')}
                className="inline-flex items-center gap-2 rounded-xl bg-[#176FAF] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#103B66] transition-colors whitespace-nowrap"
              >
                <Activity className="w-4 h-4 shrink-0" />
                View Live Monitoring
              </button>
              <button
                type="button"
                onClick={() => onNavigate('panels')}
                className="inline-flex items-center gap-2 rounded-xl border border-[#82C5EF] bg-white px-5 py-2.5 text-sm font-medium text-[#103B66] hover:bg-[#EAF6FF] transition-colors whitespace-nowrap"
              >
                <Building2 className="w-4 h-4 shrink-0 text-[#429EDB]" />
                Explore Facade Panels
                <ArrowRight className="w-4 h-4 shrink-0 text-[#429EDB]" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 relative min-h-[240px] lg:min-h-[300px] bg-[#103B66]">
            <img
              src="/src/assets/images/hero_facade_building_1795694951234.jpg"
              alt="Modern blue-glass building integrated with modular AIRSKIN COIR coconut fiber air filtration facade panels"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#103B66]/70 via-transparent to-transparent lg:bg-gradient-to-r lg:from-[#E1F2FD]/30 lg:via-transparent lg:to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#103B66]/80 backdrop-blur-sm px-4 py-2.5 text-xs text-white">
              <span>Active Bay: {config.activePanelId}</span>
              <span className="font-mono text-[#B9E0F8]">
                {mode === 'live_esp32'
                  ? 'Live ESP32 Telemetry'
                  : mode === 'demo_simulation'
                    ? 'Demo Simulation'
                    : 'Awaiting Prototype Sensor Feed'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 4 KPI Metric Cards */}
      <section aria-label="Primary Particulate Matter Metrics" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1: PM2.5 INLET */}
        <article className="airskin-card p-5 flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold tracking-wide text-[#176FAF]">
                PM2.5 INLET
              </div>
              <p className="mt-0.5 text-xs text-[#103B66]/65">
                Particulate concentration before filtration.
              </p>
            </div>
            <div className="rounded-xl bg-[#EAF6FF] p-2.5 text-[#176FAF] shrink-0">
              <Wind className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline justify-between gap-2">
            <div>
              <span className="font-mono tabular-nums text-3xl font-semibold text-[#103B66]">
                {latestPm25In !== null ? latestPm25In.toFixed(dec) : '--'}
              </span>
              <span className="ml-1.5 font-mono text-xs text-[#103B66]/60">{unit}</span>
            </div>
            {pm25InDelta !== null ? (
              <span className="font-mono tabular-nums text-xs text-[#176FAF]">
                {pm25InDelta >= 0 ? `+${pm25InDelta.toFixed(dec)}` : pm25InDelta.toFixed(dec)}
              </span>
            ) : (
              <span className="text-[11px] text-[#103B66]/55">Awaiting Test Data</span>
            )}
          </div>

          <SparklineChart values={pm25InValues.slice(-16)} strokeColor="#176FAF" />
        </article>

        {/* KPI 2: PM2.5 OUTLET */}
        <article className="airskin-card p-5 flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold tracking-wide text-[#176FAF]">
                PM2.5 OUTLET
              </div>
              <p className="mt-0.5 text-xs text-[#103B66]/65">
                Particulate concentration after filtration.
              </p>
            </div>
            <div className="rounded-xl bg-[#EAF6FF] p-2.5 text-[#72B89A] shrink-0">
              <Filter className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline justify-between gap-2">
            <div>
              <span className="font-mono tabular-nums text-3xl font-semibold text-[#103B66]">
                {latestPm25Out !== null ? latestPm25Out.toFixed(dec) : '--'}
              </span>
              <span className="ml-1.5 font-mono text-xs text-[#103B66]/60">{unit}</span>
            </div>
            <span className="text-[11px] text-[#103B66]/55">
              {!config.hasOutletSensor
                ? 'Outlet sensor not installed'
                : latestPm25Out === null
                  ? 'Awaiting Test Data'
                  : 'Filtered stream'}
            </span>
          </div>

          <SparklineChart
            values={pm25OutValues.slice(-16)}
            strokeColor="#72B89A"
            fillColor="rgba(114, 184, 154, 0.16)"
          />
        </article>

        {/* KPI 3: PM10 CONCENTRATION */}
        <article className="airskin-card p-5 flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold tracking-wide text-[#176FAF]">
                PM10 CONCENTRATION
              </div>
              <p className="mt-0.5 text-xs text-[#103B66]/65">
                Coarse particulate monitoring.
              </p>
            </div>
            <div className="rounded-xl bg-[#EAF6FF] p-2.5 text-[#429EDB] shrink-0">
              <Droplets className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline justify-between gap-2">
            <div>
              <span className="font-mono tabular-nums text-3xl font-semibold text-[#103B66]">
                {latestPm10 !== null ? latestPm10.toFixed(dec) : '--'}
              </span>
              <span className="ml-1.5 font-mono text-xs text-[#103B66]/60">{unit}</span>
            </div>
            {pm10Delta !== null ? (
              <span className="font-mono tabular-nums text-xs text-[#429EDB]">
                {pm10Delta >= 0 ? `+${pm10Delta.toFixed(dec)}` : pm10Delta.toFixed(dec)}
              </span>
            ) : (
              <span className="text-[11px] text-[#103B66]/55">Awaiting Test Data</span>
            )}
          </div>

          <SparklineChart values={pm10InValues.slice(-16)} strokeColor="#429EDB" />
        </article>

        {/* KPI 4: FILTRATION EFFICIENCY */}
        <article className="airskin-card p-5 flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold tracking-wide text-[#176FAF]">
                FILTRATION EFFICIENCY
              </div>
              <p className="mt-0.5 text-xs text-[#103B66]/65">
                Calculated from inlet and outlet measurements.
              </p>
            </div>
            <div className="rounded-xl bg-[#EAF6FF] p-2.5 text-[#72B89A] shrink-0">
              <Gauge className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline justify-between gap-2">
            <div>
              <span className="font-mono tabular-nums text-3xl font-semibold text-[#103B66]">
                {latestEff !== null ? latestEff.toFixed(1) : '--'}
              </span>
              <span className="ml-1.5 font-mono text-xs text-[#103B66]/60">%</span>
            </div>
            {latestEff !== null ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-[#458B6D]">
                <TrendingDown className="w-3.5 h-3.5" />
                Active η
              </span>
            ) : (
              <span className="text-[11px] text-[#103B66]/55">Requires dual sensors</span>
            )}
          </div>

          <SparklineChart
            values={effValues.slice(-16)}
            strokeColor="#72B89A"
            fillColor="rgba(114, 184, 154, 0.16)"
          />
        </article>
      </section>

      {/* Three Key Values: FILTER · MONITOR · OPTIMIZE */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4" aria-label="Core Platform Pillars">
        <div className="airskin-surface-sky p-5">
          <div className="flex items-center gap-2.5 text-[#176FAF] font-[Poppins] text-sm font-semibold">
            <Leaf className="w-4 h-4 text-[#72B89A]" />
            <span>01. FILTER</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-[#103B66]/80">
            Coconut-based particulate filtration combining a G3 nonwoven prefilter and compressed natural coir media.
          </p>
        </div>

        <div className="airskin-surface-sky p-5">
          <div className="flex items-center gap-2.5 text-[#176FAF] font-[Poppins] text-sm font-semibold">
            <Activity className="w-4 h-4 text-[#429EDB]" />
            <span>02. MONITOR</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-[#103B66]/80">
            Real-time PM2.5 and PM10 monitoring via ESP32 optical particulate sensing and synchronized telemetry logs.
          </p>
        </div>

        <div className="airskin-surface-sky p-5">
          <div className="flex items-center gap-2.5 text-[#176FAF] font-[Poppins] text-sm font-semibold">
            <Building2 className="w-4 h-4 text-[#176FAF]" />
            <span>03. OPTIMIZE</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-[#103B66]/80">
            Data-driven evaluation of removal efficiency and maintenance cadence toward connected multi-panel smart buildings.
          </p>
        </div>
      </section>

      {/* Future Smart Building Network Preview */}
      <FutureBuildingNetwork />

      {/* Brand Statement Footer */}
      <footer className="pt-2 pb-4 text-center text-xs text-[#103B66]/70">
        AIRSKIN COIR — Turning Sustainable Materials into Smart Building Air Solutions.
      </footer>
    </div>
  );
};
