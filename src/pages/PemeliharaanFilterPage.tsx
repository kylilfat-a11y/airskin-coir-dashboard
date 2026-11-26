import React, { useState } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  History,
  Info,
  Plus,
  Wrench,
} from 'lucide-react';
import type { MaintenanceRecord, SystemStatePayload } from '../types/airskin';
import { formatDateTimeFull } from '../utils/airskinMetrics';

interface PemeliharaanFilterPageProps {
  state: SystemStatePayload;
  onAddRecord: (payload: Omit<MaintenanceRecord, 'id' | 'tanggal'>) => Promise<void>;
  onMarkInspected: () => Promise<void>;
  busy: boolean;
}

export const PemeliharaanFilterPage: React.FC<PemeliharaanFilterPageProps> = ({
  state,
  onAddRecord,
  onMarkInspected,
  busy,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [showHistoryOnly, setShowHistoryOnly] = useState(false);
  const [komponen, setKomponen] = useState<MaintenanceRecord['komponen']>('Media Serabut Kelapa');
  const [jenis, setJenis] = useState<MaintenanceRecord['jenis']>('catatan');
  const [tindakan, setTindakan] = useState('');
  const [catatan, setCatatan] = useState('');
  const [petugas, setPetugas] = useState('Operator Fasad');
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tindakan.trim()) return;
    await onAddRecord({
      komponen,
      jenis,
      tindakan: tindakan.trim(),
      catatan: catatan.trim(),
      petugas: petugas.trim() || 'Operator Fasad',
    });
    setTindakan('');
    setCatatan('');
    setShowForm(false);
    setFeedback('Catatan pemeliharaan baru telah disimpan.');
  };

  const handleInspectClick = async () => {
    await onMarkInspected();
    setFeedback('Status pemeriksaan filter terbaru berhasil dicatat.');
  };

  const replacementHistory = state.maintenanceRecords.filter(
    (r) => r.jenis === 'penggantian',
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-[#176FAF]" />
            <h2 className="font-display text-xl font-semibold text-[#103B66]">
              Pemeliharaan dan Kondisi Filter
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#176FAF]/90 mt-0.5">
            Pencatatan inspeksi visual, jadwal pemeriksaan berkala, dan riwayat perawatan media filtrasi AIRSKIN COIR.
          </p>
        </div>

        {/* Tiga Tombol Utama */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowForm((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#176FAF] hover:bg-[#103B66] text-white text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah Catatan Pemeliharaan
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={handleInspectClick}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#72B89A] bg-[#EFF9F4] hover:bg-[#DFEFE7] text-[#2F6F54] text-xs font-semibold transition-colors disabled:opacity-60"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Tandai Filter Telah Diperiksa
          </button>
          <button
            type="button"
            onClick={() => setShowHistoryOnly((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#B9E0F8] bg-white hover:bg-[#EAF6FF] text-[#103B66] text-xs font-semibold transition-colors"
          >
            <History className="w-3.5 h-3.5" />
            {showHistoryOnly ? 'Tampilkan Semua Kartu' : 'Lihat Riwayat'}
          </button>
        </div>
      </div>

      {feedback && (
        <div className="rounded-xl border border-[#72B89A] bg-[#EFF9F4] px-4 py-2.5 text-xs text-[#2F6F54] font-medium">
          {feedback}
        </div>
      )}

      {/* Formulir Tambah Catatan */}
      {showForm && (
        <form onSubmit={handleSubmit} className="airskin-card p-5 space-y-4">
          <h3 className="font-display text-base font-semibold text-[#103B66]">
            Formulir Catatan Pemeliharaan Baru
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="block space-y-1">
              <span className="text-xs text-[#103B66]">Komponen</span>
              <select
                value={komponen}
                onChange={(e) => setKomponen(e.target.value as MaintenanceRecord['komponen'])}
                className="w-full rounded-xl border border-[#B9E0F8] bg-[#F8FCFF] px-3 py-2 text-xs text-[#103B66]"
              >
                <option value="Media Serabut Kelapa">Media Serabut Kelapa</option>
                <option value="Lapisan Nonwoven">Lapisan Nonwoven</option>
                <option value="Panel & Kipas DC">Panel &amp; Kipas DC</option>
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-[#103B66]">Jenis Tindakan</span>
              <select
                value={jenis}
                onChange={(e) => setJenis(e.target.value as MaintenanceRecord['jenis'])}
                className="w-full rounded-xl border border-[#B9E0F8] bg-[#F8FCFF] px-3 py-2 text-xs text-[#103B66]"
              >
                <option value="catatan">Catatan Pemeliharaan</option>
                <option value="pemeriksaan">Pemeriksaan Berkala</option>
                <option value="penggantian">Penggantian Media</option>
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-[#103B66]">Petugas</span>
              <input
                type="text"
                value={petugas}
                onChange={(e) => setPetugas(e.target.value)}
                className="w-full rounded-xl border border-[#B9E0F8] bg-[#F8FCFF] px-3 py-2 text-xs text-[#103B66]"
              />
            </label>
          </div>
          <label className="block space-y-1">
            <span className="text-xs text-[#103B66]">Ringkasan Tindakan</span>
            <input
              type="text"
              required
              placeholder="Contoh: Pembersihan debu permukaan casing dan pengecekan kerapatan serabut"
              value={tindakan}
              onChange={(e) => setTindakan(e.target.value)}
              className="w-full rounded-xl border border-[#B9E0F8] bg-[#F8FCFF] px-3 py-2 text-xs text-[#103B66]"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-[#103B66]">Catatan Tambahan</span>
            <textarea
              rows={2}
              placeholder="Tuliskan hasil observasi visual atau catatan teknis lainnya..."
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              className="w-full rounded-xl border border-[#B9E0F8] bg-[#F8FCFF] px-3 py-2 text-xs text-[#103B66]"
            />
          </label>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={busy}
              className="px-4 py-2 rounded-xl bg-[#176FAF] hover:bg-[#103B66] text-white text-xs font-semibold"
            >
              Simpan Catatan
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl border border-[#B9E0F8] bg-white text-xs font-semibold text-[#103B66]"
            >
              Batal
            </button>
          </div>
        </form>
      )}

      {!showHistoryOnly && (
        <>
          {/* Kondisi Media & Jadwal Pemeriksaan */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="airskin-card p-5 space-y-2">
              <span className="text-xs text-[#103B66]/70 block">Kondisi Media Serabut Kelapa</span>
              <p className="font-display text-base font-semibold text-[#103B66]">
                {state.lastFilterInspectionAt
                  ? 'Telah Diperiksa Secara Visual'
                  : 'Menunggu Pemeriksaan & Data Sensor'}
              </p>
              <p className="text-xs text-[#103B66]/75 leading-relaxed">
                Penilaian kejenuhan media hanya ditentukan melalui inspeksi fisik atau pembacaan sensor tekanan/partikulat aktual.
              </p>
            </div>

            <div className="airskin-card p-5 space-y-2">
              <span className="text-xs text-[#103B66]/70 block">Kondisi Lapisan Nonwoven</span>
              <p className="font-display text-base font-semibold text-[#103B66]">
                {state.lastFilterInspectionAt
                  ? 'Terpasang & Terinspeksi'
                  : 'Siap Inspeksi Berkala'}
              </p>
              <p className="text-xs text-[#103B66]/75 leading-relaxed">
                Lapisan penyaring awal diperiksa secara periodik untuk memastikan tidak ada penyumbatan partikel kasar berlebih.
              </p>
            </div>

            <div className="airskin-card p-5 space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-[#103B66]/70">
                <CalendarClock className="w-4 h-4 text-[#176FAF]" />
                <span>Jadwal Pemeriksaan</span>
              </div>
              <p className="font-display text-sm font-semibold text-[#176FAF]">
                {state.nextInspectionSchedule}
              </p>
              <p className="text-xs font-mono text-[#103B66]/75">
                Pemeriksaan terakhir:{' '}
                {state.lastFilterInspectionAt
                  ? formatDateTimeFull(state.lastFilterInspectionAt)
                  : 'Belum tercatat'}
              </p>
            </div>
          </div>

          {/* Keterangan Kejujuran */}
          <div className="rounded-xl border border-[#B9E0F8] bg-white px-4 py-3 flex items-start gap-2.5 text-xs sm:text-sm text-[#103B66]/85">
            <Info className="w-4 h-4 text-[#176FAF] shrink-0 mt-0.5" />
            <span>
              Sistem tidak menyimpulkan bahwa filter harus diganti apabila belum ada pengukuran fisik atau pembacaan sensor jangka panjang yang membuktikan penurunan kapasitas media.
            </span>
          </div>
        </>
      )}

      {/* Riwayat Penggantian Media & Catatan Pemeliharaan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 airskin-card p-5 space-y-3">
          <h3 className="font-display text-base font-semibold text-[#103B66]">
            Riwayat Penggantian Media
          </h3>
          {replacementHistory.length === 0 ? (
            <p className="text-xs text-[#103B66]/70 bg-[#F8FCFF] border border-[#DCEEFB] rounded-xl p-4">
              Belum ada catatan penggantian media filter pada prototipe saat ini.
            </p>
          ) : (
            <div className="space-y-2.5">
              {replacementHistory.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-[#DCEEFB] bg-[#F8FCFF] p-3 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#103B66]">{item.komponen}</span>
                    <span className="font-mono text-[11px] text-[#176FAF]">
                      {formatDateTimeFull(item.tanggal)}
                    </span>
                  </div>
                  <p className="font-medium text-[#103B66]">{item.tindakan}</p>
                  {item.catatan && <p className="text-[#103B66]/75">{item.catatan}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-7 airskin-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-[#176FAF]" />
            <h3 className="font-display text-base font-semibold text-[#103B66]">
              Catatan Pemeliharaan
            </h3>
          </div>
          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {state.maintenanceRecords.map((rec) => (
              <div
                key={rec.id}
                className="rounded-xl border border-[#DCEEFB] bg-[#F8FCFF] p-3.5 text-xs space-y-1.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-[#176FAF]">{rec.komponen}</span>
                  <span className="font-mono text-[11px] text-[#103B66]/65">
                    {formatDateTimeFull(rec.tanggal)} • {rec.petugas}
                  </span>
                </div>
                <p className="font-semibold text-[#103B66]">{rec.tindakan}</p>
                {rec.catatan && (
                  <p className="text-[#103B66]/80 leading-relaxed">{rec.catatan}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
