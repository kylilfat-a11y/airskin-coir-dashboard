import React, { useMemo, useState } from 'react';
import { Info, Send } from 'lucide-react';
import type {
  FilterConfigKey,
  SimulationScenarioKey,
  SystemStatePayload,
  TimeRangeFilter,
} from '../types/airskin';
import { InteractiveTrendChart } from '../components/InteractiveTrendChart';
import { SimulationSelector } from '../components/SimulationSelector';

interface LiveMonitoringPageProps {
  state: SystemStatePayload;
  onToggleMode: (mode: 'menunggu_koneksi' | 'data_simulasi') => void;
  onChangeSimulationPreset: (
    scenario: SimulationScenarioKey,
    filterConfig: FilterConfigKey,
  ) => void;
  onSendTestPacket: (payload: {
    pm25Inlet: number;
    pm25Outlet: number | null;
    pm10Inlet: number;
    pm10Outlet: number | null;
  }) => Promise<void>;
}

const TIME_FILTERS: Array<{ id: TimeRangeFilter; label: string; hours: number }> = [
  { id: '1h', label: '1 jam terakhir', hours: 1 },
  { id: '6h', label: '6 jam terakhir', hours: 6 },
  { id: '24h', label: '24 jam terakhir', hours: 24 },
  { id: '7d', label: '7 hari terakhir', hours: 168 },
];

export const LiveMonitoringPage: React.FC<LiveMonitoringPageProps> = ({
  state,
  onToggleMode,
  onChangeSimulationPreset,
  onSendTestPacket,
}) => {
  const [range, setRange] = useState<TimeRangeFilter>('24h');
  const [packetOpen, setPacketOpen] = useState(false);
  const [pm25InInput, setPm25InInput] = useState('45.8');
  const [pm25OutInput, setPm25OutInput] = useState('20.2');
  const [pm10InInput, setPm10InInput] = useState('71.4');
  const [pm10OutInput, setPm10OutInput] = useState('25.1');
  const [submitting, setSubmitting] = useState(false);

  const { telemetry, config, mode } = state;
  const isSim = mode === 'data_simulasi';
  const outletAvailable = config.hasOutletSensor || isSim;
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
  const prev = telemetry.length > 1 ? telemetry[telemetry.length - 2] : null;

  const pm25In = latest?.pm25Inlet !== null && latest?.pm25Inlet !== undefined ? latest.pm25Inlet * scale : null;
  const pm25Out =
    outletAvailable && latest?.pm25Outlet !== null && latest?.pm25Outlet !== undefined
      ? latest.pm25Outlet * scale
      : null;
  const pm25Change =
    pm25In !== null && pm25Out !== null
      ? pm25Out - pm25In
      : latest && prev && latest.pm25Inlet !== null && prev.pm25Inlet !== null
        ? (latest.pm25Inlet - prev.pm25Inlet) * scale
        : null;

  const pm10In = latest?.pm10Inlet !== null && latest?.pm10Inlet !== undefined ? latest.pm10Inlet * scale : null;
  const pm10Out =
    outletAvailable && latest?.pm10Outlet !== null && latest?.pm10Outlet !== undefined
      ? latest.pm10Outlet * scale
      : null;
  const pm10Change =
    pm10In !== null && pm10Out !== null
      ? pm10Out - pm10In
      : latest && prev && latest.pm10Inlet !== null && prev.pm10Inlet !== null
        ? (latest.pm10Inlet - prev.pm10Inlet) * scale
        : null;

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
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-[Poppins] text-2xl sm:text-3xl font-semibold tracking-tight text-[#103B66]">
            Pemantauan Kualitas Udara
          </h1>
          <p className="mt-1 text-sm text-[#103B66]/75">
            Data konsentrasi partikulat PM2.5 dan PM10 secara berkala pada panel {config.activePanelId}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPacketOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#82C5EF] bg-white px-3.5 py-2 text-xs font-medium text-[#103B66] hover:bg-[#EAF6FF] whitespace-nowrap"
          >
            <Send className="w-3.5 h-3.5 text-[#176FAF]" />
            Kirim Paket Uji ESP32
          </button>
        </div>
      </div>

      {/* Pilihan Sumber Data & Skenario Simulasi */}
      <SimulationSelector
        mode={mode}
        scenario={config.simulationScenario}
        filterConfig={config.simulationFilterConfig}
        onToggleMode={onToggleMode}
        onChangePreset={onChangeSimulationPreset}
      />

      {/* Keterangan Batasan Sensor Partikulat */}
      <div className="rounded-xl border border-[#82C5EF] bg-[#F5FAFF] px-4 py-3 text-xs text-[#103B66] flex items-start gap-2.5">
        <Info className="w-4 h-4 text-[#176FAF] shrink-0 mt-0.5" />
        <span>
          <strong>Catatan Pengukuran:</strong> Sensor partikulat mengukur konsentrasi materi partikulat tersuspensi (PM2.5 dan PM10), bukan seluruh jenis polutan udara seperti gas karbon monoksida (CO), NO₂, SO₂, maupun senyawa organik volatil (VOC).
        </span>
      </div>

      {/* Pilihan Rentang Waktu */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-semibold text-[#103B66]">Pilih Rentang Waktu Grafik:</span>
        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-[#B9E0F8] bg-white p-1">
          {TIME_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setRange(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                range === f.id ? 'bg-[#176FAF] text-white' : 'text-[#103B66]/75 hover:bg-[#EAF6FF]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {packetOpen && (
        <form onSubmit={handlePacketSubmit} className="airskin-card p-5 space-y-4 bg-[#F5FAFF]">
          <div className="font-[Poppins] text-sm font-semibold text-[#103B66]">
            Kirim Paket Telemetri Uji ke POST /api/telemetry
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <label className="text-xs text-[#103B66]">
              <span>PM2.5 Masuk (µg/m³)</span>
              <input
                type="number"
                step="0.1"
                required
                value={pm25InInput}
                onChange={(e) => setPm25InInput(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#B9E0F8] bg-white px-3 py-2 font-mono text-xs"
              />
            </label>
            {config.hasOutletSensor && (
              <label className="text-xs text-[#103B66]">
                <span>PM2.5 Keluar (µg/m³)</span>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={pm25OutInput}
                  onChange={(e) => setPm25OutInput(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#B9E0F8] bg-white px-3 py-2 font-mono text-xs"
                />
              </label>
            )}
            <label className="text-xs text-[#103B66]">
              <span>PM10 Masuk (µg/m³)</span>
              <input
                type="number"
                step="0.1"
                required
                value={pm10InInput}
                onChange={(e) => setPm10InInput(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#B9E0F8] bg-white px-3 py-2 font-mono text-xs"
              />
            </label>
            {config.hasOutletSensor && (
              <label className="text-xs text-[#103B66]">
                <span>PM10 Keluar (µg/m³)</span>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={pm10OutInput}
                  onChange={(e) => setPm10OutInput(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#B9E0F8] bg-white px-3 py-2 font-mono text-xs"
                />
              </label>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setPacketOpen(false)}
              className="rounded-xl border border-[#B9E0F8] bg-white px-4 py-2 text-xs text-[#103B66]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-[#176FAF] px-4 py-2 text-xs font-medium text-white hover:bg-[#103B66]"
            >
              {submitting ? 'Mengirim...' : 'Kirim Data'}
            </button>
          </div>
        </form>
      )}

      {/* A. Pemantauan PM2.5 */}
      <section className="airskin-card p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DCEEFB] pb-3.5">
          <div>
            <h2 className="font-[Poppins] text-base font-semibold text-[#103B66]">
              A. Pemantauan PM2.5
            </h2>
            <p className="text-xs text-[#103B66]/65">Partikulat halus berdiameter ≤ 2,5 mikrometer</p>
          </div>
          {isSim && <span className="font-mono text-xs font-semibold text-[#A68338]">DATA SIMULASI</span>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-[#DCEEFB] bg-[#F5FAFF] p-4">
            <div className="text-xs text-[#103B66]/70">Konsentrasi Udara Masuk</div>
            <div className="mt-1 font-mono tabular-nums text-2xl font-semibold text-[#176FAF]">
              {pm25In !== null ? pm25In.toFixed(dec) : '--'}{' '}
              <span className="text-xs font-normal text-[#103B66]/60">{unit}</span>
            </div>
          </div>
          <div className="rounded-xl border border-[#DCEEFB] bg-[#F5FAFF] p-4">
            <div className="text-xs text-[#103B66]/70">Konsentrasi Udara Keluar</div>
            <div className="mt-1 font-mono tabular-nums text-2xl font-semibold text-[#458B6D]">
              {pm25Out !== null ? pm25Out.toFixed(dec) : '--'}{' '}
              <span className="text-xs font-normal text-[#103B66]/60">{unit}</span>
            </div>
          </div>
          <div className="rounded-xl border border-[#DCEEFB] bg-[#F5FAFF] p-4">
            <div className="text-xs text-[#103B66]/70">Perubahan Konsentrasi</div>
            <div className="mt-1 font-mono tabular-nums text-2xl font-semibold text-[#103B66]">
              {pm25Change !== null ? `${pm25Change > 0 ? '+' : ''}${pm25Change.toFixed(dec)}` : '--'}{' '}
              <span className="text-xs font-normal text-[#103B66]/60">{unit}</span>
            </div>
          </div>
        </div>

        <InteractiveTrendChart
          data={filteredTelemetry}
          metric="pm25"
          unit={unit}
          hasOutletSensor={outletAvailable}
          isSimulation={isSim}
          onRequestDemo={() => onToggleMode('data_simulasi')}
        />
      </section>

      {/* B. Pemantauan PM10 */}
      <section className="airskin-card p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DCEEFB] pb-3.5">
          <div>
            <h2 className="font-[Poppins] text-base font-semibold text-[#103B66]">
              B. Pemantauan PM10
            </h2>
            <p className="text-xs text-[#103B66]/65">Partikulat kasar berdiameter ≤ 10 mikrometer</p>
          </div>
          {isSim && <span className="font-mono text-xs font-semibold text-[#A68338]">DATA SIMULASI</span>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-[#DCEEFB] bg-[#F5FAFF] p-4">
            <div className="text-xs text-[#103B66]/70">Konsentrasi Udara Masuk</div>
            <div className="mt-1 font-mono tabular-nums text-2xl font-semibold text-[#176FAF]">
              {pm10In !== null ? pm10In.toFixed(dec) : '--'}{' '}
              <span className="text-xs font-normal text-[#103B66]/60">{unit}</span>
            </div>
          </div>
          <div className="rounded-xl border border-[#DCEEFB] bg-[#F5FAFF] p-4">
            <div className="text-xs text-[#103B66]/70">Konsentrasi Udara Keluar</div>
            <div className="mt-1 font-mono tabular-nums text-2xl font-semibold text-[#458B6D]">
              {pm10Out !== null ? pm10Out.toFixed(dec) : '--'}{' '}
              <span className="text-xs font-normal text-[#103B66]/60">{unit}</span>
            </div>
          </div>
          <div className="rounded-xl border border-[#DCEEFB] bg-[#F5FAFF] p-4">
            <div className="text-xs text-[#103B66]/70">Perubahan Konsentrasi</div>
            <div className="mt-1 font-mono tabular-nums text-2xl font-semibold text-[#103B66]">
              {pm10Change !== null ? `${pm10Change > 0 ? '+' : ''}${pm10Change.toFixed(dec)}` : '--'}{' '}
              <span className="text-xs font-normal text-[#103B66]/60">{unit}</span>
            </div>
          </div>
        </div>

        <InteractiveTrendChart
          data={filteredTelemetry}
          metric="pm10"
          unit={unit}
          hasOutletSensor={outletAvailable}
          isSimulation={isSim}
          onRequestDemo={() => onToggleMode('data_simulasi')}
        />
      </section>
    </div>
  );
};
