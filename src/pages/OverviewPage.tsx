import React, { useState } from 'react';
import {
  Activity,
  ArrowRight,
  Cpu,
  Droplets,
  Fan,
  Filter,
  Gauge,
  Radio,
  Wind,
} from 'lucide-react';
import type { NavSection, SystemStatePayload } from '../types/airskin';
import { InteractiveTrendChart } from '../components/InteractiveTrendChart';

interface OverviewPageProps {
  state: SystemStatePayload;
  onNavigate: (section: NavSection) => void;
  onToggleMode: (mode: 'menunggu_koneksi' | 'data_simulasi') => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  state,
  onNavigate,
  onToggleMode,
}) => {
  const { telemetry, config, mode, sensors, notifications } = state;
  const [chartMetric, setChartMetric] = useState<'pm25' | 'pm10'>('pm25');

  const unit = config.measurementUnit;
  const scale = unit === 'mg/m³' ? 0.001 : 1;
  const dec = unit === 'mg/m³' ? 3 : 1;

  const latest = telemetry.length > 0 ? telemetry[telemetry.length - 1] : null;
  const isSim = mode === 'data_simulasi';

  const pm25In = latest?.pm25Inlet !== null && latest?.pm25Inlet !== undefined ? latest.pm25Inlet * scale : null;
  const pm25Out =
    config.hasOutletSensor && latest?.pm25Outlet !== null && latest?.pm25Outlet !== undefined
      ? latest.pm25Outlet * scale
      : null;

  const pm10In = latest?.pm10Inlet !== null && latest?.pm10Inlet !== undefined ? latest.pm10Inlet * scale : null;
  const pm10Out =
    config.hasOutletSensor && latest?.pm10Outlet !== null && latest?.pm10Outlet !== undefined
      ? latest.pm10Outlet * scale
      : null;

  const effPm25 =
    pm25In !== null && pm25In > 0 && pm25Out !== null ? ((pm25In - pm25Out) / pm25In) * 100 : null;
  const effPm10 =
    pm10In !== null && pm10In > 0 && pm10Out !== null ? ((pm10In - pm10Out) / pm10In) * 100 : null;

  const espNode = sensors.find((s) => s.id === 'esp32');
  const pmInletNode = sensors.find((s) => s.id === 'pm-inlet');

  return (
    <div className="space-y-6">
      {/* Tajuk Halaman Dashboard Monitoring */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-[Poppins] text-2xl sm:text-3xl font-semibold tracking-tight text-[#103B66]">
            Ringkasan Kualitas Udara
          </h1>
          <p className="mt-1 text-sm text-[#103B66]/75">
            Pantau kondisi kualitas udara dan performa sistem filtrasi AIRSKIN COIR secara terintegrasi.
          </p>
        </div>

        {/* Sakelar Sumber Data */}
        <div className="flex items-center gap-1 rounded-xl border border-[#B9E0F8] bg-white p-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onToggleMode('menunggu_koneksi')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              mode !== 'data_simulasi'
                ? 'bg-[#176FAF] text-white'
                : 'text-[#103B66]/75 hover:bg-[#EAF6FF]'
            }`}
          >
            {mode === 'terhubung_esp32' ? 'Data Sensor Aktual' : 'Menunggu Sensor'}
          </button>
          <button
            type="button"
            onClick={() => onToggleMode('data_simulasi')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              mode === 'data_simulasi'
                ? 'bg-[#D7B978] text-[#103B66] font-semibold'
                : 'text-[#103B66]/75 hover:bg-[#EAF6FF]'
            }`}
          >
            DATA SIMULASI
          </button>
        </div>
      </div>

      {/* Peringatan Tegas DATA SIMULASI */}
      {isSim && (
        <div className="rounded-xl border border-[#D7B978] bg-[#FDF8EC] px-4 py-2.5 text-xs text-[#103B66] flex flex-wrap items-center justify-between gap-2">
          <span>
            <strong>DATA SIMULASI:</strong> Perangkat ESP32 belum mengirimkan data aktual. Angka di bawah hanya simulasi pratinjau antarmuka, bukan hasil eksperimen nyata.
          </span>
          <button
            type="button"
            onClick={() => onToggleMode('menunggu_koneksi')}
            className="font-semibold text-[#176FAF] underline underline-offset-2 hover:text-[#103B66] whitespace-nowrap"
          >
            Kembali ke Menunggu Data Sensor
          </button>
        </div>
      )}

      {/* 4 Kartu Informasi Utama: PM2.5 & PM10 Udara Masuk / Keluar */}
      <section aria-label="Konsentrasi Partikulat Utama" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <article className="airskin-card p-5 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#176FAF]">PM2.5 Udara Masuk ({unit})</span>
            <Wind className="w-4 h-4 text-[#176FAF]" />
          </div>
          <div className="font-mono tabular-nums text-3xl font-semibold text-[#103B66]">
            {pm25In !== null ? pm25In.toFixed(dec) : '--'}
          </div>
          <div className="text-xs text-[#103B66]/65">
            {pm25In !== null
              ? isSim
                ? 'DATA SIMULASI · Sebelum filtrasi'
                : 'Pembacaan aktual sebelum filtrasi'
              : 'Menunggu data sensor'}
          </div>
        </article>

        <article className="airskin-card p-5 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#176FAF]">PM2.5 Udara Keluar ({unit})</span>
            <Filter className="w-4 h-4 text-[#72B89A]" />
          </div>
          <div className="font-mono tabular-nums text-3xl font-semibold text-[#458B6D]">
            {pm25Out !== null ? pm25Out.toFixed(dec) : '--'}
          </div>
          <div className="text-xs text-[#103B66]/65">
            {pm25Out !== null
              ? isSim
                ? 'DATA SIMULASI · Sesudah filtrasi'
                : 'Pembacaan aktual sesudah filtrasi'
              : !config.hasOutletSensor
                ? 'Menunggu data sensor (kanal keluar belum aktif)'
                : 'Menunggu data sensor'}
          </div>
        </article>

        <article className="airskin-card p-5 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#176FAF]">PM10 Udara Masuk ({unit})</span>
            <Droplets className="w-4 h-4 text-[#429EDB]" />
          </div>
          <div className="font-mono tabular-nums text-3xl font-semibold text-[#103B66]">
            {pm10In !== null ? pm10In.toFixed(dec) : '--'}
          </div>
          <div className="text-xs text-[#103B66]/65">
            {pm10In !== null
              ? isSim
                ? 'DATA SIMULASI · Partikulat kasar masuk'
                : 'Pembacaan aktual partikulat kasar'
              : 'Menunggu data sensor'}
          </div>
        </article>

        <article className="airskin-card p-5 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#176FAF]">PM10 Udara Keluar ({unit})</span>
            <Filter className="w-4 h-4 text-[#72B89A]" />
          </div>
          <div className="font-mono tabular-nums text-3xl font-semibold text-[#458B6D]">
            {pm10Out !== null ? pm10Out.toFixed(dec) : '--'}
          </div>
          <div className="text-xs text-[#103B66]/65">
            {pm10Out !== null
              ? isSim
                ? 'DATA SIMULASI · Sesudah filtrasi'
                : 'Pembacaan aktual sesudah filtrasi'
              : !config.hasOutletSensor
                ? 'Menunggu data sensor (kanal keluar belum aktif)'
                : 'Menunggu data sensor'}
          </div>
        </article>
      </section>

      {/* 4 Kartu Informasi Tambahan: Efisiensi PM2.5, Efisiensi PM10, Status ESP32, Status Sensor */}
      <section aria-label="Efisiensi dan Status Perangkat" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <article className="airskin-surface-sky p-4 space-y-1.5">
          <div className="flex items-center justify-between gap-2 text-xs font-semibold text-[#176FAF]">
            <span>Efisiensi Filtrasi PM2.5 (%)</span>
            <Gauge className="w-4 h-4" />
          </div>
          <div className="font-mono tabular-nums text-2xl font-semibold text-[#103B66]">
            {effPm25 !== null ? `${effPm25.toFixed(1)}%` : '--'}
          </div>
          <div className="text-[11px] text-[#103B66]/70">
            {effPm25 !== null
              ? isSim
                ? 'DATA SIMULASI · Dihitung dari masuk & keluar'
                : 'Dihitung dari sensor masuk & keluar'
              : 'Menunggu data sensor masuk & keluar'}
          </div>
        </article>

        <article className="airskin-surface-sky p-4 space-y-1.5">
          <div className="flex items-center justify-between gap-2 text-xs font-semibold text-[#176FAF]">
            <span>Efisiensi Filtrasi PM10 (%)</span>
            <Gauge className="w-4 h-4" />
          </div>
          <div className="font-mono tabular-nums text-2xl font-semibold text-[#103B66]">
            {effPm10 !== null ? `${effPm10.toFixed(1)}%` : '--'}
          </div>
          <div className="text-[11px] text-[#103B66]/70">
            {effPm10 !== null
              ? isSim
                ? 'DATA SIMULASI · Dihitung dari masuk & keluar'
                : 'Dihitung dari sensor masuk & keluar'
              : 'Menunggu data sensor masuk & keluar'}
          </div>
        </article>

        <article className="airskin-surface-sky p-4 space-y-1.5">
          <div className="flex items-center justify-between gap-2 text-xs font-semibold text-[#176FAF]">
            <span>Status ESP32</span>
            <Cpu className="w-4 h-4" />
          </div>
          <div
            className={`font-[Poppins] text-lg font-semibold ${
              espNode?.status === 'Terhubung' ? 'text-[#458B6D]' : 'text-[#103B66]'
            }`}
          >
            {espNode?.status || 'Menunggu koneksi'}
          </div>
          <div className="font-mono text-[11px] text-[#103B66]/70 truncate">
            {config.esp32DeviceId}
          </div>
        </article>

        <article className="airskin-surface-sky p-4 space-y-1.5">
          <div className="flex items-center justify-between gap-2 text-xs font-semibold text-[#176FAF]">
            <span>Status Sensor</span>
            <Radio className="w-4 h-4" />
          </div>
          <div
            className={`font-[Poppins] text-lg font-semibold ${
              pmInletNode?.status === 'Terhubung' ? 'text-[#458B6D]' : 'text-[#103B66]'
            }`}
          >
            {pmInletNode?.status || 'Menunggu koneksi'}
          </div>
          <div className="text-[11px] text-[#103B66]/70 truncate">
            {config.hasOutletSensor ? 'Kanal Masuk & Keluar Aktif' : 'Sensor Masuk Tunggal (CH1)'}
          </div>
        </article>
      </section>

      {/* Grafik Perubahan PM2.5 & PM10 + Skema Gedung & Aliran Udara */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* Grafik Perubahan PM2.5 dan PM10 */}
        <section className="xl:col-span-7 airskin-card p-6 flex flex-col justify-between gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-[Poppins] text-base font-semibold text-[#103B66]">
                Grafik Perubahan PM2.5 dan PM10
              </h2>
              <p className="text-xs text-[#103B66]/70">
                Pemantauan konsentrasi partikulat berdasarkan waktu pada panel {config.activePanelId}.
              </p>
            </div>
            <div className="flex items-center gap-1 rounded-xl border border-[#B9E0F8] bg-[#F5FAFF] p-1">
              <button
                type="button"
                onClick={() => setChartMetric('pm25')}
                className={`px-3 py-1 rounded-lg text-xs font-medium ${
                  chartMetric === 'pm25' ? 'bg-[#176FAF] text-white' : 'text-[#103B66]/75'
                }`}
              >
                PM2.5
              </button>
              <button
                type="button"
                onClick={() => setChartMetric('pm10')}
                className={`px-3 py-1 rounded-lg text-xs font-medium ${
                  chartMetric === 'pm10' ? 'bg-[#176FAF] text-white' : 'text-[#103B66]/75'
                }`}
              >
                PM10
              </button>
            </div>
          </div>

          <InteractiveTrendChart
            data={telemetry}
            metric={chartMetric}
            unit={unit}
            hasOutletSensor={config.hasOutletSensor}
            isSimulation={isSim}
            onRequestDemo={() => onToggleMode('data_simulasi')}
          />
        </section>

        {/* Ilustrasi Gedung + Indikator Aliran Udara + Ringkasan Kondisi Perangkat */}
        <section className="xl:col-span-5 airskin-card overflow-hidden flex flex-col">
          <div className="border-b border-[#DCEEFB] px-5 py-3.5 bg-[#F5FAFF] flex items-center justify-between gap-2">
            <span className="font-[Poppins] text-sm font-semibold text-[#103B66]">
              Fasad Bangunan & Aliran Udara
            </span>
            <button
              type="button"
              onClick={() => onNavigate('panel')}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#176FAF] hover:underline"
            >
              Detail Panel <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="relative h-52 bg-[#EAF6FF]">
            <img
              src="/src/assets/images/facade_3d_isometric_1795694950809.jpg"
              alt="Ilustrasi gedung dengan panel AIRSKIN COIR yang terpasang di fasad"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
            {/* Indikator Aliran Udara Masuk dan Keluar */}
            <div className="rounded-xl border border-[#DCEEFB] bg-[#F5FAFF] p-3.5 space-y-2.5">
              <div className="text-xs font-semibold text-[#103B66]">
                Indikator Aliran Udara Masuk & Keluar
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg bg-white border border-[#DCEEFB] p-2.5">
                  <div className="text-[11px] text-[#103B66]/65">Udara Masuk (Inlet)</div>
                  <div className="mt-0.5 font-semibold text-[#176FAF] flex items-center gap-1.5">
                    <Wind className="w-3.5 h-3.5" />
                    {mode === 'terhubung_esp32' ? 'Aliran Aktif' : isSim ? 'Simulasi Aktif' : 'Siaga'}
                  </div>
                </div>
                <div className="rounded-lg bg-white border border-[#DCEEFB] p-2.5">
                  <div className="text-[11px] text-[#103B66]/65">Udara Keluar (Outlet)</div>
                  <div className="mt-0.5 font-semibold text-[#458B6D] flex items-center gap-1.5">
                    <Fan className="w-3.5 h-3.5" />
                    {mode === 'terhubung_esp32'
                      ? 'Kipas DC Aktif'
                      : isSim
                        ? 'Simulasi Terfiltrasi'
                        : 'Menunggu Kipas DC'}
                  </div>
                </div>
              </div>
            </div>

            {/* Ringkasan Kondisi Perangkat & Notifikasi Terbaru */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#103B66]">Ringkasan Kondisi Perangkat</span>
                <button
                  type="button"
                  onClick={() => onNavigate('pengaturan')}
                  className="text-[#176FAF] font-medium hover:underline"
                >
                  Atur Perangkat
                </button>
              </div>
              <div className="space-y-1.5 text-xs">
                {sensors.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between py-1 border-b border-[#EAF6FF] last:border-b-0"
                  >
                    <span className="text-[#103B66]/85">{s.name}</span>
                    <span
                      className={`font-semibold ${
                        s.status === 'Terhubung'
                          ? 'text-[#458B6D]'
                          : s.status === 'Terputus'
                            ? 'text-[#C2410C]'
                            : 'text-[#176FAF]'
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>
                ))}
              </div>
              {notifications[0] && (
                <div className="pt-1 text-[11px] text-[#103B66]/70 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#429EDB] shrink-0" />
                  <span className="truncate">{notifications[0].message}</span>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Tagline Penutup */}
      <footer className="pt-1 pb-3 text-center text-xs text-[#103B66]/70">
        AIRSKIN COIR — Pantau Udara, Optimalkan Filtrasi, Bangun Lingkungan Lebih Baik.
      </footer>
    </div>
  );
};
