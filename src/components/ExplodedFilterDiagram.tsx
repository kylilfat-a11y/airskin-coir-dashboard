import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';

interface FilterStage {
  id: string;
  order: number;
  title: string;
  shortLabel: string;
  material: string;
  role: string;
  accent: string;
}

const STAGES: FilterStage[] = [
  {
    id: 'inlet',
    order: 1,
    title: 'AIR INLET',
    shortLabel: 'Louver Intake',
    material: 'Anodized Aluminum Weather Louver + Inlet PMS5003 Node',
    role: 'Draws ambient urban exterior air while deflecting rain droplets and large debris.',
    accent: '#429EDB',
  },
  {
    id: 'nonwoven',
    order: 2,
    title: 'NONWOVEN',
    shortLabel: 'G3 Prefilter',
    material: 'Spunbond Polypropylene Nonwoven Sheet (8 mm)',
    role: 'Captures coarse street dust, pollen, and insects before air enters the bio-media bed.',
    accent: '#82C5EF',
  },
  {
    id: 'coir',
    order: 3,
    title: 'COCONUT COIR',
    shortLabel: 'Bio-Media Bed',
    material: 'Compressed Cocos nucifera Fibrous Matrix (35 mm, 140 kg/m³)',
    role: 'Tortuous natural fiber network traps fine PM2.5 and coarse PM10 particulates sustainably.',
    accent: '#D7B978',
  },
  {
    id: 'mesh',
    order: 4,
    title: 'SUPPORT MESH',
    shortLabel: 'Structural Grid',
    material: 'Stainless Steel 304 Perforated Support Frame',
    role: 'Maintains uniform coir compression and prevents fiber migration under airflow load.',
    accent: '#176FAF',
  },
  {
    id: 'fan',
    order: 5,
    title: 'DC FAN',
    shortLabel: '12V Axial Drive',
    material: 'Low-Noise Brushless 12V DC Axial Fan (PWM Controlled)',
    role: 'Draws air across the dual-stage cartridge at calibrated velocity (~4.8 W nominal draw).',
    accent: '#103B66',
  },
  {
    id: 'outlet',
    order: 6,
    title: 'AIR OUTLET',
    shortLabel: 'Filtered Diffuser',
    material: 'Interior/Facade Diffuser + Optional Outlet PM Channel',
    role: 'Delivers cleaner, particulate-reduced air into building intake plenums or facade zones.',
    accent: '#72B89A',
  },
];

export const ExplodedFilterDiagram: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>('coir');
  const activeStage = STAGES.find((s) => s.id === selectedId) || STAGES[2];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="font-[Poppins] text-sm font-semibold text-[#103B66]">
            Exploded-View Module Architecture
          </h4>
          <p className="text-xs text-[#103B66]/70">
            Select any layer to inspect its material specification and aerodynamic role.
          </p>
        </div>
        <div className="text-[11px] font-mono text-[#176FAF]">
          AIR INLET → NONWOVEN → COCONUT COIR → SUPPORT MESH → DC FAN → AIR OUTLET
        </div>
      </div>

      {/* Isometric Exploded SVG Stack */}
      <div className="overflow-x-auto rounded-2xl border border-[#B9E0F8] bg-[#F5FAFF] p-4">
        <svg
          viewBox="0 0 820 230"
          className="w-full min-w-[680px]"
          role="img"
          aria-label="Exploded architectural diagram of AIRSKIN COIR module layers"
        >
          {/* Ambient Airflow Arrows In */}
          <g stroke="#429EDB" strokeWidth="2" strokeLinecap="round">
            <line x1="16" y1="88" x2="54" y2="88" />
            <polyline points="47,83 54,88 47,93" fill="none" />
            <line x1="16" y1="115" x2="54" y2="115" />
            <polyline points="47,110 54,115 47,120" fill="none" />
            <line x1="16" y1="142" x2="54" y2="142" />
            <polyline points="47,137 54,142 47,147" fill="none" />
          </g>

          {/* Clean Airflow Arrows Out */}
          <g stroke="#72B89A" strokeWidth="2.2" strokeLinecap="round">
            <line x1="752" y1="88" x2="798" y2="88" />
            <polyline points="791,83 798,88 791,93" fill="none" />
            <line x1="752" y1="115" x2="798" y2="115" />
            <polyline points="791,110 798,115 791,120" fill="none" />
            <line x1="752" y1="142" x2="798" y2="142" />
            <polyline points="791,137 798,142 791,147" fill="none" />
          </g>

          {/* Center Axis Flow Guide */}
          <line
            x1="62"
            y1="115"
            x2="746"
            y2="115"
            stroke="#82C5EF"
            strokeWidth="1.2"
            strokeDasharray="4 4"
          />

          {/* Stage 1: Air Inlet */}
          <g
            className="cursor-pointer transition-opacity"
            onClick={() => setSelectedId('inlet')}
            opacity={selectedId === 'inlet' ? 1 : 0.85}
          >
            <polygon
              points="72,56 122,40 122,170 72,186"
              fill={selectedId === 'inlet' ? '#E1F2FD' : '#FFFFFF'}
              stroke={selectedId === 'inlet' ? '#176FAF' : '#82C5EF'}
              strokeWidth={selectedId === 'inlet' ? '2.5' : '1.5'}
            />
            {[72, 92, 112, 132, 152].map((y) => (
              <line key={y} x1="82" y1={y} x2="112" y2={y - 10} stroke="#429EDB" strokeWidth="2.5" />
            ))}
            <text x="97" y="208" textAnchor="middle" className="fill-[#103B66] font-mono text-[10px] font-semibold">
              1. AIR INLET
            </text>
          </g>

          {/* Stage 2: Nonwoven */}
          <g
            className="cursor-pointer"
            onClick={() => setSelectedId('nonwoven')}
            opacity={selectedId === 'nonwoven' ? 1 : 0.85}
          >
            <polygon
              points="182,56 232,40 232,170 182,186"
              fill="#FFFFFF"
              stroke={selectedId === 'nonwoven' ? '#176FAF' : '#82C5EF'}
              strokeWidth={selectedId === 'nonwoven' ? '2.5' : '1.5'}
            />
            <polygon
              points="190,64 224,52 224,162 190,174"
              fill="#EAF6FF"
              stroke="#B9E0F8"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <text x="207" y="208" textAnchor="middle" className="fill-[#103B66] font-mono text-[10px] font-semibold">
              2. NONWOVEN
            </text>
          </g>

          {/* Stage 3: Coconut Coir */}
          <g
            className="cursor-pointer"
            onClick={() => setSelectedId('coir')}
            opacity={selectedId === 'coir' ? 1 : 0.85}
          >
            <polygon
              points="292,54 358,36 358,172 292,190"
              fill="#F3E5C8"
              stroke={selectedId === 'coir' ? '#176FAF' : '#D7B978'}
              strokeWidth={selectedId === 'coir' ? '2.8' : '1.8'}
            />
            {/* Coir fiber hatch lines */}
            <path
              d="M302 72 L346 60 M302 90 L348 80 M302 108 L348 96 M302 126 L348 114 M302 144 L348 134 M302 162 L348 152"
              stroke="#B68E45"
              strokeWidth="1.4"
              strokeDasharray="6 3"
            />
            <text x="325" y="208" textAnchor="middle" className="fill-[#103B66] font-mono text-[10px] font-semibold">
              3. COCONUT COIR
            </text>
          </g>

          {/* Stage 4: Support Mesh */}
          <g
            className="cursor-pointer"
            onClick={() => setSelectedId('mesh')}
            opacity={selectedId === 'mesh' ? 1 : 0.85}
          >
            <polygon
              points="422,56 472,40 472,170 422,186"
              fill="#EAF2F8"
              stroke={selectedId === 'mesh' ? '#176FAF' : '#6488AA'}
              strokeWidth={selectedId === 'mesh' ? '2.5' : '1.5'}
            />
            {[68, 88, 108, 128, 148].map((y) => (
              <line key={y} x1="428" y1={y} x2="466" y2={y - 12} stroke="#4D789E" strokeWidth="1" />
            ))}
            {[436, 448, 460].map((x) => (
              <line key={x} x1={x} y1="54" x2={x} y2="174" stroke="#4D789E" strokeWidth="1" />
            ))}
            <text x="447" y="208" textAnchor="middle" className="fill-[#103B66] font-mono text-[10px] font-semibold">
              4. SUPPORT MESH
            </text>
          </g>

          {/* Stage 5: DC Fan */}
          <g
            className="cursor-pointer"
            onClick={() => setSelectedId('fan')}
            opacity={selectedId === 'fan' ? 1 : 0.85}
          >
            <polygon
              points="538,54 596,38 596,172 538,188"
              fill="#103B66"
              stroke={selectedId === 'fan' ? '#429EDB' : '#176FAF'}
              strokeWidth={selectedId === 'fan' ? '2.8' : '1.5'}
            />
            <ellipse cx="567" cy="113" rx="20" ry="34" fill="#176FAF" stroke="#82C5EF" strokeWidth="1.5" />
            <circle cx="567" cy="113" r="6" fill="#FFFFFF" />
            <path d="M567 84 L573 108 M567 142 L561 118 M549 108 L563 113 M585 118 L571 113" stroke="#EAF6FF" strokeWidth="2.5" strokeLinecap="round" />
            <text x="567" y="208" textAnchor="middle" className="fill-[#103B66] font-mono text-[10px] font-semibold">
              5. DC FAN
            </text>
          </g>

          {/* Stage 6: Air Outlet */}
          <g
            className="cursor-pointer"
            onClick={() => setSelectedId('outlet')}
            opacity={selectedId === 'outlet' ? 1 : 0.85}
          >
            <polygon
              points="666,56 718,40 718,170 666,186"
              fill="#E8F6EF"
              stroke={selectedId === 'outlet' ? '#458B6D' : '#72B89A'}
              strokeWidth={selectedId === 'outlet' ? '2.5' : '1.5'}
            />
            {[74, 98, 122, 146].map((y) => (
              <line key={y} x1="676" y1={y} x2="708" y2={y - 10} stroke="#72B89A" strokeWidth="2.2" />
            ))}
            <text x="692" y="208" textAnchor="middle" className="fill-[#103B66] font-mono text-[10px] font-semibold">
              6. AIR OUTLET
            </text>
          </g>
        </svg>
      </div>

      {/* Stage Selector Strip + Details */}
      <div className="flex flex-wrap items-center gap-1.5">
        {STAGES.map((stage, idx) => (
          <React.Fragment key={stage.id}>
            <button
              type="button"
              onClick={() => setSelectedId(stage.id)}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                selectedId === stage.id
                  ? 'bg-[#176FAF] text-white'
                  : 'bg-[#EAF6FF] text-[#103B66] hover:bg-[#B9E0F8]/70'
              }`}
            >
              {stage.order}. {stage.title}
            </button>
            {idx < STAGES.length - 1 && (
              <ArrowRight className="w-3.5 h-3.5 text-[#429EDB] shrink-0 hidden sm:block" />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="rounded-xl border border-[#B9E0F8] bg-[#F5FAFF] px-4 py-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="font-[Poppins] text-sm font-semibold text-[#103B66]">
            Stage 0{activeStage.order}: {activeStage.title} — {activeStage.shortLabel}
          </div>
          <span className="font-mono text-xs text-[#176FAF]">{activeStage.material}</span>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-[#103B66]/80">{activeStage.role}</p>
      </div>
    </div>
  );
};
