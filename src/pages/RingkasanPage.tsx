import React from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Cpu,
  Gauge,
  Radio,
  Wind,
} from 'lucide-react';
import type { DataSourceMode, NavSection, SystemStatePayload } from '../types/airskin';
import {
  calcRemovalEfficiency,
  filterTelemetryByRange,
  formatTimestamp,
} from '../utils/airskinMetrics';
import { InteractiveTrendChart } from '../components/InteractiveTrendChart';
import heroFacadeImg from '../assets/images/hero_facade_building_1795694951234.jpg';

interface RingkasanPageProps {
  state: SystemStatePayload;
  onChangeDataSource: (mode: DataSourceMode) => Promise<void>;
  onNavigate: (section: NavSection) => void;
}

export const RingkasanPage: React.FC<RingkasanPageProps> = ({
  state,
  onChangeDataSource,
  onNavigate,
}) => {
  const isSimulated = state.dataSourceMode === 'simulasi';
  const activeSeries = isSimulated
    ? state.simulationTelemetry
    : state.deviceConnected
      ? state.liveTelemetry
      : [];

  const latest = activeSeries.length > 0 ? activeSeries[activeSeries.length - 1] : null;
  const chartPoints = filterTelemetryByRange(activeSeries, '24h');

  const effPm25 = latest ? calcRemovalEfficiency(latest.pm25Inlet, latest.pm25Outlet) : null;
  const effPm10 = latest ? calcRemovalEfficiency(latest.pm10Inlet, latest.pm10Outlet) : null;

  const fourMainCards = [
    {
      label: 'PM2.5 Udara Masuk (µg/m³)',
      value: latest?.pm25Inlet ?? null,
      accent: 'border-t-[#176FAF]',
      textColor: 'text-[#176FAF]',
    },
    {
      label: 'PM2.5 Udara Keluar (µg/m³)',
      value: latest?.pm25Outlet ?? null,
      accent: 'border-t-[#72B89A]',
      textColor: 'text-[#2F6F54]',
    },
    {
      label: 'PM10 Udara Masuk (µg/m³)',
      value: latest?.pm10Inlet ?? null,
      accent: 'border-t-[#429EDB]',
      textColor: 'text-[#176FAF]',
    },
    {
      label: 'PM10 Udara Keluar (µg/m³)',
      value: latest?.pm10Outlet ?? null,
      accent: 'border-t-[#72B89A]',
      textColor: 'text-[#2F6F54]',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Judul Halaman & Pilihan Sumber Data */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-[#103B66]">
            Ringkasan Kualitas Udara
          </h2>
          <p className="text-xs sm:text-sm text-[#176FAF]/90 mt-0.5">
            Pantau kondisi kualitas udara dan performa sistem filtrasi AIRSKIN COIR secara terintegrasi.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-[#C8E5F8]">
          <button
            type="button"
            onClick={() => onChangeDataSource('aktual')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              !isSimulated
                ? 'bg-[#176FAF] text-white'
                : 'text-[#103B66]/75 hover:bg-[#EAF6FF]'
            }`}
          >
            Data Sensor Aktual
          </button>
          <button
            type="button"
            onClick={() => onChangeDataSource('simulasi')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              isSimulated
                ? 'bg-[#D7B978] text-[#103B66]'
                : 'text-[#103B66]/75 hover:bg-[#EAF6FF]'
            }`}
          >
            DATA SIMULASI
          </button>
        </div>
      </div>

      {/* Peringatan Label Data Simulasi / Menunggu Perangkat */}
      {isSimulated ? (
        <div className="rounded-xl border border-[#D7B978] bg-[#FCF7EC] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm text-[#6E541D]">
            <AlertTriangle className="w-4 h-4 shrink-0 text-[#B8923E]" />
            <span>
              <strong className="font-mono uppercase">DATA SIMULASI:</strong> Perangkat sensor belum terhubung penuh. Nilai berikut merupakan data simulasi ilustratif dan bukan hasil pengukuran aktual.
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('simulasi')}
            className="text-xs font-semibold text-[#176FAF] hover:text-[#103B66] inline-flex items-center gap-1"
          >
            Buka Simulasi Sistem <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : !state.deviceConnected ? (
        <div className="rounded-xl border border-[#B9E0F8] bg-white px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm text-[#103B66]">
            <Cpu className="w-4 h-4 text-[#176FAF] shrink-0" />
            <span>
              Menunggu data sensor dari ESP32. Anda dapat mengaktifkan mode <strong>DATA SIMULASI</strong> di kanan atas untuk demonstrasi tampilan grafik.
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('pengaturan')}
            className="text-xs font-semibold text-[#176FAF] hover:text-[#103B66] inline-flex items-center gap-1"
          >
            Pengaturan Perangkat <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : null}

      {/* 4 Kartu Utama Konsentrasi PM */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {fourMainCards.map((card) => (
          <div
            key={card.label}
            className={`airskin-card p-5 border-t-4 ${card.accent} flex flex-col justify-between`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-display text-sm font-semibold text-[#103B66] leading-snug">
                {card.label}
              </p>
              <span
                className={`font-mono text-[10px] uppercase px-1.5 py-0.5 rounded border shrink-0 ${
                  isSimulated
                    ? 'bg-[#D7B978]/20 text-[#8A6D2E] border-[#D7B978]/45'
                    : latest
                      ? 'bg-[#72B89A]/20 text-[#2F6F54] border-[#72B89A]/45'
                      : 'bg-[#EAF6FF] text-[#103B66]/65 border-[#B9E0F8]'
                }`}
              >
                {isSimulated ? 'DATA SIMULASI' : latest ? 'DATA AKTUAL' : 'MENUNGGU'}
              </span>
            </div>

            <div className="mt-4 flex items-baseline gap-1.5">
              <span className={`font-display text-3xl font-semibold tabular-nums ${card.textColor}`}>
                {card.value !== null ? card.value.toFixed(1) : '--'}
              </span>
              <span className="text-xs font-mono text-[#103B66]/65">µg/m³</span>
            </div>

            <p className="mt-3 pt-2.5 border-t border-[#E6F3FC] text-xs text-[#103B66]/65">
              {latest
                ? isSimulated
                  ? 'Nilai ilustrasi simulasi'
                  : 'Terbaca dari sensor partikulat'
                : 'Menunggu data sensor'}
            </p>
          </div>
        ))}
      </div>

      {/* 4 Kartu Informasi Tambahan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="airskin-card p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-[#103B66]/70">Efisiensi Filtrasi PM2.5 (%)</p>
            <p className="font-display text-2xl font-semibold text-[#103B66] tabular-nums mt-1">
              {effPm25 !== null ? `${effPm25}%` : '--'}
            </p>
            <p className="text-[11px] text-[#103B66]/60 mt-0.5">
              {effPm25 !== null
                ? isSimulated
                  ? 'DATA SIMULASI'
                  : 'Dihitung dari sensor aktual'
                : 'Menunggu data sensor'}
            </p>
          </div>
          <Gauge className="w-8 h-8 text-[#429EDB]/70 shrink-0" />
        </div>

        <div className="airskin-card p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-[#103B66]/70">Efisiensi Filtrasi PM10 (%)</p>
            <p className="font-display text-2xl font-semibold text-[#103B66] tabular-nums mt-1">
              {effPm10 !== null ? `${effPm10}%` : '--'}
            </p>
            <p className="text-[11px] text-[#103B66]/60 mt-0.5">
              {effPm10 !== null
                ? isSimulated
                  ? 'DATA SIMULASI'
                  : 'Dihitung dari sensor aktual'
                : 'Menunggu data sensor'}
            </p>
          </div>
          <Activity className="w-8 h-8 text-[#72B89A]/80 shrink-0" />
        </div>

        <div className="airskin-card p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-[#103B66]/70">Status ESP32</p>
            <p
              className={`font-display text-lg font-semibold mt-1 ${
                state.connectionState === 'Terhubung'
                  ? 'text-[#2F6F54]'
                  : state.connectionState === 'Menunggu koneksi'
                    ? 'text-[#176FAF]'
                    : 'text-[#8A6D2E]'
              }`}
            >
              {state.connectionState}
            </p>
            <p className="text-[11px] font-mono text-[#103B66]/60 mt-0.5">
              {state.deviceStatus.esp32DeviceId}
            </p>
          </div>
          <Cpu className="w-8 h-8 text-[#176FAF]/75 shrink-0" />
        </div>

        <div className="airskin-card p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-[#103B66]/70">Status Sensor</p>
            <p
              className={`font-display text-lg font-semibold mt-1 ${
                state.deviceStatus.pmSensorConnected ? 'text-[#2F6F54]' : 'text-[#8A6D2E]'
              }`}
            >
              {state.deviceStatus.pmSensorConnected ? 'Aktif Membaca' : 'Menunggu data sensor'}
            </p>
            <p className="text-[11px] text-[#103B66]/60 mt-0.5">
              Sensor Partikulat PM2.5 &amp; PM10
            </p>
          </div>
          <Radio className="w-8 h-8 text-[#429EDB]/75 shrink-0" />
        </div>
      </div>

      {/* Grafik Perubahan PM2.5 & PM10 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <InteractiveTrendChart
          title="Grafik Perubahan PM2.5"
          subtitle="Perbandingan konsentrasi PM2.5 udara masuk dan udara keluar terhadap waktu."
          points={chartPoints}
          metric="pm25"
          isSimulated={isSimulated}
        />
        <InteractiveTrendChart
          title="Grafik Perubahan PM10"
          subtitle="Perbandingan konsentrasi PM10 udara masuk dan udara keluar terhadap waktu."
          points={chartPoints}
          metric="pm10"
          isSimulated={isSimulated}
        />
      </div>

      {/* Ilustrasi Gedung + Aliran Udara + Ringkasan Kondisi Perangkat */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 airskin-card overflow-hidden grid grid-cols-1 sm:grid-cols-12">
          <div className="sm:col-span-5 relative min-h-48">
            <img
              src={heroFacadeImg}
              alt="Ilustrasi Gedung dengan Panel AIRSKIN COIR pada Fasad"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="sm:col-span-7 p-5 flex flex-col justify-between space-y-4">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#176FAF]">
                Ilustrasi Fasad Bangunan
              </span>
              <h3 className="font-display text-base font-semibold text-[#103B66] mt-1">
                Panel Filtrasi AIRSKIN COIR pada Fasad
              </h3>
              <p className="text-xs text-[#103B66]/80 mt-1 leading-relaxed">
                Modul filtrasi dipasang pada selubung luar bangunan untuk mengalirkan udara lingkungan melewati susunan media serabut kelapa dan nonwoven sebelum masuk ke sisi keluaran.
              </p>
            </div>

            {/* Indikator Aliran Udara Masuk dan Keluar */}
            <div className="rounded-xl bg-[#F5FAFF] border border-[#DCEEFB] p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 font-medium text-[#176FAF]">
                  <Wind className="w-3.5 h-3.5" /> Udara Masuk (Lingkungan)
                </span>
                <span className="font-mono font-semibold text-[#103B66] tabular-nums">
                  {latest ? `${latest.pm25Inlet} / ${latest.pm10Inlet} µg/m³` : '--'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs border-t border-[#E1F1FC] pt-2">
                <span className="inline-flex items-center gap-1.5 font-medium text-[#2F6F54]">
                  <Wind className="w-3.5 h-3.5" /> Udara Keluar (Setelah Panel)
                </span>
                <span className="font-mono font-semibold text-[#2F6F54] tabular-nums">
                  {latest ? `${latest.pm25Outlet ?? '--'} / ${latest.pm10Outlet ?? '--'} µg/m³` : '--'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Ringkasan Kondisi Perangkat */}
        <div className="lg:col-span-5 airskin-card p-5 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-display text-base font-semibold text-[#103B66]">
              Ringkasan Kondisi Perangkat
            </h3>
            <p className="text-xs text-[#103B66]/70 mt-0.5">
              Status komunikasi mikrokontroler dan aktuator panel saat ini.
            </p>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-[#E6F3FC]">
              <span className="text-[#103B66]/70">Status Koneksi</span>
              <span className="font-semibold text-[#103B66]">{state.connectionState}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[#E6F3FC]">
              <span className="text-[#103B66]/70">Kipas DC</span>
              <span className="font-semibold text-[#103B66]">{state.deviceStatus.fanStatus}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[#E6F3FC]">
              <span className="text-[#103B66]/70">Transmisi Data</span>
              <span className="font-semibold text-[#103B66]">{state.deviceStatus.dataTransmissionStatus}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-[#103B66]/70">Pembaruan Sensor Terakhir</span>
              <span className="font-mono text-[#176FAF] tabular-nums">
                {formatTimestamp(state.deviceStatus.lastDataReceived)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('panel')}
            className="w-full py-2.5 rounded-xl border border-[#B9E0F8] bg-[#F5FAFF] hover:bg-[#EAF6FF] text-xs font-semibold text-[#176FAF] transition-colors"
          >
            Lihat Struktur Panel Filtrasi
          </button>
        </div>
      </div>
    </div>
  );
};
