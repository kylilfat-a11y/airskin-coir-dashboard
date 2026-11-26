import React, { useState } from 'react';
import { AlertTriangle, Building2, CheckCircle2, Fan, Layers, WifiOff } from 'lucide-react';
import type { FacadePanel, SystemStatePayload } from '../types/airskin';
import { ExplodedFilterDiagram } from '../components/ExplodedFilterDiagram';
import { FutureBuildingNetwork } from '../components/FutureBuildingNetwork';

interface FacadePanelsPageProps {
  state: SystemStatePayload;
}

export const FacadePanelsPage: React.FC<FacadePanelsPageProps> = ({ state }) => {
  const { panels, telemetry, config } = state;
  const [selectedId, setSelectedId] = useState<string>(panels[0]?.id || 'AC-01');

  const activePanel: FacadePanel = panels.find((p) => p.id === selectedId) || panels[0];
  const latest = telemetry.length > 0 ? telemetry[telemetry.length - 1] : null;
  const scale = config.measurementUnit === 'mg/m³' ? 0.001 : 1;
  const dec = config.measurementUnit === 'mg/m³' ? 3 : 1;

  function renderStatusIndicator(status: FacadePanel['status']) {
    if (status === 'Connected') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#458B6D]">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          Connected
        </span>
      );
    }
    if (status === 'Needs Inspection') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A68338]">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          Needs Inspection
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B]">
        <WifiOff className="w-3.5 h-3.5 shrink-0" />
        Offline
      </span>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-[Poppins] text-2xl sm:text-3xl font-semibold tracking-tight text-[#103B66]">
            Smart Facade Management
          </h1>
          <p className="mt-1 text-sm text-[#103B66]/75">
            Architectural module registry, facade zone placement, and layered filtration diagnostics.
          </p>
        </div>
        <div className="text-xs text-[#176FAF] font-medium">
          1 Active Prototype Bay (AC-01) · 3 Demo Panels / Planned Modules
        </div>
      </div>

      {/* 3D Architectural Visualization + Selectable Panel List */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* 3D Isometric Building Visualization */}
        <section className="xl:col-span-7 airskin-card overflow-hidden flex flex-col">
          <div className="border-b border-[#DCEEFB] px-5 py-3.5 flex flex-wrap items-center justify-between gap-2 bg-[#F5FAFF]">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#103B66]">
              <Building2 className="w-4 h-4 text-[#176FAF]" />
              <span>3D Facade Integration Layout</span>
            </div>
            <span className="text-[11px] text-[#103B66]/70">
              Click any modular pin on the building exterior to inspect
            </span>
          </div>

          <div className="relative flex-1 min-h-[320px] bg-[#EAF6FF]">
            <img
              src="/src/assets/images/facade_3d_isometric_1795694950809.jpg"
              alt="3D isometric building showing AIRSKIN COIR modular filtration panels attached to curtain wall sections"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            {/* Interactive Module Hotspots */}
            {panels.map((panel) => {
              const isSelected = panel.id === activePanel.id;
              const statusColor =
                panel.status === 'Connected'
                  ? 'bg-[#72B89A] border-white text-[#103B66]'
                  : panel.status === 'Needs Inspection'
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
                  aria-label={`Select ${panel.label} at ${panel.location}`}
                >
                  {panel.id}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="border-t border-[#DCEEFB] px-5 py-3 flex flex-wrap items-center justify-between gap-4 text-xs text-[#103B66]/80 bg-white">
            <div className="flex flex-wrap items-center gap-5">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#72B89A]" /> Connected
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#D7B978]" /> Needs Inspection
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#64748B]" /> Offline
              </span>
            </div>
            <span className="text-[11px] text-[#103B66]/60">
              AC-02, AC-03, AC-04 represent planned facade modules
            </span>
          </div>
        </section>

        {/* Panel Identification Cards */}
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
                  {renderStatusIndicator(panel.status)}
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#DCEEFB] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#103B66]/70">
                  <span>
                    PM Monitoring:{' '}
                    <strong className="text-[#103B66]">
                      {panel.pmMonitoringAvailable ? 'Available' : 'Planned'}
                    </strong>
                  </span>
                  <span>
                    Inspection:{' '}
                    <strong className="text-[#103B66]">{panel.inspectionStatus}</strong>
                  </span>
                </div>
              </button>
            );
          })}
        </section>
      </div>

      {/* Selected Panel Detailed View + Exploded Diagram */}
      <section className="airskin-card p-6 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#DCEEFB] pb-4">
          <div>
            <div className="text-xs font-medium text-[#176FAF]">
              Selected Module Specification · {activePanel.classification}
            </div>
            <h2 className="mt-0.5 font-[Poppins] text-xl font-semibold text-[#103B66]">
              {activePanel.label} — {activePanel.location}
            </h2>
          </div>
          {renderStatusIndicator(activePanel.status)}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="rounded-xl border border-[#DCEEFB] bg-[#F5FAFF] p-4 space-y-1">
            <div className="text-xs font-medium text-[#103B66]/65">Filter Cartridge Condition</div>
            <div className="text-sm font-semibold text-[#103B66]">{activePanel.inspectionStatus}</div>
            <div className="text-xs text-[#103B66]/75">{activePanel.cartridgeCondition}</div>
          </div>

          <div className="rounded-xl border border-[#DCEEFB] bg-[#F5FAFF] p-4 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#103B66]/65">
              <Layers className="w-3.5 h-3.5 text-[#D7B978]" />
              Coconut Coir & Prefilter Media
            </div>
            <div className="text-xs font-semibold text-[#103B66]">{activePanel.coirMediaSpec}</div>
            <div className="text-xs text-[#103B66]/75">{activePanel.nonwovenPrefilterSpec}</div>
          </div>

          <div className="rounded-xl border border-[#DCEEFB] bg-[#F5FAFF] p-4 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#103B66]/65">
              <Fan className="w-3.5 h-3.5 text-[#176FAF]" />
              DC Fan & Maintenance Date
            </div>
            <div className="text-xs font-semibold text-[#103B66]">{activePanel.fanStatus}</div>
            <div className="font-mono text-xs text-[#103B66]/75">
              Last maintenance: {activePanel.lastMaintenanceDate}
            </div>
          </div>

          <div className="rounded-xl border border-[#DCEEFB] bg-[#F5FAFF] p-4 space-y-1">
            <div className="text-xs font-medium text-[#103B66]/65">PM Inlet / Outlet Readout</div>
            {activePanel.pmMonitoringAvailable && latest ? (
              <div className="space-y-1 font-mono tabular-nums text-xs">
                <div className="text-[#176FAF] font-semibold">
                  Inlet PM2.5: {latest.pm25Inlet !== null ? (latest.pm25Inlet * scale).toFixed(dec) : '--'} {config.measurementUnit}
                </div>
                <div className="text-[#458B6D] font-semibold">
                  Outlet PM2.5:{' '}
                  {config.hasOutletSensor && latest.pm25Outlet !== null
                    ? `${(latest.pm25Outlet * scale).toFixed(dec)} ${config.measurementUnit}`
                    : 'Not installed'}
                </div>
              </div>
            ) : (
              <div className="text-xs text-[#103B66]/65">
                {activePanel.pmMonitoringAvailable
                  ? 'Awaiting Test Data'
                  : 'Planned module · Hardware not deployed'}
              </div>
            )}
          </div>
        </div>

        <ExplodedFilterDiagram />
      </section>

      {/* Future Smart Building Network */}
      <FutureBuildingNetwork />
    </div>
  );
};
