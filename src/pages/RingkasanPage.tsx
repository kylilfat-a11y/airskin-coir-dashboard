import React from 'react';
import { AlertTriangle, Cpu, Radio } from 'lucide-react';
import type { DataSourceMode, SystemStatePayload } from '../types/airskin';
import { filterTelemetryByRange } from '../utils/airskinMetrics';
import { InteractiveTrendChart } from '../components/InteractiveTrendChart';
import heroFacadeImg from '../assets/images/hero_facade_building_1795694951234.jpg';

interface RingkasanPageProps {
  state: SystemStatePayload;
  onChangeDataSource: (mode: DataSourceMode) => Promise<void>;
}

export const RingkasanPage: React.FC<RingkasanPageProps> = ({
  state,
  onChangeDataSource,
}) => {
  const isSimulated = state.dataSourceMode === 'simulasi';
  const activeSeries = isSimulated
    ? state.simulationTelemetry
    : state.deviceConnected
      ? state.liveTelemetry
      : [];

  const latest = activeSeries.length > 0 ? activeSeries[activeSeries.length - 1] : null;
  const chartPoints = filterTelemetryByRange(activeSeries, '24h');

  const fourMetrics = [
    {
      label: 'PM2.5 Udara Masuk',
      value: latest?.pm25Inlet ?? null,
      accent: 'border-t-[#176FAF]',
      color: 'text-[#176FAF]',
    },
    {
      label: 'PM2.5 Udara Keluar',
      value: latest?.pm25Outlet ?? null,
      accent: 'border-t-[#72B89A]',
      color: 'text-[#2F6F54]',
    },
    {
      label: 'PM10 Udara Masuk',
      value: latest?.pm10Inlet ?? null,
      accent: 'border-t-[#429EDB]',
      color: 'text-[#176FAF]',
    },
    {
      label: 'PM10 Udara Keluar',
      value: latest?.pm10Outlet ?? null,
      accent: 'border-t-[#72B89A]',
      color: 'text-[#2F6F54]',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-[#103B66]">
            Ringkasan Kualitas Udara
          </h2>
          <p className="text-xs sm:text-sm text-[#176FAF]/90 mt-0.5">
            Pantau kualitas udara dan status perangkat AIRSKIN COIR secara ringkas.
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
            Data Aktual
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

      {isSimulated && (
        <div className="rounded-xl border border-[#D7B978] bg-[#FCF7EC] px-4 py-2.5 flex items-center gap-2.5 text-xs text-[#6E541D]">
          <AlertTriangle className="w-4 h-4 shrink-0 text-[#B8923E]" />
          <span>
            <strong className="font-mono uppercase">DATA SIMULASI:</strong> Menampilkan data ilustrasi karena sensor aktual belum terhubung.
          </span>
        </div>
      )}

      {/* 5 Kartu Informasi Ringkasan (4 Konsentrasi PM + 1 Kartu Status ESP32 & Sensor) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {fourMetrics.map((item) => (
          <div
            key={item.label}
            className={`airskin-card p-4 border-t-4 ${item.accent} flex flex-col justify-between`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-display text-xs font-semibold text-[#103B66]">
                {item.label}
              </span>
              {isSimulated && (
                <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#D7B978]/20 text-[#8A6D2E]">
                  SIMULASI
                </span>
              )}
            </div>

            <div className="mt-3 flex items-baseline gap-1">
              <span className={`font-display text-2xl font-semibold tabular-nums ${item.color}`}>
                {item.value !== null ? item.value.toFixed(1) : '--'}
              </span>
              <span className="text-[11px] font-mono text-[#103B66]/65">µg/m³</span>
            </div>

            <span className="mt-2 text-[11px] text-[#103B66]/60">
              {latest
                ? isSimulated
                  ? 'Data simulasi'
                  : 'Terbaca sensor'
                : 'Menunggu data sensor'}
            </span>
          </div>
        ))}

        {/* Kartu ke-5: Status ESP32 & Status Sensor */}
        <div className="airskin-card p-4 border-t-4 border-t-[#103B66] flex flex-col justify-between space-y-2.5">
          <span className="font-display text-xs font-semibold text-[#103B66]">
            Status Perangkat
          </span>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-[#103B66]/70">
                <Cpu className="w-3.5 h-3.5 text-[#176FAF]" /> ESP32
              </span>
              <span className="font-semibold text-[#103B66]">
                {state.deviceStatus.esp32Status}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-[#103B66]/70">
                <Radio className="w-3.5 h-3.5 text-[#429EDB]" /> Sensor
              </span>
              <span className="font-semibold text-[#103B66]">
                {state.deviceStatus.sensorPmStatus}
              </span>
            </div>
          </div>
          <span className="text-[11px] text-[#103B66]/60">
            {state.deviceConnected ? 'Koneksi aktif' : 'Menunggu data sensor'}
          </span>
        </div>
      </div>

      {/* 1 Grafik Ringkas + Ilustrasi Kecil Fasad Bangunan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-8">
          <InteractiveTrendChart
            title="Grafik Ringkas Kualitas Udara (PM2.5)"
            subtitle="Perubahan konsentrasi udara masuk dan udara keluar pada panel."
            points={chartPoints}
            metric="pm25"
            isSimulated={isSimulated}
          />
        </div>

        <div className="lg:col-span-4 airskin-card overflow-hidden flex flex-col">
          <img
            src={heroFacadeImg}
            alt="Ilustrasi Panel AIRSKIN COIR pada Fasad Bangunan"
            referrerPolicy="no-referrer"
            className="w-full h-44 object-cover"
          />
          <div className="p-4 flex-1 flex flex-col justify-center space-y-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#176FAF]">
              Fasad Bangunan
            </span>
            <h3 className="font-display text-sm font-semibold text-[#103B66]">
              Panel AIRSKIN COIR
            </h3>
            <p className="text-xs text-[#103B66]/75 leading-relaxed">
              Panel filtrasi terpasang di dinding fasad untuk menyaring partikulat udara dari luar sebelum dialirkan ke sisi keluar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
