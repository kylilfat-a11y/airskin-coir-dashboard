import React from 'react';
import { ArrowRight, Fan, Layers, Wind } from 'lucide-react';

const SUSUNAN_LAPISAN = [
  {
    nama: 'Nonwoven depan',
    label: 'Lapisan penyaring awal partikel kasar',
    warna: '#429EDB',
    bg: '#EEF8FF',
  },
  {
    nama: 'Kapuk',
    label: 'Media serat alami berongga',
    warna: '#D7B978',
    bg: '#FCF8EE',
  },
  {
    nama: 'Jerami padi',
    label: 'Media serat utama penangkap partikulat',
    warna: '#72B89A',
    bg: '#EFF9F4',
  },
  {
    nama: 'Nonwoven belakang',
    label: 'Lapisan penahan akhir susunan media',
    warna: '#429EDB',
    bg: '#EEF8FF',
  },
  {
    nama: 'Kipas DC',
    label: 'Mengalirkan udara melewati panel filter',
    warna: '#103B66',
    bg: '#F2F6FA',
  },
];

export const PanelFiltrasiPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-[#176FAF]" />
          <h2 className="font-display text-xl font-semibold text-[#103B66]">
            Panel Filtrasi AIRSKIN COIR
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-[#176FAF]/90 mt-0.5">
          Susunan lapisan media filtrasi dan arah aliran udara di dalam panel.
        </p>
      </div>

      {/* Satu Ilustrasi Panel Filtrasi dengan Susunan 5 Lapisan */}
      <div className="airskin-card p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-[#176FAF]">
          <span className="inline-flex items-center gap-1.5">
            <Wind className="w-4 h-4" /> Udara Masuk
          </span>
          <span className="text-[#103B66]/70">
            Nonwoven depan → Kapuk → Jerami padi → Nonwoven belakang → Kipas DC
          </span>
          <span className="inline-flex items-center gap-1.5 text-[#2F6F54]">
            <Fan className="w-4 h-4" /> Udara Keluar
          </span>
        </div>

        {/* Ilustrasi SVG Potongan Susunan Panel */}
        <div className="rounded-xl border border-[#CBE7FA] bg-gradient-to-br from-[#F5FAFF] to-[#E6F3FC] p-5">
          <svg
            viewBox="0 0 780 210"
            className="w-full h-auto"
            role="img"
            aria-label="Ilustrasi susunan panel filtrasi AIRSKIN COIR"
          >
            {/* Casing luar */}
            <rect x="30" y="18" width="720" height="174" rx="14" fill="#FFFFFF" stroke="#103B66" strokeWidth="2.5" />

            {/* 1. Nonwoven depan */}
            <rect x="65" y="38" width="95" height="134" rx="8" fill="#B9E0F8" stroke="#429EDB" strokeWidth="2" />
            <text x="112" y="102" textAnchor="middle" className="fill-[#103B66] text-[12px] font-semibold">Nonwoven</text>
            <text x="112" y="118" textAnchor="middle" className="fill-[#103B66]/75 text-[11px]">Depan</text>

            {/* 2. Kapuk */}
            <rect x="190" y="38" width="115" height="134" rx="8" fill="#F4E8CC" stroke="#D7B978" strokeWidth="2" />
            <text x="247" y="108" textAnchor="middle" className="fill-[#103B66] text-[13px] font-semibold">Kapuk</text>

            {/* 3. Jerami padi */}
            <rect x="335" y="38" width="125" height="134" rx="8" fill="#DFF2E9" stroke="#72B89A" strokeWidth="2" />
            <text x="397" y="108" textAnchor="middle" className="fill-[#103B66] text-[13px] font-semibold">Jerami Padi</text>

            {/* 4. Nonwoven belakang */}
            <rect x="490" y="38" width="95" height="134" rx="8" fill="#B9E0F8" stroke="#429EDB" strokeWidth="2" />
            <text x="537" y="102" textAnchor="middle" className="fill-[#103B66] text-[12px] font-semibold">Nonwoven</text>
            <text x="537" y="118" textAnchor="middle" className="fill-[#103B66]/75 text-[11px]">Belakang</text>

            {/* 5. Kipas DC */}
            <rect x="615" y="48" width="100" height="114" rx="10" fill="#E6F2FC" stroke="#103B66" strokeWidth="2" />
            <circle cx="665" cy="96" r="26" fill="#FFFFFF" stroke="#176FAF" strokeWidth="2" />
            <circle cx="665" cy="96" r="6" fill="#103B66" />
            <text x="665" y="146" textAnchor="middle" className="fill-[#103B66] text-[12px] font-semibold">Kipas DC</text>

            {/* Panah aliran antar lapisan */}
            {[164, 309, 464, 589].map((x) => (
              <path
                key={x}
                d={`M ${x} 105 H ${x + 22} M ${x + 22} 105 L ${x + 15} 99 M ${x + 22} 105 L ${x + 15} 111`}
                stroke="#176FAF"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </svg>
        </div>

        {/* Label Singkat Setiap Lapisan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {SUSUNAN_LAPISAN.map((item, idx) => (
            <div
              key={item.nama}
              className="rounded-xl p-3.5 border border-[#CFE8FA]"
              style={{ backgroundColor: item.bg }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded text-white"
                  style={{ backgroundColor: item.warna }}
                >
                  0{idx + 1}
                </span>
                {idx < SUSUNAN_LAPISAN.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 text-[#429EDB]" />
                )}
              </div>
              <p className="font-display text-sm font-semibold text-[#103B66]">{item.nama}</p>
              <p className="text-xs text-[#103B66]/75 mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
