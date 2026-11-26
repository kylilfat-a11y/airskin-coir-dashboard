import React, { useState } from 'react';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Droplets,
  Plus,
  RefreshCw,
} from 'lucide-react';
import type { MaintenanceStatus, SystemStatePayload } from '../types/airskin';

interface MaintenancePageProps {
  state: SystemStatePayload;
  onAddRecord: (record: {
    panelId: string;
    inspector: string;
    recordType: 'Routine Inspection' | 'Cartridge Replacement' | 'Moisture & Frame Audit';
    moistureLevelPct: number;
    visibleDamage: boolean;
    dustLoadingNote: string;
    status: MaintenanceStatus;
    notes: string;
  }) => Promise<void>;
}

export const MaintenancePage: React.FC<MaintenancePageProps> = ({ state, onAddRecord }) => {
  const { maintenance, panels } = state;
  const [panelId, setPanelId] = useState('AC-01');
  const [inspector, setInspector] = useState('Kaylilla Faticha');
  const [recordType, setRecordType] = useState<
    'Routine Inspection' | 'Cartridge Replacement' | 'Moisture & Frame Audit'
  >('Routine Inspection');
  const [moistureLevelPct, setMoistureLevelPct] = useState('12.0');
  const [visibleDamage, setVisibleDamage] = useState(false);
  const [dustLoadingNote, setDustLoadingNote] = useState('');
  const [status, setStatus] = useState<MaintenanceStatus>('Good Condition');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onAddRecord({
        panelId,
        inspector,
        recordType,
        moistureLevelPct: Number(moistureLevelPct),
        visibleDamage,
        dustLoadingNote,
        status,
        notes,
      });
      setDustLoadingNote('');
      setNotes('');
    } finally {
      setSubmitting(false);
    }
  }

  function renderStatusBadge(st: MaintenanceStatus) {
    if (st === 'Good Condition') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#458B6D]">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          Good Condition
        </span>
      );
    }
    if (st === 'Inspection Required') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A68338]">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          Inspection Required
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C2410C]">
        <RefreshCw className="w-3.5 h-3.5 shrink-0" />
        Replacement Recommended
      </span>
    );
  }

  const replacements = maintenance.filter((m) => m.recordType === 'Cartridge Replacement');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[Poppins] text-2xl sm:text-3xl font-semibold tracking-tight text-[#103B66]">
          Filter Maintenance
        </h1>
        <p className="mt-1 text-sm text-[#103B66]/75">
          Physical inspection schedule, moisture & fiber integrity tracking, and cartridge replacement records.
        </p>
      </div>

      {/* Scientific Governance Banner */}
      <div className="rounded-xl border border-[#82C5EF] bg-[#F5FAFF] px-4 py-3 text-xs text-[#103B66]">
        <strong>Inspection-Based Maintenance Protocol:</strong> Cartridge condition and replacement recommendations are governed by recorded physical inspections (moisture level, fiber integrity, and visible dust loading) — never automatically inferred from PM sensor data alone.
      </div>

      {/* Cartridge Showcase + Inspection Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Visual Illustration of Removable Coconut Coir Filter Cartridge */}
        <section className="lg:col-span-5 airskin-card overflow-hidden flex flex-col">
          <div className="aspect-4/3 bg-[#F5FAFF] overflow-hidden">
            <img
              src="/src/assets/images/coir_cartridge_module_1795694950650.jpg"
              alt="Removable AIRSKIN COIR modular coconut coir filter cartridge in anodized aluminum frame"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-5 space-y-2 flex-1">
            <div className="font-[Poppins] text-sm font-semibold text-[#103B66]">
              Removable Coconut Coir Filter Cartridge
            </div>
            <p className="text-xs leading-relaxed text-[#103B66]/75">
              Slide-out anodized cassette housing the 8 mm spunbond G3 prefilter and 35 mm compressed coconut coir media bed. Inspect perimeter silicone gaskets and moisture content every 30 days.
            </p>
            <div className="pt-2 border-t border-[#DCEEFB] grid grid-cols-2 gap-2 text-[11px] text-[#103B66]/80">
              <div>Safe Moisture: &lt; 15% RH eq.</div>
              <div>Nominal Service Cycle: 90 days</div>
            </div>
          </div>
        </section>

        {/* Inspection Schedule & Reminders */}
        <section className="lg:col-span-7 airskin-card p-6 flex flex-col justify-between gap-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 border-b border-[#DCEEFB] pb-3">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-[#176FAF]" />
                <h2 className="font-[Poppins] text-base font-semibold text-[#103B66]">
                  Panel Inspection Schedule & Reminders
                </h2>
              </div>
              <span className="text-xs text-[#103B66]/65">30-day physical audit cadence</span>
            </div>

            <div className="divide-y divide-[#EAF6FF]">
              {panels.map((panel) => (
                <div
                  key={panel.id}
                  className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-semibold text-[#103B66]">
                      {panel.label} · <span className="font-normal text-[#103B66]/75">{panel.location}</span>
                    </div>
                    <div className="mt-0.5 font-mono text-[11px] text-[#103B66]/65">
                      Last audit: {panel.lastMaintenanceDate} · {panel.classification}
                    </div>
                  </div>
                  {renderStatusBadge(panel.inspectionStatus)}
                </div>
              ))}
            </div>
          </div>

          {/* Cartridge Replacement History Summary */}
          <div className="rounded-xl border border-[#DCEEFB] bg-[#F5FAFF] p-4 space-y-2">
            <div className="text-xs font-semibold text-[#176FAF]">Cartridge Replacement History</div>
            {replacements.length === 0 ? (
              <p className="text-xs text-[#103B66]/65">No cartridge replacements logged yet.</p>
            ) : (
              <ul className="space-y-1.5 text-xs text-[#103B66]/85">
                {replacements.slice(0, 3).map((rep) => (
                  <li key={rep.id} className="flex flex-wrap items-center justify-between gap-2">
                    <span>
                      <strong className="font-mono">{rep.panelId}</strong> — {rep.notes || rep.dustLoadingNote}
                    </span>
                    <span className="font-mono text-[11px] text-[#103B66]/65">{rep.date}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      {/* Log Moisture & Visible-Damage Inspection Form */}
      <section className="airskin-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Plus className="w-4 h-4 text-[#176FAF]" />
          <h2 className="font-[Poppins] text-base font-semibold text-[#103B66]">
            Log Physical Inspection or Cartridge Replacement
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <label className="text-xs text-[#103B66]">
              <span className="font-medium">Facade Panel</span>
              <select
                value={panelId}
                onChange={(e) => setPanelId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#B9E0F8] bg-white px-3 py-2 text-xs"
              >
                {panels.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label} ({p.facadeZone})
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs text-[#103B66]">
              <span className="font-medium">Record Type</span>
              <select
                value={recordType}
                onChange={(e) =>
                  setRecordType(
                    e.target.value as
                      | 'Routine Inspection'
                      | 'Cartridge Replacement'
                      | 'Moisture & Frame Audit',
                  )
                }
                className="mt-1 w-full rounded-xl border border-[#B9E0F8] bg-white px-3 py-2 text-xs"
              >
                <option value="Routine Inspection">Routine Inspection</option>
                <option value="Moisture & Frame Audit">Moisture & Frame Audit</option>
                <option value="Cartridge Replacement">Cartridge Replacement</option>
              </select>
            </label>

            <label className="text-xs text-[#103B66]">
              <span className="font-medium">Coir Moisture (%)</span>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                required
                value={moistureLevelPct}
                onChange={(e) => setMoistureLevelPct(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#B9E0F8] bg-white px-3 py-2 font-mono text-xs"
              />
            </label>

            <label className="text-xs text-[#103B66]">
              <span className="font-medium">Validated Status</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as MaintenanceStatus)}
                className="mt-1 w-full rounded-xl border border-[#B9E0F8] bg-white px-3 py-2 text-xs"
              >
                <option value="Good Condition">Good Condition</option>
                <option value="Inspection Required">Inspection Required</option>
                <option value="Replacement Recommended">Replacement Recommended</option>
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
            <label className="text-xs text-[#103B66]">
              <span className="font-medium">Inspector Name</span>
              <input
                type="text"
                required
                value={inspector}
                onChange={(e) => setInspector(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#B9E0F8] bg-white px-3 py-2 text-xs"
              />
            </label>
            <label className="text-xs text-[#103B66]">
              <span className="font-medium">Dust Loading Observation</span>
              <input
                type="text"
                placeholder="e.g., Moderate surface dust on G3 prefilter"
                value={dustLoadingNote}
                onChange={(e) => setDustLoadingNote(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#B9E0F8] bg-white px-3 py-2 text-xs"
              />
            </label>
            <label className="flex items-center gap-2 pt-5 text-xs text-[#103B66] cursor-pointer">
              <input
                type="checkbox"
                checked={visibleDamage}
                onChange={(e) => setVisibleDamage(e.target.checked)}
                className="h-4 w-4 rounded border-[#82C5EF] text-[#176FAF]"
              />
              <span>Visible frame, gasket, or fiber damage observed</span>
            </label>
          </div>

          <label className="block text-xs text-[#103B66]">
            <span className="font-medium">Inspection Notes</span>
            <input
              type="text"
              placeholder="Document seal condition, odor/mold check, or corrective actions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#B9E0F8] bg-white px-3 py-2 text-xs"
            />
          </label>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-[#176FAF] px-5 py-2.5 text-xs font-medium text-white hover:bg-[#103B66] transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving Record...' : 'Record Inspection'}
            </button>
          </div>
        </form>
      </section>

      {/* Panel Inspection Records Table */}
      <section className="airskin-card overflow-hidden">
        <div className="border-b border-[#DCEEFB] px-6 py-4 flex items-center gap-2">
          <ClipboardCheck className="w-4 h-4 text-[#176FAF]" />
          <h2 className="font-[Poppins] text-base font-semibold text-[#103B66]">
            Recorded Panel Inspection Log
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5FAFF] text-[#103B66]/70 border-b border-[#DCEEFB]">
              <tr>
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold">Panel</th>
                <th className="px-5 py-3 font-semibold">Type</th>
                <th className="px-5 py-3 font-semibold text-right">Moisture</th>
                <th className="px-5 py-3 font-semibold">Damage</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAF6FF]">
              {maintenance.map((rec) => (
                <tr key={rec.id} className="hover:bg-[#F5FAFF]/70">
                  <td className="px-5 py-3 font-mono tabular-nums text-[#103B66] whitespace-nowrap">
                    {rec.date}
                  </td>
                  <td className="px-5 py-3 font-mono font-semibold text-[#176FAF] whitespace-nowrap">
                    {rec.panelId}
                  </td>
                  <td className="px-5 py-3 text-[#103B66] whitespace-nowrap">{rec.recordType}</td>
                  <td className="px-5 py-3 font-mono tabular-nums text-right text-[#103B66]">
                    <span className="inline-flex items-center gap-1">
                      <Droplets className="w-3 h-3 text-[#429EDB]" />
                      {rec.moistureLevelPct.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[#103B66]">
                    {rec.visibleDamage ? 'Yes (Flagged)' : 'None'}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">{renderStatusBadge(rec.status)}</td>
                  <td className="px-5 py-3 text-[#103B66]/80 max-w-xs">
                    {rec.dustLoadingNote} {rec.notes ? `— ${rec.notes}` : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
