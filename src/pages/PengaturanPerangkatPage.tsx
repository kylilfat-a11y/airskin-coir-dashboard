import React, { useState } from 'react';
import {
  Cpu,
  Fan,
  Link2,
  Radio,
  RefreshCw,
  Send,
  Settings,
  Sliders,
  Unplug,
  WifiOff,
} from 'lucide-react';
import type { SensorSettings, SystemStatePayload } from '../types/airskin';
import { formatTimestamp } from '../utils/airskinMetrics';

interface PengaturanPerangkatPageProps {
  state: SystemStatePayload;
  onRequestConnect: () => Promise<void>;
  onRefreshData: () => Promise<void>;
  onSaveSettings: (settings: SensorSettings) => Promise<void>;
  onSendTestTelemetry: (payload: {
    pm25Inlet: number;
    pm25Outlet: number;
    pm10Inlet: number;
    pm10Outlet: number;
  }) => Promise<void>;
  onDisconnectDevice: () => Promise<void>;
  busy: boolean;
}

export const PengaturanPerangkatPage: React.FC<PengaturanPerangkatPageProps> = ({
  state,
  onRequestConnect,
  onRefreshData,
  onSaveSettings,
  onSendTestTelemetry,
  onDisconnectDevice,
  busy,
}) => {
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [intervalDetik, setIntervalDetik] = useState(String(state.sensorSettings.intervalKirimDetik));
  const [topikMqtt, setTopikMqtt] = useState(state.sensorSettings.topikMqtt);
  const [ambangPm25, setAmbangPm25] = useState(String(state.sensorSettings.ambangPm25Peringatan));
  const [ambangPm10, setAmbangPm10] = useState(String(state.sensorSettings.ambangPm10Peringatan));
  const [fanPwm, setFanPwm] = useState(String(state.sensorSettings.fanPwmPersen));
  const [feedback, setFeedback] = useState<string | null>(null);

  // Uji pengiriman paket JSON ESP32
  const [testPm25In, setTestPm25In] = useState('64.2');
  const [testPm25Out, setTestPm25Out] = useState('34.5');
  const [testPm10In, setTestPm10In] = useState('98.0');
  const [testPm10Out, setTestPm10Out] = useState('46.0');

  const handleConnectClick = async () => {
    await onRequestConnect();
    setFeedback(
      state.deviceConnected
        ? 'Perangkat ESP32 sudah dalam kondisi Terhubung.'
        : 'Status diubah ke Menunggu koneksi. Pastikan ESP32 mengirimkan paket JSON ke POST /api/telemetry atau topik MQTT.',
    );
  };

  const handleRefreshClick = async () => {
    await onRefreshData();
    setFeedback('Status perangkat dan data terbaru telah diperbarui.');
  };

  const handleSaveSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveSettings({
      intervalKirimDetik: Math.max(1, Number(intervalDetik) || 5),
      topikMqtt: topikMqtt.trim() || 'airskin/coir/panel01/telemetry',
      ambangPm25Peringatan: Math.max(5, Number(ambangPm25) || 55),
      ambangPm10Peringatan: Math.max(10, Number(ambangPm10) || 100),
      fanPwmPersen: Math.max(0, Math.min(100, Number(fanPwm) || 65)),
    });
    setShowSettingsPanel(false);
    setFeedback('Pengaturan sensor dan interval pengiriman telah disimpan.');
  };

  const handleTestPacketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSendTestTelemetry({
      pm25Inlet: Number(testPm25In),
      pm25Outlet: Number(testPm25Out),
      pm10Inlet: Number(testPm10In),
      pm10Outlet: Number(testPm10Out),
    });
    setFeedback('Paket uji integrasi ESP32 diterima. Status koneksi berubah menjadi Terhubung.');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#176FAF]" />
            <h2 className="font-display text-xl font-semibold text-[#103B66]">
              Pengaturan dan Koneksi Perangkat
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#176FAF]/90 mt-0.5">
            Pantau kesiapan ESP32, sensor partikulat, kipas DC, serta konfigurasi komunikasi API dan MQTT.
          </p>
        </div>

        {/* Tiga Tombol Aksi */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={handleConnectClick}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#176FAF] hover:bg-[#103B66] text-white text-xs font-semibold transition-colors disabled:opacity-60"
          >
            <Link2 className="w-3.5 h-3.5" />
            Hubungkan Perangkat
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={handleRefreshClick}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#B9E0F8] bg-white hover:bg-[#EAF6FF] text-[#103B66] text-xs font-semibold transition-colors disabled:opacity-60"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Perbarui Data
          </button>
          <button
            type="button"
            onClick={() => setShowSettingsPanel((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#B9E0F8] bg-[#F5FAFF] hover:bg-[#EAF6FF] text-[#176FAF] text-xs font-semibold transition-colors"
          >
            <Sliders className="w-3.5 h-3.5" />
            Pengaturan Sensor
          </button>
        </div>
      </div>

      {/* Indikator Status Koneksi: Terhubung / Terputus / Menunggu koneksi */}
      <div className="airskin-card p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {state.connectionState === 'Terhubung' ? (
            <Radio className="w-5 h-5 text-[#2F6F54]" />
          ) : (
            <WifiOff className="w-5 h-5 text-[#9B7A2C]" />
          )}
          <div>
            <span className="text-xs text-[#103B66]/70 block">Status Koneksi Perangkat</span>
            <p className="font-display text-lg font-semibold text-[#103B66]">
              {state.connectionState}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {(['Terhubung', 'Terputus', 'Menunggu koneksi'] as const).map((statusOption) => {
            const active = state.connectionState === statusOption;
            return (
              <span
                key={statusOption}
                className={`px-3 py-1 rounded-lg border ${
                  active
                    ? statusOption === 'Terhubung'
                      ? 'bg-[#EFF9F4] border-[#72B89A] text-[#2F6F54] font-semibold'
                      : statusOption === 'Menunggu koneksi'
                        ? 'bg-[#EAF6FF] border-[#429EDB] text-[#176FAF] font-semibold'
                        : 'bg-[#FCF7EC] border-[#D7B978] text-[#7A5E1B] font-semibold'
                    : 'bg-[#F8FCFF] border-[#DCEEFB] text-[#103B66]/45'
                }`}
              >
                {statusOption}
              </span>
            );
          })}
        </div>
      </div>

      {feedback && (
        <div className="rounded-xl border border-[#B9E0F8] bg-[#EAF6FF] px-4 py-2.5 text-xs text-[#103B66] font-medium">
          {feedback}
        </div>
      )}

      {/* Pengaturan Sensor (Expandable) */}
      {showSettingsPanel && (
        <form onSubmit={handleSaveSettingsSubmit} className="airskin-card p-5 space-y-4">
          <h3 className="font-display text-base font-semibold text-[#103B66]">
            Konfigurasi Sensor &amp; Akuisisi Data
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <label className="block space-y-1">
              <span className="text-xs text-[#103B66]">Interval Kirim (detik)</span>
              <input
                type="number"
                min={1}
                max={3600}
                value={intervalDetik}
                onChange={(e) => setIntervalDetik(e.target.value)}
                className="w-full rounded-xl border border-[#B9E0F8] bg-[#F8FCFF] px-3 py-2 font-mono text-xs text-[#103B66]"
              />
            </label>
            <label className="block space-y-1 sm:col-span-2">
              <span className="text-xs text-[#103B66]">Topik MQTT</span>
              <input
                type="text"
                value={topikMqtt}
                onChange={(e) => setTopikMqtt(e.target.value)}
                className="w-full rounded-xl border border-[#B9E0F8] bg-[#F8FCFF] px-3 py-2 font-mono text-xs text-[#103B66]"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-[#103B66]">Ambang PM2.5 (µg/m³)</span>
              <input
                type="number"
                min={5}
                max={500}
                value={ambangPm25}
                onChange={(e) => setAmbangPm25(e.target.value)}
                className="w-full rounded-xl border border-[#B9E0F8] bg-[#F8FCFF] px-3 py-2 font-mono text-xs text-[#103B66]"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-[#103B66]">PWM Kipas DC (%)</span>
              <input
                type="number"
                min={0}
                max={100}
                value={fanPwm}
                onChange={(e) => setFanPwm(e.target.value)}
                className="w-full rounded-xl border border-[#B9E0F8] bg-[#F8FCFF] px-3 py-2 font-mono text-xs text-[#103B66]"
              />
            </label>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={busy}
              className="px-4 py-2 rounded-xl bg-[#176FAF] hover:bg-[#103B66] text-white text-xs font-semibold"
            >
              Simpan Pengaturan
            </button>
            <button
              type="button"
              onClick={() => setShowSettingsPanel(false)}
              className="px-4 py-2 rounded-xl border border-[#B9E0F8] bg-white text-xs font-semibold text-[#103B66]"
            >
              Tutup
            </button>
          </div>
        </form>
      )}

      {/* 4 Kartu Komponen Perangkat */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="airskin-card p-5 space-y-2">
          <Cpu className="w-5 h-5 text-[#176FAF]" />
          <span className="text-xs text-[#103B66]/70 block">ESP32</span>
          <p className="font-display text-base font-semibold text-[#103B66]">
            {state.deviceStatus.esp32DeviceId}
          </p>
          <span className="text-xs text-[#103B66]/65 block">
            Status: {state.deviceStatus.esp32Connected ? 'Terhubung' : state.connectionState}
          </span>
        </div>

        <div className="airskin-card p-5 space-y-2">
          <Radio className="w-5 h-5 text-[#429EDB]" />
          <span className="text-xs text-[#103B66]/70 block">Sensor Partikulat</span>
          <p className="font-display text-base font-semibold text-[#103B66]">
            {state.deviceStatus.pmSensorConnected ? 'Terhubung (Masuk & Keluar)' : 'Menunggu data sensor'}
          </p>
          <span className="text-xs text-[#103B66]/65 block">
            Parameter: PM2.5 &amp; PM10
          </span>
        </div>

        <div className="airskin-card p-5 space-y-2">
          <Fan className="w-5 h-5 text-[#176FAF]" />
          <span className="text-xs text-[#103B66]/70 block">Kipas DC</span>
          <p className="font-display text-base font-semibold text-[#103B66]">
            {state.deviceStatus.fanStatus}
          </p>
          <span className="text-xs font-mono text-[#103B66]/65 block">
            Target PWM: {state.sensorSettings.fanPwmPersen}%
          </span>
        </div>

        <div className="airskin-card p-5 space-y-2">
          <RefreshCw className="w-5 h-5 text-[#72B89A]" />
          <span className="text-xs text-[#103B66]/70 block">Waktu Pembaruan Data Terakhir</span>
          <p className="font-mono text-sm font-semibold text-[#103B66] tabular-nums">
            {formatTimestamp(state.deviceStatus.lastDataReceived)}
          </p>
          <span className="text-xs text-[#103B66]/65 block">
            Transmisi: {state.deviceStatus.dataTransmissionStatus}
          </span>
        </div>
      </div>

      {/* Integrasi API / MQTT & Uji Commissioning */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6 airskin-card p-5 space-y-3">
          <h3 className="font-display text-base font-semibold text-[#103B66]">
            Struktur Integrasi API &amp; MQTT untuk ESP32
          </h3>
          <p className="text-xs text-[#103B66]/80 leading-relaxed">
            Saat modul ESP32 fisik sudah terhubung ke jaringan Wi-Fi, kirimkan payload JSON pembacaan sensor ke endpoint REST berikut atau melalui bridge MQTT.
          </p>
          <div className="space-y-2 text-xs font-mono bg-[#F5FAFF] border border-[#DCEEFB] rounded-xl p-3.5 text-[#103B66]">
            <div>Endpoint REST: <strong>POST /api/telemetry</strong></div>
            <div>Topik MQTT: <strong>{state.sensorSettings.topikMqtt}</strong></div>
            <pre className="pt-2 text-[11px] overflow-x-auto text-[#176FAF]">
{`{
  "pm25Inlet": 64.2,
  "pm25Outlet": 34.5,
  "pm10Inlet": 98.0,
  "pm10Outlet": 46.0
}`}
            </pre>
          </div>
        </div>

        <form onSubmit={handleTestPacketSubmit} className="lg:col-span-6 airskin-card p-5 space-y-4">
          <div>
            <h3 className="font-display text-base font-semibold text-[#103B66]">
              Uji Penerimaan Paket Data ESP32
            </h3>
            <p className="text-xs text-[#103B66]/75 mt-0.5">
              Khusus untuk pengujian komunikasi perangkat keras sebelum pemasangan lapangan.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-xs text-[#103B66]">PM2.5 Masuk (µg/m³)</span>
              <input
                type="number"
                step="0.1"
                value={testPm25In}
                onChange={(e) => setTestPm25In(e.target.value)}
                className="w-full rounded-xl border border-[#B9E0F8] bg-[#F8FCFF] px-3 py-2 font-mono text-xs text-[#103B66]"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-[#103B66]">PM2.5 Keluar (µg/m³)</span>
              <input
                type="number"
                step="0.1"
                value={testPm25Out}
                onChange={(e) => setTestPm25Out(e.target.value)}
                className="w-full rounded-xl border border-[#B9E0F8] bg-[#F8FCFF] px-3 py-2 font-mono text-xs text-[#103B66]"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-[#103B66]">PM10 Masuk (µg/m³)</span>
              <input
                type="number"
                step="0.1"
                value={testPm10In}
                onChange={(e) => setTestPm10In(e.target.value)}
                className="w-full rounded-xl border border-[#B9E0F8] bg-[#F8FCFF] px-3 py-2 font-mono text-xs text-[#103B66]"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-[#103B66]">PM10 Keluar (µg/m³)</span>
              <input
                type="number"
                step="0.1"
                value={testPm10Out}
                onChange={(e) => setTestPm10Out(e.target.value)}
                className="w-full rounded-xl border border-[#B9E0F8] bg-[#F8FCFF] px-3 py-2 font-mono text-xs text-[#103B66]"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#176FAF] hover:bg-[#103B66] text-white text-xs font-semibold"
            >
              <Send className="w-3.5 h-3.5" />
              Kirim Paket Uji
            </button>
            {state.deviceConnected && (
              <button
                type="button"
                disabled={busy}
                onClick={onDisconnectDevice}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#D7B978] bg-[#FCF7EC] text-[#6E541D] text-xs font-semibold"
              >
                <Unplug className="w-3.5 h-3.5" />
                Putuskan Koneksi Uji
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
