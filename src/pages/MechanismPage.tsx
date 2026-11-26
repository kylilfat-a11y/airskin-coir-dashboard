import React, { useState } from 'react';
import { Layers, Play, Pause } from 'lucide-react';
import type { SystemStatePayload } from '../types/airskin';
import { WorkingMechanismDiagram } from '../components/WorkingMechanismDiagram';
import facadeIsoImg from '../assets/images/facade_3d_isometric_1795694950809.jpg';
import cartridgeImg from '../assets/images/coir_cartridge_module_1795694950650.jpg';

interface MechanismPageProps {
  state: SystemStatePayload;
}

export const MechanismPage: React.FC<MechanismPageProps> = ({ state }) => {
  const [previewAnimated, setPreviewAnimated] = useState(true);
  const isFlowActive =
    previewAnimated || state.deviceConnected || state.simulation.running;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#176FAF]" />
            <h2 className="font-display text-lg font-semibold text-[#103B66]">
              AIRSKIN COIR Working Mechanism
            </h2>
          </div>
          <p className="text-xs text-[#176FAF]/85 mt-0.5">
            Susunan aliran udara bertingkat menggunakan kombinasi lapisan nonwoven depan-belakang, serat kapuk, dan jerami padi terolah.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setPreviewAnimated((prev) => !prev)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#B9E0F8] bg-white text-xs font-semibold text-[#176FAF] hover:bg-[#EAF6FF] transition-colors"
        >
          {previewAnimated ? (
            <>
              <Pause className="w-3.5 h-3.5" /> Jeda Animasi Aliran
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" /> Jalankan Animasi Aliran
            </>
          )}
        </button>
      </div>

      <WorkingMechanismDiagram animateFlow={isFlowActive} />

      {/* Architectural & Module Context Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="airskin-card overflow-hidden flex flex-col sm:flex-row">
          <img
            src={facadeIsoImg}
            alt="Konsep Modul Fasad AIRSKIN COIR"
            referrerPolicy="no-referrer"
            className="w-full sm:w-48 h-44 sm:h-auto object-cover shrink-0"
          />
          <div className="p-5 flex flex-col justify-center space-y-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#176FAF]">
              Integrasi Fasad Bangunan
            </span>
            <h3 className="font-display text-base font-semibold text-[#103B66]">
              Alur Udara Inlet ke Outlet Terintegrasi Sensor
            </h3>
            <p className="text-xs text-[#103B66]/80 leading-relaxed">
              Udara ambien diarahkan melewati sisi depan modul menggunakan kipas DC menuju ruang media komposit berlapis sebelum keluar pada sisi outlet, sehingga perbedaan konsentrasi partikulat dapat dipantau oleh dua titik sensor.
            </p>
          </div>
        </div>

        <div className="airskin-card overflow-hidden flex flex-col sm:flex-row">
          <img
            src={cartridgeImg}
            alt="Susunan Media Filtrasi Berlapis"
            referrerPolicy="no-referrer"
            className="w-full sm:w-48 h-44 sm:h-auto object-cover shrink-0"
          />
          <div className="p-5 flex flex-col justify-center space-y-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#2F6F54]">
              Komposisi Media Prototipe
            </span>
            <h3 className="font-display text-base font-semibold text-[#103B66]">
              Kapuk, Jerami Padi, dan Nonwoven Depan-Belakang
            </h3>
            <p className="text-xs text-[#103B66]/80 leading-relaxed">
              Front dan rear nonwoven menjaga stabilitas susunan serat alami (kapuk dan jerami padi terolah) serta ditopang oleh support mesh untuk mempertahankan bentuk modul saat aliran udara bekerja.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
