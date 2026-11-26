import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  History,
  Plus,
  RefreshCw,
} from 'lucide-react';
import type { MaintenanceStatus, SystemStatePayload } from '../types/airskin';

interface MaintenancePageProps {
  state: SystemStatePayload;
  onAddRecord: (record: {
    panelId: string;
    inspector: string;
    recordType: 'Pemeriksaan Rutin' | 'Penggantian Media' | 'Audit Kelembapan & Casing';
    coirCondition: string;
    nonwovenCondition: string;
    status: MaintenanceStatus;
    notes: string;
  }) => Promise<void>;
}

export const MaintenancePage: React.FC<MaintenancePageProps> = ({ state, onAddRecord }) => {
  const { maintenance, panels } = state;
  const historyRef = useRef<HTMLElement | null>(null);

  const [panelId, setPanelId] = useState('AC-01');
  const [inspector, setInspector] = useState('Kaylilla Faticha');
  const [recordType, setRecordType] = useState<
    'Pemeriksaan Rutin' | 'Penggantian Media' | 'Audit Kelembapan & Casing'
  >('Pemeriksaan Rutin');
  const [coirCondition, setCoirCondition] = useState('Serabut kelapa kering & utuh');
  const [nonwovenCondition, setNonwovenCondition] = useState('Lapisan nonwoven bersih dari sobekan');
  const [status, setStatus] = useState<MaintenanceStatus>('Kondisi Baik');
  const [notes, setNotes] = useState('');
  const [formVisible, setFormVisible] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const activePanel = panels.find((p) => p.id === panelId) || panels[0];
  const replacements = maintenance.filter((m) => m.recordType === 'Penggantian Media');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onAddRecord({
        panelId,
        inspector,
        recordType,
        coirCondition,
        nonwovenCondition,
        status,
        notes,
      });
      setNotes('');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleQuickMarkInspected() {
    setSubmitting(true);
    try {
      await onAddRecord({
        panelId,
        inspector,
        recordType: 'Pemeriksaan Rutin',
        coirCondition: 'Telah diperiksa secara fisik: serat utuh dan tidak lembap.',
        nonwovenCondition: 'Telah diperiksa secara fisik: lapisan awal bersih.',
        status: 'Kondisi Baik',
        notes: 'Ditandai telah diperiksa langsung melalui modul Pemeliharaan Filter.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  function renderStatusBadge(st: MaintenanceStatus) {
    if (st === 'Kondisi Baik') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#458B6D]">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          Kondisi Baik
        </span>
      );
    }
    if (st === 'Perlu Pemeriksaan') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A68338]">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          Perlu Pemeriksaan
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C2410C]">
        <RefreshCw className="w-3.5 h-3.5 shrink-0" />
        Perlu Pembersihan / Penggantian
      </span>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-[Poppins] text-2xl sm:text-3xl font-semibold tracking-tight text-[#103B66]">
            Pemeliharaan dan Kondisi Filter
          </h1>
          <p className="mt-1 text-sm text-[#103B66]/75">
            Pantau kondisi fisik media serabut kelapa, lapisan nonwoven, jadwal pemeriksaan, dan riwayat penggantian.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFormVisible(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#176FAF] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#103B66] whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah Catatan Pemeliharaan
          </button>
          <button
            type="button"
            onClick={handleQuickMarkInspected}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#72B89A] bg-white px-3.5 py-2 text-xs font-medium text-[#458B6D] hover:bg-[#E8F6EF] whitespace-nowrap"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Tandai Filter Telah Diperiksa
          </button>
          <button
            type="button"
            onClick={() => historyRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#B9E0F8] bg-white px-3.5 py-2 text-xs font-medium text-[#103B66] hover:bg-[#EAF6FF] whitespace-nowrap"
          >
            <History className="w-3.5 h-3.5 text-[#176FAF]" />
            Lihat Riwayat
          </button>
        </div>
      </div>

      {/* Prinsip Inspeksi Fisik */}
      <div className="rounded-xl border border-[#82C5EF] bg-[#F5FAFF] px-4 py-3 text-xs text-[#103B66]">
        <strong>Protokol Pemeliharaan Terverifikasi:</strong> Status penggantian media filter tidak disimpulkan dari angka yang tidak terukur. Seluruh keputusan pemeliharaan didasarkan pada hasil inspeksi fisik tercatat.
      </div>

      {/* Kondisi Media & Ilustrasi Kartrid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <section className="lg:col-span-5 airskin-card overflow-hidden flex flex-col">
          <div className="aspect-4/3 bg-[#F5FAFF] overflow-hidden">
            <img
              src="/src/assets/images/coir_cartridge_module_1795694950650.jpg"
              alt="Modul kartrid media serabut kelapa dan lapisan nonwoven AIRSKIN COIR"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-5 space-y-3 flex-1">
            <div className="font-[Poppins] text-sm font-semibold text-[#103B66]">
              Kondisi Terakhir {activePanel.label}
            </div>
            <div className="space-y-2 text-xs">
              <div className="rounded-xl border border-[#DCEEFB] bg-[#F5FAFF] p-3">
                <div className="text-[#103B66]/65">Kondisi Media Serabut Kelapa</div>
                <div className="mt-0.5 font-semibold text-[#103B66]">{activePanel.coirCondition}</div>
              </div>
              <div className="rounded-xl border border-[#DCEEFB] bg-[#F5FAFF] p-3">
                <div className="text-[#103B66]/65">Kondisi Lapisan Nonwoven</div>
                <div className="mt-0.5 font-semibold text-[#103B66]">
                  {activePanel.nonwovenCondition}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="lg:col-span-7 airskin-card p-6 flex flex-col justify-between gap-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#DCEEFB] pb-3">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-[#176FAF]" />
                <h2 className="font-[Poppins] text-base font-semibold text-[#103B66]">
                  Jadwal Pemeriksaan Panel
                </h2>
              </div>
              <span className="text-xs text-[#103B66]/65">Siklus pemeriksaan fisik berkala</span>
            </div>

            <div className="divide-y divide-[#EAF6FF] text-xs">
              {panels.map((p) => (
                <div key={p.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-[#103B66]">
                      {p.label} · <span className="font-normal text-[#103B66]/75">{p.location}</span>
                    </div>
                    <div className="font-mono text-[11px] text-[#103B66]/65">
                      Pemeriksaan terakhir: {p.lastMaintenanceDate}
                    </div>
                  </div>
                  {renderStatusBadge(p.inspectionStatus)}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[#DCEEFB] bg-[#F5FAFF] p-4 space-y-2">
            <div className="text-xs font-semibold text-[#176FAF]">Riwayat Penggantian Media</div>
            {replacements.length === 0 ? (
              <p className="text-xs text-[#103B66]/65">Belum ada penggantian media tercatat.</p>
            ) : (
              <ul className="space-y-1.5 text-xs text-[#103B66]/85">
                {replacements.map((rep) => (
                  <li key={rep.id} className="flex flex-wrap items-center justify-between gap-2">
                    <span>
                      <strong className="font-mono">{rep.panelId}</strong> — {rep.coirCondition}
                    </span>
                    <span className="font-mono text-[11px] text-[#103B66]/65">{rep.date}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      {/* Form Catatan Pemeliharaan */}
      {formVisible && (
        <section className="airskin-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#176FAF]" />
            <h2 className="font-[Poppins] text-base font-semibold text-[#103B66]">
              Formulir Catatan Pemeliharaan
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <label className="text-xs text-[#103B66]">
                <span>Panel Filtrasi</span>
                <select
                  value={panelId}
                  onChange={(e) => setPanelId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#B9E0F8] bg-white px-3 py-2 text-xs"
                >
                  {panels.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs text-[#103B66]">
                <span>Jenis Kegiatan</span>
                <select
                  value={recordType}
                  onChange={(e) =>
                    setRecordType(
                      e.target.value as
                        | 'Pemeriksaan Rutin'
                        | 'Penggantian Media'
                        | 'Audit Kelembapan & Casing',
                    )
                  }
                  className="mt-1 w-full rounded-xl border border-[#B9E0F8] bg-white px-3 py-2 text-xs"
                >
                  <option value="Pemeriksaan Rutin">Pemeriksaan Rutin</option>
                  <option value="Audit Kelembapan & Casing">Audit Kelembapan & Casing</option>
                  <option value="Penggantian Media">Penggantian Media</option>
                </select>
              </label>

              <label className="text-xs text-[#103B66]">
                <span>Nama Pemeriksa</span>
                <input
                  type="text"
                  required
                  value={inspector}
                  onChange={(e) => setInspector(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#B9E0F8] bg-white px-3 py-2 text-xs"
                />
              </label>

              <label className="text-xs text-[#103B66]">
                <span>Status Kondisi</span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as MaintenanceStatus)}
                  className="mt-1 w-full rounded-xl border border-[#B9E0F8] bg-white px-3 py-2 text-xs"
                >
                  <option value="Kondisi Baik">Kondisi Baik</option>
                  <option value="Perlu Pemeriksaan">Perlu Pemeriksaan</option>
                  <option value="Perlu Pembersihan / Penggantian">
                    Perlu Pembersihan / Penggantian
                  </option>
                </select>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="text-xs text-[#103B66]">
                <span>Kondisi Media Serabut Kelapa</span>
                <input
                  type="text"
                  required
                  value={coirCondition}
                  onChange={(e) => setCoirCondition(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#B9E0F8] bg-white px-3 py-2 text-xs"
                />
              </label>
              <label className="text-xs text-[#103B66]">
                <span>Kondisi Lapisan Nonwoven</span>
                <input
                  type="text"
                  required
                  value={nonwovenCondition}
                  onChange={(e) => setNonwovenCondition(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#B9E0F8] bg-white px-3 py-2 text-xs"
                />
              </label>
            </div>

            <label className="block text-xs text-[#103B66]">
              <span>Catatan Pemeliharaan</span>
              <input
                type="text"
                placeholder="Catat kondisi fisik casing, kipas DC, atau pengamatan lapangan..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#B9E0F8] bg-white px-3 py-2 text-xs"
              />
            </label>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-[#176FAF] px-5 py-2.5 text-xs font-medium text-white hover:bg-[#103B66]"
              >
                {submitting ? 'Menyimpan...' : 'Simpan Catatan Pemeliharaan'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Riwayat Pemeliharaan */}
      <section ref={historyRef} className="airskin-card overflow-hidden">
        <div className="border-b border-[#DCEEFB] px-6 py-4 flex items-center gap-2">
          <ClipboardCheck className="w-4 h-4 text-[#176FAF]" />
          <h2 className="font-[Poppins] text-base font-semibold text-[#103B66]">
            Riwayat Catatan Pemeliharaan Filter
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5FAFF] text-[#103B66]/70 border-b border-[#DCEEFB]">
              <tr>
                <th className="px-5 py-3 font-semibold">Tanggal</th>
                <th className="px-5 py-3 font-semibold">Panel</th>
                <th className="px-5 py-3 font-semibold">Kegiatan</th>
                <th className="px-5 py-3 font-semibold">Media Serabut Kelapa</th>
                <th className="px-5 py-3 font-semibold">Lapisan Nonwoven</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAF6FF]">
              {maintenance.map((rec) => (
                <tr key={rec.id} className="hover:bg-[#F5FAFF]/70">
                  <td className="px-5 py-3 font-mono tabular-nums whitespace-nowrap">{rec.date}</td>
                  <td className="px-5 py-3 font-mono font-semibold text-[#176FAF]">{rec.panelId}</td>
                  <td className="px-5 py-3 whitespace-nowrap">{rec.recordType}</td>
                  <td className="px-5 py-3 text-[#103B66]/85">{rec.coirCondition}</td>
                  <td className="px-5 py-3 text-[#103B66]/85">{rec.nonwovenCondition}</td>
                  <td className="px-5 py-3 whitespace-nowrap">{renderStatusBadge(rec.status)}</td>
                  <td className="px-5 py-3 text-[#103B66]/75 max-w-xs">{rec.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
