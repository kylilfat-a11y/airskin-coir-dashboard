import React from 'react';
import { Cpu, Fan, Link2, Radio, RefreshCw, Settings, Unplug } from 'lucide-react';
import type { ConnectionState, SystemStatePayload } from '../types/airskin';

interface PengaturanPerangkatPageProps {
  state: SystemStatePayload;
  onRequestConnect: () => Promise<void>;
  onRefreshData: () => Promise<void>;
  onDisconnectDevice: () => Promise<void>;
  busy: boolean;
}

function getStatusBadgeStyle(status: ConnectionState): string {
  if (status === 'Terhubung') {
    return 'bg-[#EFF9F4] border-[#72B89A] text-[#2F6F54]';
  }
  if (status === 'Menunggu Koneksi') {
    return 'bg-[#EAF6FF] border-[#429EDB] text-[#176FAF]';
  }
  return 'bg-[#FCF7EC] border-[#D7B978] text-[#7A5E1B]';
}

export const PengaturanPerangkatPage: React.FC<PengaturanPerangkatPageProps> = ({
  state,
  onRequestConnect,
  onRefreshData,
  onDisconnectDevice,
  busy,
}) => {
  const komponenList = [
    {
      nama: 'ESP32',
      status: state.deviceStatus.esp32Status,
      icon: Cpu,
    },
    {
      nama: 'Sensor PM',
      status: state.deviceStatus.sensorPmStatus,
      icon: Radio,
    },
    {
      nama: 'Kipas AC',
      status: state.deviceStatus.kipasAcStatus,
      icon: Fan,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#176FAF]" />
            <h2 className="font-display text-xl font-bold text-[#103B66]">
              Pengaturan Perangkat
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#176FAF]/90 mt-0.5">
            Status koneksi komponen perangkat keras AIRSKIN COIR.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onRequestConnect}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#176FAF] hover:bg-[#103B66] text-white text-xs font-semibold transition-colors disabled:opacity-60"
          >
            <Link2 className="w-3.5 h-3.5" />
            Hubungkan Perangkat
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onRefreshData}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#B9E0F8] bg-white hover:bg-[#EAF6FF] text-[#103B66] text-xs font-semibold transition-colors disabled:opacity-60"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Perbarui Status
          </button>
          {state.deviceConnected && (
            <button
              type="button"
              disabled={busy}
              onClick={onDisconnectDevice}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#D7B978] bg-[#FCF7EC] text-[#6E541D] text-xs font-semibold"
            >
              <Unplug className="w-3.5 h-3.5" />
              Putuskan
            </button>
          )}
        </div>
      </div>

      {/* Tiga Komponen: ESP32, Sensor PM, Kipas AC */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {komponenList.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.nama} className="airskin-card p-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EAF6FF] border border-[#B9E0F8] flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[#176FAF]" />
                </div>
                <h3 className="text-base font-semibold text-[#103B66]">
                  {item.nama}
                </h3>
              </div>

              <span
                className={`font-mono text-xs font-semibold px-3 py-1.5 rounded-lg border ${getStatusBadgeStyle(
                  item.status,
                )}`}
              >
                {item.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
