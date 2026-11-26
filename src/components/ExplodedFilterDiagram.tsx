import React, { useState } from 'react';
import { ArrowRight, Maximize2, X } from 'lucide-react';

interface FilterStage {
  id: string;
  order: number;
  title: string;
  description: string;
  material: string;
}

const PANEL_LAYERS: FilterStage[] = [
  {
    id: 'casing',
    order: 1,
    title: 'Casing Pelindung',
    description: 'Melindungi komponen filtrasi dari lingkungan luar, hujan, dan paparan sinar UV.',
    material: 'Aluminium Anodized + Seal EPDM',
  },
  {
    id: 'inlet',
    order: 2,
    title: 'Saluran Udara Masuk',
    description: 'Jalur masuk udara sekitar yang diarahkan menuju kisi louver depan.',
    material: 'Kisi Louver Tahan Cuaca + Sensor PMS5003 Masuk',
  },
  {
    id: 'nonwoven',
    order: 3,
    title: 'Lapisan Nonwoven',
    description: 'Lapisan penyaring awal untuk menahan partikel kasar, serbuk sari, dan debu jalanan.',
    material: 'Polipropilena Spunbond G3 (8 mm)',
  },
  {
    id: 'coir',
    order: 4,
    title: 'Media Serabut Kelapa',
    description: 'Media filtrasi partikulat utama berbahan alami yang sedang dikembangkan.',
    material: 'Serabut Kelapa Terkompresi (35 mm · 140 kg/m³)',
  },
  {
    id: 'mesh',
    order: 5,
    title: 'Jaring Penyangga',
    description: 'Menjaga kestabilan media filter agar tidak bergeser atau melengkung saat dialiri udara.',
    material: 'Kawat Baja Tahan Karat 304 Berlubang',
  },
  {
    id: 'fan',
    order: 6,
    title: 'Kipas DC',
    description: 'Membantu menarik udara melewati susunan media filtrasi secara terkendali.',
    material: 'Kipas Aksial Brushless 12V DC (4,8 W nominal)',
  },
  {
    id: 'outlet',
    order: 7,
    title: 'Saluran Udara Keluar',
    description: 'Jalur keluarnya udara setelah melewati seluruh lapisan sistem filtrasi.',
    material: 'Plenum Diffuser + Kanal Sensor Keluar (Opsional)',
  },
];

export const ExplodedFilterDiagram: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>('coir');
  const [zoomOpen, setZoomOpen] = useState(false);

  const activeStage = PANEL_LAYERS.find((s) => s.id === selectedId) || PANEL_LAYERS[3];

  const renderSvgDiagram = (compact: boolean) => (
    <svg
      viewBox="0 0 880 245"
      className={compact ? 'w-full min-w-[700px]' : 'w-full'}
      role="img"
      aria-label="Ilustrasi potongan susunan 7 komponen panel filtrasi AIRSKIN COIR"
    >
      {/* Casing Pelindung Terluar */}
      <rect
        x="48"
        y="24"
        width="780"
        height="182"
        rx="14"
        fill="#FFFFFF"
        stroke={selectedId === 'casing' ? '#176FAF' : '#B9E0F8'}
        strokeWidth={selectedId === 'casing' ? '2.8' : '1.5'}
        strokeDasharray="6 4"
        className="cursor-pointer"
        onClick={() => setSelectedId('casing')}
      />
      <text
        x="438"
        y="16"
        textAnchor="middle"
        className="fill-[#176FAF] font-mono text-[10px] font-semibold cursor-pointer"
        onClick={() => setSelectedId('casing')}
      >
        1. CASING PELINDUNG MODULAR
      </text>

      {/* Panah Aliran Udara Masuk */}
      <g stroke="#429EDB" strokeWidth="2" strokeLinecap="round">
        <line x1="10" y1="90" x2="46" y2="90" />
        <polyline points="39,85 46,90 39,95" fill="none" />
        <line x1="10" y1="118" x2="46" y2="118" />
        <polyline points="39,113 46,118 39,123" fill="none" />
        <line x1="10" y1="146" x2="46" y2="146" />
        <polyline points="39,141 46,146 39,151" fill="none" />
      </g>

      {/* Panah Aliran Udara Keluar */}
      <g stroke="#72B89A" strokeWidth="2.2" strokeLinecap="round">
        <line x1="828" y1="90" x2="868" y2="90" />
        <polyline points="861,85 868,90 861,95" fill="none" />
        <line x1="828" y1="118" x2="868" y2="118" />
        <polyline points="861,113 868,118 861,123" fill="none" />
        <line x1="828" y1="146" x2="868" y2="146" />
        <polyline points="861,141 868,146 861,151" fill="none" />
      </g>

      {/* Garis Sumbu Aliran */}
      <line x1="56" y1="118" x2="818" y2="118" stroke="#82C5EF" strokeWidth="1.2" strokeDasharray="4 4" />

      {/* 2. Saluran Udara Masuk */}
      <g className="cursor-pointer" onClick={() => setSelectedId('inlet')}>
        <polygon
          points="72,62 122,46 122,172 72,188"
          fill={selectedId === 'inlet' ? '#E1F2FD' : '#F5FAFF'}
          stroke={selectedId === 'inlet' ? '#176FAF' : '#82C5EF'}
          strokeWidth={selectedId === 'inlet' ? '2.5' : '1.5'}
        />
        {[78, 98, 118, 138, 158].map((y) => (
          <line key={y} x1="82" y1={y} x2="112" y2={y - 10} stroke="#429EDB" strokeWidth="2.5" />
        ))}
        <text x="97" y="226" textAnchor="middle" className="fill-[#103B66] font-mono text-[10px] font-semibold">
          2. UDARA MASUK
        </text>
      </g>

      {/* 3. Lapisan Nonwoven */}
      <g className="cursor-pointer" onClick={() => setSelectedId('nonwoven')}>
        <polygon
          points="192,62 242,46 242,172 192,188"
          fill="#FFFFFF"
          stroke={selectedId === 'nonwoven' ? '#176FAF' : '#82C5EF'}
          strokeWidth={selectedId === 'nonwoven' ? '2.5' : '1.5'}
        />
        <polygon
          points="200,70 234,58 234,164 200,176"
          fill="#EAF6FF"
          stroke="#B9E0F8"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
        <text x="217" y="226" textAnchor="middle" className="fill-[#103B66] font-mono text-[10px] font-semibold">
          3. NONWOVEN
        </text>
      </g>

      {/* 4. Media Serabut Kelapa */}
      <g className="cursor-pointer" onClick={() => setSelectedId('coir')}>
        <polygon
          points="312,58 380,40 380,174 312,192"
          fill="#F3E5C8"
          stroke={selectedId === 'coir' ? '#176FAF' : '#D7B978'}
          strokeWidth={selectedId === 'coir' ? '2.8' : '1.8'}
        />
        <path
          d="M322 76 L368 64 M322 94 L370 84 M322 112 L370 100 M322 130 L370 118 M322 148 L370 138 M322 166 L370 156"
          stroke="#B68E45"
          strokeWidth="1.5"
          strokeDasharray="6 3"
        />
        <text x="346" y="226" textAnchor="middle" className="fill-[#103B66] font-mono text-[10px] font-semibold">
          4. SERABUT KELAPA
        </text>
      </g>

      {/* 5. Jaring Penyangga */}
      <g className="cursor-pointer" onClick={() => setSelectedId('mesh')}>
        <polygon
          points="452,62 502,46 502,172 452,188"
          fill="#EAF2F8"
          stroke={selectedId === 'mesh' ? '#176FAF' : '#6488AA'}
          strokeWidth={selectedId === 'mesh' ? '2.5' : '1.5'}
        />
        {[72, 92, 112, 132, 152].map((y) => (
          <line key={y} x1="458" y1={y} x2="496" y2={y - 12} stroke="#4D789E" strokeWidth="1" />
        ))}
        {[466, 478, 490].map((x) => (
          <line key={x} x1={x} y1="58" x2={x} y2="176" stroke="#4D789E" strokeWidth="1" />
        ))}
        <text x="477" y="226" textAnchor="middle" className="fill-[#103B66] font-mono text-[10px] font-semibold">
          5. JARING PENYANGGA
        </text>
      </g>

      {/* 6. Kipas DC */}
      <g className="cursor-pointer" onClick={() => setSelectedId('fan')}>
        <polygon
          points="574,58 632,42 632,174 574,190"
          fill="#103B66"
          stroke={selectedId === 'fan' ? '#429EDB' : '#176FAF'}
          strokeWidth={selectedId === 'fan' ? '2.8' : '1.5'}
        />
        <ellipse cx="603" cy="116" rx="20" ry="34" fill="#176FAF" stroke="#82C5EF" strokeWidth="1.5" />
        <circle cx="603" cy="116" r="6" fill="#FFFFFF" />
        <path
          d="M603 87 L609 111 M603 145 L597 121 M585 111 L599 116 M621 121 L607 116"
          stroke="#EAF6FF"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <text x="603" y="226" textAnchor="middle" className="fill-[#103B66] font-mono text-[10px] font-semibold">
          6. KIPAS DC
        </text>
      </g>

      {/* 7. Saluran Udara Keluar */}
      <g className="cursor-pointer" onClick={() => setSelectedId('outlet')}>
        <polygon
          points="706,62 758,46 758,172 706,188"
          fill="#E8F6EF"
          stroke={selectedId === 'outlet' ? '#458B6D' : '#72B89A'}
          strokeWidth={selectedId === 'outlet' ? '2.5' : '1.5'}
        />
        {[78, 102, 126, 150].map((y) => (
          <line key={y} x1="716" y1={y} x2="748" y2={y - 10} stroke="#72B89A" strokeWidth="2.2" />
        ))}
        <text x="732" y="226" textAnchor="middle" className="fill-[#103B66] font-mono text-[10px] font-semibold">
          7. UDARA KELUAR
        </text>
      </g>
    </svg>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="font-[Poppins] text-sm font-semibold text-[#103B66]">
            Susunan Potongan Panel Filtrasi (7 Komponen Utama)
          </h4>
          <p className="text-xs text-[#103B66]/70">
            Klik komponen pada gambar atau tombol di bawah untuk melihat fungsi teknisnya.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setZoomOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#82C5EF] bg-white px-3 py-1.5 text-xs font-medium text-[#176FAF] hover:bg-[#EAF6FF] transition-colors whitespace-nowrap"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          Perbesar Ilustrasi Potongan
        </button>
      </div>

      {/* Diagram Aliran Udara */}
      <div className="rounded-xl border border-[#B9E0F8] bg-[#EAF6FF]/60 px-4 py-2.5 flex flex-wrap items-center gap-2 text-xs font-medium text-[#103B66]">
        <span className="font-semibold text-[#176FAF]">Diagram Aliran Udara:</span>
        <span>Udara Lingkungan</span>
        <ArrowRight className="w-3.5 h-3.5 text-[#429EDB]" />
        <span>Nonwoven</span>
        <ArrowRight className="w-3.5 h-3.5 text-[#429EDB]" />
        <span>Serabut Kelapa</span>
        <ArrowRight className="w-3.5 h-3.5 text-[#429EDB]" />
        <span>Kipas DC</span>
        <ArrowRight className="w-3.5 h-3.5 text-[#72B89A]" />
        <span className="font-semibold text-[#458B6D]">Udara Keluar</span>
      </div>

      {/* Ilustrasi Potongan Interaktif */}
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) setZoomOpen(true);
        }}
        className="overflow-x-auto rounded-2xl border border-[#B9E0F8] bg-[#F5FAFF] p-4"
      >
        {renderSvgDiagram(true)}
      </div>

      {/* Pilihan 7 Komponen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {PANEL_LAYERS.map((layer) => (
          <button
            key={layer.id}
            type="button"
            onClick={() => setSelectedId(layer.id)}
            className={`rounded-xl px-2.5 py-2 text-left text-xs transition-colors border ${
              selectedId === layer.id
                ? 'bg-[#176FAF] text-white border-[#176FAF]'
                : 'bg-white text-[#103B66] border-[#DCEEFB] hover:bg-[#EAF6FF]'
            }`}
          >
            <div className={`font-mono text-[10px] ${selectedId === layer.id ? 'text-[#B9E0F8]' : 'text-[#176FAF]'}`}>
              0{layer.order}
            </div>
            <div className="font-medium truncate">{layer.title}</div>
          </button>
        ))}
      </div>

      {/* Detail Komponen Terpilih */}
      <div className="rounded-xl border border-[#B9E0F8] bg-[#F5FAFF] px-4 py-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="font-[Poppins] text-sm font-semibold text-[#103B66]">
            {activeStage.order}. {activeStage.title}
          </div>
          <span className="font-mono text-xs text-[#176FAF]">{activeStage.material}</span>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-[#103B66]/80">{activeStage.description}</p>
      </div>

      {/* Modal Perbesar Ilustrasi */}
      {zoomOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#103B66]/65 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label="Tampilan diperbesar potongan panel filtrasi"
        >
          <div className="w-full max-w-5xl rounded-2xl border border-[#B9E0F8] bg-white p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between gap-4 border-b border-[#DCEEFB] pb-3">
              <div>
                <h3 className="font-[Poppins] text-base font-semibold text-[#103B66]">
                  Tampilan Detail Potongan Panel AIRSKIN COIR
                </h3>
                <p className="text-xs text-[#103B66]/70">
                  Udara Lingkungan → Nonwoven → Serabut Kelapa → Kipas DC → Udara Keluar
                </p>
              </div>
              <button
                type="button"
                onClick={() => setZoomOpen(false)}
                className="rounded-xl border border-[#B9E0F8] p-2 text-[#103B66] hover:bg-[#EAF6FF]"
                aria-label="Tutup tampilan diperbesar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="rounded-2xl border border-[#DCEEFB] bg-[#F5FAFF] p-4 overflow-x-auto">
              {renderSvgDiagram(false)}
            </div>
            <div className="rounded-xl border border-[#B9E0F8] bg-[#F5FAFF] p-4 text-xs text-[#103B66]">
              <strong>{activeStage.order}. {activeStage.title}:</strong> {activeStage.description} ({activeStage.material})
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
