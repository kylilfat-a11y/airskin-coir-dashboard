import React, { useState } from 'react';
import { Calculator, FlaskConical, Info, Plus, Trash2 } from 'lucide-react';
import type { FilterConfigKey, FilterExperimentTrial, SystemStatePayload } from '../types/airskin';

interface FilterPerformancePageProps {
  state: SystemStatePayload;
  onAddTrial: (trial: {
    configKey: FilterConfigKey;
    pm25Inlet: number;
    pm25Outlet: number;
    pm10Inlet: number;
    pm10Outlet: number;
    notes: string;
  }) => Promise<void>;
  onLoadSampleTrials: () => Promise<void>;
  onClearTrials: () => Promise<void>;
}

const CONFIG_DEFINITIONS: Array<{ key: FilterConfigKey; label: string }> = [
  { key: 'A', label: 'A. Lapisan Nonwoven Saja' },
  { key: 'B', label: 'B. Media Serabut Kelapa Saja' },
  { key: 'C', label: 'C. Nonwoven + Serabut Kelapa' },
  { key: 'D', label: 'D. Kontrol Tanpa Filter' },
];

export const FilterPerformancePage: React.FC<FilterPerformancePageProps> = ({
  state,
  onAddTrial,
  onLoadSampleTrials,
  onClearTrials,
}) => {
  const { telemetry, config, experiments, mode } = state;
  const [calcCin, setCalcCin] = useState('52.0');
  const [calcCout, setCalcCout] = useState('21.8');

  const [formOpen, setFormOpen] = useState(false);
  const [formConfigKey, setFormConfigKey] = useState<FilterConfigKey>('C');
  const [pm25In, setPm25In] = useState('53.0');
  const [pm25Out, setPm25Out] = useState('22.1');
  const [pm10In, setPm10In] = useState('80.0');
  const [pm10Out, setPm10Out] = useState('25.2');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const latest = telemetry.length > 0 ? telemetry[telemetry.length - 1] : null;
  const outletAvailable = config.hasOutletSensor || mode === 'data_simulasi';
  const validPairPm25 =
    latest &&
    outletAvailable &&
    latest.pm25Inlet !== null &&
    latest.pm25Inlet > 0 &&
    latest.pm25Outlet !== null;
  const validPairPm10 =
    latest &&
    outletAvailable &&
    latest.pm10Inlet !== null &&
    latest.pm10Inlet > 0 &&
    latest.pm10Outlet !== null;

  const pm25EffLive = validPairPm25
    ? (((latest!.pm25Inlet! - latest!.pm25Outlet!) / latest!.pm25Inlet!) * 100).toFixed(1)
    : null;
  const pm10EffLive = validPairPm10
    ? (((latest!.pm10Inlet! - latest!.pm10Outlet!) / latest!.pm10Inlet!) * 100).toFixed(1)
    : null;

  const cinNum = Number(calcCin);
  const coutNum = Number(calcCout);
  const calcEta =
    Number.isFinite(cinNum) && cinNum > 0 && Number.isFinite(coutNum)
      ? (((cinNum - coutNum) / cinNum) * 100).toFixed(2)
      : '--';

  const hasSimulationTrial = experiments.some((e) => e.isSimulation);

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
        notes,
      });
      setFormOpen(false);
    } finally {
      setSaving(false);
    }
  }

  function renderComparisonBars(
    title: string,
    getValue: (t: FilterExperimentTrial) => number,
    barColor: string,
  ) {
    return (
      <div className="rounded-xl border border-[#DCEEFB] bg-[#F5FAFF] p-4 space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-[#103B66]">
          <span>{title}</span>
          <span className="font-mono text-[#176FAF]">%</span>
        </div>
        <div className="space-y-2.5">
          {CONFIG_DEFINITIONS.map((def) => {
            const match = experiments.find((e) => e.configKey === def.key);
            const val = match ? getValue(match) : null;
            const pct = val !== null ? Math.min(100, Math.max(0, val)) : 0;
            return (
              <div key={def.key} className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#103B66]/85 font-medium truncate pr-2">{def.label}</span>
                  <span className="font-mono tabular-nums font-semibold text-[#103B66] shrink-0">
                    {val !== null ? `${val.toFixed(1)}%` : '--'}
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
      <div>
        <h1 className="font-[Poppins] text-2xl sm:text-3xl font-semibold tracking-tight text-[#103B66]">
          Analisis Kinerja Filtrasi
        </h1>
        <p className="mt-1 text-sm text-[#103B66]/75">
          Perbandingan konsentrasi partikulat sebelum dan sesudah filtrasi, nilai efisiensi, serta riwayat pengujian media.
        </p>
      </div>

      {/* Keterangan Validitas Rumus Efisiensi */}
      <div className="rounded-xl border border-[#82C5EF] bg-[#F5FAFF] px-4 py-3 text-xs text-[#103B66] flex items-start gap-2.5">
        <Info className="w-4 h-4 text-[#176FAF] shrink-0 mt-0.5" />
        <span>
          <strong>Prinsip Perhitungan Ilmiah:</strong> Efisiensi filtrasi hanya dapat dihitung apabila data pengukuran udara masuk dan udara keluar tersedia secara bersamaan serta valid. Tidak ada klaim efisiensi yang ditampilkan tanpa data terukur.
        </span>
      </div>

      {/* Nilai Efisiensi Filtrasi Terkini */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="airskin-card p-5 space-y-1">
          <div className="text-xs font-semibold text-[#176FAF]">Efisiensi Filtrasi PM2.5</div>
          <div className="font-mono tabular-nums text-3xl font-semibold text-[#458B6D]">
            {pm25EffLive !== null ? `${pm25EffLive}%` : '--'}
          </div>
          <div className="text-[11px] text-[#103B66]/65">
            {pm25EffLive !== null
              ? mode === 'data_simulasi'
                ? 'DATA SIMULASI · Pasangan masuk/keluar'
                : 'Dihitung dari sensor aktual'
              : 'Menunggu data masuk & keluar yang valid'}
          </div>
        </div>

        <div className="airskin-card p-5 space-y-1">
          <div className="text-xs font-semibold text-[#176FAF]">Efisiensi Filtrasi PM10</div>
          <div className="font-mono tabular-nums text-3xl font-semibold text-[#458B6D]">
            {pm10EffLive !== null ? `${pm10EffLive}%` : '--'}
          </div>
          <div className="text-[11px] text-[#103B66]/65">
            {pm10EffLive !== null
              ? mode === 'data_simulasi'
                ? 'DATA SIMULASI · Pasangan masuk/keluar'
                : 'Dihitung dari sensor aktual'
              : 'Menunggu data masuk & keluar yang valid'}
          </div>
        </div>

        <div className="airskin-card p-5 space-y-1">
          <div className="text-xs font-semibold text-[#176FAF]">PM2.5 Masuk / Keluar</div>
          <div className="font-mono tabular-nums text-xl font-semibold text-[#103B66]">
            {latest?.pm25Inlet !== null && latest?.pm25Inlet !== undefined
              ? latest.pm25Inlet.toFixed(1)
              : '--'}{' '}
            /{' '}
            {outletAvailable && latest?.pm25Outlet !== null && latest?.pm25Outlet !== undefined
              ? latest.pm25Outlet.toFixed(1)
              : '--'}
            <span className="ml-1 text-xs font-normal text-[#103B66]/60">µg/m³</span>
          </div>
          <div className="text-[11px] text-[#103B66]/65">Perbandingan langsung PM2.5</div>
        </div>

        <div className="airskin-card p-5 space-y-1">
          <div className="text-xs font-semibold text-[#176FAF]">PM10 Masuk / Keluar</div>
          <div className="font-mono tabular-nums text-xl font-semibold text-[#103B66]">
            {latest?.pm10Inlet !== null && latest?.pm10Inlet !== undefined
              ? latest.pm10Inlet.toFixed(1)
              : '--'}{' '}
            /{' '}
            {outletAvailable && latest?.pm10Outlet !== null && latest?.pm10Outlet !== undefined
              ? latest.pm10Outlet.toFixed(1)
              : '--'}
            <span className="ml-1 text-xs font-normal text-[#103B66]/60">µg/m³</span>
          </div>
          <div className="text-[11px] text-[#103B66]/65">Perbandingan langsung PM10</div>
        </div>
      </section>

      {/* Rumus & Kalkulator Efisiensi Filtrasi */}
      <section className="airskin-card p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#176FAF]">
            <Calculator className="w-4 h-4" />
            <span>Rumus Efisiensi Filtrasi</span>
          </div>
          <div className="rounded-xl border border-[#B9E0F8] bg-[#F5FAFF] px-5 py-4 font-mono text-sm sm:text-base font-semibold text-[#103B66]">
            Efisiensi Filtrasi (%) = ((Konsentrasi Masuk − Konsentrasi Keluar) / Konsentrasi Masuk) × 100%
          </div>
          <p className="text-xs text-[#103B66]/75">
            Rumus hanya dapat menghasilkan angka valid jika Konsentrasi Masuk &gt; 0 dan nilai pengukuran Udara Keluar tersedia.
          </p>
        </div>

        <div className="lg:col-span-6 rounded-xl border border-[#DCEEFB] bg-[#F5FAFF] p-5 space-y-3">
          <div className="text-xs font-semibold text-[#103B66]">Simulasi Perhitungan Manual Rumus</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <label className="text-xs text-[#103B66]">
              <span>Konsentrasi Masuk (µg/m³)</span>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={calcCin}
                onChange={(e) => setCalcCin(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#B9E0F8] bg-white px-3 py-2 font-mono text-xs"
              />
            </label>
            <label className="text-xs text-[#103B66]">
              <span>Konsentrasi Keluar (µg/m³)</span>
              <input
                type="number"
                step="0.1"
                min="0"
                value={calcCout}
                onChange={(e) => setCalcCout(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#B9E0F8] bg-white px-3 py-2 font-mono text-xs"
              />
            </label>
            <div className="rounded-xl bg-[#103B66] px-4 py-2 text-white">
              <div className="text-[11px] text-[#B9E0F8]">Efisiensi</div>
              <div className="font-mono tabular-nums text-lg font-semibold">{calcEta}%</div>
            </div>
          </div>
        </div>
      </section>

      {/* Grafik Perbandingan PM2.5 & PM10 + Riwayat Pengujian */}
      <section className="airskin-card p-6 space-y-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-[#176FAF]" />
              <h2 className="font-[Poppins] text-base font-semibold text-[#103B66]">
                Grafik Perbandingan & Riwayat Pengujian Media
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-[#103B66]/70">
              Catat hasil uji laboratorium untuk membandingkan efisiensi filtrasi PM2.5 dan PM10 antar konfigurasi media.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setFormOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#176FAF] px-4 py-2 text-xs font-medium text-white hover:bg-[#103B66] whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              Catat Hasil Pengujian
            </button>
            {experiments.length === 0 ? (
              <button
                type="button"
                onClick={onLoadSampleTrials}
                className="rounded-xl border border-[#82C5EF] bg-white px-4 py-2 text-xs font-medium text-[#103B66] hover:bg-[#EAF6FF] whitespace-nowrap"
              >
                Muat Pratinjau DATA SIMULASI
              </button>
            ) : (
              <button
                type="button"
                onClick={onClearTrials}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#B9E0F8] bg-white px-3.5 py-2 text-xs font-medium text-[#103B66] hover:bg-[#EAF6FF] whitespace-nowrap"
              >
                <Trash2 className="w-3.5 h-3.5 text-[#176FAF]" />
                Kosongkan Riwayat
              </button>
            )}
          </div>
        </div>

        {hasSimulationTrial && (
          <div className="rounded-xl border border-[#D7B978] bg-[#FDF8EC] px-4 py-2.5 text-xs text-[#103B66]">
            <strong>DATA SIMULASI:</strong> Data grafik di bawah adalah contoh pratinjau antarmuka, bukan hasil pengujian laboratorium yang telah divalidasi.
          </div>
        )}

        {formOpen && (
          <form onSubmit={handleTrialSubmit} className="rounded-2xl border border-[#B9E0F8] bg-[#F5FAFF] p-5 space-y-4">
            <div className="font-[Poppins] text-sm font-semibold text-[#103B66]">
              Input Hasil Pengujian Terukur
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <label className="text-xs text-[#103B66]">
                <span>Konfigurasi Filter</span>
                <select
                  value={formConfigKey}
                  onChange={(e) => setFormConfigKey(e.target.value as FilterConfigKey)}
                  className="mt-1 w-full rounded-xl border border-[#B9E0F8] bg-white px-3 py-2 text-xs"
                >
                  {CONFIG_DEFINITIONS.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-[#103B66]">
                <span>PM2.5 Masuk (µg/m³)</span>
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
                <span>PM2.5 Keluar (µg/m³)</span>
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
                <span>PM10 Masuk (µg/m³)</span>
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
                <span>PM10 Keluar (µg/m³)</span>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={pm10Out}
                  onChange={(e) => setPm10Out(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#B9E0F8] bg-white px-3 py-2 font-mono text-xs"
                />
              </label>
            </div>
            <label className="block text-xs text-[#103B66]">
              <span>Catatan Pengujian</span>
              <input
                type="text"
                placeholder="Misalnya: Uji ruang chamber #2, kecepatan kipas 50%"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#B9E0F8] bg-white px-3 py-2 text-xs"
              />
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="rounded-xl border border-[#B9E0F8] bg-white px-4 py-2 text-xs text-[#103B66]"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#176FAF] px-4 py-2 text-xs font-medium text-white hover:bg-[#103B66]"
              >
                {saving ? 'Menyimpan...' : 'Simpan Pengujian'}
              </button>
            </div>
          </form>
        )}

        {experiments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#82C5EF] bg-[#F5FAFF] px-6 py-12 text-center">
            <p className="font-[Poppins] text-base font-semibold text-[#103B66]">
              Belum Ada Data Hasil Pengujian Tercatat
            </p>
            <p className="mt-1 max-w-lg mx-auto text-xs text-[#103B66]/70">
              Tidak ada klaim efisiensi filtrasi yang dibuat sebelum hasil pengujian dimasukkan. Klik &ldquo;Catat Hasil Pengujian&rdquo; atau muat pratinjau DATA SIMULASI.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderComparisonBars('Grafik Perbandingan Efisiensi PM2.5', (t) => t.pm25Efficiency, '#176FAF')}
              {renderComparisonBars('Grafik Perbandingan Efisiensi PM10', (t) => t.pm10Efficiency, '#72B89A')}
            </div>

            {/* Tabel Hasil Pengukuran */}
            <div className="overflow-x-auto rounded-xl border border-[#DCEEFB]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5FAFF] text-[#103B66]/70 border-b border-[#DCEEFB]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Konfigurasi</th>
                    <th className="px-4 py-3 font-semibold text-right">PM2.5 Masuk</th>
                    <th className="px-4 py-3 font-semibold text-right">PM2.5 Keluar</th>
                    <th className="px-4 py-3 font-semibold text-right">Efisiensi PM2.5</th>
                    <th className="px-4 py-3 font-semibold text-right">PM10 Masuk</th>
                    <th className="px-4 py-3 font-semibold text-right">PM10 Keluar</th>
                    <th className="px-4 py-3 font-semibold text-right">Efisiensi PM10</th>
                    <th className="px-4 py-3 font-semibold">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAF6FF] font-mono tabular-nums">
                  {experiments.map((row) => (
                    <tr key={row.id} className="hover:bg-[#F5FAFF]/60">
                      <td className="px-4 py-3 font-sans font-medium text-[#103B66]">{row.configLabel}</td>
                      <td className="px-4 py-3 text-right">{row.pm25Inlet.toFixed(1)}</td>
                      <td className="px-4 py-3 text-right">{row.pm25Outlet.toFixed(1)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-[#176FAF]">
                        {row.pm25Efficiency.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-right">{row.pm10Inlet.toFixed(1)}</td>
                      <td className="px-4 py-3 text-right">{row.pm10Outlet.toFixed(1)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-[#458B6D]">
                        {row.pm10Efficiency.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 font-sans text-[#103B66]/75">
                        {row.isSimulation ? 'DATA SIMULASI' : row.notes || 'Terukur'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
