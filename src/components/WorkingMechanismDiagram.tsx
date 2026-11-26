import React, { useState } from 'react';
import { ArrowRight, Fan, Layers, Wind } from 'lucide-react';

export interface MechanismStage {
  id: string;
  order: number;
  name: string;
  roleTitle: string;
  description: string;
  materialNote: string;
  accentColor: string;
  bgTint: string;
}

const MECHANISM_STAGES: MechanismStage[] = [
  {
    id: 'ambient',
    order: 1,
    name: 'Ambient Air',
    roleTitle: 'Udara Luar Bangunan',
    description: 'Udara ambien yang membawa partikulat PM2.5 dan PM10 masuk menuju sisi depan modul fasad.',
    materialNote: 'Sisi Inlet Sensor',
    accentColor: '#176FAF',
    bgTint: '#EAF6FF',
  },
  {
    id: 'front-nonwoven',
    order: 2,
    name: 'Front Nonwoven',
    roleTitle: 'Pra-Filtrasi Awal',
    description: 'Lapisan penyaring awal untuk menahan partikel kasar dan menjaga distribusi aliran udara.',
    materialNote: 'Lapisan Nonwoven Depan',
    accentColor: '#429EDB',
    bgTint: '#EEF8FF',
  },
  {
    id: 'kapok-fiber',
    order: 3,
    name: 'Kapok Fiber',
    roleTitle: 'Media Serat Kapuk',
    description: 'Lapisan serat alami yang diuji sebagai media filtrasi tambahan dengan struktur berongga ringan.',
    materialNote: 'Serat Alami Kapuk',
    accentColor: '#D7B978',
    bgTint: '#FCF8EE',
  },
  {
    id: 'rice-straw',
    order: 4,
    name: 'Processed Rice Straw',
    roleTitle: 'Media Utama Jerami Padi',
    description:
      'Media utama berbasis serat jerami padi yang memiliki potensi filtrasi partikulat berdasarkan penelitian terdahulu.',
    materialNote: 'Serat Lignoselulosa Terolah',
    accentColor: '#72B89A',
    bgTint: '#EFF9F4',
  },
  {
    id: 'rear-nonwoven',
    order: 5,
    name: 'Rear Nonwoven',
    roleTitle: 'Penahan Lapisan Belakang',
    description: 'Lapisan penahan partikel dan pendukung susunan media agar serat tidak terlepas mengikuti aliran.',
    materialNote: 'Lapisan Nonwoven Belakang',
    accentColor: '#429EDB',
    bgTint: '#EEF8FF',
  },
  {
    id: 'support-mesh',
    order: 6,
    name: 'Support Mesh',
    roleTitle: 'Rangka Penyangga Media',
    description: 'Jaring penyangga struktur susunan media supaya ketebalan dan kerapatan tetap stabil terhadap tekanan udara.',
    materialNote: 'Struktur Penyangga Mekanik',
    accentColor: '#103B66',
    bgTint: '#F2F6FA',
  },
  {
    id: 'dc-fan',
    order: 7,
    name: 'DC Fan',
    roleTitle: 'Pendorong Aliran Udara',
    description: 'Membantu mengalirkan udara melewati media filtrasi dari sisi masuk menuju sisi keluar secara terkendali.',
    materialNote: 'Aktuator Aliran Udara',
    accentColor: '#176FAF',
    bgTint: '#EAF6FF',
  },
  {
    id: 'outlet',
    order: 8,
    name: 'Filtered Air Outlet',
    roleTitle: 'Keluaran Udara Terfiltrasi',
    description: 'Udara keluaran setelah melewati seluruh susunan media filtrasi untuk dipantau oleh sensor partikulat outlet.',
    materialNote: 'Sisi Outlet Sensor',
    accentColor: '#72B89A',
    bgTint: '#EFF9F4',
  },
];

interface WorkingMechanismDiagramProps {
  animateFlow: boolean;
  compact?: boolean;
}

export const WorkingMechanismDiagram: React.FC<WorkingMechanismDiagramProps> = ({
  animateFlow,
  compact = false,
}) => {
  const [selectedId, setSelectedId] = useState<string>('rice-straw');
  const selectedStage =
    MECHANISM_STAGES.find((stage) => stage.id === selectedId) || MECHANISM_STAGES[3];

  return (
    <div className="airskin-card p-5 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#176FAF]" />
            <h3 className="font-display text-base font-semibold text-[#103B66]">
              Diagram Alur Kerja Filtrasi AIRSKIN COIR
            </h3>
          </div>
          <p className="text-xs text-[#176FAF]/85 mt-0.5">
            Klik setiap komponen untuk meninjau fungsi lapisan pada susunan komposit kapuk, jerami padi, dan nonwoven.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span
            className={`w-2 h-2 rounded-full ${
              animateFlow ? 'bg-[#72B89A] animate-pulse' : 'bg-[#82C5EF]'
            }`}
          />
          <span className="text-[#103B66]/80">
            {animateFlow ? 'Aliran Udara Aktif' : 'Aliran Udara Siaga'}
          </span>
        </div>
      </div>

      {/* Animated SVG Airflow Conduit Header */}
      <div className="rounded-xl border border-[#CBE7FA] bg-[#F5FAFF] px-4 py-3">
        <div className="flex items-center justify-between text-[11px] font-mono text-[#176FAF] mb-1.5">
          <span className="inline-flex items-center gap-1">
            <Wind className="w-3.5 h-3.5" />
            AMBIENT INLET
          </span>
          <span className="hidden sm:inline text-[#103B66]/65">
            Susunan Komposit Bertingkat (8 Tahap Aliran)
          </span>
          <span className="inline-flex items-center gap-1 text-[#2F6F54]">
            <Fan className={`w-3.5 h-3.5 ${animateFlow ? 'animate-spin' : ''}`} />
            FILTERED OUTLET
          </span>
        </div>
        <svg viewBox="0 0 800 28" className="w-full h-7" aria-hidden="true">
          <line
            x1="8"
            y1="14"
            x2="784"
            y2="14"
            stroke="#B9E0F8"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            x1="8"
            y1="14"
            x2="784"
            y2="14"
            stroke="#429EDB"
            strokeWidth="3"
            strokeLinecap="round"
            className={animateFlow ? 'airflow-stream' : ''}
            strokeDasharray={animateFlow ? '8 8' : '2 6'}
          />
          <polygon points="784,8 796,14 784,20" fill="#72B89A" />
        </svg>
      </div>

      {/* 8-Stage Horizontal / Responsive Flow Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-2.5">
        {MECHANISM_STAGES.map((stage, idx) => {
          const isSelected = stage.id === selectedStage.id;
          return (
            <div key={stage.id} className="relative flex items-stretch">
              <button
                type="button"
                onClick={() => setSelectedId(stage.id)}
                className={`w-full text-left rounded-xl p-3 border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#176FAF] ring-2 ring-[#429EDB]/30 shadow-sm'
                    : 'border-[#CFE8FA] hover:border-[#429EDB]'
                }`}
                style={{ backgroundColor: stage.bgTint }}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span
                      className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded text-white"
                      style={{ backgroundColor: stage.accentColor }}
                    >
                      0{stage.order}
                    </span>
                    {idx < MECHANISM_STAGES.length - 1 && (
                      <ArrowRight
                        className={`w-3.5 h-3.5 shrink-0 ${
                          animateFlow ? 'text-[#176FAF] translate-x-0.5' : 'text-[#82C5EF]'
                        } transition-transform`}
                      />
                    )}
                  </div>
                  <p className="font-display text-xs font-semibold text-[#103B66] leading-snug">
                    {stage.name}
                  </p>
                </div>
                <p className="text-[11px] text-[#103B66]/70 mt-2 leading-tight">
                  {stage.roleTitle}
                </p>
              </button>
            </div>
          );
        })}
      </div>

      {/* Selected Component Detail */}
      {!compact && (
        <div className="rounded-xl border border-[#B9E0F8] bg-[#EAF6FF]/65 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded text-white"
                style={{ backgroundColor: selectedStage.accentColor }}
              >
                Tahap 0{selectedStage.order}
              </span>
              <h4 className="font-display text-sm font-semibold text-[#103B66]">
                {selectedStage.name} — {selectedStage.roleTitle}
              </h4>
            </div>
            <p className="text-sm text-[#103B66]/85 leading-relaxed">
              {selectedStage.description}
            </p>
          </div>
          <div className="shrink-0 rounded-lg border border-[#B9E0F8] bg-white px-3.5 py-2.5 text-xs">
            <span className="text-[#103B66]/60 block">Klasifikasi Komponen</span>
            <span className="font-medium text-[#176FAF]">{selectedStage.materialNote}</span>
          </div>
        </div>
      )}
    </div>
  );
};
