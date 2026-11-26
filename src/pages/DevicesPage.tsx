import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Cpu,
  Fan,
  GitBranch,
  Radio,
  RefreshCw,
  Send,
  Unplug,
  WifiOff,
} from 'lucide-react';
import type { SystemStatePayload } from '../types/airskin';
import { formatTimestamp } from '../utils/airskinMetrics';

interface DevicesPageProps {
  state: SystemStatePayload;
  onRefreshState: () => Promise<void>;
}

interface GithubStatusResp {
  connected: boolean;
  hasToken: boolean;
  repo: string;
  htmlUrl?: string;
  defaultBranch?: string;
  message?: string;
}

export const DevicesPage: React.FC<DevicesPageProps> = ({ state, onRefreshState }) => {
  const { deviceStatus } = state;

  // Test ESP32 JSON telemetry packet controls for hardware integration verification
  const [testPm25In, setTestPm25In] = useState('64.2');
  const [testPm25Out, setTestPm25Out] = useState('31.8');
  const [testPm10In, setTestPm10In] = useState('98.5');
  const [testPm10Out, setTestPm10Out] = useState('42.1');
  const [deviceFeedback, setDeviceFeedback] = useState<string | null>(null);
  const [deviceBusy, setDeviceBusy] = useState(false);

  // GitHub Integration state
  const [ghRepo, setGhRepo] = useState(state.githubRepo);
  const [ghToken, setGhToken] = useState('');
  const [ghStatus, setGhStatus] = useState<GithubStatusResp | null>(null);
  const [ghFeedback, setGhFeedback] = useState<string | null>(null);
  const [ghBusy, setGhBusy] = useState(false);

  const loadGithubStatus = async () => {
    try {
      const resp = await fetch('/api/github/status');
      if (resp.ok) {
        const data = (await resp.json()) as GithubStatusResp;
        setGhStatus(data);
      }
    } catch {
      // ignore transient errors
    }
  };

  useEffect(() => {
    loadGithubStatus();
  }, []);

  const handleSendTestTelemetry = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeviceBusy(true);
    setDeviceFeedback(null);
    try {
      const resp = await fetch('/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pm25Inlet: Number(testPm25In),
          pm25Outlet: Number(testPm25Out),
          pm10Inlet: Number(testPm10In),
          pm10Outlet: Number(testPm10Out),
        }),
      });
      if (!resp.ok) {
        const err = (await resp.json()) as { error?: string };
        setDeviceFeedback(err.error || 'Gagal mengirim paket uji ESP32.');
      } else {
        setDeviceFeedback('Paket telemetri diterima pada endpoint /api/telemetry dan mode beralih ke Live Data.');
        await onRefreshState();
      }
    } catch {
      setDeviceFeedback('Gagal menghubungi server backend.');
    } finally {
      setDeviceBusy(false);
    }
  };

  const handleDisconnectDevice = async () => {
    setDeviceBusy(true);
    setDeviceFeedback(null);
    try {
      await fetch('/api/device/disconnect', { method: 'POST' });
      setDeviceFeedback('Sesi perangkat diputuskan kembali ke status Disconnected.');
      await onRefreshState();
    } finally {
      setDeviceBusy(false);
    }
  };

  const handleSaveGithubConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setGhBusy(true);
    setGhFeedback(null);
    try {
      const resp = await fetch('/api/github/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo: ghRepo.trim(),
          ...(ghToken.trim() ? { token: ghToken.trim() } : {}),
        }),
      });
      if (resp.ok) {
        setGhToken('');
        await loadGithubStatus();
        setGhFeedback('Konfigurasi repositori GitHub diperbarui untuk sesi server ini.');
      }
    } finally {
      setGhBusy(false);
    }
  };

  const handleSyncSnapshot = async () => {
    setGhBusy(true);
    setGhFeedback(null);
    try {
      const resp = await fetch('/api/github/sync-snapshot', { method: 'POST' });
      const data = (await resp.json()) as { synced?: boolean; path?: string; error?: string };
      if (!resp.ok) {
        setGhFeedback(data.error || 'Gagal menyinkronkan snapshot ke GitHub.');
      } else {
        setGhFeedback(`Snapshot tersinkronisasi ke ${data.path}`);
      }
    } catch {
      setGhFeedback('Terjadi gangguan jaringan saat sinkronisasi GitHub.');
    } finally {
      setGhBusy(false);
    }
  };

  const statusRows = [
    {
      label: 'ESP32 Connection Status',
      value: deviceStatus.esp32Connected ? 'Connected' : 'Disconnected',
      ok: deviceStatus.esp32Connected,
      icon: Cpu,
    },
    {
      label: 'PM Sensor Connection Status',
      value: deviceStatus.pmSensorConnected ? 'Connected (Inlet & Outlet)' : 'Disconnected',
      ok: deviceStatus.pmSensorConnected,
      icon: Radio,
    },
    {
      label: 'Fan Status',
      value: deviceStatus.fanStatus,
      ok: deviceStatus.fanStatus === 'Active',
      icon: Fan,
    },
    {
      label: 'Data Transmission Status',
      value: deviceStatus.dataTransmissionStatus,
      ok: deviceStatus.dataTransmissionStatus === 'Streaming',
      icon: RefreshCw,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-[#176FAF]" />
          <h2 className="font-display text-lg font-semibold text-[#103B66]">
            Device &amp; Sensor Status
          </h2>
        </div>
        <p className="text-xs text-[#176FAF]/85 mt-0.5">
          Pemantauan kesiapan perangkat keras ESP32, sensor partikulat PM2.5/PM10, kipas DC, serta konfigurasi integrasi API/MQTT.
        </p>
      </div>

      {/* Disconnected Warning */}
      {!deviceStatus.esp32Connected && (
        <div className="rounded-xl border border-[#D7B978] bg-[#FCF7EC] px-4 py-3.5 flex items-center gap-3">
          <WifiOff className="w-5 h-5 text-[#B8923E] shrink-0" />
          <p className="text-sm font-medium text-[#6E541D]">
            Device not connected. You are currently viewing simulation data.
          </p>
        </div>
      )}

      {/* 4 Hardware Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statusRows.map((row) => {
          const Icon = row.icon;
          return (
            <div key={row.label} className="airskin-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <Icon className={`w-5 h-5 ${row.ok ? 'text-[#2F6F54]' : 'text-[#176FAF]'}`} />
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    row.ok ? 'bg-[#72B89A]' : 'bg-[#D7B978]'
                  }`}
                />
              </div>
              <div>
                <p className="text-xs text-[#103B66]/70">{row.label}</p>
                <p
                  className={`font-display text-lg font-semibold mt-0.5 ${
                    row.ok ? 'text-[#2F6F54]' : 'text-[#103B66]'
                  }`}
                >
                  {row.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Last Data Received & Endpoint Spec */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6 airskin-card p-5 space-y-4">
          <h3 className="font-display text-base font-semibold text-[#103B66]">
            Kesiapan Integrasi ESP32 (HTTP REST &amp; MQTT)
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-[#E6F3FC]">
              <span className="text-[#103B66]/70">Last Data Received</span>
              <span className="font-mono font-semibold text-[#103B66] tabular-nums">
                {formatTimestamp(deviceStatus.lastDataReceived)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[#E6F3FC]">
              <span className="text-[#103B66]/70">Device ID</span>
              <span className="font-mono text-[#176FAF]">{deviceStatus.esp32DeviceId}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[#E6F3FC]">
              <span className="text-[#103B66]/70">HTTP Ingest Endpoint</span>
              <span className="font-mono text-[#176FAF]">POST /api/telemetry</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[#E6F3FC]">
              <span className="text-[#103B66]/70">MQTT Topic Struktur</span>
              <span className="font-mono text-[#176FAF]">{deviceStatus.mqttTopic}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-[#103B66]/70">Firmware Target</span>
              <span className="font-mono text-[#103B66]">{deviceStatus.firmwareVersion}</span>
            </div>
          </div>

          <div className="rounded-xl bg-[#F5FAFF] border border-[#DCEEFB] p-3.5">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#176FAF] block mb-1.5">
              Contoh Payload JSON ESP32
            </span>
            <pre className="font-mono text-[11px] text-[#103B66] overflow-x-auto leading-relaxed">
{`{
  "pm25Inlet": 64.2,
  "pm25Outlet": 31.8,
  "pm10Inlet": 98.5,
  "pm10Outlet": 42.1
}`}
            </pre>
          </div>
        </div>

        {/* Interactive Endpoint Tester for Hardware Commissioning */}
        <form
          onSubmit={handleSendTestTelemetry}
          className="lg:col-span-6 airskin-card p-5 space-y-4"
        >
          <div>
            <h3 className="font-display text-base font-semibold text-[#103B66]">
              Uji Koneksi Endpoint ESP32 (Commissioning)
            </h3>
            <p className="text-xs text-[#103B66]/70 mt-0.5">
              Gunakan formulir ini untuk menguji penerimaan payload JSON ke <code className="font-mono">/api/telemetry</code> sebelum perangkat fisik terhubung penuh.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-xs text-[#103B66]">PM2.5 Inlet (µg/m³)</span>
              <input
                type="number"
                step="0.1"
                value={testPm25In}
                onChange={(e) => setTestPm25In(e.target.value)}
                className="w-full rounded-xl border border-[#B9E0F8] bg-[#F8FCFF] px-3 py-2 font-mono text-xs text-[#103B66]"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-[#103B66]">PM2.5 Outlet (µg/m³)</span>
              <input
                type="number"
                step="0.1"
                value={testPm25Out}
                onChange={(e) => setTestPm25Out(e.target.value)}
                className="w-full rounded-xl border border-[#B9E0F8] bg-[#F8FCFF] px-3 py-2 font-mono text-xs text-[#103B66]"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-[#103B66]">PM10 Inlet (µg/m³)</span>
              <input
                type="number"
                step="0.1"
                value={testPm10In}
                onChange={(e) => setTestPm10In(e.target.value)}
                className="w-full rounded-xl border border-[#B9E0F8] bg-[#F8FCFF] px-3 py-2 font-mono text-xs text-[#103B66]"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-[#103B66]">PM10 Outlet (µg/m³)</span>
              <input
                type="number"
                step="0.1"
                value={testPm10Out}
                onChange={(e) => setTestPm10Out(e.target.value)}
                className="w-full rounded-xl border border-[#B9E0F8] bg-[#F8FCFF] px-3 py-2 font-mono text-xs text-[#103B66]"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={deviceBusy}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#176FAF] hover:bg-[#103B66] text-white text-xs font-semibold transition-colors disabled:opacity-60"
            >
              <Send className="w-3.5 h-3.5" /> Kirim Paket Uji ke /api/telemetry
            </button>
            {deviceStatus.esp32Connected && (
              <button
                type="button"
                disabled={deviceBusy}
                onClick={handleDisconnectDevice}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#D7B978] bg-[#FCF7EC] text-[#6E541D] text-xs font-semibold hover:bg-[#F7EED8] transition-colors"
              >
                <Unplug className="w-3.5 h-3.5" /> Putuskan Sesi Uji
              </button>
            )}
          </div>

          {deviceFeedback && (
            <p className="text-xs text-[#176FAF] bg-[#EAF6FF] border border-[#B9E0F8] rounded-lg px-3 py-2">
              {deviceFeedback}
            </p>
          )}
        </form>
      </div>

      {/* GitHub Integration Panel */}
      <div className="airskin-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-[#176FAF]" />
            <div>
              <h3 className="font-display text-base font-semibold text-[#103B66]">
                Integrasi Repositori GitHub
              </h3>
              <p className="text-xs text-[#103B66]/70">
                Sinkronisasi snapshot telemetri dan arsip konfigurasi ke repositori GitHub proyek.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            {ghStatus?.connected ? (
              <span className="inline-flex items-center gap-1.5 text-[#2F6F54]">
                <CheckCircle2 className="w-4 h-4" />
                Terhubung: {ghStatus.repo} ({ghStatus.defaultBranch || 'main'})
              </span>
            ) : (
              <span className="text-[#103B66]/70">Repositori: {ghRepo}</span>
            )}
          </div>
        </div>

        <form onSubmit={handleSaveGithubConfig} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <label className="md:col-span-5 block space-y-1">
            <span className="text-xs text-[#103B66]">Repositori (owner/repo)</span>
            <input
              type="text"
              value={ghRepo}
              onChange={(e) => setGhRepo(e.target.value)}
              className="w-full rounded-xl border border-[#B9E0F8] bg-[#F8FCFF] px-3 py-2 font-mono text-xs text-[#103B66]"
            />
          </label>
          <label className="md:col-span-4 block space-y-1">
            <span className="text-xs text-[#103B66]">Token Sesi (opsional, disarankan pakai Secrets)</span>
            <input
              type="password"
              value={ghToken}
              onChange={(e) => setGhToken(e.target.value)}
              placeholder={ghStatus?.hasToken ? 'Token aktif di server' : 'Masukkan token sesi...'}
              className="w-full rounded-xl border border-[#B9E0F8] bg-[#F8FCFF] px-3 py-2 font-mono text-xs text-[#103B66]"
            />
          </label>
          <div className="md:col-span-3 flex items-center gap-2">
            <button
              type="submit"
              disabled={ghBusy}
              className="flex-1 px-3.5 py-2 rounded-xl border border-[#B9E0F8] bg-white hover:bg-[#EAF6FF] text-[#103B66] text-xs font-semibold transition-colors"
            >
              Simpan
            </button>
            <button
              type="button"
              disabled={ghBusy}
              onClick={handleSyncSnapshot}
              className="flex-1 px-3.5 py-2 rounded-xl bg-[#176FAF] hover:bg-[#103B66] text-white text-xs font-semibold transition-colors"
            >
              Sync Snapshot
            </button>
          </div>
        </form>

        {ghFeedback && (
          <p className="text-xs text-[#176FAF] bg-[#EAF6FF] border border-[#B9E0F8] rounded-lg px-3 py-2">
            {ghFeedback}
          </p>
        )}
      </div>
    </div>
  );
};
