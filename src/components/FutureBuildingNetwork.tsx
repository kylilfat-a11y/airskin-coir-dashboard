import React, { useState } from 'react';
import { Building2, Layers, Network, ShieldCheck } from 'lucide-react';

interface NetworkNode {
  id: string;
  zone: string;
  elevation: string;
  purpose: string;
  telemetryScope: string;
}

const CONCEPT_NODES: NetworkNode[] = [
  {
    id: 'AC-01',
    zone: 'Fasad Barat Laut Bawah',
    elevation: 'Lantai 2',
    purpose: 'Penangkapan partikulat area jalan dan plaza pejalan kaki',
    telemetryScope: 'PM2.5/PM10 Udara Masuk-Keluar · Modul Prototipe Utama',
  },
  {
    id: 'AC-02',
    zone: 'Fasad Barat Laut Atas',
    elevation: 'Lantai 5',
    purpose: 'Filtrasi udara hadap angin pada elevasi menengah gedung',
    telemetryScope: 'Rencana Node ESP32 Mesh · Sensor Beda Tekanan',
  },
  {
    id: 'AC-03',
    zone: 'Dinding Tirai Koridor Timur',
    elevation: 'Lantai 3',
    purpose: 'Pemantauan kelembapan media & filtrasi aliran termal pagi',
    telemetryScope: 'Rencana Array Kelembapan + PM2.5 + Notifikasi Perawatan',
  },
  {
    id: 'AC-04',
    zone: 'Louver Atrium Atas',
    elevation: 'Lantai 6',
    purpose: 'Pra-penyaringan udara segar sebelum masuk sistem tata udara gedung',
    telemetryScope: 'Rencana Optimasi Terpusat Tingkat Bangunan',
  },
];

export const FutureBuildingNetwork: React.FC = () => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('AC-01');
  const activeNode = CONCEPT_NODES.find((n) => n.id === selectedNodeId) || CONCEPT_NODES[0];

  return (
    <section
      className="airskin-card overflow-hidden"
      aria-labelledby="future-network-heading"
    >
      <div className="border-b border-[#DCEEFB] bg-[#F5FAFF] px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#176FAF]">
          <Network className="w-4 h-4 shrink-0" />
          <span>Konsep Pengembangan Lanjutan — Integrasi Multi-Panel IoT</span>
        </div>
        <span className="text-xs text-[#103B66]/70">
          Peta Jalan Sistem · Belum Diterapkan Penuh
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
        <div className="lg:col-span-6 relative min-h-[250px] bg-[#103B66]">
          <img
            src="/src/assets/images/future_smart_building_1795694951121.jpg"
            alt="Konsep jaringan bangunan pintar terhubung dengan banyak panel filtrasi AIRSKIN COIR"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#103B66]/85 via-[#103B66]/20 to-transparent" />
          <div className="absolute bottom-5 left-5 right-5 text-white">
            <h3
              id="future-network-heading"
              className="font-[Poppins] text-lg font-semibold leading-snug"
            >
              Dari Satu Panel Filtrasi Menuju Jaringan Bangunan Pintar Terhubung.
            </h3>
            <p className="mt-1.5 text-xs text-[#EAF6FF]/85 leading-relaxed">
              Rancangan arsitektur komunikasi antarmodul panel fasad AIRSKIN COIR untuk pemantauan partikulat terpusat dan jadwal pemeliharaan tingkat gedung.
            </p>
          </div>
        </div>

        <div className="lg:col-span-6 p-5 flex flex-col justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-[#176FAF] mb-2.5">
              Topologi Rencana Jaringan Panel Fasad
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {CONCEPT_NODES.map((node) => {
                const selected = node.id === selectedNodeId;
                return (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`rounded-xl border p-3 text-left transition-colors ${
                      selected
                        ? 'border-[#429EDB] bg-[#EAF6FF]'
                        : 'border-[#DCEEFB] bg-white hover:bg-[#F5FAFF]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-[#103B66]">
                        {node.id}
                      </span>
                      <span className="text-[11px] text-[#176FAF]">{node.elevation}</span>
                    </div>
                    <div className="mt-1 text-xs font-medium text-[#103B66] truncate">
                      {node.zone}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-[#B9E0F8] bg-[#F5FAFF] p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-[Poppins] text-sm font-semibold text-[#103B66]">
                Simpul Konsep: {activeNode.id} · {activeNode.zone}
              </span>
              <span className="text-[11px] font-mono text-[#176FAF]">{activeNode.elevation}</span>
            </div>
            <p className="text-xs text-[#103B66]/80">{activeNode.purpose}</p>
            <div className="pt-2 border-t border-[#DCEEFB] flex items-center gap-1.5 text-[11px] text-[#103B66]/75">
              <Layers className="w-3.5 h-3.5 text-[#429EDB] shrink-0" />
              <span>{activeNode.telemetryScope}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-1 border-t border-[#DCEEFB] text-xs">
            <div className="flex items-start gap-2">
              <Building2 className="w-4 h-4 text-[#429EDB] shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-[#103B66]">Pantau Terpusat</div>
                <div className="text-[11px] text-[#103B66]/65">Peta PM gedung</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Network className="w-4 h-4 text-[#72B89A] shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-[#103B66]">Komparasi Zona</div>
                <div className="text-[11px] text-[#103B66]/65">Riwayat antarpanel</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-[#D7B978] shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-[#103B66]">Notifikasi Rawat</div>
                <div className="text-[11px] text-[#103B66]/65">Jadwal inspeksi</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
