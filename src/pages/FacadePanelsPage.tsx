import React, { useState } from 'react';
import { Activity, AlertTriangle, Building2, CheckCircle2, Layers, WifiOff } from 'lucide-react';
import type { FacadePanel, SystemStatePayload } from '../types/airskin';
import { ExplodedFilterDiagram } from '../components/ExplodedFilterDiagram';
import { FutureBuildingNetwork } from '../components/FutureBuildingNetwork';

interface FacadePanelsPageProps {
  state: SystemStatePayload;
}

export const FacadePanelsPage: React.FC<FacadePanelsPageProps> = ({ state }) => {
  const { panels } = state;
  const [selectedId, setSelectedId] = useState<string>(panels[0]?.id || 'AC-01');
  const [activeSubTab, setActiveSubTab] = useState<'detail' | 'susunan' | 'status'>('detail');

  const activePanel: FacadePanel = panels.find((p) => p.id === selectedId) || panels[0];

  function renderStatusBadge(status: FacadePanel['status']) {
    if (status === 'Terhubung') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#458B6D]">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          Terhubung
        </span>
      );
    }
    if (status === 'Perlu Pemeriksaan') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A68338]">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          Perlu Pemeriksaan
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B]">
        <WifiOff className="w-3.5 h-3.5 shrink-0" />
        Menunggu Koneksi
      </span>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-[Poppins] text-2xl sm:text-3xl font-semibold tracking-tight text-[#103B66]">
            Pemantauan Panel AIRSKIN COIR
          </h1>
          <p className="mt-1 text-sm text-[#103B66]/75">
            Visualisasi teknis panel filtrasi pada fasad bangunan, susunan 7 lapisan, dan status operasional unit.
          </p>
        </div>
        <div className="text-xs text-[#176FAF] font-medium">
          1 Modul Prototipe Utama (AC-01) · 3 Modul Konsep / Rencana
        </div>
      </div>

      {/* Visualisasi Fasad Gedung + Daftar Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        <section className="xl:col-span-7 airskin-card overflow-hidden flex flex-col">
          <div className="border-b border-[#DCEEFB] px-5 py-3.5 flex flex-wrap items-center justify-between gap-2 bg-[#F5FAFF]">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#103B66]">
              <Building2 className="w-4 h-4 text-[#176FAF]" />
              <span>Tata Letak Panel Filtrasi pada Fasad Bangunan</span>
            </div>
            <span className="text-[11px] text-[#103B66]/70">
              Klik pin panel pada gedung untuk memeriksa detail unit
            </span>
          </div>

          <div className="relative flex-1 min-h-[310px] bg-[#EAF6FF]">
            <img
              src="/src/assets/images/facade_3d_isometric_1795694950809.jpg"
              alt="Visualisasi teknis gedung dengan panel filtrasi AIRSKIN COIR pada fasad"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            {panels.map((panel) => {
              const isSelected = panel.id === activePanel.id;
              const statusColor =
                panel.status === 'Terhubung'
                  ? 'bg-[#72B89A] border-white text-[#103B66]'
                  : panel.status === 'Perlu Pemeriksaan'
                    ? 'bg-[#D7B978] border-white text-[#103B66]'
                    : 'bg-[#64748B] border-white text-white';

              return (
                <button
                  key={panel.id}
                  type="button"
                  onClick={() => setSelectedId(panel.id)}
                  style={{ left: `${panel.hotspotX}%`, top: `${panel.hotspotY}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-xl border-2 px-2.5 py-1 font-mono text-xs font-semibold shadow-md transition-transform duration-150 ${statusColor} ${
                    isSelected ? 'scale-110 ring-4 ring-[#429EDB]/45' : 'hover:scale-105'
                  }`}
                  aria-label={`Pilih ${panel.label} di ${panel.location}`}
                >
                  {panel.id}
                </button>
              );
            })}
          </div>

          <div className="border-t border-[#DCEEFB] px-5 py-3 flex flex-wrap items-center justify-between gap-4 text-xs text-[#103B66]/80 bg-white">
            <div className="flex flex-wrap items-center gap-5">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#72B89A]" /> Terhubung
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#D7B978]" /> Perlu Pemeriksaan
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#64748B]" /> Menunggu Koneksi
              </span>
            </div>
          </div>
        </section>

        {/* Daftar Kartu Panel */}
        <section className="xl:col-span-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3">
          {panels.map((panel) => {
            const isSelected = panel.id === activePanel.id;
            return (
              <button
                key={panel.id}
                type="button"
                onClick={() => setSelectedId(panel.id)}
                className={`airskin-card p-4 text-left transition-colors ${
                  isSelected
                    ? 'border-[#429EDB] bg-[#F5FAFF] ring-2 ring-[#429EDB]/25'
                    : 'hover:bg-[#F5FAFF]/60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-[Poppins] text-sm font-semibold text-[#103B66]">
                        {panel.label}
                      </span>
                      <span className="text-[11px] text-[#176FAF]">· {panel.classification}</span>
                    </div>
                    <div className="mt-1 text-xs text-[#103B66]/75">{panel.location}</div>
                  </div>
                  {renderStatusBadge(panel.status)}
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#DCEEFB] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#103B66]/70">
                  <span>
                    Sensor PM:{' '}
                    <strong className="text-[#103B66]">
                      {panel.pmMonitoringAvailable ? 'Tersedia' : 'Rencana'}
                    </strong>
                  </span>
                  <span>
                    Inspeksi: <strong className="text-[#103B66]">{panel.inspectionStatus}</strong>
                  </span>
                </div>
              </button>
            );
          })}
        </section>
      </div>

      {/* Kontrol Tombol Detail Panel, Susunan Filter, Status Operasional */}
      <section className="airskin-card p-6 space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-[#DCEEFB] pb-4">
          <div>
            <div className="text-xs font-medium text-[#176FAF]">
              {activePanel.classification} · {activePanel.facadeZone}
            </div>
            <h2 className="mt-0.5 font-[Poppins] text-xl font-semibold text-[#103B66]">
              {activePanel.label} — {activePanel.location}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveSubTab('detail')}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                activeSubTab === 'detail'
                  ? 'bg-[#176FAF] text-white'
                  : 'border border-[#B9E0F8] bg-white text-[#103B66] hover:bg-[#EAF6FF]'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Lihat Detail Panel
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('susunan')}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                activeSubTab === 'susunan'
                  ? 'bg-[#176FAF] text-white'
                  : 'border border-[#B9E0F8] bg-white text-[#103B66] hover:bg-[#EAF6FF]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Lihat Susunan Filter
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('status')}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                activeSubTab === 'status'
                  ? 'bg-[#176FAF] text-white'
                  : 'border border-[#B9E0F8] bg-white text-[#103B66] hover:bg-[#EAF6FF]'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Status Operasional
            </button>
          </div>
        </div>

        {activeSubTab === 'detail' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="rounded-xl border border-[#DCEEFB] bg-[#F5FAFF] p-4 space-y-1">
                <div className="text-xs font-medium text-[#103B66]/65">Kondisi Media Serabut Kelapa</div>
                <div className="text-xs font-semibold text-[#103B66]">{activePanel.coirCondition}</div>
              </div>
              <div className="rounded-xl border border-[#DCEEFB] bg-[#F5FAFF] p-4 space-y-1">
                <div className="text-xs font-medium text-[#103B66]/65">Kondisi Lapisan Nonwoven</div>
                <div className="text-xs font-semibold text-[#103B66]">{activePanel.nonwovenCondition}</div>
              </div>
              <div className="rounded-xl border border-[#DCEEFB] bg-[#F5FAFF] p-4 space-y-1">
                <div className="text-xs font-medium text-[#103B66]/65">Status Kipas DC</div>
                <div className="text-xs font-semibold text-[#103B66]">{activePanel.fanStatus}</div>
              </div>
              <div className="rounded-xl border border-[#DCEEFB] bg-[#F5FAFF] p-4 space-y-1">
                <div className="text-xs font-medium text-[#103B66]/65">Pemeriksaan Terakhir</div>
                <div className="font-mono text-xs font-semibold text-[#176FAF]">
                  {activePanel.lastMaintenanceDate}
                </div>
                <div className="text-xs text-[#103B66]/75">{activePanel.inspectionStatus}</div>
              </div>
            </div>
            <ExplodedFilterDiagram />
          </div>
        )}

        {activeSubTab === 'susunan' && <ExplodedFilterDiagram />}

        {activeSubTab === 'status' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="rounded-xl border border-[#DCEEFB] bg-[#F5FAFF] p-4 space-y-2">
              <div className="font-semibold text-[#176FAF]">Status Koneksi Unit</div>
              <div>{renderStatusBadge(activePanel.status)}</div>
              <p className="text-[#103B66]/75">
                {activePanel.pmMonitoringAvailable
                  ? 'Terintegrasi dengan node kontroler ESP32 utama.'
                  : 'Unit konsep arsitektural; belum terhubung ke perangkat keras.'}
              </p>
            </div>
            <div className="rounded-xl border border-[#DCEEFB] bg-[#F5FAFF] p-4 space-y-2">
              <div className="font-semibold text-[#176FAF]">Status Kipas DC</div>
              <div className="font-semibold text-[#103B66]">{activePanel.fanStatus}</div>
              <p className="text-[#103B66]/75">
                Mengalirkan udara lingkungan melewati lapisan nonwoven dan media serabut kelapa.
              </p>
            </div>
            <div className="rounded-xl border border-[#DCEEFB] bg-[#F5FAFF] p-4 space-y-2">
              <div className="font-semibold text-[#176FAF]">Kesiapan Pemeliharaan</div>
              <div className="font-semibold text-[#103B66]">{activePanel.inspectionStatus}</div>
              <p className="font-mono text-[#103B66]/75">
                Audit fisik terakhir: {activePanel.lastMaintenanceDate}
              </p>
            </div>
          </div>
        )}
      </section>

      <FutureBuildingNetwork />
    </div>
  );
};
