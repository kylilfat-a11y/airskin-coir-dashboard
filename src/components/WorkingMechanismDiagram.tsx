import React, { useState } from 'react';
import { ArrowRight, Fan, Layers, Wind } from 'lucide-react';

interface TahapSimulasi {
  id: string;
  urutan: number;
  nama: string;
  peran: string;
  deskripsi: string;
  accentColor: string;
  bgTint: string;
}

const TAHAP_ALIRAN: TahapSimulasi[] = [
  {
    id: 'udara-masuk',
    urutan: 1,
    nama: 'Udara Lingkungan',
    peran: 'Aliran Masuk Panel',
    deskripsi: 'Udara luar bangunan yang membawa partikel PM2.5 dan PM10 masuk melalui kisi saluran depan.',
    accentColor: '#176FAF',
    bgTint: '#EAF6FF',
  },
  {
    id: 'nonwoven-depan',
    urutan: 2,
    nama: 'Lapisan Nonwoven Depan',
    peran: 'Penyaring Awal',
    deskripsi: 'Menahan partikulat berukuran lebih besar serta membantu pemerataan aliran udara ke dalam modul.',
    accentColor: '#429EDB',
    bgTint: '#EEF8FF',
  },
  {
    id: 'kapuk',
    urutan: 3,
    nama: 'Media Kapuk',
    peran: 'Lapisan Serat Kapuk',
    deskripsi: 'Lapisan serat alami berongga yang menangkap sebagian partikel halus yang lolos dari pra-filter.',
    accentColor: '#D7B978',
    bgTint: '#FCF8EE',
  },
  {
    id: 'jerami-padi',
    urutan: 4,
    nama: 'Media Jerami Padi',
    peran: 'Media Serat Jerami',
    deskripsi: 'Media filtrasi berpori berbasis serat lignoselulosa untuk menjebak partikulat tersuspensi.',
    accentColor: '#72B89A',
    bgTint: '#EFF9F4',
  },
  {
    id: 'nonwoven-belakang',
    urutan: 5,
    nama: 'Lapisan Nonwoven Belakang',
    peran: 'Penahan Akhir Media',
    deskripsi: 'Menahan partikel sisa serta menjaga serat media utama agar tidak terbawa menuju sisi keluaran.',
    accentColor: '#429EDB',
    bgTint: '#EEF8FF',
  },
  {
    id: 'kipas-dc',
    urutan: 6,
    nama: 'Kipas DC',
    peran: 'Penggerak Aliran Udara',
    deskripsi: 'Membantu menarik udara melewati seluruh susunan lapisan filter dengan aliran yang stabil.',
    accentColor: '#103B66',
    bgTint: '#F2F6FA',
  },
  {
    id: 'udara-keluar',
    urutan: 7,
    nama: 'Udara Keluar Panel',
    peran: 'Sisi Pengukuran Keluar',
    deskripsi: 'Udara yang telah melewati sistem filtrasi keluar dari panel dan dibandingkan konsentrasinya.',
    accentColor: '#72B89A',
    bgTint: '#EFF9F4',
  },
];

interface WorkingMechanismDiagramProps {
  animateFlow: boolean;
}

export const WorkingMechanismDiagram: React.FC<WorkingMechanismDiagramProps> = ({
  animateFlow,
}) => {
  const [selectedId, setSelectedId] = useState<string>('kapuk');
  const selected = TAHAP_ALIRAN.find((t) => t.id === selectedId) || TAHAP_ALIRAN[2];

  return (
    <div className="airskin-card p-5 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#176FAF]" />
            <h3 className="font-display text-base font-semibold text-[#103B66]">
              A. Simulasi Alur Kerja Filtrasi
            </h3>
          </div>
          <p className="text-xs text-[#176FAF]/85 mt-0.5">
            Ilustrasi pergerakan partikel PM2.5 dan PM10 melewati lapisan nonwoven depan, media kapuk, media jerami padi, nonwoven belakang, dan kipas DC.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span
            className={`w-2 h-2 rounded-full ${
              animateFlow ? 'bg-[#72B89A] animate-pulse' : 'bg-[#82C5EF]'
            }`}
          />
          <span className="text-[#103B66]/80">
            {animateFlow ? 'Aliran Partikel & Udara Aktif' : 'Simulasi Aliran Siaga'}
          </span>
        </div>
      </div>

      {/* Animasi SVG Partikel PM2.5 / PM10 & Panah Aliran Udara */}
      <div className="rounded-xl border border-[#CBE7FA] bg-[#F5FAFF] px-4 py-3">
        <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-[#176FAF] mb-2 gap-2">
          <span className="inline-flex items-center gap-1">
            <Wind className="w-3.5 h-3.5" />
            UDARA LINGKUNGAN (PM2.5 &amp; PM10)
          </span>
          <div className="flex items-center gap-3 text-[10px] text-[#103B66]/75">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#D7B978] inline-block" /> Partikel PM10
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#176FAF] inline-block" /> Partikel PM2.5
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-[#2F6F54]">
            <Fan className={`w-3.5 h-3.5 ${animateFlow ? 'animate-spin' : ''}`} />
            UDARA KELUAR PANEL
          </span>
        </div>

        <svg viewBox="0 0 820 56" className="w-full h-14" aria-label="Animasi aliran udara dan partikel PM2.5 serta PM10">
          {/* Blok Media Penampang Tipis */}
          <rect x="130" y="8" width="70" height="40" rx="6" fill="#B9E0F8" fillOpacity="0.45" stroke="#429EDB" strokeWidth="1" />
          <text x="165" y="53" textAnchor="middle" className="fill-[#103B66]/70 text-[8px] font-mono">NW Depan</text>

          <rect x="240" y="8" width="85" height="40" rx="6" fill="#D7B978" fillOpacity="0.28" stroke="#D7B978" strokeWidth="1" />
          <text x="282" y="53" textAnchor="middle" className="fill-[#103B66]/70 text-[8px] font-mono">Kapuk</text>

          <rect x="365" y="8" width="95" height="40" rx="6" fill="#72B89A" fillOpacity="0.25" stroke="#72B89A" strokeWidth="1" />
          <text x="412" y="53" textAnchor="middle" className="fill-[#103B66]/70 text-[8px] font-mono">Jerami Padi</text>

          <rect x="500" y="8" width="70" height="40" rx="6" fill="#B9E0F8" fillOpacity="0.45" stroke="#429EDB" strokeWidth="1" />
          <text x="535" y="53" textAnchor="middle" className="fill-[#103B66]/70 text-[8px] font-mono">NW Belakang</text>

          <rect x="615" y="10" width="60" height="36" rx="6" fill="#103B66" fillOpacity="0.12" stroke="#103B66" strokeWidth="1" />
          <text x="645" y="53" textAnchor="middle" className="fill-[#103B66]/70 text-[8px] font-mono">Kipas DC</text>

          {/* Garis Aliran Udara */}
          <line x1="12" y1="28" x2="795" y2="28" stroke="#B9E0F8" strokeWidth="3" strokeLinecap="round" />
          <line
            x1="12"
            y1="28"
            x2="795"
            y2="28"
            stroke="#429EDB"
            strokeWidth="3"
            strokeLinecap="round"
            className={animateFlow ? 'airflow-stream' : ''}
            strokeDasharray={animateFlow ? '8 8' : '2 6'}
          />
          <polygon points="795,21 810,28 795,35" fill="#72B89A" />

          {/* Animasi Partikel PM10 (lebih banyak tertahan sebelum media belakang) */}
          {animateFlow && (
            <>
              <circle r="4" fill="#D7B978" cy="20">
                <animate attributeName="cx" values="20;280;390" dur="2.6s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="1;0.85;0.1" dur="2.6s" repeatCount="indefinite" />
              </circle>
              <circle r="3.5" fill="#D7B978" cy="35">
                <animate attributeName="cx" values="15;210;360" dur="3.1s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="1;0.75;0.1" dur="3.1s" repeatCount="indefinite" />
              </circle>
              {/* Animasi Partikel PM2.5 */}
              <circle r="2.6" fill="#176FAF" cy="24">
                <animate attributeName="cx" values="25;420;785" dur="2.4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="1;0.65;0.25" dur="2.4s" repeatCount="indefinite" />
              </circle>
              <circle r="2.6" fill="#176FAF" cy="33">
                <animate attributeName="cx" values="10;320;520" dur="2.9s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="1;0.7;0.1" dur="2.9s" repeatCount="indefinite" />
              </circle>
            </>
          )}
        </svg>
      </div>

      {/* 7 Tahap Kartu Interaktif */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-2.5">
        {TAHAP_ALIRAN.map((tahap, idx) => {
          const isSelected = tahap.id === selected.id;
          return (
            <button
              key={tahap.id}
              type="button"
              onClick={() => setSelectedId(tahap.id)}
              className={`w-full text-left rounded-xl p-3 border transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-[#176FAF] ring-2 ring-[#429EDB]/30 shadow-sm'
                  : 'border-[#CFE8FA] hover:border-[#429EDB]'
              }`}
              style={{ backgroundColor: tahap.bgTint }}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span
                    className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded text-white"
                    style={{ backgroundColor: tahap.accentColor }}
                  >
                    0{tahap.urutan}
                  </span>
                  {idx < TAHAP_ALIRAN.length - 1 && (
                    <ArrowRight
                      className={`w-3.5 h-3.5 shrink-0 ${
                        animateFlow ? 'text-[#176FAF] translate-x-0.5' : 'text-[#82C5EF]'
                      } transition-transform`}
                    />
                  )}
                </div>
                <p className="font-display text-xs font-semibold text-[#103B66] leading-snug">
                  {tahap.nama}
                </p>
              </div>
              <p className="text-[11px] text-[#103B66]/70 mt-2 leading-tight">
                {tahap.peran}
              </p>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-[#B9E0F8] bg-[#EAF6FF]/65 px-4 py-3 text-xs sm:text-sm text-[#103B66]">
        <span className="font-semibold text-[#176FAF]">{selected.nama}:</span> {selected.deskripsi}
      </div>
    </div>
  );
};
