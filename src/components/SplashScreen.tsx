import React, { useEffect, useState } from 'react';
import { BrandLogo } from './BrandLogo';

interface SplashScreenProps {
  onFinish: () => void;
  durationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  durationMs = 2000,
}) => {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => {
      setExiting(true);
    }, Math.max(400, durationMs - 300));

    const doneTimer = window.setTimeout(() => {
      onFinish();
    }, durationMs);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(doneTimer);
    };
  }, [durationMs, onFinish]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-[#EAF6FF] via-[#F7FBFF] to-[#D7EEFC] px-6 transition-opacity duration-300 ${
        exiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      role="status"
      aria-label="Memuat tampilan awal AIRSKIN COIR"
    >
      <div className="max-w-md w-full bg-white/90 backdrop-blur-sm border border-[#B9E0F8] rounded-2xl p-8 shadow-lg text-center space-y-5">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-[#103B66] flex items-center justify-center shadow-md border border-[#429EDB]/40">
            <BrandLogo className="w-11 h-11" />
          </div>
        </div>

        <div className="space-y-1.5">
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-wide text-[#103B66]">
            AIRSKIN COIR
          </h1>
          <p className="text-sm font-semibold text-[#176FAF]">
            Sistem Pemantauan Filtrasi Udara Berbasis IoT
          </p>
          <p className="text-xs text-[#103B66]/75 pt-1 leading-relaxed">
            Pantau Udara, Optimalkan Filtrasi, Bangun Lingkungan Lebih Baik.
          </p>
        </div>

        {/* Bilah progres halus 2 detik */}
        <div className="space-y-2 pt-1">
          <div className="h-1.5 w-full rounded-full bg-[#DCEEFB] overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#429EDB] to-[#72B89A] rounded-full animate-[splashProgress_1.85s_ease-out_forwards]" />
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#103B66]/65">
            <span>Menyiapkan dashboard pemantauan...</span>
            <button
              type="button"
              onClick={onFinish}
              className="font-semibold text-[#176FAF] hover:text-[#103B66] transition-colors"
            >
              Lewati
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
