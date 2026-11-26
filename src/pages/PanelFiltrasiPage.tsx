import React, { useState } from 'react';
import {
  ArrowRight,
  Cpu,
  Fan,
  Layers,
  Maximize2,
  Minimize2,
  Wind,
  X,
} from 'lucide-react';
import type { SystemStatePayload } from '../types/airskin';
import facadeIsoImg from '../assets/images/facade_3d_isometric_1795694950809.jpg';
import cartridgeImg from '../assets/images/coir_cartridge_module_1795694950650.jpg';

interface PanelFiltrasiPageProps {
  state: SystemStatePayload;
}

interface KomponenPanel {
  nomor: number;
  nama: string;
  deskripsi: string;
  posisi: string;
  warna: string;
}

const KOMPONEN_PANEL: KomponenPanel[] = [
  {
    nomor: 1,
    nama: 'Casing Pelindung',
    deskripsi: 'Melindungi komponen filtrasi dari lingkungan luar seperti hujan, angin kencang, dan paparan sinar matahari langsung.',
    posisi: 'Rangka Luar Modul Fasad',
    warna: '#103B66',
  },
  {
    nomor: 2,
    nama: 'Saluran Udara Masuk',
    deskripsi: 'Jalur masuk udara sekitar dari lingkungan luar menuju sisi depan susunan media filtrasi.',
    posisi: 'Sisi Depan / Inlet',
    warna: '#176FAF',
  },
  {
    nomor: 3,
    nama: 'Lapisan Nonwoven',
    deskripsi: 'Lapisan penyaring awal untuk menyaring partikel debu berukuran kasar sekaligus meratakan aliran udara.',
    posisi: 'Lapisan Pra-Filtrasi',
    warna: '#429EDB',
  },
  {
    nomor: 4,
    nama: 'Media Serabut Kelapa',
    deskripsi: 'Media filtrasi partikulat utama yang sedang dikembangkan untuk menjebak partikulat udara pada modul fasad.',
    posisi: 'Ruang Media Utama',
    warna: '#D7B978',
  },
  {
    nomor: 5,
    nama: 'Jaring Penyangga',
    deskripsi: 'Menjaga kestabilan media filter agar tidak melengkung atau terlepas akibat aliran udara.',
    posisi: 'Struktur Penahan Media',
    warna: '#82C5EF',
  },
  {
    nomor: 6,
    nama: 'Kipas DC',
    deskripsi: 'Membantu menarik udara melewati media filtrasi dari sisi masuk menuju sisi keluaran secara terkendali.',
    posisi: 'Ruang Aliran Belakang',
    warna: '#176FAF',
  },
  {
    nomor: 7,
    nama: 'Saluran Udara Keluar',
    deskripsi: 'Jalur keluarnya udara setelah melewati sistem filtrasi menuju titik pengukuran sensor outlet.',
    posisi: 'Sisi Belakang / Outlet',
    warna: '#72B89A',
  },
];

type TabPanel = 'detail' | 'susunan' | 'operasional';

export const PanelFiltrasiPage: React.FC<PanelFiltrasiPageProps> = ({ state }) => {
  const [activeTab, setActiveTab] = useState<TabPanel>('detail');
  const [selectedPart, setSelectedPart] = useState<KomponenPanel>(KOMPONEN_PANEL[3]);
  const [zoomOpen, setZoomOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#176FAF]" />
            <h2 className="font-display text-xl font-semibold text-[#103B66]">
              Pemantauan Panel AIRSKIN COIR
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#176FAF]/90 mt-0.5">
            Visualisasi teknis struktur modul filtrasi fasad bangunan beserta fungsi tiap lapisan dan alur aliran udara.
          </p>
        </div>

        {/* Tiga Tombol Aksi */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('detail')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
              activeTab === 'detail'
                ? 'bg-[#176FAF] text-white border-[#176FAF]'
                : 'bg-white text-[#103B66] border-[#B9E0F8] hover:bg-[#EAF6FF]'
            }`}
          >
            Lihat Detail Panel
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('susunan')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
              activeTab === 'susunan'
                ? 'bg-[#176FAF] text-white border-[#176FAF]'
                : 'bg-white text-[#103B66] border-[#B9E0F8] hover:bg-[#EAF6FF]'
            }`}
          >
            Lihat Susunan Filter
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('operasional')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
              activeTab === 'operasional'
                ? 'bg-[#176FAF] text-white border-[#176FAF]'
                : 'bg-white text-[#103B66] border-[#B9E0F8] hover:bg-[#EAF6FF]'
            }`}
          >
            Status Operasional
          </button>
        </div>
      </div>

      {/* Diagram Aliran Udara */}
      <div className="airskin-card p-5 space-y-3">
        <span className="font-mono text-[11px] uppercase tracking-wider text-[#176FAF] block">
          Diagram Aliran Udara Panel
        </span>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm font-medium">
          {[
            'Udara Lingkungan',
            'Nonwoven',
            'Serabut Kelapa',
            'Kipas DC',
            'Udara Keluar',
          ].map((step, idx, arr) => (
            <React.Fragment key={step}>
              <div className="px-3.5 py-2 rounded-xl bg-[#F5FAFF] border border-[#B9E0F8] text-[#103B66] inline-flex items-center gap-1.5">
                {idx === 0 || idx === arr.length - 1 ? (
                  <Wind className="w-3.5 h-3.5 text-[#176FAF]" />
                ) : step === 'Kipas DC' ? (
                  <Fan className="w-3.5 h-3.5 text-[#176FAF]" />
                ) : (
                  <Layers className="w-3.5 h-3.5 text-[#72B89A]" />
                )}
                <span>{step}</span>
              </div>
              {idx < arr.length - 1 && (
                <ArrowRight className="w-4 h-4 text-[#429EDB] shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Ilustrasi Potongan Panel Interaktif (Dapat Diperbesar & Diklik) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 airskin-card p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-base font-semibold text-[#103B66]">
                Ilustrasi Potongan Panel Filtrasi
              </h3>
              <p className="text-xs text-[#103B66]/70">
                Klik nomor komponen atau klik gambar untuk memperbesar tampilan teknis potongan panel.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setZoomOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#B9E0F8] bg-[#F5FAFF] hover:bg-[#EAF6FF] text-xs font-semibold text-[#176FAF]"
            >
              <Maximize2 className="w-3.5 h-3.5" /> Perbesar
            </button>
          </div>

          {/* Skema Potongan SVG Interaktif */}
          <div
            onClick={() => setZoomOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setZoomOpen(true);
            }}
            className="cursor-zoom-in rounded-xl border border-[#CBE7FA] bg-gradient-to-br from-[#F5FAFF] to-[#E6F3FC] p-4"
          >
            <svg viewBox="0 0 740 240" className="w-full h-auto" aria-label="Potongan teknis panel AIRSKIN COIR">
              {/* 1. Casing Pelindung */}
              <rect
                x="40"
                y="24"
                width="660"
                height="192"
                rx="14"
                fill="#FFFFFF"
                stroke={selectedPart.nomor === 1 ? '#176FAF' : '#103B66'}
                strokeWidth={selectedPart.nomor === 1 ? '4' : '2.5'}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPart(KOMPONEN_PANEL[0]);
                }}
              />
              {/* 2. Saluran Udara Masuk */}
              <rect
                x="58"
                y="46"
                width="62"
                height="148"
                rx="8"
                fill="#EAF6FF"
                stroke="#176FAF"
                strokeWidth={selectedPart.nomor === 2 ? '3' : '1.5'}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPart(KOMPONEN_PANEL[1]);
                }}
              />
              {/* 3. Lapisan Nonwoven */}
              <rect
                x="145"
                y="42"
                width="75"
                height="156"
                rx="8"
                fill="#B9E0F8"
                stroke="#429EDB"
                strokeWidth={selectedPart.nomor === 3 ? '3' : '1.5'}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPart(KOMPONEN_PANEL[2]);
                }}
              />
              {/* 4. Media Serabut Kelapa */}
              <rect
                x="245"
                y="42"
                width="145"
                height="156"
                rx="8"
                fill="#F4E8CC"
                stroke="#D7B978"
                strokeWidth={selectedPart.nomor === 4 ? '3.5' : '1.8'}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPart(KOMPONEN_PANEL[3]);
                }}
              />
              {/* 5. Jaring Penyangga */}
              <rect
                x="412"
                y="42"
                width="42"
                height="156"
                rx="6"
                fill="#E3F2FD"
                stroke="#103B66"
                strokeDasharray="4 3"
                strokeWidth={selectedPart.nomor === 5 ? '3' : '1.5'}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPart(KOMPONEN_PANEL[4]);
                }}
              />
              {/* 6. Kipas DC */}
              <rect
                x="480"
                y="56"
                width="96"
                height="128"
                rx="10"
                fill="#DCEEFB"
                stroke="#176FAF"
                strokeWidth={selectedPart.nomor === 6 ? '3' : '1.5'}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPart(KOMPONEN_PANEL[5]);
                }}
              />
              <circle cx="528" cy="120" r="32" fill="#FFFFFF" stroke="#176FAF" strokeWidth="2" />
              <circle cx="528" cy="120" r="7" fill="#103B66" />
              {/* 7. Saluran Udara Keluar */}
              <rect
                x="602"
                y="46"
                width="76"
                height="148"
                rx="8"
                fill="#E5F6EE"
                stroke="#72B89A"
                strokeWidth={selectedPart.nomor === 7 ? '3' : '1.5'}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPart(KOMPONEN_PANEL[6]);
                }}
              />

              {/* Label Nomor Komponen */}
              {[
                { num: 1, x: 370, y: 18 },
                { num: 2, x: 89, y: 124 },
                { num: 3, x: 182, y: 124 },
                { num: 4, x: 317, y: 124 },
                { num: 5, x: 433, y: 124 },
                { num: 6, x: 528, y: 124 },
                { num: 7, x: 640, y: 124 },
              ].map((pin) => {
                const isSel = selectedPart.nomor === pin.num;
                return (
                  <g
                    key={pin.num}
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPart(KOMPONEN_PANEL[pin.num - 1]);
                    }}
                  >
                    <circle
                      cx={pin.x}
                      cy={pin.y}
                      r="13"
                      fill={isSel ? '#176FAF' : '#103B66'}
                      stroke="#FFFFFF"
                      strokeWidth="2"
                    />
                    <text
                      x={pin.x}
                      y={pin.y + 4}
                      textAnchor="middle"
                      className="fill-white text-[11px] font-mono font-bold"
                    >
                      {pin.num}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Detail Bagian Terpilih */}
          <div className="rounded-xl border border-[#B9E0F8] bg-[#EAF6FF]/75 p-4">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="font-mono text-xs font-semibold px-2 py-0.5 rounded text-white"
                style={{ backgroundColor: selectedPart.warna }}
              >
                Komponen 0{selectedPart.nomor}
              </span>
              <h4 className="font-display text-sm font-semibold text-[#103B66]">
                {selectedPart.nama}
              </h4>
            </div>
            <p className="text-xs sm:text-sm text-[#103B66]/85 leading-relaxed">
              {selectedPart.deskripsi}
            </p>
          </div>
        </div>

        {/* Kolom Kanan: Konten Berdasarkan Tombol Aktif */}
        <div className="lg:col-span-5 airskin-card p-5 space-y-4">
          {activeTab === 'detail' && (
            <>
              <h3 className="font-display text-base font-semibold text-[#103B66]">
                Daftar 7 Komponen Panel AIRSKIN COIR
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {KOMPONEN_PANEL.map((part) => {
                  const active = selectedPart.nomor === part.nomor;
                  return (
                    <button
                      key={part.nomor}
                      type="button"
                      onClick={() => setSelectedPart(part)}
                      className={`w-full text-left rounded-xl p-3 border transition-colors ${
                        active
                          ? 'bg-[#EAF6FF] border-[#176FAF]'
                          : 'bg-[#F8FCFF] border-[#DCEEFB] hover:border-[#429EDB]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display text-xs font-semibold text-[#103B66]">
                          {part.nomor}. {part.nama}
                        </span>
                        <span className="font-mono text-[10px] text-[#176FAF]">
                          {part.posisi}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#103B66]/75 mt-1 leading-snug">
                        {part.deskripsi}
                      </p>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {activeTab === 'susunan' && (
            <div className="space-y-4">
              <h3 className="font-display text-base font-semibold text-[#103B66]">
                Susunan Media Filter Prototipe
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <img
                  src={facadeIsoImg}
                  alt="Isometrik Fasad Panel AIRSKIN COIR"
                  referrerPolicy="no-referrer"
                  className="w-full h-36 object-cover rounded-xl border border-[#CBE7FA]"
                />
                <img
                  src={cartridgeImg}
                  alt="Kartrid Media Filtrasi Berlapis"
                  referrerPolicy="no-referrer"
                  className="w-full h-36 object-cover rounded-xl border border-[#CBE7FA]"
                />
              </div>
              <ol className="space-y-2 text-xs text-[#103B66]/85 list-decimal pl-4">
                <li><strong>Lapisan Nonwoven:</strong> Menahan debu kasar di sisi masuk dan menstabilkan aliran udara.</li>
                <li><strong>Media Serabut Kelapa:</strong> Lapisan utama berongga untuk menjebak partikulat halus.</li>
                <li><strong>Jaring Penyangga &amp; Kipas DC:</strong> Menjaga ketebalan media sekaligus mendorong udara keluar.</li>
              </ol>
            </div>
          )}

          {activeTab === 'operasional' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#176FAF]" />
                <h3 className="font-display text-base font-semibold text-[#103B66]">
                  Status Operasional Panel
                </h3>
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-2 border-b border-[#E6F3FC]">
                  <span className="text-[#103B66]/70">Status Koneksi Panel</span>
                  <span className="font-semibold text-[#103B66]">{state.connectionState}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#E6F3FC]">
                  <span className="text-[#103B66]/70">Kipas DC</span>
                  <span className="font-semibold text-[#103B66]">{state.deviceStatus.fanStatus}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#E6F3FC]">
                  <span className="text-[#103B66]/70">Target Kecepatan PWM Kipas</span>
                  <span className="font-mono font-semibold text-[#176FAF] tabular-nums">
                    {state.sensorSettings.fanPwmPersen}%
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-[#103B66]/70">Sensor Partikulat</span>
                  <span className="font-semibold text-[#103B66]">
                    {state.deviceStatus.pmSensorConnected ? 'Terhubung' : 'Menunggu data sensor'}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-[#103B66]/70 bg-[#F5FAFF] border border-[#DCEEFB] rounded-xl p-3 leading-relaxed">
                Status operasional aktual akan diperbarui secara otomatis saat unit ESP32 pada panel fasad terhubung dan mengirimkan telemetri.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Perbesar Ilustrasi Panel */}
      {zoomOpen && (
        <div className="fixed inset-0 z-50 bg-[#103B66]/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#B9E0F8] max-w-4xl w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-[#103B66]">
                Detail Diperbesar — Potongan Panel AIRSKIN COIR
              </h3>
              <button
                type="button"
                onClick={() => setZoomOpen(false)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#B9E0F8] text-xs font-semibold text-[#103B66] hover:bg-[#EAF6FF]"
              >
                <Minimize2 className="w-3.5 h-3.5" /> Tutup <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <img
                src={facadeIsoImg}
                alt="Visualisasi 3D Fasad AIRSKIN COIR"
                referrerPolicy="no-referrer"
                className="w-full h-64 object-cover rounded-xl border border-[#CBE7FA]"
              />
              <img
                src={cartridgeImg}
                alt="Detail Susunan Media Filtrasi"
                referrerPolicy="no-referrer"
                className="w-full h-64 object-cover rounded-xl border border-[#CBE7FA]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
              {KOMPONEN_PANEL.map((item) => (
                <div
                  key={item.nomor}
                  className="rounded-xl bg-[#F5FAFF] border border-[#DCEEFB] p-3"
                >
                  <p className="font-semibold text-[#103B66]">
                    {item.nomor}. {item.nama}
                  </p>
                  <p className="text-[11px] text-[#103B66]/75 mt-1">{item.deskripsi}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
