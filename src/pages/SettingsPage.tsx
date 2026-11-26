import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Cpu,
  Fan,
  GitBranch,
  Github,
  Link2,
  Radio,
  RefreshCw,
  Save,
  Sliders,
  UploadCloud,
} from 'lucide-react';
import type { SystemConfig, SystemStatePayload } from '../types/airskin';

interface SettingsPageProps {
  state: SystemStatePayload;
  onSaveConfig: (patch: Partial<SystemConfig>) => Promise<void>;
  onRefreshState: () => Promise<void>;
  onSendTestPacket: (payload: {
    pm25Inlet: number;
    pm25Outlet: number | null;
    pm10Inlet: number;
    pm10Outlet: number | null;
  }) => Promise<void>;
}

interface GithubStatusResponse {
  connected: boolean;
  hasToken: boolean;
  repo: string;
  htmlUrl?: string;
  defaultBranch?: string;
  message?: string;
  recentCommits?: Array<{ sha: string; message: string; date: string }>;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  state,
  onSaveConfig,
  onRefreshState,
  onSendTestPacket,
}) => {
  const { config, sensors, connectionState, lastSyncAt, mode } = state;
  const sensorFormRef = useRef<HTMLFormElement | null>(null);

  const [form, setForm] = useState<SystemConfig>(config);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [connectGuideOpen, setConnectGuideOpen] = useState(false);
  const [connectingTest, setConnectingTest] = useState(false);

  const [githubStatus, setGithubStatus] = useState<GithubStatusResponse | null>(null);
  const [sessionTokenInput, setSessionTokenInput] = useState('');
  const [syncingGithub, setSyncingGithub] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    setForm(config);
  }, [config]);

  async function fetchGithubStatus() {
    try {
      const resp = await fetch('/api/github/status');
      const data = (await resp.json()) as GithubStatusResponse;
      setGithubStatus(data);
    } catch {
      setGithubStatus({
        connected: false,
        hasToken: false,
        repo: form.githubRepo,
        message: 'Gagal memeriksa status repositori GitHub.',
      });
    }
  }

  useEffect(() => {
    fetchGithubStatus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveMessage(null);
    try {
      await onSaveConfig(form);
      setSaveMessage('Pengaturan perangkat & sensor berhasil disimpan.');
      fetchGithubStatus();
    } finally {
      setSaving(false);
    }
  }

  async function handleRefreshNow() {
    setConnectingTest(true);
    try {
      await onRefreshState();
    } finally {
      setConnectingTest(false);
    }
  }

  async function handleSimulateHardwareHandshake() {
    setConnectingTest(true);
    try {
      await onSendTestPacket({
        pm25Inlet: 41.2,
        pm25Outlet: config.hasOutletSensor ? 18.6 : null,
        pm10Inlet: 64.5,
        pm10Outlet: config.hasOutletSensor ? 23.1 : null,
      });
      setConnectGuideOpen(false);
    } finally {
      setConnectingTest(false);
    }
  }

  async function handleSaveSessionToken() {
    await fetch('/api/github/session-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: sessionTokenInput }),
    });
    setSessionTokenInput('');
    setSyncMessage('Token sesi GitHub disimpan di memori server.');
    fetchGithubStatus();
  }

  async function handleGithubSync() {
    setSyncingGithub(true);
    setSyncMessage(null);
    try {
      const resp = await fetch('/api/github/sync-snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: 'Sinkronisasi snapshot AIRSKIN COIR dari dashboard' }),
      });
      const data = (await resp.json()) as { synced?: boolean; path?: string; error?: string };
      if (!resp.ok) {
        setSyncMessage(data.error || 'Sinkronisasi GitHub gagal.');
      } else {
        setSyncMessage(`Snapshot berhasil dikirim ke ${data.path}`);
        fetchGithubStatus();
      }
    } catch {
      setSyncMessage('Terjadi gangguan jaringan saat sinkronisasi GitHub.');
    } finally {
      setSyncingGithub(false);
    }
  }

  function renderIndicator(status: 'Terhubung' | 'Terputus' | 'Menunggu koneksi') {
    if (status === 'Terhubung') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#458B6D]">
          <span className="w-2 h-2 rounded-full bg-[#72B89A]" />
          Terhubung
        </span>
      );
    }
    if (status === 'Terputus') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C2410C]">
          <span className="w-2 h-2 rounded-full bg-[#C2410C]" />
          Terputus
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#176FAF]">
        <span className="w-2 h-2 rounded-full bg-[#D7B978]" />
        Menunggu koneksi
      </span>
    );
  }

  const espSensor = sensors.find((s) => s.id === 'esp32');
  const pmSensor = sensors.find((s) => s.id === 'pm-inlet');
  const fanDevice = sensors.find((s) => s.id === 'dc-fan');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-[Poppins] text-2xl sm:text-3xl font-semibold tracking-tight text-[#103B66]">
            Pengaturan dan Koneksi Perangkat
          </h1>
          <p className="mt-1 text-sm text-[#103B66]/75">
            Status koneksi perangkat keras ESP32, sensor partikulat, kipas DC, serta konfigurasi API & MQTT.
          </p>
        </div>

        {/* 3 Tombol Wajib Section 10 */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setConnectGuideOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#176FAF] px-4 py-2 text-xs font-medium text-white hover:bg-[#103B66] whitespace-nowrap"
          >
            <Link2 className="w-3.5 h-3.5" />
            Hubungkan Perangkat
          </button>
          <button
            type="button"
            onClick={handleRefreshNow}
            disabled={connectingTest}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#82C5EF] bg-white px-4 py-2 text-xs font-medium text-[#103B66] hover:bg-[#EAF6FF] whitespace-nowrap"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#176FAF]" />
            Perbarui Data
          </button>
          <button
            type="button"
            onClick={() => sensorFormRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#B9E0F8] bg-white px-4 py-2 text-xs font-medium text-[#103B66] hover:bg-[#EAF6FF] whitespace-nowrap"
          >
            <Sliders className="w-3.5 h-3.5 text-[#176FAF]" />
            Pengaturan Sensor
          </button>
        </div>
      </div>

      {/* Ringkasan Status Perangkat Keras (ESP32, Sensor Partikulat, Kipas DC) */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="airskin-card p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[#176FAF]">
            <span>ESP32</span>
            <Cpu className="w-4 h-4" />
          </div>
          <div>{renderIndicator(espSensor?.status || 'Menunggu koneksi')}</div>
          <div className="font-mono text-[11px] text-[#103B66]/70 truncate">
            {config.esp32DeviceId}
          </div>
        </div>

        <div className="airskin-card p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[#176FAF]">
            <span>Sensor Partikulat</span>
            <Radio className="w-4 h-4" />
          </div>
          <div>{renderIndicator(pmSensor?.status || 'Menunggu koneksi')}</div>
          <div className="font-mono text-[11px] text-[#103B66]/70 truncate">
            {config.hasOutletSensor ? 'PMS5003 Masuk & Keluar' : 'PMS5003 Masuk (CH1)'}
          </div>
        </div>

        <div className="airskin-card p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[#176FAF]">
            <span>Kipas DC</span>
            <Fan className="w-4 h-4" />
          </div>
          <div>{renderIndicator(fanDevice?.status || 'Menunggu koneksi')}</div>
          <div className="font-mono text-[11px] text-[#103B66]/70 truncate">
            12V Brushless Axial
          </div>
        </div>

        <div className="airskin-card p-4 space-y-2">
          <div className="text-xs font-semibold text-[#176FAF]">Status Koneksi Perangkat</div>
          <div>{renderIndicator(connectionState)}</div>
          <div className="text-[11px] text-[#103B66]/70">
            {mode === 'data_simulasi'
              ? 'Mode DATA SIMULASI aktif'
              : mode === 'terhubung_esp32'
                ? 'Menerima telemetri aktual'
                : 'Belum ada perangkat keras aktif'}
          </div>
        </div>

        <div className="airskin-card p-4 space-y-2">
          <div className="text-xs font-semibold text-[#176FAF]">Waktu Pembaruan Terakhir</div>
          <div className="font-mono tabular-nums text-sm font-semibold text-[#103B66]">
            {lastSyncAt
              ? new Date(lastSyncAt).toLocaleString('id-ID', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })
              : 'Belum ada pembaruan'}
          </div>
          <div className="text-[11px] text-[#103B66]/70">Interval: {config.refreshIntervalSec} detik</div>
        </div>
      </section>

      {/* Panduan Hubungkan Perangkat API / MQTT */}
      {connectGuideOpen && (
        <section className="airskin-card p-6 bg-[#F5FAFF] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-[Poppins] text-base font-semibold text-[#103B66]">
                Integrasi Perangkat Keras ESP32 (HTTP REST API & Topik MQTT)
              </h2>
              <p className="text-xs text-[#103B66]/75">
                Arahkan firmware ESP32 Anda untuk mengirim payload JSON ke endpoint berikut, atau kirim paket uji jabat tangan.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSimulateHardwareHandshake}
              disabled={connectingTest}
              className="rounded-xl bg-[#72B89A] px-4 py-2 text-xs font-semibold text-[#103B66] hover:opacity-90"
            >
              Uji Kirim Paket Jabat Tangan ESP32
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
            <div className="rounded-xl border border-[#B9E0F8] bg-white p-4 space-y-1.5">
              <div className="font-semibold text-[#176FAF]">Endpoint HTTP POST (Siap Pakai)</div>
              <div className="font-mono text-[11px] text-[#103B66] break-all">
                POST /api/telemetry
              </div>
              <pre className="mt-2 rounded-lg bg-[#EAF6FF] p-3 font-mono text-[11px] text-[#103B66] overflow-x-auto">
{`{
  "panelId": "${config.activePanelId}",
  "pm25Inlet": 42.4,
  "pm10Inlet": 66.1
}`}
              </pre>
            </div>

            <div className="rounded-xl border border-[#B9E0F8] bg-white p-4 space-y-1.5">
              <div className="font-semibold text-[#176FAF]">Struktur Topik MQTT Bridge</div>
              <div className="font-mono text-[11px] text-[#103B66] break-all">
                Topic: {config.mqttBrokerTopic}
              </div>
              <p className="mt-2 text-xs text-[#103B66]/75 leading-relaxed">
                Apabila perangkat menggunakan broker MQTT (HiveMQ / Mosquitto), bridge dapat meneruskan pesan JSON dari topik di atas langsung ke <span className="font-mono">/api/telemetry</span>.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Diagram Alir Arsitektur Sistem */}
      <section className="airskin-card p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-[Poppins] text-base font-semibold text-[#103B66]">
            Alur Arsitektur Data IoT
          </h2>
          <span className="font-mono text-xs text-[#176FAF]">
            SENSOR PARTIKULAT → ESP32 → PEMROSESAN DATA → DASHBOARD IoT
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-7 items-center gap-2 rounded-2xl border border-[#B9E0F8] bg-[#F5FAFF] p-4">
          <div className="md:col-span-1 rounded-xl border border-[#82C5EF] bg-white p-3 text-center">
            <div className="text-[10px] font-mono text-[#176FAF]">TAHAP 01</div>
            <div className="mt-1 font-[Poppins] text-xs font-semibold text-[#103B66]">SENSOR PM</div>
            <div className="text-[11px] text-[#103B66]/65">PMS5003 UART</div>
          </div>
          <div className="flex justify-center">
            <ArrowRight className="w-5 h-5 text-[#429EDB] rotate-90 md:rotate-0" />
          </div>
          <div className="md:col-span-1 rounded-xl border border-[#82C5EF] bg-white p-3 text-center">
            <div className="text-[10px] font-mono text-[#176FAF]">TAHAP 02</div>
            <div className="mt-1 font-[Poppins] text-xs font-semibold text-[#103B66]">ESP32</div>
            <div className="text-[11px] text-[#103B66]/65">Wi-Fi / MQTT</div>
          </div>
          <div className="flex justify-center">
            <ArrowRight className="w-5 h-5 text-[#429EDB] rotate-90 md:rotate-0" />
          </div>
          <div className="md:col-span-1 rounded-xl border border-[#82C5EF] bg-white p-3 text-center">
            <div className="text-[10px] font-mono text-[#176FAF]">TAHAP 03</div>
            <div className="mt-1 font-[Poppins] text-xs font-semibold text-[#103B66]">API SERVER</div>
            <div className="text-[11px] text-[#103B66]/65">Validasi Data</div>
          </div>
          <div className="flex justify-center">
            <ArrowRight className="w-5 h-5 text-[#429EDB] rotate-90 md:rotate-0" />
          </div>
          <div className="md:col-span-1 rounded-xl border border-[#72B89A] bg-[#103B66] p-3 text-center text-white">
            <div className="text-[10px] font-mono text-[#82C5EF]">TAHAP 04</div>
            <div className="mt-1 font-[Poppins] text-xs font-semibold">DASHBOARD</div>
            <div className="text-[11px] text-[#B9E0F8]">AIRSKIN COIR</div>
          </div>
        </div>
      </section>

      {/* Pengaturan Sensor & Perangkat */}
      <form ref={sensorFormRef} onSubmit={handleSubmit} className="airskin-card p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#103B66]">
              <Cpu className="w-4 h-4 text-[#176FAF]" />
              <span>Identitas Perangkat & Jaringan</span>
            </div>

            <label className="block text-xs text-[#103B66]">
              <span>Lokasi Bangunan</span>
              <input
                type="text"
                value={form.buildingLocation}
                onChange={(e) => setForm({ ...form, buildingLocation: e.target.value })}
                className="mt-1 w-full rounded-xl border border-[#B9E0F8] bg-white px-3 py-2 text-xs"
              />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block text-xs text-[#103B66]">
                <span>ID Perangkat ESP32</span>
                <input
                  type="text"
                  value={form.esp32DeviceId}
                  onChange={(e) => setForm({ ...form, esp32DeviceId: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-[#B9E0F8] bg-white px-3 py-2 font-mono text-xs"
                />
              </label>

              <label className="block text-xs text-[#103B66]">
                <span>SSID Wi-Fi</span>
                <input
                  type="text"
                  value={form.wifiSsid}
                  onChange={(e) => setForm({ ...form, wifiSsid: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-[#B9E0F8] bg-white px-3 py-2 font-mono text-xs"
                />
              </label>
            </div>

            <label className="block text-xs text-[#103B66]">
              <span>Topik MQTT</span>
              <input
                type="text"
                value={form.mqttBrokerTopic}
                onChange={(e) => setForm({ ...form, mqttBrokerTopic: e.target.value })}
                className="mt-1 w-full rounded-xl border border-[#B9E0F8] bg-white px-3 py-2 font-mono text-xs"
              />
            </label>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#103B66]">
              <Sliders className="w-4 h-4 text-[#176FAF]" />
              <span>Pengaturan Sensor & Satuan Pengukuran</span>
            </div>

            <div className="space-y-3 rounded-xl border border-[#DCEEFB] bg-[#F5FAFF] p-4 text-xs">
              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <div>
                  <div className="font-semibold text-[#103B66]">Sensor Partikulat Udara Keluar (CH2)</div>
                  <div className="text-[11px] text-[#103B66]/65">
                    Aktifkan hanya apabila sensor kedua terpasang di sisi udara keluar.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={form.hasOutletSensor}
                  onChange={(e) => setForm({ ...form, hasOutletSensor: e.target.checked })}
                  className="h-4 w-4 rounded border-[#82C5EF] text-[#176FAF]"
                />
              </label>

              <label className="flex items-center justify-between gap-3 cursor-pointer pt-2 border-t border-[#DCEEFB]">
                <div>
                  <div className="font-semibold text-[#103B66]">Kipas DC 12V Terpasang</div>
                  <div className="text-[11px] text-[#103B66]/65">
                    Mengaktifkan pemantauan status aktuator kipas DC pada panel aktif.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={form.dcFanInstalled}
                  onChange={(e) => setForm({ ...form, dcFanInstalled: e.target.checked })}
                  className="h-4 w-4 rounded border-[#82C5EF] text-[#176FAF]"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="block text-xs text-[#103B66]">
                <span>Panel Aktif</span>
                <select
                  value={form.activePanelId}
                  onChange={(e) => setForm({ ...form, activePanelId: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-[#B9E0F8] bg-white px-3 py-2 font-mono text-xs"
                >
                  <option value="AC-01">AC-01</option>
                  <option value="AC-02">AC-02</option>
                  <option value="AC-03">AC-03</option>
                  <option value="AC-04">AC-04</option>
                </select>
              </label>

              <label className="block text-xs text-[#103B66]">
                <span>Interval Pembaruan (dtk)</span>
                <input
                  type="number"
                  min={2}
                  max={300}
                  value={form.refreshIntervalSec}
                  onChange={(e) => setForm({ ...form, refreshIntervalSec: Number(e.target.value) })}
                  className="mt-1 w-full rounded-xl border border-[#B9E0F8] bg-white px-3 py-2 font-mono text-xs"
                />
              </label>

              <label className="block text-xs text-[#103B66]">
                <span>Satuan Konsentrasi</span>
                <select
                  value={form.measurementUnit}
                  onChange={(e) =>
                    setForm({ ...form, measurementUnit: e.target.value as 'µg/m³' | 'mg/m³' })
                  }
                  className="mt-1 w-full rounded-xl border border-[#B9E0F8] bg-white px-3 py-2 font-mono text-xs"
                >
                  <option value="µg/m³">µg/m³</option>
                  <option value="mg/m³">mg/m³</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-[#DCEEFB] flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-[#458B6D] font-medium">
            {saveMessage && (
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                {saveMessage}
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#176FAF] px-5 py-2.5 text-xs font-medium text-white hover:bg-[#103B66]"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan Perangkat'}
          </button>
        </div>
      </form>

      {/* Integrasi Repositori GitHub */}
      <section className="airskin-card p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DCEEFB] pb-4">
          <div className="flex items-center gap-2.5">
            <Github className="w-5 h-5 text-[#103B66]" />
            <div>
              <h2 className="font-[Poppins] text-base font-semibold text-[#103B66]">
                Koneksi Repositori GitHub
              </h2>
              <p className="text-xs text-[#103B66]/70">
                Terhubung ke repositori proyek untuk pencadangan snapshot telemetri dan kode sumber.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={fetchGithubStatus}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#B9E0F8] bg-white px-3 py-2 text-xs font-medium text-[#103B66] hover:bg-[#EAF6FF]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Periksa Status
            </button>
            <button
              type="button"
              onClick={handleGithubSync}
              disabled={syncingGithub}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#103B66] px-4 py-2 text-xs font-medium text-white hover:bg-[#176FAF] disabled:opacity-50"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              {syncingGithub ? 'Mengirim...' : 'Sinkronkan Snapshot ke GitHub'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <div className="space-y-3">
            <label className="block text-xs text-[#103B66]">
              <span>Repositori GitHub (pemilik/nama-repo)</span>
              <input
                type="text"
                value={form.githubRepo}
                onChange={(e) => setForm({ ...form, githubRepo: e.target.value })}
                className="mt-1 w-full rounded-xl border border-[#B9E0F8] bg-white px-3 py-2 font-mono text-xs"
              />
            </label>

            <div className="flex items-end gap-2">
              <label className="flex-1 text-xs text-[#103B66]">
                <span>Token Sesi GitHub (Opsional, hanya memori server)</span>
                <input
                  type="password"
                  placeholder="Tempel PAT jika GITHUB_TOKEN belum diatur di Secrets"
                  value={sessionTokenInput}
                  onChange={(e) => setSessionTokenInput(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#B9E0F8] bg-white px-3 py-2 font-mono text-xs"
                />
              </label>
              <button
                type="button"
                onClick={handleSaveSessionToken}
                className="rounded-xl border border-[#82C5EF] bg-white px-3.5 py-2 text-xs font-medium text-[#176FAF] hover:bg-[#EAF6FF] whitespace-nowrap"
              >
                Hubungkan Token
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-[#DCEEFB] bg-[#F5FAFF] p-4 text-xs space-y-1.5">
            {githubStatus?.connected ? (
              <>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-[#458B6D]">
                    ● Terhubung ke {githubStatus.repo}
                  </span>
                  <span className="font-mono text-[11px] text-[#176FAF] flex items-center gap-1">
                    <GitBranch className="w-3 h-3" /> {githubStatus.defaultBranch || 'main'}
                  </span>
                </div>
                {githubStatus.htmlUrl && (
                  <a
                    href={githubStatus.htmlUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block font-mono text-[11px] text-[#176FAF] underline underline-offset-2"
                  >
                    {githubStatus.htmlUrl}
                  </a>
                )}
                <div className="text-[11px] text-[#103B66]/70">
                  Status otentikasi tulis:{' '}
                  <strong>{githubStatus.hasToken ? 'Token Server Aktif' : 'Mode Baca Saja'}</strong>
                </div>
              </>
            ) : (
              <div className="text-[#103B66]/75">
                {githubStatus?.message || 'Memeriksa koneksi repositori...'}
              </div>
            )}
          </div>
        </div>

        {syncMessage && (
          <div className="rounded-xl border border-[#82C5EF] bg-[#EAF6FF] px-4 py-2.5 text-xs text-[#103B66]">
            {syncMessage}
          </div>
        )}
      </section>
    </div>
  );
};
