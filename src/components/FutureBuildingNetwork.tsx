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
    zone: 'North-West Lower Bay',
    elevation: 'Level 2',
    purpose: 'Street-canyon particulate capture near pedestrian plaza',
    telemetryScope: 'PM2.5/PM10 Inlet-Outlet · Active Prototype Bay',
  },
  {
    id: 'AC-02',
    zone: 'North-West Upper Bay',
    elevation: 'Level 5',
    purpose: 'Mid-rise facade windward air scrubbing',
    telemetryScope: 'Planned Multi-Node ESP32 Mesh · Differential Pressure',
  },
  {
    id: 'AC-03',
    zone: 'East Corridor Curtain Wall',
    elevation: 'Level 3',
    purpose: 'Morning thermal-draft filtration & moisture profiling',
    telemetryScope: 'Planned Humidity + PM2.5 Array + Maintenance Alerts',
  },
  {
    id: 'AC-04',
    zone: 'Upper Atrium Louver',
    elevation: 'Level 6',
    purpose: 'Fresh intake pre-conditioning for rooftop HVAC intake',
    telemetryScope: 'Planned Building-Level Optimization Loop',
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
      <div className="border-b border-[#DCEEFB] bg-[#F5FAFF] px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-xs font-medium text-[#176FAF]">
          <Network className="w-4 h-4 shrink-0" />
          <span>Future Development Concept — Multi-Panel IoT Integration</span>
        </div>
        <span className="text-xs text-[#103B66]/70">
          Architectural Roadmap · Not Currently Implemented
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
        <div className="lg:col-span-6 relative min-h-[260px] bg-[#103B66]">
          <img
            src="/src/assets/images/future_smart_building_1795694951121.jpg"
            alt="Future smart building facade network with interconnected coconut coir filtration panels"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#103B66]/85 via-[#103B66]/20 to-transparent" />
          <div className="absolute bottom-5 left-5 right-5 text-white">
            <h3
              id="future-network-heading"
              className="font-[Poppins] text-xl font-semibold leading-snug text-balance"
            >
              From One Filtration Panel to a Connected Smart Building.
            </h3>
            <p className="mt-1.5 text-xs text-[#EAF6FF]/85 leading-relaxed">
              Concept architecture illustrating how distributed AIRSKIN COIR facade modules will synchronize particulate telemetry, historical efficiency trends, and inspection schedules across a single building-wide hub.
            </p>
          </div>
        </div>

        <div className="lg:col-span-6 p-6 flex flex-col justify-between gap-5">
          <div>
            <div className="text-xs font-semibold text-[#176FAF] mb-3">
              Planned Building-Wide Facade Topology
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
                Concept Node: {activeNode.id} · {activeNode.zone}
              </span>
              <span className="text-[11px] font-mono text-[#176FAF]">{activeNode.elevation}</span>
            </div>
            <p className="text-xs text-[#103B66]/80">{activeNode.purpose}</p>
            <div className="pt-2 border-t border-[#DCEEFB] flex flex-wrap items-center gap-4 text-[11px] text-[#103B66]/75">
              <span className="inline-flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#429EDB]" />
                {activeNode.telemetryScope}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-1 border-t border-[#DCEEFB] text-xs">
            <div className="flex items-start gap-2">
              <Building2 className="w-4 h-4 text-[#429EDB] shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-[#103B66]">Centralized View</div>
                <div className="text-[11px] text-[#103B66]/65">Building-level PM map</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Network className="w-4 h-4 text-[#72B89A] shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-[#103B66]">Zone Comparison</div>
                <div className="text-[11px] text-[#103B66]/65">Historical panel logs</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-[#D7B978] shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-[#103B66]">Maintenance Alerts</div>
                <div className="text-[11px] text-[#103B66]/65">Inspection scheduling</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
