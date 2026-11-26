import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import type { DataSourceMode, FilterConfigKey, SimulationScenarioKey } from '../types/airskin';

interface SimulationSelectorProps {
  mode: DataSourceMode;
  scenario: SimulationScenarioKey;
  filterConfig: FilterConfigKey;
  onToggleMode: (mode: 'menunggu_koneksi' | 'data_simulasi') => void;
  onChangePreset: (scenario: SimulationScenarioKey, filterConfig: FilterConfigKey) => void;
}

const SCENARIO_OPTIONS: Array<{ id: SimulationScenarioKey; label: string }> = [
  { id: 'pagi_bersih', label: 'Udara Pagi Bersih (~18 µg/m³)' },
  { id: 'normal', label: 'Udara Perkotaan Normal (~39 µg/m³)' },
  { id: 'lalu_lintas', label: 'Jam Sibuk Lalu Lintas (~65 µg/m³)' },
  { id: 'beban_tinggi', label: 'Beban Partikulat Tinggi (~118 µg/m³)' },
];

const FILTER_OPTIONS: Array<{ id: FilterConfigKey; label: string }> = [
  { id: 'A', label: 'A. Lapisan Nonwoven Saja' },
  { id: 'B', label: 'B. Media Serabut Kelapa Saja' },
  { id: 'C', label: 'C. Nonwoven + Serabut Kelapa' },
  { id: 'D', label: 'D. Kontrol Tanpa Filter' },
];

export const SimulationSelector: React.FC<SimulationSelectorProps> = ({
  mode,
  scenario,
  filterConfig,
  onToggleMode,
  onChangePreset,
}) => {
  const isSim = mode === 'data_simulasi';

  return (
    <div className="airskin-card p-4 space-y-3 bg-[#F5FAFF]">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#103B66]">
          <SlidersHorizontal className="w-4 h-4 text-[#176FAF] shrink-0" />
          <span>Sumber Data & Pilihan Skenario Simulasi</span>
        </div>

        {/* Pilihan Mode Utama */}
        <div className="flex items-center gap-1 rounded-xl border border-[#B9E0F8] bg-white p-1 self-start md:self-auto">
          <button
            type="button"
            onClick={() => onToggleMode('menunggu_koneksi')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              !isSim ? 'bg-[#176FAF] text-white' : 'text-[#103B66]/75 hover:bg-[#EAF6FF]'
            }`}
          >
            {mode === 'terhubung_esp32' ? 'Data Sensor Aktual' : 'Menunggu Sensor Aktual'}
          </button>
          <button
            type="button"
            onClick={() => onToggleMode('data_simulasi')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              isSim
                ? 'bg-[#D7B978] text-[#103B66] font-semibold'
                : 'text-[#103B66]/75 hover:bg-[#EAF6FF]'
            }`}
          >
            DATA SIMULASI
          </button>
        </div>
      </div>

      {/* Pilihan Skenario Lingkungan & Konfigurasi Filter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 border-t border-[#DCEEFB]">
        <label className="block text-xs text-[#103B66]">
          <span className="font-medium text-[#176FAF]">Pilihan Skenario Udara (Simulasi)</span>
          <select
            value={scenario}
            onChange={(e) =>
              onChangePreset(e.target.value as SimulationScenarioKey, filterConfig)
            }
            className="mt-1 w-full rounded-xl border border-[#B9E0F8] bg-white px-3 py-2 text-xs text-[#103B66] focus:border-[#429EDB] focus:outline-none"
          >
            {SCENARIO_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs text-[#103B66]">
          <span className="font-medium text-[#176FAF]">Pilihan Konfigurasi Media (Simulasi)</span>
          <select
            value={filterConfig}
            onChange={(e) => onChangePreset(scenario, e.target.value as FilterConfigKey)}
            className="mt-1 w-full rounded-xl border border-[#B9E0F8] bg-white px-3 py-2 text-xs text-[#103B66] focus:border-[#429EDB] focus:outline-none"
          >
            {FILTER_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isSim ? (
        <div className="text-[11px] text-[#7A5B1A] bg-[#FDF8EC] border border-[#D7B978] rounded-xl px-3.5 py-2">
          <strong>DATA SIMULASI AKTIF:</strong> Nilai yang ditampilkan pada kartu & grafik merupakan data simulasi sesuai pilihan di atas, bukan hasil pengukuran perangkat keras aktual.
        </div>
      ) : (
        <div className="text-[11px] text-[#103B66]/70">
          {mode === 'terhubung_esp32'
            ? 'Menampilkan data sensor aktual dari ESP32. Mengubah pilihan di atas akan beralih ke pratinjau DATA SIMULASI.'
            : 'Perangkat keras belum terhubung sehingga angka aktual ditampilkan "--". Pilih salah satu opsi di atas atau klik DATA SIMULASI untuk melihat simulasi.'}
        </div>
      )}
    </div>
  );
};
