import React from 'react';
import { BookOpen, Info } from 'lucide-react';

export const BenchmarkPage: React.FC = () => {
  const benchmarkSpecs = [
    {
      label: 'PM2.5 removal efficiency',
      value: '96.5 ± 0.8%',
      note: 'Efisiensi penyisihan PM2.5 pada kondisi uji laboratorium literatur',
    },
    {
      label: 'PM10 removal efficiency',
      value: '98.2 ± 0.5%',
      note: 'Efisiensi penyisihan PM10 pada kondisi uji laboratorium literatur',
    },
    {
      label: 'Pressure drop',
      value: '45 ± 2 Pa',
      note: 'Penurunan tekanan melintasi media jerami padi terolah',
    },
    {
      label: 'Face velocity',
      value: '0.5 m/s',
      note: 'Kecepatan aliran muka udara saat pengujian laboratorium',
    },
    {
      label: 'Source',
      value: 'Kaur & Kaur (2026)',
      note: 'Referensi studi media filter lignoselulosa berbasis jerami padi',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#176FAF]" />
          <h2 className="font-display text-lg font-semibold text-[#103B66]">
            Literature Benchmark
          </h2>
        </div>
        <p className="text-xs text-[#176FAF]/85 mt-0.5">
          Referensi ilmiah terdahulu yang digunakan sebagai acuan latar belakang pemilihan media jerami padi, terpisah dari hasil prototipe AIRSKIN COIR.
        </p>
      </div>

      {/* Dedicated Literature Benchmark Card */}
      <article className="airskin-card p-6 space-y-5 border-t-4 border-t-[#103B66]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#176FAF]">
              Referensi Literatur Ilmiah
            </span>
            <h3 className="font-display text-xl font-semibold text-[#103B66] mt-1">
              Rice-Straw Lignocellulosic Filter — Literature Benchmark
            </h3>
          </div>
          <span className="font-mono text-xs px-3 py-1 rounded-lg bg-[#EAF6FF] border border-[#B9E0F8] text-[#103B66] font-semibold">
            Kaur &amp; Kaur (2026)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {benchmarkSpecs.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-[#DCEEFB] bg-[#F8FCFF] p-4 space-y-1.5"
            >
              <span className="text-xs font-medium text-[#103B66]/70 block">
                {item.label}
              </span>
              <p className="font-display text-2xl font-semibold text-[#103B66] tabular-nums">
                {item.value}
              </p>
              <p className="text-[11px] text-[#103B66]/65 leading-snug">{item.note}</p>
            </div>
          ))}
        </div>

        {/* Mandatory Benchmark Note */}
        <div className="rounded-xl border border-[#D7B978] bg-[#FCF7EC] p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-[#9B7A2C] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#7A5E1B]">
              Catatan Penting Integritas Data
            </span>
            <p className="text-sm text-[#5C4612] leading-relaxed font-medium">
              Hasil penelitian pada media jerami padi yang diproses secara khusus dalam kondisi laboratorium. Angka ini bukan hasil pengujian komposit AIRSKIN COIR.
            </p>
          </div>
        </div>
      </article>

      {/* Separation Explanation Card */}
      <div className="airskin-card p-5 space-y-2">
        <h4 className="font-display text-sm font-semibold text-[#103B66]">
          Pemisahan Benchmark Literatur dan Pengukuran Prototipe
        </h4>
        <p className="text-xs sm:text-sm text-[#103B66]/80 leading-relaxed">
          Nilai 96.5 ± 0.8% (PM2.5) dan 98.2 ± 0.5% (PM10) di atas tidak pernah dipakai secara otomatis sebagai angka efisiensi pada ringkasan maupun simulasi AIRSKIN COIR. Efisiensi aktual AIRSKIN COIR hanya akan dihitung setelah perangkat ESP32 dan sensor inlet/outlet melakukan pengukuran langsung pada prototipe komposit kapuk, jerami padi, dan nonwoven.
        </p>
      </div>
    </div>
  );
};
