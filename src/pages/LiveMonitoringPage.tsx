import React, { useMemo, useState } from 'react';
import { Activity, Cpu, Radio, Send, Wifi, WifiOff } from 'lucide-react';
import type { SystemStatePayload, TimeRangeFilter } from '../types/airskin';
import { InteractiveTrendChart } from '../components/InteractiveTrendChart';

interface LiveMonitoringPageProps {
  state: SystemStatePayload;
  onToggleMode: (mode: 'hardware_standby' | 'demo_simulation') => void;
  onSendTestPacket: (payload: {
    pm25Inlet: number;
    pm25Outlet: number | null;
    pm10Inlet: number;
    pm10Outlet: number | null;
  }) => Promise<void>;
}

const TIME_FILTERS: Array<{ id: TimeRangeFilter; label: string; hours: number }> = [
  { id: '1h', label: 'Last 1 hour', hours: 1 },
  { id: '6h', label: 'Last 6 hours', hours: 6 },
  { id: '24h', label: 'Last 24 hours', hours: 24 },
  { id: '7d', label: 'Last 7 days', hours: 168 },
];

export const LiveMonitoringPage: React.FC<LiveMonitoringPageProps> = ({
  state,
  onToggleMode,
  onSendTestPacket,
}) => {
  const [range, setRange] = useState<TimeRangeFilter>('24h');
  const [chartMetric, setChartMetric] = useState<'pm25' | 'pm10'>('pm25');
  const [packetOpen, setPacketOpen] = useState(false);
  const [pm25InInput, setPm25InInput] = useState('46.5');
  const [pm25OutInput, setPm25OutInput] = useState('20.4');
  const [pm10InInput, setPm10InInput] = useState('72.0');
  const [pm10OutInput, setPm10OutInput] = useState('25.8');
  const [submitting, setSubmitting] = useState(false);

  const { telemetry, sensors, config, mode } = state;
  const unit = config.measurementUnit;
  const scale = unit === 'mg/m³' ? 0.001 : 1;
  const dec = unit === 'mg/m³' ? 3 : 1;

  const filteredTelemetry = useMemo(() => {
    if (telemetry.length === 0) return [];
    const selected = TIME_FILTERS.find((f) => f.id === range) || TIME_FILTERS[2];
    const cutoff = Date.now() - selected.hours * 3600 * 1000;
    const sliced = telemetry.filter((t) => new Date(t.timestamp).getTime() >= cutoff);
    return sliced.length > 0 ? sliced : telemetry.slice(-6);
  }, [telemetry, range]);

  const latest = telemetry.length > 0 ? telemetry[telemetry.length - 1] : null;
  const pm25Inlet = latest?.pm25Inlet !== null && latest?.pm25Inlet !== undefined ? latest.pm25Inlet * scale : null;
  const pm25Outlet =
    config.hasOutletSensor && latest?.pm25Outlet !== null && latest?.pm25Outlet !== undefined
      ? latest.pm25Outlet * scale
      : null;
  const pm25Diff = pm25Inlet !== null && pm25Outlet !== null ? pm25Inlet - pm25Outlet : null;

  const pm10Inlet = latest?.pm10Inlet !== null && latest?.pm10Inlet !== undefined ? latest.pm10Inlet * scale : null;
  const pm10Outlet =
    config.hasOutletSensor && latest?.pm10Outlet !== null && latest?.pm10Outlet !== undefined
      ? latest.pm10Outlet * scale
      : null;

  const formattedTs = latest
    ? new Date(latest.timestamp).toLocaleString([], {
        dateStyle: 'medium',
        timeStyle: 'medium',
      })
    : 'Awaiting packet';

  async function handlePacketSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSendTestPacket({
        pm25Inlet: Number(pm25InInput),
        pm25Outlet: config.hasOutletSensor ? Number(pm25OutInput) : null,
        pm10Inlet: Number(pm10InInput),
        pm10Outlet: config.hasOutletSensor ? Number(pm10OutInput) : null,
      });
      setPacketOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-[Poppins] text-2xl sm:text-3xl font-semibold tracking-tight text-[#103B66]">
            Real-Time Air Quality Monitoring
          </h1>
          <p className="mt-1 text-sm text-[#103B66]/75">
            Live inlet and filtered-outlet particulate matter telemetry for {config.activePanelId}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPacketOpen((v) => !v)}
            className="inline-flex items-center gap-2 rounded-xl border border-[#82C5EF] bg-white px-4 py-2 text-xs font-medium text-[#103B66] hover:bg-[#EAF6FF] transition-colors whitespace-nowrap"
          >
            <Send className="w-3.5 h-3.5 text-[#176FAF]" />
            Ingest Hardware Test Packet
          </button>
          <button
            type="button"
            onClick={() =>
              onToggleMode(mode === 'demo_simulation' ? 'hardware_standby' : 'demo_simulation')
            }
            className={`rounded-xl px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
              mode === 'demo_simulation'
                ? 'bg-[#D7B978] text-[#103B66] font-semibold'
                : 'bg-[#176FAF] text-white hover:bg-[#103B66]'
            }`}
          >
            {mode === 'demo_simulation' ? 'Demo Mode Active (Switch Off)' : 'Enable Demo Simulation'}
          </button>
        </div>
      </div>

      {/* Manual ESP32 HTTP Test Packet Form */}
      {packetOpen && (
        <form
          onSubmit={handlePacketSubmit}
          className="airskin-card p-5 space-y-4 bg-[#F5FAFF]"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-[Poppins] text-sm font-semibold text-[#103B66]">
                Submit Sensor Reading to POST /api/telemetry
              </h2>
              <p className="text-xs text-[#103B66]/70">
                Simulates an actual ESP32 HTTP packet using your current hardware topology ({config.hasOutletSensor ? 'Dual Inlet + Outlet' : 'Single Inlet Sensor'}).
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <label className="block text-xs text-[#103B66]">
              <span className="font-medium">PM2.5 Inlet (µg/m³)</span>
              <input
                type="number"
                step="0.1"
                min="0"
                required
                value={pm25InInput}
                onChange={(e) => setPm25InInput(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#B9E0F8] bg-white px-3 py-2 font-mono text-sm text-[#103B66] focus:border-[#429EDB] focus:outline-none"
              />
            </label>
            {config.hasOutletSensor && (
              <label className="block text-xs text-[#103B66]">
                <span className="font-medium">PM2.5 Outlet (µg/m³)</span>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  required
                  value={pm25OutInput}
                  onChange={(e) => setPm25OutInput(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#B9E0F8] bg-white px-3 py-2 font-mono text-sm text-[#103B66] focus:border-[#429EDB] focus:outline-none"
                />
              </label>
            )}
            <label className="block text-xs text-[#103B66]">
              <span className="font-medium">PM10 Inlet (µg/m³)</span>
              <input
                type="number"
                step="0.1"
                min="0"
                required
                value={pm10InInput}
                onChange={(e) => setPm10InInput(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#B9E0F8] bg-white px-3 py-2 font-mono text-sm text-[#103B66] focus:border-[#429EDB] focus:outline-none"
              />
            </label>
            {config.hasOutletSensor && (
              <label className="block text-xs text-[#103B66]">
                <span className="font-medium">PM10 Outlet (µg/m³)</span>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  required
                  value={pm10OutInput}
                  onChange={(e) => setPm10OutInput(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#B9E0F8] bg-white px-3 py-2 font-mono text-sm text-[#103B66] focus:border-[#429EDB] focus:outline-none"
                />
              </label>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setPacketOpen(false)}
              className="rounded-xl border border-[#B9E0F8] bg-white px-4 py-2 text-xs font-medium text-[#103B66]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-[#176FAF] px-4 py-2 text-xs font-medium text-white hover:bg-[#103B66] disabled:opacity-50"
            >
              {submitting ? 'Sending...' : 'Transmit Packet'}
            </button>
          </div>
        </form>
      )}

      {/* A. PM2.5 Monitoring & B. PM10 Monitoring */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* A. PM2.5 Monitoring */}
        <section className="airskin-card p-6 space-y-5">
          <div className="flex items-center justify-between gap-3 border-b border-[#DCEEFB] pb-3.5">
            <div>
              <h2 className="font-[Poppins] text-base font-semibold text-[#103B66]">
                A. PM2.5 Fine Particulate Monitoring
              </h2>
              <p className="text-xs text-[#103B66]/65">Aerodynamic diameter ≤ 2.5 µm</p>
            </div>
            <span className="font-mono text-[11px] text-[#176FAF] tabular-nums">{formattedTs}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl bg-[#F5FAFF] border border-[#DCEEFB] p-4">
              <div className="text-xs font-medium text-[#103B66]/70">Inlet PM2.5</div>
              <div className="mt-1.5 font-mono tabular-nums text-2xl font-semibold text-[#176FAF]">
                {pm25Inlet !== null ? pm25Inlet.toFixed(dec) : '--'}
                <span className="ml-1 text-xs font-normal text-[#103B66]/60">{unit}</span>
              </div>
            </div>

            <div className="rounded-xl bg-[#F5FAFF] border border-[#DCEEFB] p-4">
              <div className="text-xs font-medium text-[#103B66]/70">Outlet PM2.5</div>
              <div className="mt-1.5 font-mono tabular-nums text-2xl font-semibold text-[#458B6D]">
                {pm25Outlet !== null ? pm25Outlet.toFixed(dec) : '--'}
                <span className="ml-1 text-xs font-normal text-[#103B66]/60">{unit}</span>
              </div>
              {!config.hasOutletSensor && (
                <div className="mt-1 text-[11px] text-[#103B66]/55">Second sensor not installed</div>
              )}
            </div>

            <div className="rounded-xl bg-[#F5FAFF] border border-[#DCEEFB] p-4">
              <div className="text-xs font-medium text-[#103B66]/70">Inlet − Outlet (Δ)</div>
              <div className="mt-1.5 font-mono tabular-nums text-2xl font-semibold text-[#103B66]">
                {pm25Diff !== null ? `${pm25Diff >= 0 ? '-' : '+'}${Math.abs(pm25Diff).toFixed(dec)}` : '--'}
                <span className="ml-1 text-xs font-normal text-[#103B66]/60">{unit}</span>
              </div>
            </div>
          </div>
        </section>

        {/* B. PM10 Monitoring */}
        <section className="airskin-card p-6 space-y-5">
          <div className="flex items-center justify-between gap-3 border-b border-[#DCEEFB] pb-3.5">
            <div>
              <h2 className="font-[Poppins] text-base font-semibold text-[#103B66]">
                B. PM10 Coarse Particulate Monitoring
              </h2>
              <p className="text-xs text-[#103B66]/65">Aerodynamic diameter ≤ 10 µm</p>
            </div>
            <span className="font-mono text-[11px] text-[#176FAF] tabular-nums">{formattedTs}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl bg-[#F5FAFF] border border-[#DCEEFB] p-4">
              <div className="text-xs font-medium text-[#103B66]/70">Inlet PM10</div>
              <div className="mt-1.5 font-mono tabular-nums text-2xl font-semibold text-[#176FAF]">
                {pm10Inlet !== null ? pm10Inlet.toFixed(dec) : '--'}
                <span className="ml-1 text-xs font-normal text-[#103B66]/60">{unit}</span>
              </div>
            </div>

            <div className="rounded-xl bg-[#F5FAFF] border border-[#DCEEFB] p-4">
              <div className="text-xs font-medium text-[#103B66]/70">Outlet PM10</div>
              <div className="mt-1.5 font-mono tabular-nums text-2xl font-semibold text-[#458B6D]">
                {pm10Outlet !== null ? pm10Outlet.toFixed(dec) : '--'}
                <span className="ml-1 text-xs font-normal text-[#103B66]/60">{unit}</span>
              </div>
              {!config.hasOutletSensor && (
                <div className="mt-1 text-[11px] text-[#103B66]/55">Second sensor not installed</div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* C. Real-Time Trend Chart */}
      <section className="airskin-card p-6 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-[Poppins] text-base font-semibold text-[#103B66]">
              C. Real-Time Particulate Trend
            </h2>
            <p className="text-xs text-[#103B66]/70">
              {mode === 'demo_simulation'
                ? 'Demo Mode — Simulated time-series trend'
                : mode === 'live_esp32'
                  ? 'Live ESP32 telemetry stream'
                  : 'Waiting for incoming sensor telemetry'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* PM2.5 vs PM10 switch */}
            <div className="flex items-center gap-1 rounded-xl border border-[#B9E0F8] bg-[#F5FAFF] p-1">
              <button
                type="button"
                onClick={() => setChartMetric('pm25')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  chartMetric === 'pm25' ? 'bg-[#176FAF] text-white' : 'text-[#103B66]/75'
                }`}
              >
                PM2.5
              </button>
              <button
                type="button"
                onClick={() => setChartMetric('pm10')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  chartMetric === 'pm10' ? 'bg-[#176FAF] text-white' : 'text-[#103B66]/75'
                }`}
              >
                PM10
              </button>
            </div>

            {/* Time Range Filters */}
            <div className="flex items-center gap-1 rounded-xl border border-[#B9E0F8] bg-[#F5FAFF] p-1">
              {TIME_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setRange(f.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    range === f.id ? 'bg-white text-[#103B66] shadow-xs' : 'text-[#103B66]/70 hover:text-[#103B66]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <InteractiveTrendChart
          data={filteredTelemetry}
          metric={chartMetric}
          unit={unit}
          hasOutletSensor={config.hasOutletSensor}
          onRequestDemo={() => onToggleMode('demo_simulation')}
        />
      </section>

      {/* D. Sensor Status */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-[Poppins] text-base font-semibold text-[#103B66]">
            D. Hardware & Sensor Node Status
          </h2>
          {!config.hasOutletSensor && (
            <span className="text-xs text-[#103B66]/70">
              Single-sensor inlet hardware active · Configure dual outlet sensor in Settings when installed
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {sensors.map((sensor) => {
            const Icon =
              sensor.id === 'esp32'
                ? Cpu
                : sensor.id === 'wifi'
                  ? sensor.online
                    ? Wifi
                    : WifiOff
                  : sensor.id === 'pm-outlet'
                    ? Activity
                    : Radio;

            return (
              <div key={sensor.id} className="airskin-card p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-[Poppins] text-sm font-semibold text-[#103B66]">
                      {sensor.name}
                    </div>
                    <div className="mt-0.5 font-mono text-[11px] text-[#176FAF]">
                      {sensor.hardwareModel}
                    </div>
                  </div>
                  <div className="rounded-xl bg-[#EAF6FF] p-2 text-[#176FAF]">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <div className="pt-2 border-t border-[#DCEEFB] flex items-center justify-between text-xs">
                  <span
                    className={`font-semibold ${
                      sensor.online ? 'text-[#458B6D]' : 'text-[#103B66]/55'
                    }`}
                  >
                    {sensor.online ? '● Online' : '○ Offline'}
                  </span>
                  <span className="font-mono tabular-nums text-[11px] text-[#103B66]/65">
                    {sensor.lastReceivedAt
                      ? new Date(sensor.lastReceivedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })
                      : 'No data'}
                  </span>
                </div>

                <p className="text-xs text-[#103B66]/70">{sensor.detail}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
