import React, { useState } from 'react';
import { Calculator, FlaskConical, Gauge, Plus, Trash2, Wind, Zap } from 'lucide-react';
import type { FilterConfigKey, FilterExperimentTrial, SystemStatePayload } from '../types/airskin';

interface FilterPerformancePageProps {
  state: SystemStatePayload;
  onAddTrial: (trial: {
    configKey: FilterConfigKey;
    pm25Inlet: number;
    pm25Outlet: number;
    pm10Inlet: number;
    pm10Outlet: number;
    pressureDropPa: number | null;
    airflowM3h: number | null;
    fanPowerW: number | null;
    notes: string;
  }) => Promise<void>;
  onLoadSampleTrials: () => Promise<void>;
  onClearTrials: () => Promise<void>;
}

const CONFIG_DEFINITIONS: Array<{ key: FilterConfigKey; label: string }> = [
  { key: 'A', label: 'A. Nonwoven only' },
  { key: 'B', label: 'B. Coconut coir only' },
  { key: 'C', label: 'C. Nonwoven + coconut coir' },
  { key: 'D', label: 'D. No-filter control' },
];

export const FilterPerformancePage: React.FC<FilterPerformancePageProps> = ({
  state,
  onAddTrial,
  onLoadSampleTrials,
  onClearTrials,
}) => {
  const { telemetry, config, experiments } = state;
  const [calcCin, setCalcCin] = useState('52.0');
  const [calcCout, setCalcCout] = useState('21.8');

  const [formOpen, setFormOpen] = useState(false);
  const [formConfigKey, setFormConfigKey] = useState<FilterConfigKey>('C');
  const [pm25In, setPm25In] = useState('53.0');
  const [pm25Out, setPm25Out] = useState('22.1');
  const [pm10In, setPm10In] = useState('80.0');
  const [pm10Out, setPm10Out] = useState('25.2');
  const [pressurePa, setPressurePa] = useState('');
  const [airflowM3h, setAirflowM3h] = useState('');
  const [fanPowerW, setFanPowerW] = useState('4.8');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const latest = telemetry.length > 0 ? telemetry[telemetry.length - 1] : null;
  const pm25EffLive =
    latest &&
    config.hasOutletSensor &&
    latest.pm25Inlet !== null &&
    latest.pm25Inlet > 0 &&
    latest.pm25Outlet !== null
      ? (((latest.pm25Inlet - latest.pm25Outlet) / latest.pm25Inlet) * 100).toFixed(1)
      : null;
  const pm10EffLive =
    latest &&
    config.hasOutletSensor &&
    latest.pm10Inlet !== null &&
    latest.pm10Inlet > 0 &&
    latest.pm10Outlet !== null
      ? (((latest.pm10Inlet - latest.pm10Outlet) / latest.pm10Inlet) * 100).toFixed(1)
      : null;

  const cinNum = Number(calcCin);
  const coutNum = Number(calcCout);
  const calcEta =
    Number.isFinite(cinNum) && cinNum > 0 && Number.isFinite(coutNum)
      ? (((cinNum - coutNum) / cinNum) * 100).toFixed(2)
      : '--';

  const hasSampleDemo = experiments.some((e) => e.isSampleDemo);

  async function handleTrialSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onAddTrial({
        configKey: formConfigKey,
        pm25Inlet: Number(pm25In),
        pm25Outlet: Number(pm25Out),
        pm10Inlet: Number(pm10In),
        pm10Outlet: Number(pm10Out),
        pressureDropPa: pressurePa.trim() ? Number(pressurePa) : null,
        airflowM3h: airflowM3h.trim() ? Number(airflowM3h) : null,
        fanPowerW: fanPowerW.trim() ? Number(fanPowerW) : null,
        notes,
      });
      setFormOpen(false);
    } finally {
      setSaving(false);
    }
  }

  function renderComparisonBars(
    title: string,
    unitLabel: string,
    getValue: (t: FilterExperimentTrial) => number | null,
    maxScale: number,
    barColor: string,
  ) {
    return (
      <div className="rounded-xl border border-[#DCEEFB] bg-[#F5FAFF] p-4 space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-[#103B66]">
          <span>{title}</span>
          <span className="font-mono text-[#176FAF]">{unitLabel}</span>
        </div>
        <div className="space-y-2.5">
          {CONFIG_DEFINITIONS.map((def) => {
            const match = experiments.find((e) => e.configKey === def.key);
            const val = match ? getValue(match) : null;
            const pct = val !== null ? Math.min(100, Math.max(0, (val / maxScale) * 100)) : 0;
            return (
              <div key={def.key} className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#103B66]/85 font-medium truncate pr-2">{def.label}</span>
                  <span className="font-mono tabular-nums font-semibold text-[#103B66] shrink-0">
                    {val !== null ? `${val.toFixed(1)} ${unitLabel}` : '--'}
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-white border border-[#DCEEFB] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${pct}%`, backgroundColor: barColor }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-[Poppins] text-2xl sm:text-3xl font-semibold tracking-tight text-[#103B66]">
            Filtration Performance
          </h1>
          <p className="mt-1 text-sm text-[#103B66]/75">
            Empirical removal efficiency, aerodynamic resistance, and controlled media configuration benchmarks.
          </p>
        </div>
      </div>

      {/* Mandatory Scientific Integrity Note */}
      <div className="rounded-xl border border-[#82C5EF] bg-[#F5FAFF] px-4 py-3 text-xs text-[#103B66]">
        Performance values are based on controlled prototype measurements. No unverified performance claims are displayed.
      </div>

      {/* Performance Metrics Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="airskin-card p-5 space-y-1.5">
          <div className="text-xs font-semibold text-[#176FAF]">PM2.5 REMOVAL EFFICIENCY</div>
          <div className="font-mono tabular-nums text-2xl font-semibold text-[#458B6D]">
            {pm25EffLive !== null ? `${pm25EffLive} %` : '--'}
          </div>
          <div className="text-[11px] text-[#103B66]/65">
            {config.hasOutletSensor ? 'From active inlet/outlet telemetry' : 'Requires outlet PM sensor'}
          </div>
        </div>

        <div className="airskin-card p-5 space-y-1.5">
          <div className="text-xs font-semibold text-[#176FAF]">PM10 REMOVAL EFFICIENCY</div>
          <div className="font-mono tabular-nums text-2xl font-semibold text-[#458B6D]">
            {pm10EffLive !== null ? `${pm10EffLive} %` : '--'}
          </div>
          <div className="text-[11px] text-[#103B66]/65">
            {config.hasOutletSensor ? 'From active inlet/outlet telemetry' : 'Requires outlet PM sensor'}
          </div>
        </div>

        <div className="airskin-card p-5 space-y-1.5">
          <div className="text-xs font-semibold text-[#176FAF]">INLET / OUTLET CONCENTRATION</div>
          <div className="font-mono tabular-nums text-lg font-semibold text-[#103B66]">
            {latest?.pm25Inlet !== null && latest?.pm25Inlet !== undefined
              ? `${latest.pm25Inlet.toFixed(1)} / ${
                  config.hasOutletSensor && latest.pm25Outlet !== null
                    ? latest.pm25Outlet.toFixed(1)
                    : '--'
                }`
              : '-- / --'}
            <span className="ml-1 text-xs font-normal text-[#103B66]/60">µg/m³</span>
          </div>
          <div className="text-[11px] text-[#103B66]/65">PM2.5 active sensor pair</div>
        </div>

        <div className="airskin-card p-5 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#176FAF]">
            <Zap className="w-3.5 h-3.5 text-[#D7B978]" />
            <span>FAN POWER CONSUMPTION</span>
          </div>
          <div className="font-mono tabular-nums text-2xl font-semibold text-[#103B66]">
            {latest?.fanPowerW !== null && latest?.fanPowerW !== undefined
              ? `${latest.fanPowerW.toFixed(1)} W`
              : '--'}
          </div>
          <div className="text-[11px] text-[#103B66]/65">12V DC brushless axial module</div>
        </div>
      </section>

      {/* Conditional Pressure Drop & Airflow Row */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="airskin-card p-5 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#176FAF]">
              <Gauge className="w-4 h-4" />
              <span>DIFFERENTIAL PRESSURE DROP (ΔP)</span>
            </div>
            <div className="mt-1.5 font-mono tabular-nums text-2xl font-semibold text-[#103B66]">
              {config.hasPressureSensor && latest?.pressureDropPa !== null && latest?.pressureDropPa !== undefined
                ? `${latest.pressureDropPa.toFixed(1)} Pa`
                : 'Awaiting Sensor'}
            </div>
            <p className="mt-1 text-xs text-[#103B66]/65">
              {config.hasPressureSensor
                ? 'Differential pressure transducer enabled'
                : 'Displayed only when a differential pressure sensor is installed.'}
            </p>
          </div>
        </div>

        <div className="airskin-card p-5 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#176FAF]">
              <Wind className="w-4 h-4" />
              <span>VOLUMETRIC AIRFLOW (Q)</span>
            </div>
            <div className="mt-1.5 font-mono tabular-nums text-2xl font-semibold text-[#103B66]">
              {config.hasAirflowSensor && latest?.airflowM3h !== null && latest?.airflowM3h !== undefined
                ? `${latest.airflowM3h.toFixed(1)} m³/h`
                : 'Awaiting Sensor'}
            </div>
            <p className="mt-1 text-xs text-[#103B66]/65">
              {config.hasAirflowSensor
                ? 'Hot-wire anemometer / flow sensor enabled'
                : 'Displayed only when a calibrated airflow measurement system is available.'}
            </p>
          </div>
        </div>
      </section>

      {/* Formula & Interactive Calculator */}
      <section className="airskin-card p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#176FAF]">
            <Calculator className="w-4 h-4" />
            <span>PARTICULATE REMOVAL EFFICIENCY EQUATION</span>
          </div>
          <div className="rounded-xl border border-[#B9E0F8] bg-[#F5FAFF] px-5 py-4 font-mono text-lg sm:text-xl font-semibold text-[#103B66]">
            η = ((C<sub>in</sub> − C<sub>out</sub>) / C<sub>in</sub>) × 100%
          </div>
          <ul className="space-y-1 text-xs text-[#103B66]/80">
            <li>
              <span className="font-mono font-semibold text-[#176FAF]">C<sub>in</sub></span> = inlet particulate concentration (µg/m³)
            </li>
            <li>
              <span className="font-mono font-semibold text-[#458B6D]">C<sub>out</sub></span> = outlet particulate concentration (µg/m³)
            </li>
            <li>
              <span className="font-mono font-semibold text-[#103B66]">η</span> = particulate removal efficiency (%)
            </li>
          </ul>
        </div>

        <div className="lg:col-span-6 rounded-xl border border-[#DCEEFB] bg-[#F5FAFF] p-5 space-y-4">
          <div className="text-xs font-semibold text-[#103B66]">Interactive Formula Verification</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <label className="text-xs text-[#103B66]">
              <span>C_in (µg/m³)</span>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={calcCin}
                onChange={(e) => setCalcCin(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#B9E0F8] bg-white px-3 py-2 font-mono text-sm focus:border-[#429EDB] focus:outline-none"
              />
            </label>
            <label className="text-xs text-[#103B66]">
              <span>C_out (µg/m³)</span>
              <input
                type="number"
                step="0.1"
                min="0"
                value={calcCout}
                onChange={(e) => setCalcCout(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#B9E0F8] bg-white px-3 py-2 font-mono text-sm focus:border-[#429EDB] focus:outline-none"
              />
            </label>
            <div className="rounded-xl bg-[#103B66] px-4 py-2 text-white">
              <div className="text-[11px] text-[#B9E0F8]">Calculated η</div>
              <div className="font-mono tabular-nums text-lg font-semibold">{calcEta}%</div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Comparison Interface (A/B/C/D) */}
      <section className="airskin-card p-6 space-y-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-[#176FAF]" />
              <h2 className="font-[Poppins] text-base font-semibold text-[#103B66]">
                Experimental Configuration Comparison (A / B / C / D)
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-[#103B66]/70">
              Compare Nonwoven only, Coconut coir only, Dual-stage Nonwoven + Coir, and No-filter control.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setFormOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#176FAF] px-4 py-2 text-xs font-medium text-white hover:bg-[#103B66] whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              Upload Controlled Trial
            </button>
            {experiments.length === 0 ? (
              <button
                type="button"
                onClick={onLoadSampleTrials}
                className="rounded-xl border border-[#82C5EF] bg-white px-4 py-2 text-xs font-medium text-[#103B66] hover:bg-[#EAF6FF] whitespace-nowrap"
              >
                Load Sample Reference Dataset (Demo)
              </button>
            ) : (
              <button
                type="button"
                onClick={onClearTrials}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#B9E0F8] bg-white px-3.5 py-2 text-xs font-medium text-[#103B66] hover:bg-[#EAF6FF] whitespace-nowrap"
              >
                <Trash2 className="w-3.5 h-3.5 text-[#176FAF]" />
                Reset to Empty State
              </button>
            )}
          </div>
        </div>

        {hasSampleDemo && (
          <div className="rounded-xl border border-[#D7B978] bg-[#FDF8EC] px-4 py-2.5 text-xs text-[#103B66]">
            <strong>Sample Reference Dataset (Demo):</strong> Currently showing illustrative reference values for comparison chart preview. Upload your lab test runs above to replace them.
          </div>
        )}

        {/* Trial Entry Form */}
        {formOpen && (
          <form onSubmit={handleTrialSubmit} className="rounded-2xl border border-[#B9E0F8] bg-[#F5FAFF] p-5 space-y-4">
            <div className="font-[Poppins] text-sm font-semibold text-[#103B66]">
              Record Controlled Prototype Trial
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <label className="text-xs text-[#103B66]">
                <span className="font-medium">Configuration</span>
                <select
                  value={formConfigKey}
                  onChange={(e) => setFormConfigKey(e.target.value as FilterConfigKey)}
                  className="mt-1 w-full rounded-xl border border-[#B9E0F8] bg-white px-3 py-2 text-xs text-[#103B66]"
                >
                  {CONFIG_DEFINITIONS.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-[#103B66]">
                <span className="font-medium">PM2.5 Inlet (µg/m³)</span>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={pm25In}
                  onChange={(e) => setPm25In(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#B9E0F8] bg-white px-3 py-2 font-mono text-xs"
                />
              </label>
              <label className="text-xs text-[#103B66]">
                <span className="font-medium">PM2.5 Outlet (µg/m³)</span>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={pm25Out}
                  onChange={(e) => setPm25Out(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#B9E0F8] bg-white px-3 py-2 font-mono text-xs"
                />
              </label>
              <label className="text-xs text-[#103B66]">
                <span className="font-medium">PM10 Inlet (µg/m³)</span>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={pm10In}
                  onChange={(e) => setPm10In(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#B9E0F8] bg-white px-3 py-2 font-mono text-xs"
                />
              </label>
              <label className="text-xs text-[#103B66]">
                <span className="font-medium">PM10 Outlet (µg/m³)</span>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={pm10Out}
                  onChange={(e) => setPm10Out(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#B9E0F8] bg-white px-3 py-2 font-mono text-xs"
                />
              </label>
              <label className="text-xs text-[#103B66]">
                <span className="font-medium">Pressure Drop (Pa, optional)</span>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Only if measured"
                  value={pressurePa}
                  onChange={(e) => setPressurePa(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#B9E0F8] bg-white px-3 py-2 font-mono text-xs"
                />
              </label>
              <label className="text-xs text-[#103B66]">
                <span className="font-medium">Airflow (m³/h, optional)</span>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Only if measured"
                  value={airflowM3h}
                  onChange={(e) => setAirflowM3h(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#B9E0F8] bg-white px-3 py-2 font-mono text-xs"
                />
              </label>
              <label className="text-xs text-[#103B66]">
                <span className="font-medium">Fan Power (W, optional)</span>
                <input
                  type="number"
                  step="0.1"
                  value={fanPowerW}
                  onChange={(e) => setFanPowerW(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#B9E0F8] bg-white px-3 py-2 font-mono text-xs"
                />
              </label>
            </div>
            <label className="block text-xs text-[#103B66]">
              <span className="font-medium">Lab Notes</span>
              <input
                type="text"
                placeholder="e.g., Chamber run #4, RH 58%"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#B9E0F8] bg-white px-3 py-2 text-xs"
              />
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="rounded-xl border border-[#B9E0F8] bg-white px-4 py-2 text-xs font-medium text-[#103B66]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#176FAF] px-4 py-2 text-xs font-medium text-white hover:bg-[#103B66]"
              >
                {saving ? 'Saving...' : 'Save Trial Result'}
              </button>
            </div>
          </form>
        )}

        {experiments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#82C5EF] bg-[#F5FAFF] px-6 py-12 text-center">
            <p className="font-[Poppins] text-base font-semibold text-[#103B66]">
              Awaiting Controlled Test Results
            </p>
            <p className="mt-1 max-w-lg mx-auto text-xs text-[#103B66]/70">
              No experimental comparison runs have been uploaded for Configurations A–D. Upload verified laboratory test results or load the labeled sample dataset to evaluate the comparison charts.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderComparisonBars('PM2.5 Removal Efficiency', '%', (t) => t.pm25Efficiency, 100, '#176FAF')}
            {renderComparisonBars('PM10 Removal Efficiency', '%', (t) => t.pm10Efficiency, 100, '#72B89A')}
            {renderComparisonBars('Differential Pressure Drop', 'Pa', (t) => t.pressureDropPa, 50, '#429EDB')}
            {renderComparisonBars('Volumetric Airflow', 'm³/h', (t) => t.airflowM3h, 70, '#D7B978')}
          </div>
        )}
      </section>
    </div>
  );
};
