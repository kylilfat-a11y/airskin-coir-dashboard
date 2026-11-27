import React from 'react';
import { ArrowRight, Fan, Wind } from 'lucide-react';

interface WorkingMechanismDiagramProps {
  animateFlow: boolean;
}

const LAPISAN_FILTER = [
  { nama: 'Nonwoven Depan', keterangan: 'Penyaring partikel awal', warna: '#429EDB', bg: '#EEF8FF' },
  { nama: 'Kapuk', keterangan: 'Media serat alami ringan', warna: '#D7B978', bg: '#FCF8EE' },
  { nama: 'Jerami Padi', keterangan: 'Media serat lignoselulosa', warna: '#72B89A', bg: '#EFF9F4' },
  { nama: 'Nonwoven Belakang', keterangan: 'Penahan akhir lapisan media', warna: '#429EDB', bg: '#EEF8FF' },
  { nama: 'Kipas AC', keterangan: 'Penggerak aliran udara', warna: '#103B66', bg: '#F2F6FA' },
];

export const WorkingMechanismDiagram: React.FC<WorkingMechanismDiagramProps> = ({
  animateFlow,
}) => {
  return (
    <div className="airskin-card p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-[#103B66]">
            Aliran Udara Melewati Lapisan Filter
          </h3>
          <p className="text-xs text-[#176FAF]/85">
            Nonwoven depan → Kapuk → Jerami padi → Nonwoven belakang → Kipas AC
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 text-xs font-mono text-[#103B66]/80">
          <span
            className={`w-2 h-2 rounded-full ${
              animateFlow ? 'bg-[#72B89A] animate-pulse' : 'bg-[#82C5EF]'
            }`}
          />
          {animateFlow ? 'Aliran Udara Aktif' : 'Aliran Siaga'}
        </span>
      </div>

      {/* Animasi Aliran Partikel & Panah */}
      <div className="rounded-xl border border-[#CBE7FA] bg-[#F5FAFF] px-4 py-3">
        <div className="flex items-center justify-between text-[11px] font-mono text-[#176FAF] mb-1">
          <span className="inline-flex items-center gap-1">
            <Wind className="w-3.5 h-3.5" /> Udara Masuk
          </span>
          <span className="inline-flex items-center gap-1 text-[#2F6F54]">
            <Fan className={`w-3.5 h-3.5 ${animateFlow ? 'animate-spin' : ''}`} /> Udara Keluar
          </span>
        </div>

        <svg viewBox="0 0 800 44" className="w-full h-11" aria-label="Animasi aliran udara melewati 5 lapisan filter">
          <line x1="12" y1="22" x2="778" y2="22" stroke="#B9E0F8" strokeWidth="3" strokeLinecap="round" />
          <line
            x1="12"
            y1="22"
            x2="778"
            y2="22"
            stroke="#429EDB"
            strokeWidth="3"
            strokeLinecap="round"
            className={animateFlow ? 'airflow-stream' : ''}
            strokeDasharray={animateFlow ? '8 8' : '2 6'}
          />
          <polygon points="778,15 794,22 778,29" fill="#72B89A" />

          {animateFlow && (
            <>
              <circle r="3.5" fill="#D7B978" cy="15">
                <animate attributeName="cx" values="20;280;420" dur="2.6s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="1;0.8;0.1" dur="2.6s" repeatCount="indefinite" />
              </circle>
              <circle r="2.6" fill="#176FAF" cy="28">
                <animate attributeName="cx" values="20;440;765" dur="2.3s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="1;0.65;0.25" dur="2.3s" repeatCount="indefinite" />
              </circle>
            </>
          )}
        </svg>
      </div>

      {/* 5 Lapisan Berurutan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        {LAPISAN_FILTER.map((item, idx) => (
          <div
            key={item.nama}
            className="rounded-xl p-3.5 border border-[#CFE8FA] flex flex-col justify-between"
            style={{ backgroundColor: item.bg }}
          >
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span
                className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded text-white"
                style={{ backgroundColor: item.warna }}
              >
                0{idx + 1}
              </span>
              {idx < LAPISAN_FILTER.length - 1 && (
                <ArrowRight className="w-3.5 h-3.5 text-[#429EDB] shrink-0" />
              )}
            </div>
            <p className="text-xs font-semibold text-[#103B66]">{item.nama}</p>
            <p className="text-[11px] text-[#103B66]/70 mt-1">{item.keterangan}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
