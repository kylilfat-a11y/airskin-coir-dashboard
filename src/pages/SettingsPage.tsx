import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Cpu,
  GitBranch,
  Github,
  RefreshCw,
  Save,
  Sliders,
  UploadCloud,
  Wifi,
} from 'lucide-react';
import type { SystemConfig, SystemStatePayload } from '../types/airskin';

interface SettingsPageProps {
  state: SystemStatePayload;
  onSaveConfig: (patch: Partial<SystemConfig>) => Promise<void>;
}

interface GithubStatusResponse {
  connected: boolean;
  hasToken: boolean;
  repo: string;
  htmlUrl?: string;
  defaultBranch?: string;
  visibility?: string;
  updatedAt?: string;
  message?: string;
  recentCommits?: Array<{ sha: string; message: string; date: string }>;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ state, onSaveConfig }) => {
  const [form, setForm] = useState<SystemConfig>(state.config);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [githubStatus, setGithubStatus] = useState<GithubStatusResponse | null>(null);
  const [syncingGithub, setSyncingGithub] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    setForm(state.config);
  }, [state.config]);

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
        message: 'Unable to check GitHub repository status.',
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
      setSaveMessage('System configuration updated.');
      fetchGithubStatus();
    } finally {
      setSaving(false);
    }
  }

  async function handleGithubSync() {
    setSyncingGithub(true);
    setSyncMessage(null);
    try {
      const resp = await fetch('/api/github/sync-snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: 'Dashboard configuration & telemetry snapshot' }),
      });
      const data = (await resp.json()) as { synced?: boolean; path?: string; error?: string };
      if (!resp.ok) {
        setSyncMessage(data.error || 'GitHub sync failed.');
      } else {
        setSyncMessage(`Snapshot synced to ${data.path}`);
        fetchGithubStatus();
      }
    } catch {
      setSyncMessage('Network error during GitHub snapshot sync.');
    } finally {
      setSyncingGithub(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[Poppins] text-2xl sm:text-3xl font-semibold tracking-tight text-[#103B66]">
          System Configuration
        </h1>
        <p className="mt-1 text-sm text-[#103B66]/75">
          ESP32 hardware telemetry setup, sensor topology flags, measurement units, and GitHub synchronization.
        </p>
      </div>

      {/* System Architecture Flow Diagram */}
      <section className="airskin-card p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-[Poppins] text-base font-semibold text-[#103B66]">
            IoT Data Pipeline Architecture
          </h2>
          <span className="font-mono text-xs text-[#176FAF]">
            PM SENSOR → ESP32 → DATA PROCESSING → IoT DASHBOARD
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-7 items-center gap-2 rounded-2xl border border-[#B9E0F8] bg-[#F5FAFF] p-4">
          <div className="md:col-span-1 rounded-xl border border-[#82C5EF] bg-white p-3.5 text-center">
            <div className="text-[11px] font-mono text-[#176FAF]">STAGE 01</div>
            <div className="mt-1 font-[Poppins] text-xs font-semibold text-[#103B66]">PM SENSOR</div>
            <div className="mt-0.5 text-[11px] text-[#103B66]/65">PMS5003 UART</div>
          </div>

          <div className="flex justify-center">
            <ArrowRight className="w-5 h-5 text-[#429EDB] rotate-90 md:rotate-0" />
          </div>

          <div className="md:col-span-1 rounded-xl border border-[#82C5EF] bg-white p-3.5 text-center">
            <div className="text-[11px] font-mono text-[#176FAF]">STAGE 02</div>
            <div className="mt-1 font-[Poppins] text-xs font-semibold text-[#103B66]">ESP32</div>
            <div className="mt-0.5 text-[11px] text-[#103B66]/65">Wi-Fi HTTP POST</div>
          </div>

          <div className="flex justify-center">
            <ArrowRight className="w-5 h-5 text-[#429EDB] rotate-90 md:rotate-0" />
          </div>

          <div className="md:col-span-1 rounded-xl border border-[#82C5EF] bg-white p-3.5 text-center">
            <div className="text-[11px] font-mono text-[#176FAF]">STAGE 03</div>
            <div className="mt-1 font-[Poppins] text-xs font-semibold text-[#103B66]">
              DATA PROCESSING
            </div>
            <div className="mt-0.5 text-[11px] text-[#103B66]/65">Validation & η Math</div>
          </div>

          <div className="flex justify-center">
            <ArrowRight className="w-5 h-5 text-[#429EDB] rotate-90 md:rotate-0" />
          </div>

          <div className="md:col-span-1 rounded-xl border border-[#72B89A] bg-[#103B66] p-3.5 text-center text-white">
            <div className="text-[11px] font-mono text-[#82C5EF]">STAGE 04</div>
            <div className="mt-1 font-[Poppins] text-xs font-semibold">IoT DASHBOARD</div>
            <div className="mt-0.5 text-[11px] text-[#B9E0F8]">AIRSKIN COIR UI</div>
          </div>
        </div>
      </section>

      {/* Hardware & Telemetry Settings Form */}
      <form onSubmit={handleSubmit} className="airskin-card p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ESP32 & Wi-Fi */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#103B66]">
              <Cpu className="w-4 h-4 text-[#176FAF]" />
              <span>ESP32 Device & Wi-Fi Uplink</span>
            </div>

            <label className="block text-xs text-[#103B66]">
              <span className="font-medium">Building Location</span>
              <input
                type="text"
                value={form.buildingLocation}
                onChange={(e) => setForm({ ...form, buildingLocation: e.target.value })}
                className="mt-1 w-full rounded-xl border border-[#B9E0F8] bg-white px-3 py-2 text-xs"
              />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block text-xs text-[#103B66]">
                <span className="font-medium">ESP32 Device ID</span>
                <input
                  type="text"
                  value={form.esp32DeviceId}
                  onChange={(e) => setForm({ ...form, esp32DeviceId: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-[#B9E0F8] bg-white px-3 py-2 font-mono text-xs"
                />
              </label>

              <label className="block text-xs text-[#103B66]">
                <span className="font-medium">Wi-Fi SSID</span>
                <div className="mt-1 flex items-center gap-2 rounded-xl border border-[#B9E0F8] bg-white px-3 py-2">
                  <Wifi className="w-3.5 h-3.5 text-[#429EDB] shrink-0" />
                  <input
                    type="text"
                    value={form.wifiSsid}
                    onChange={(e) => setForm({ ...form, wifiSsid: e.target.value })}
                    className="w-full font-mono text-xs focus:outline-none"
                  />
                </div>
              </label>
            </div>

            <div className="rounded-xl border border-[#DCEEFB] bg-[#F5FAFF] p-3.5 space-y-1.5">
              <div className="text-xs font-semibold text-[#103B66]">ESP32 HTTP Telemetry Endpoint</div>
              <div className="font-mono text-[11px] text-[#176FAF] break-all">
                POST /api/telemetry · {'{ "pm25Inlet": 42.1, "pm10Inlet": 65.4, "panelId": "AC-01" }'}
              </div>
            </div>
          </div>

          {/* Sensor Topology & Units */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#103B66]">
              <Sliders className="w-4 h-4 text-[#176FAF]" />
              <span>Sensor Configuration & Display Units</span>
            </div>

            <div className="space-y-2.5 rounded-xl border border-[#DCEEFB] bg-[#F5FAFF] p-4 text-xs">
              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <div>
                  <div className="font-semibold text-[#103B66]">Outlet PM Sensor Installed (CH2)</div>
                  <div className="text-[11px] text-[#103B66]/65">
                    Enable only when a second physical PM sensor is mounted downstream.
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
                  <div className="font-semibold text-[#103B66]">Differential Pressure Sensor (ΔP)</div>
                  <div className="text-[11px] text-[#103B66]/65">
                    Enable pressure drop telemetry across the coir cartridge.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={form.hasPressureSensor}
                  onChange={(e) => setForm({ ...form, hasPressureSensor: e.target.checked })}
                  className="h-4 w-4 rounded border-[#82C5EF] text-[#176FAF]"
                />
              </label>

              <label className="flex items-center justify-between gap-3 cursor-pointer pt-2 border-t border-[#DCEEFB]">
                <div>
                  <div className="font-semibold text-[#103B66]">Airflow / Anemometer Sensor</div>
                  <div className="text-[11px] text-[#103B66]/65">
                    Enable volumetric airflow reporting in m³/h.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={form.hasAirflowSensor}
                  onChange={(e) => setForm({ ...form, hasAirflowSensor: e.target.checked })}
                  className="h-4 w-4 rounded border-[#82C5EF] text-[#176FAF]"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="block text-xs text-[#103B66]">
                <span className="font-medium">Active Panel ID</span>
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
                <span className="font-medium">Refresh Interval (s)</span>
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
                <span className="font-medium">Measurement Unit</span>
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
            className="inline-flex items-center gap-2 rounded-xl bg-[#176FAF] px-5 py-2.5 text-xs font-medium text-white hover:bg-[#103B66] transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save System Configuration'}
          </button>
        </div>
      </form>

      {/* GitHub Repository Connection & Telemetry Sync */}
      <section className="airskin-card p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DCEEFB] pb-4">
          <div className="flex items-center gap-2.5">
            <Github className="w-5 h-5 text-[#103B66]" />
            <div>
              <h2 className="font-[Poppins] text-base font-semibold text-[#103B66]">
                GitHub Repository Integration
              </h2>
              <p className="text-xs text-[#103B66]/70">
                Linked project repository & server-authenticated telemetry snapshot backup.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchGithubStatus}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#B9E0F8] bg-white px-3 py-2 text-xs font-medium text-[#103B66] hover:bg-[#EAF6FF]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh Status
            </button>
            <button
              type="button"
              onClick={handleGithubSync}
              disabled={syncingGithub}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#103B66] px-4 py-2 text-xs font-medium text-white hover:bg-[#176FAF] disabled:opacity-50"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              {syncingGithub ? 'Syncing...' : 'Push Snapshot to GitHub'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <label className="block text-xs text-[#103B66]">
            <span className="font-medium">Connected GitHub Repository (owner/repo)</span>
            <input
              type="text"
              value={form.githubRepo}
              onChange={(e) => setForm({ ...form, githubRepo: e.target.value })}
              className="mt-1 w-full rounded-xl border border-[#B9E0F8] bg-white px-3 py-2 font-mono text-xs"
            />
          </label>

          <div className="rounded-xl border border-[#DCEEFB] bg-[#F5FAFF] p-3.5 text-xs space-y-1">
            {githubStatus?.connected ? (
              <>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-[#458B6D]">
                    ● Connected to {githubStatus.repo}
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
              </>
            ) : (
              <div className="text-[#103B66]/75">
                {githubStatus?.message || 'Checking repository link...'}
              </div>
            )}
          </div>
        </div>

        {githubStatus?.recentCommits && githubStatus.recentCommits.length > 0 && (
          <div className="space-y-1.5 pt-2">
            <div className="text-xs font-semibold text-[#103B66]">Recent Repository Commits</div>
            <div className="divide-y divide-[#EAF6FF] text-xs">
              {githubStatus.recentCommits.map((c) => (
                <div key={c.sha} className="py-2 flex items-center justify-between gap-3">
                  <span className="text-[#103B66] truncate">
                    <span className="font-mono text-[#176FAF] mr-2">{c.sha}</span>
                    {c.message}
                  </span>
                  <span className="font-mono text-[11px] text-[#103B66]/60 shrink-0">
                    {new Date(c.date).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {syncMessage && (
          <div className="rounded-xl border border-[#82C5EF] bg-[#EAF6FF] px-4 py-2.5 text-xs text-[#103B66]">
            {syncMessage}
          </div>
        )}
      </section>
    </div>
  );
};
